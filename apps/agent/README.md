# Creator Agent Orchestrator

Reusable TypeScript package for creator workflow orchestration across content strategy, repurposing, publishing, and scheduling.

The package is designed to plug into a Next.js app, backend API, worker queue, or cross-platform scheduler. It keeps provider choices swappable while enforcing the main architectural boundary:

- Agents reason.
- Adapters execute platform-specific formatting, validation, metadata, and scheduling payload preparation.
- The orchestrator routes, coordinates workflows, and aggregates typed responses.

## Architecture

```text
Orchestrator
├── Content Strategy Agent
├── Content Repurposing Agent
└── Publishing & Scheduling Agent
    ├── X Adapter
    ├── LinkedIn Adapter
    ├── TikTok Adapter
    ├── Instagram Adapter
    ├── YouTube Adapter
    └── Newsletter Adapter
```

Core folders:

- `src/orchestrator`: task classification, workflow planning, routing, and aggregation.
- `src/agents`: reasoning agents that depend on RAG, memory, LLM, and logging interfaces.
- `src/platforms`: swappable platform adapters with platform-owned constraints.
- `src/rag`: RAG retrieval interface, local document retriever, and Pinecone-backed retriever.
- `src/memory`: memory interface and real Pinecone-backed memory store.
- `src/llm`: LLM provider interface and deterministic mock structured provider.
- `src/logging`: logger interface and console logger.

## Why Agents And Adapters Are Separate

The `PublishingSchedulingAgent` decides publishing strategy and cadence, but it does not know platform limits. Character limits, hashtag rules, captions, metadata, and scheduling payload details live inside `SocialPlatformAdapter` implementations.

This keeps new platforms easy to add without changing core agent logic.

## RAG Retrieval

Every agent retrieves external knowledge through the `RagRetriever` interface. The included `MockRagRetriever` is a local seeded retriever for brand guidelines, platform best practices, calendar docs, and templates.

For production-like runs, use `PineconeRagRetriever` with your `narrativee-rag` index:

```ts
import { PineconeRagRetriever } from "creator-agent-orchestrator";

const ragRetriever = new PineconeRagRetriever({
  apiKey: process.env.PINECONE_RAG_API_KEY ?? process.env.PINECONE_MEMORY_API_KEY!,
  indexName: "narrativee-rag",
  host: process.env.PINECONE_RAG_HOST,
  namespace: "creator-rag",
  textField: "chunk_text"
});
```

The RAG index should contain larger reference material, such as previous creator content, templates, platform rules, brand guidelines, campaign docs, audience research, and high-performing examples. The example seeds starter documents into Pinecone with `upsertRecords()` so a new index does not stay empty.

RAG search uses `searchRecords()` with text input and optional reranking over `chunk_text`.

## Pinecone Memory Retrieval

Memory retrieval uses the `MemoryRetriever` interface and the included `PineconeMemoryStore`.

`PineconeMemoryStore` uses the official `@pinecone-database/pinecone` SDK. It expects a Pinecone index with integrated embedding so it can call `upsertRecords()` and `searchRecords()` with raw text. The configured text field must match your index field map, for example `chunk_text`.

Required env vars:

```bash
export PINECONE_MEMORY_API_KEY="..."
export PINECONE_MEMORY_INDEX_NAME="narrativee"
export PINECONE_MEMORY_HOST="https://narrativee-ifmf4fq.svc.aped-4627-b74a.pinecone.io"
export PINECONE_MEMORY_NAMESPACE="creator-memory"
export PINECONE_MEMORY_TEXT_FIELD="chunk_text"
```

By default, the store validates the existing index with `describeIndex()` and fails if it is not ready. If you want the package to create the index when it is missing, set:

```bash
export PINECONE_MEMORY_CREATE_INDEX=true
export PINECONE_MEMORY_CLOUD=aws
export PINECONE_MEMORY_REGION=us-east-1
export PINECONE_MEMORY_EMBEDDING_MODEL=llama-text-embed-v2
```

When creation is enabled, the store calls:

```ts
await pc.createIndexForModel({
  name: indexName,
  cloud: "aws",
  region: "us-east-1",
  embed: {
    model: "llama-text-embed-v2",
    fieldMap: { text: "chunk_text" }
  },
  waitUntilReady: true,
  suppressConflicts: true
});
```

Memory search uses semantic search:

```ts
await index.searchRecords({
  query: {
    inputs: { text: query },
    topK: 10,
    filter: { creatorId: { $eq: creatorId } }
  },
  fields: ["chunk_text", "creatorId", "userId", "type", "value", "tags", "metadata", "updatedAt"]
});
```

Reranking is enabled by default with `bge-reranker-v2-m3` over `chunk_text`. Disable it with `PINECONE_MEMORY_RERANK=false`.

Do not commit real API keys. If a key is exposed in chat, logs, or source control, rotate it.

The example loads `.env` automatically, and `.env` is ignored by git. You can either export variables in your current terminal session or place them in `.env`.

## LLM Providers

Agents depend on `LLMProvider`, not a vendor SDK. The included `MockLLMProvider` returns deterministic structured output so the architecture can be tested without a model call.

Replace it with a real provider by implementing:

```ts
import type { LLMProvider, LLMGenerateRequest, LLMGenerateResponse, JsonValue } from "creator-agent-orchestrator";

export class RealLLMProvider implements LLMProvider {
  async generateStructured<TOutput extends JsonValue>(
    request: LLMGenerateRequest
  ): Promise<LLMGenerateResponse<TOutput>> {
    // Call your model provider and validate/parse structured output.
    throw new Error("Not implemented");
  }
}
```

## Adding An Agent

1. Create a new agent class extending `BaseAgent`.
2. Add a new `AgentTaskType` if needed.
3. Implement `executeInternal()` with RAG retrieval, memory retrieval, LLM reasoning, warnings, and typed output.
4. Register it with `CreatorWorkflowOrchestrator`.
5. Update `SimpleTaskClassifier` and `SimpleWorkflowPlanner` if the new task requires routing.

## Adding A Platform Adapter

1. Implement `SocialPlatformAdapter`.
2. Return platform-owned constraints from `getConstraints()`.
3. Implement validation, formatting, and scheduling payload creation.
4. Pass the adapter into `PublishingSchedulingAgent`.

The publishing agent does not need to change.

## Integrations

- Content repurposing app: call the orchestrator with source transcripts, preferred platforms, and requested output counts.
- Cross-platform scheduler: use `PublishingSchedulingAgent` outputs and replace dry-run payloads with real scheduler API payloads.
- Next.js app: instantiate providers in route handlers or server actions, then call `orchestrator.handle()`.
- Backend API: expose an endpoint that accepts `OrchestratorRequest` and returns `OrchestratorResponse`.
- Worker queue: serialize requests into jobs, run the orchestrator in the worker, and persist the typed response.

## Run

Install dependencies:

```bash
npm install
```

Build:

```bash
npm run build
```

Run the example after configuring Pinecone memory env vars:

```bash
npm run dev:example
```

The example:

- Seeds starter RAG documents into Pinecone.
- Seeds creator memories into Pinecone.
- Classifies a transcript repurposing and scheduling request.
- Routes through the Content Repurposing Agent.
- Routes generated assets to the Publishing & Scheduling Agent.
- Uses X and LinkedIn adapters for formatting, validation, and dry-run scheduling payloads.
- Prints the final typed orchestration response.

## Public API

All public contracts and implementations are exported from `src/index.ts`, including:

- `CreatorWorkflowOrchestrator`
- `SimpleTaskClassifier`
- `SimpleWorkflowPlanner`
- `BaseAgent`
- all three built-in agents
- all six platform adapters
- `PineconeMemoryStore`
- `MockRagRetriever`
- `MockLLMProvider`
- shared orchestration, agent, memory, RAG, LLM, logging, platform, and content types
