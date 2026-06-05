import type { JsonValue } from "../common/types.js";
import type { RagRetriever } from "./RagRetriever.js";
import type { RagDocument, RagQuery, RagResult } from "./types.js";

export class MockRagRetriever implements RagRetriever {
  constructor(private readonly documents: readonly RagDocument[] = defaultRagDocuments) {}

  async retrieve(query: RagQuery): Promise<readonly RagResult[]> {
    const terms = tokenize(query.query);

    return this.documents
      .filter((document) => matchesFilters(document, query.filters))
      .map((document) => ({
        document,
        score: scoreDocument(document, terms)
      }))
      .filter((result) => result.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, query.limit ?? 5);
  }
}

const tokenize = (text: string): readonly string[] =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/u)
    .filter((term) => term.length > 2);

const scoreDocument = (document: RagDocument, terms: readonly string[]): number => {
  const haystack = `${document.title} ${document.content} ${JSON.stringify(document.metadata)}`.toLowerCase();
  const matches = terms.filter((term) => haystack.includes(term)).length;
  const baseScore = matches / Math.max(terms.length, 1);
  const metadataBoost = String(document.metadata["priority"] ?? "") === "high" ? 0.15 : 0;
  return Number((baseScore + metadataBoost).toFixed(3));
};

const matchesFilters = (document: RagDocument, filters?: Record<string, JsonValue>): boolean => {
  if (!filters) {
    return true;
  }

  return Object.entries(filters).every(([key, expected]) => {
    if (expected === undefined) {
      return true;
    }

    const actual = document.metadata[key];
    if (Array.isArray(expected)) {
      return expected.includes(actual);
    }

    return actual === expected;
  });
};

export const defaultRagDocuments: readonly RagDocument[] = [
  {
    id: "brand-ai-founder",
    title: "AI founder brand guidelines",
    content:
      "Use practical, founder-led language. Prefer crisp hooks, proof-backed lessons, and useful examples over hype.",
    metadata: { type: "brand_guidelines", creatorNiche: "ai_founder", priority: "high" }
  },
  {
    id: "x-best-practices",
    title: "X platform best practices",
    content:
      "Short posts need a strong first line. Threads should have one idea per post and a concise final CTA.",
    metadata: { type: "platform_rules", platform: "x", priority: "high" }
  },
  {
    id: "linkedin-best-practices",
    title: "LinkedIn platform best practices",
    content:
      "LinkedIn posts perform well with clear spacing, professional framing, a point of view, and a low-friction CTA.",
    metadata: { type: "platform_rules", platform: "linkedin", priority: "high" }
  },
  {
    id: "launch-calendar",
    title: "Creator launch campaign calendar",
    content:
      "A launch campaign should move from problem awareness to proof, objection handling, behind-the-scenes content, and final urgency.",
    metadata: { type: "content_calendar", campaign: "launch" }
  },
  {
    id: "high-performing-template",
    title: "High-performing repurposing template",
    content:
      "Turn long-form content into hooks, contrarian lessons, tactical lists, founder stories, and platform-native CTAs.",
    metadata: { type: "template", useCase: "repurposing", priority: "high" }
  }
];
