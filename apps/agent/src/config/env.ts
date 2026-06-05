import { existsSync, readFileSync } from "node:fs";

export type AppEnv = {
  readonly memoryProvider: "pinecone";
  readonly ragProvider: "pinecone";
  readonly pineconeRagApiKey?: string;
  readonly pineconeRagIndexName?: string;
  readonly pineconeRagHost?: string;
  readonly pineconeRagNamespace: string;
  readonly pineconeRagTextField: string;
  readonly pineconeRagRerank: boolean;
  readonly pineconeRagRerankModel: string;
  readonly pineconeRagRerankTopN: number;
  readonly pineconeMemoryApiKey?: string;
  readonly pineconeMemoryIndexName?: string;
  readonly pineconeMemoryHost?: string;
  readonly pineconeMemoryNamespace: string;
  readonly pineconeMemoryTextField: string;
  readonly pineconeMemoryCreateIndex: boolean;
  readonly pineconeMemoryCloud: string;
  readonly pineconeMemoryRegion: string;
  readonly pineconeMemoryEmbeddingModel: string;
  readonly pineconeMemoryRerank: boolean;
  readonly pineconeMemoryRerankModel: string;
  readonly pineconeMemoryRerankTopN: number;
};

export const loadEnv = (env: NodeJS.ProcessEnv = process.env): AppEnv => ({
  memoryProvider: "pinecone",
  ragProvider: "pinecone",
  pineconeRagApiKey: env["PINECONE_RAG_API_KEY"] ?? env["PINECONE_MEMORY_API_KEY"],
  pineconeRagIndexName: env["PINECONE_RAG_INDEX_NAME"],
  pineconeRagHost: env["PINECONE_RAG_HOST"],
  pineconeRagNamespace: env["PINECONE_RAG_NAMESPACE"] || "creator-rag",
  pineconeRagTextField: env["PINECONE_RAG_TEXT_FIELD"] || "chunk_text",
  pineconeRagRerank: env["PINECONE_RAG_RERANK"] !== "false",
  pineconeRagRerankModel: env["PINECONE_RAG_RERANK_MODEL"] || "bge-reranker-v2-m3",
  pineconeRagRerankTopN: Number(env["PINECONE_RAG_RERANK_TOP_N"] || 8),
  pineconeMemoryApiKey: env["PINECONE_MEMORY_API_KEY"],
  pineconeMemoryIndexName: env["PINECONE_MEMORY_INDEX_NAME"],
  pineconeMemoryHost: env["PINECONE_MEMORY_HOST"],
  pineconeMemoryNamespace: env["PINECONE_MEMORY_NAMESPACE"] || "creator-memory",
  pineconeMemoryTextField: env["PINECONE_MEMORY_TEXT_FIELD"] || "chunk_text",
  pineconeMemoryCreateIndex: env["PINECONE_MEMORY_CREATE_INDEX"] === "true",
  pineconeMemoryCloud: env["PINECONE_MEMORY_CLOUD"] || "aws",
  pineconeMemoryRegion: env["PINECONE_MEMORY_REGION"] || "us-east-1",
  pineconeMemoryEmbeddingModel: env["PINECONE_MEMORY_EMBEDDING_MODEL"] || "llama-text-embed-v2",
  pineconeMemoryRerank: env["PINECONE_MEMORY_RERANK"] !== "false",
  pineconeMemoryRerankModel: env["PINECONE_MEMORY_RERANK_MODEL"] || "bge-reranker-v2-m3",
  pineconeMemoryRerankTopN: Number(env["PINECONE_MEMORY_RERANK_TOP_N"] || 8)
});

export const loadDotEnv = (filePath = ".env", env: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv => {
  if (!existsSync(filePath)) {
    return env;
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/u);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = /^(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/u.exec(trimmed);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    if (env[key] !== undefined) {
      continue;
    }

    env[key] = stripQuotes(rawValue);
  }

  return env;
};

const stripQuotes = (value: string): string => {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
};
