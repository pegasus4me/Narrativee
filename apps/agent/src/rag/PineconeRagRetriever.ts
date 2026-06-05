import { Pinecone, type IndexModel, type RecordMetadata, type SearchRecordsResponse } from "@pinecone-database/pinecone";
import type { JsonObject, JsonValue } from "../common/types.js";
import type { RagRetriever } from "./RagRetriever.js";
import type { RagDocument, RagQuery, RagResult } from "./types.js";

export type PineconeRagRetrieverOptions = {
  readonly apiKey: string;
  readonly indexName: string;
  readonly host?: string;
  readonly namespace?: string;
  readonly textField?: string;
  readonly rerank?: {
    readonly enabled: boolean;
    readonly model?: string;
    readonly topN?: number;
  };
};

type RagRecordMetadata = RecordMetadata & {
  title: string;
  content: string;
  metadata: string;
  type: string;
  platform: string;
  priority: string;
};

export class PineconeRagRetriever implements RagRetriever {
  private readonly client: Pinecone;
  private readonly namespace: string;
  private readonly textField: string;
  private readonly rerank: Required<NonNullable<PineconeRagRetrieverOptions["rerank"]>>;
  private initializedIndex?: { readonly host: string; readonly model: IndexModel };

  constructor(private readonly options: PineconeRagRetrieverOptions) {
    this.client = new Pinecone({ apiKey: options.apiKey });
    this.namespace = options.namespace ?? "creator-rag";
    this.textField = options.textField ?? "chunk_text";
    this.rerank = {
      enabled: options.rerank?.enabled ?? true,
      model: options.rerank?.model ?? "bge-reranker-v2-m3",
      topN: options.rerank?.topN ?? 8
    };
  }

  static fromEnv(env: NodeJS.ProcessEnv = process.env): PineconeRagRetriever {
    const apiKey = env["PINECONE_RAG_API_KEY"] ?? env["PINECONE_MEMORY_API_KEY"];
    const indexName = env["PINECONE_RAG_INDEX_NAME"];

    if (!apiKey || !indexName) {
      throw new Error("PINECONE_RAG_API_KEY or PINECONE_MEMORY_API_KEY, and PINECONE_RAG_INDEX_NAME are required.");
    }

    return new PineconeRagRetriever({
      apiKey,
      indexName,
      host: env["PINECONE_RAG_HOST"],
      namespace: env["PINECONE_RAG_NAMESPACE"] || "creator-rag",
      textField: env["PINECONE_RAG_TEXT_FIELD"] || "chunk_text",
      rerank: {
        enabled: env["PINECONE_RAG_RERANK"] !== "false",
        model: env["PINECONE_RAG_RERANK_MODEL"] || "bge-reranker-v2-m3",
        topN: Number(env["PINECONE_RAG_RERANK_TOP_N"] || 8)
      }
    });
  }

  async ensureIndexReady(): Promise<IndexModel> {
    const existing = await this.client.describeIndex(this.options.indexName);

    if (!existing.status?.ready) {
      throw new Error(`Pinecone RAG index "${this.options.indexName}" is not ready. State: ${existing.status?.state ?? "unknown"}.`);
    }

    if (!existing.host && !this.options.host) {
      throw new Error(`Pinecone RAG index "${this.options.indexName}" did not return a host.`);
    }

    this.initializedIndex = {
      host: this.options.host ?? existing.host,
      model: existing
    };

    return existing;
  }

  async retrieve(query: RagQuery): Promise<readonly RagResult[]> {
    const index = await this.index();
    const limit = query.limit ?? 5;
    const response = await index.searchRecords({
      query: {
        inputs: { text: query.query },
        topK: Math.max(limit * 4, 10),
        filter: this.buildFilter(query.filters)
      },
      fields: [this.textField, "title", "content", "metadata", "type", "platform", "priority"],
      ...(this.rerank.enabled
        ? {
            rerank: {
              model: this.rerank.model,
              topN: limit,
              rankFields: [this.textField]
            }
          }
        : {})
    });

    return this.toRagResults(response).slice(0, limit);
  }

  async upsertDocuments(documents: readonly RagDocument[]): Promise<void> {
    if (documents.length === 0) {
      return;
    }

    const index = await this.index();
    await index.upsertRecords({
      records: documents.map((document) => this.toIntegratedRecord(document))
    });
  }

  private async index() {
    const initialized = this.initializedIndex ?? (await this.initializeIndex());

    return this.client.index<RagRecordMetadata>({
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

  private toIntegratedRecord(document: RagDocument): RagRecordMetadata & { readonly id: string } {
    const searchableText = `${document.title}\n\n${document.content}`;

    return {
      id: document.id,
      text: searchableText,
      [this.textField]: searchableText,
      title: document.title,
      content: document.content,
      metadata: JSON.stringify(document.metadata),
      type: asFlatMetadata(document.metadata["type"]),
      platform: asFlatMetadata(document.metadata["platform"]),
      priority: asFlatMetadata(document.metadata["priority"])
    } as RagRecordMetadata & { readonly id: string };
  }

  private buildFilter(filters?: JsonObject): object | undefined {
    if (!filters) {
      return undefined;
    }

    const filter = Object.fromEntries(
      Object.entries(filters)
        .filter(([, value]) => typeof value === "string" || typeof value === "number" || typeof value === "boolean")
        .map(([key, value]) => [key, { $eq: value }])
    );

    return Object.keys(filter).length > 0 ? filter : undefined;
  }

  private toRagResults(response: SearchRecordsResponse): readonly RagResult[] {
    return (response.result?.hits ?? [])
      .map((hit) => this.toRagResult(hit._id, hit._score ?? 0, hit.fields as Record<string, unknown>))
      .filter((result): result is RagResult => Boolean(result));
  }

  private toRagResult(id: string | undefined, score: number, fields: Record<string, unknown>): RagResult | undefined {
    if (!id) {
      return undefined;
    }

    return {
      document: {
        id,
        title: asString(fields["title"]) || id,
        content: asString(fields["content"]) || asString(fields[this.textField]) || asString(fields["text"]),
        metadata: parseMetadata(fields["metadata"])
      },
      score: Number(score.toFixed(3))
    };
  }
}

const asFlatMetadata = (value: JsonValue | undefined): string => {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
};

const asString = (value: unknown): string => (typeof value === "string" ? value : "");

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
