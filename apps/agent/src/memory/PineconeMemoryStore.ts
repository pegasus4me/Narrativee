import { Pinecone, type IndexModel, type RecordMetadata, type SearchRecordsResponse } from "@pinecone-database/pinecone";
import type { JsonObject, JsonValue } from "../common/types.js";
import type { MemoryRetriever } from "./MemoryRetriever.js";
import type {
  MemoryQuery,
  MemoryRecord,
  MemoryResult,
  StoreMemoryInput,
  UpdateMemoryInput
} from "./types.js";

export type PineconeMemoryStoreOptions = {
  readonly apiKey: string;
  readonly indexName: string;
  readonly host?: string;
  readonly namespace?: string;
  readonly textField?: string;
  readonly createIndexIfMissing?: boolean;
  readonly cloud?: string;
  readonly region?: string;
  readonly embeddingModel?: string;
  readonly rerank?: {
    readonly enabled: boolean;
    readonly model?: string;
    readonly topN?: number;
  };
};

type MemoryRecordMetadata = RecordMetadata & {
  creatorId: string;
  userId: string;
  type: string;
  value: string;
  tags: string;
  metadata: string;
  updatedAt: string;
};

export class PineconeMemoryStore implements MemoryRetriever {
  private readonly client: Pinecone;
  private readonly namespace: string;
  private readonly textField: string;
  private readonly rerank: Required<NonNullable<PineconeMemoryStoreOptions["rerank"]>>;
  private initializedIndex?: { readonly host: string; readonly model: IndexModel };

  constructor(private readonly options: PineconeMemoryStoreOptions) {
    this.client = new Pinecone({ apiKey: options.apiKey });
    this.namespace = options.namespace ?? "creator-memory";
    this.textField = options.textField ?? "chunk_text";
    this.rerank = {
      enabled: options.rerank?.enabled ?? true,
      model: options.rerank?.model ?? "bge-reranker-v2-m3",
      topN: options.rerank?.topN ?? 8
    };
  }

  static fromEnv(env: NodeJS.ProcessEnv = process.env): PineconeMemoryStore {
    const apiKey = env["PINECONE_MEMORY_API_KEY"];
    const indexName = env["PINECONE_MEMORY_INDEX_NAME"];

    if (!apiKey || !indexName) {
      throw new Error("PINECONE_MEMORY_API_KEY and PINECONE_MEMORY_INDEX_NAME are required for Pinecone memory.");
    }

    return new PineconeMemoryStore({
      apiKey,
      indexName,
      host: env["PINECONE_MEMORY_HOST"],
      namespace: env["PINECONE_MEMORY_NAMESPACE"] || "creator-memory",
      textField: env["PINECONE_MEMORY_TEXT_FIELD"] || "chunk_text",
      createIndexIfMissing: env["PINECONE_MEMORY_CREATE_INDEX"] === "true",
      cloud: env["PINECONE_MEMORY_CLOUD"] || "aws",
      region: env["PINECONE_MEMORY_REGION"] || "us-east-1",
      embeddingModel: env["PINECONE_MEMORY_EMBEDDING_MODEL"] || "llama-text-embed-v2",
      rerank: {
        enabled: env["PINECONE_MEMORY_RERANK"] !== "false",
        model: env["PINECONE_MEMORY_RERANK_MODEL"] || "bge-reranker-v2-m3",
        topN: Number(env["PINECONE_MEMORY_RERANK_TOP_N"] || 8)
      }
    });
  }

  async ensureIndexReady(): Promise<IndexModel> {
    const existing = await this.findOrCreateIndex();

    if (!existing.status?.ready) {
      throw new Error(`Pinecone memory index "${this.options.indexName}" is not ready. State: ${existing.status?.state ?? "unknown"}.`);
    }

    if (!existing.host && !this.options.host) {
      throw new Error(`Pinecone memory index "${this.options.indexName}" did not return a host.`);
    }

    this.initializedIndex = {
      host: this.options.host ?? existing.host,
      model: existing
    };

    return existing;
  }

  async retrieve(query: MemoryQuery): Promise<readonly MemoryResult[]> {
    const index = await this.index();
    const topK = Math.max((query.limit ?? 8) * 4, 10);
    const response = await index.searchRecords({
      query: {
        inputs: { text: this.buildSearchText(query) },
        topK,
        filter: this.buildFilter(query)
      },
      fields: [this.textField, "creatorId", "userId", "type", "value", "tags", "metadata", "updatedAt"],
      ...(this.rerank.enabled
        ? {
            rerank: {
              model: this.rerank.model,
              topN: query.limit ?? this.rerank.topN,
              rankFields: [this.textField]
            }
          }
        : {})
    });

    return this.toMemoryResults(response)
      .filter((result) => matchesMemoryQuery(result.memory, query))
      .slice(0, query.limit ?? 8);
  }

  async store(input: StoreMemoryInput): Promise<MemoryResult> {
    const memory: MemoryRecord = {
      ...input,
      id: input.id ?? `memory_${crypto.randomUUID()}`,
      updatedAt: new Date().toISOString()
    };

    const index = await this.index();
    await index.upsertRecords({
      records: [this.toIntegratedRecord(memory)]
    });

    return { memory, confidence: 1 };
  }

  async update(input: UpdateMemoryInput): Promise<MemoryResult> {
    if (!input.value && !input.type && !input.tags && !input.metadata && !input.userId) {
      throw new Error("Pinecone memory updates require replacement fields for the record.");
    }

    const existing = await this.fetchMemory(input.id);
    if (!existing) {
      throw new Error(`Memory not found: ${input.id}`);
    }

    const updated: MemoryRecord = {
      ...existing,
      ...input,
      id: existing.id,
      creatorId: existing.creatorId,
      updatedAt: new Date().toISOString()
    };

    const index = await this.index();
    await index.upsertRecords({
      records: [this.toIntegratedRecord(updated)]
    });

    return { memory: updated, confidence: 1 };
  }

  private async findOrCreateIndex(): Promise<IndexModel> {
    try {
      return await this.client.describeIndex(this.options.indexName);
    } catch (error) {
      if (!this.options.createIndexIfMissing) {
        throw error;
      }
    }

    const created = await this.client.createIndexForModel({
      name: this.options.indexName,
      cloud: this.options.cloud ?? "aws",
      region: this.options.region ?? "us-east-1",
      embed: {
        model: this.options.embeddingModel ?? "llama-text-embed-v2",
        fieldMap: { text: this.textField }
      },
      waitUntilReady: true,
      suppressConflicts: true
    });

    if (created) {
      return created;
    }

    return this.client.describeIndex(this.options.indexName);
  }

  private async index() {
    const initialized = this.initializedIndex ?? (await this.initializeIndex());

    return this.client.index<MemoryRecordMetadata>({
      host: initialized.host,
      namespace: this.namespace
    });
  }

  private async initializeIndex(): Promise<{ readonly host: string; readonly model: IndexModel }> {
    const model = await this.ensureIndexReady();
    return {
      host: this.options.host ?? model.host,
      model
    };
  }

  private async fetchMemory(id: string): Promise<MemoryRecord | undefined> {
    const results = await this.retrieve({ query: id, limit: 20 });
    return results.find((result) => result.memory.id === id)?.memory;
  }

  private toIntegratedRecord(memory: MemoryRecord): MemoryRecordMetadata & { readonly id: string } {
    const searchableText = `${memory.type}: ${memory.value}`;

    return {
      id: memory.id,
      text: searchableText,
      [this.textField]: searchableText,
      creatorId: memory.creatorId,
      userId: memory.userId ?? "",
      type: memory.type,
      value: memory.value,
      tags: memory.tags.join(","),
      metadata: JSON.stringify(memory.metadata),
      updatedAt: memory.updatedAt
    } as MemoryRecordMetadata & { readonly id: string };
  }

  private buildSearchText(query: MemoryQuery): string {
    return [
      query.query,
      query.creatorId,
      query.userId,
      query.types?.join(" "),
      query.tags?.join(" ")
    ]
      .filter(Boolean)
      .join(" ");
  }

  private buildFilter(query: MemoryQuery): object | undefined {
    const filter: Record<string, unknown> = {};

    if (query.creatorId) {
      filter["creatorId"] = { $eq: query.creatorId };
    }

    if (query.userId) {
      filter["userId"] = { $eq: query.userId };
    }

    if (query.types?.length) {
      filter["type"] = { $in: [...query.types] };
    }

    return Object.keys(filter).length > 0 ? filter : undefined;
  }

  private toMemoryResults(response: SearchRecordsResponse): readonly MemoryResult[] {
    return (response.result?.hits ?? [])
      .map((hit) => this.toMemoryResult(hit._id, hit._score ?? 0, hit.fields as Record<string, unknown>))
      .filter((result): result is MemoryResult => Boolean(result));
  }

  private toMemoryResult(id: string | undefined, score: number, fields: Record<string, unknown>): MemoryResult | undefined {
    const creatorId = asString(fields["creatorId"]);
    const type = asString(fields["type"]);
    const value = asString(fields["value"]);

    if (!id || !creatorId || !type || !value) {
      return undefined;
    }

    return {
      memory: {
        id,
        creatorId,
        userId: optionalString(fields["userId"]),
        type: type as MemoryRecord["type"],
        value,
        tags: asString(fields["tags"])
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        metadata: parseMetadata(fields["metadata"]),
        updatedAt: asString(fields["updatedAt"]) || new Date().toISOString()
      },
      confidence: Number(score.toFixed(3))
    };
  }
}

const asString = (value: unknown): string => (typeof value === "string" ? value : "");

const optionalString = (value: unknown): string | undefined => {
  const text = asString(value);
  return text.length > 0 ? text : undefined;
};

const parseMetadata = (value: unknown): JsonObject => {
  if (typeof value !== "string" || value.length === 0) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as JsonValue;
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? (parsed as JsonObject) : {};
  } catch {
    return {};
  }
};

const matchesMemoryQuery = (memory: MemoryRecord, query: MemoryQuery): boolean => {
  if (query.creatorId && memory.creatorId !== query.creatorId) {
    return false;
  }

  if (query.userId && memory.userId && memory.userId !== query.userId) {
    return false;
  }

  if (query.types && !query.types.includes(memory.type)) {
    return false;
  }

  if (query.tags && !query.tags.every((tag) => memory.tags.includes(tag))) {
    return false;
  }

  return true;
};
