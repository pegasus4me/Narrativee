import { desc, eq } from "drizzle-orm";
import { db } from "../auth/auth";
import { siteAnalysis } from "../auth/schema/schema";
import {
  brandDiagnosisSchema,
  competitorAnalysisSchema,
} from "../analysis/analysis.schema";

export interface BoardEvidence {
  id: string;
  statement: string;
  sourceUrl: string;
}

export interface BoardResearch {
  analysisId: string;
  url: string;
  brandName: string;
  diagnosis: string;
  competitorSummary: string;
  evidence: BoardEvidence[];
}

export class BoardResearchUnavailableError extends Error {}

export function prepareBoardResearch(record: {
  id: string;
  url: string;
  diagnosis: unknown;
  competitorAnalysis: unknown;
}): BoardResearch {
  const diagnosis = brandDiagnosisSchema.safeParse(record.diagnosis);
  if (!diagnosis.success) {
    throw new BoardResearchUnavailableError(
      "Brand diagnosis is missing. Complete discovery before generating a board.",
    );
  }

  const competition = competitorAnalysisSchema.safeParse(
    record.competitorAnalysis,
  );
  if (!competition.success || competition.data.competitors.length === 0) {
    throw new BoardResearchUnavailableError(
      "Competitor analysis is missing. Complete competitor comparison before generating a board.",
    );
  }

  const evidence: BoardEvidence[] = [];
  for (const item of [
    ...diagnosis.data.observations,
    ...diagnosis.data.inferences,
  ].slice(0, 14)) {
    for (const source of item.evidence.slice(0, 2)) {
      evidence.push({
        id: `B${evidence.length + 1}`,
        statement: `${item.statement} — ${source.sourceText}`.slice(0, 380),
        sourceUrl: source.sourceUrl,
      });
    }
  }
  for (const competitor of competition.data.competitors.slice(0, 5)) {
    for (const source of competitor.evidence.slice(0, 2)) {
      evidence.push({
        id: `C${evidence.filter((item) => item.id.startsWith("C")).length + 1}`,
        statement: `${competitor.name}: ${source.statement}`.slice(0, 380),
        sourceUrl: source.sourceUrl,
      });
    }
  }
  if (evidence.length === 0) {
    throw new BoardResearchUnavailableError(
      "Discovery contains no source-backed evidence. Cannot ground a creative direction.",
    );
  }

  return {
    analysisId: record.id,
    url: record.url,
    brandName: diagnosis.data.companyName,
    diagnosis: diagnosis.data.summary,
    competitorSummary: JSON.stringify({
      competitors: competition.data.competitors.slice(0, 5).map((item) => ({
        name: item.name,
        positioning: item.positioning,
        visualPatterns: item.visualPatterns,
      })),
      categoryPatterns: competition.data.categoryPatterns.slice(0, 6),
      differentiationOpportunities:
        competition.data.differentiationOpportunities.slice(0, 6),
      caveats: competition.data.caveats.slice(0, 4),
    }),
    evidence: evidence.slice(0, 40),
  };
}

export async function loadBoardResearch(url: string): Promise<BoardResearch> {
  const target = new URL(url);
  let rows;
  try {
    rows = await db
      .select({
        id: siteAnalysis.id,
        url: siteAnalysis.url,
        diagnosis: siteAnalysis.diagnosis,
        competitorAnalysis: siteAnalysis.competitorAnalysis,
      })
      .from(siteAnalysis)
      .where(eq(siteAnalysis.status, "completed"))
      .orderBy(desc(siteAnalysis.createdAt));
  } catch {
    throw new Error(
      "Could not read the research database. Start the Postgres configured in apps/backend/.env, then retry.",
    );
  }

  const record = rows.find((item) => {
    try {
      return (
        new URL(item.url).hostname.replace(/^www\./, "") ===
        target.hostname.replace(/^www\./, "")
      );
    } catch {
      return false;
    }
  });
  if (!record) {
    throw new Error(
      `No completed discovery and competitor analysis found for ${target.hostname}. Complete research first.`,
    );
  }
  return prepareBoardResearch(record);
}

export async function loadBoardResearchForBrand(
  brandId: string,
): Promise<BoardResearch> {
  const [record] = await db
    .select({
      id: siteAnalysis.id,
      url: siteAnalysis.url,
      status: siteAnalysis.status,
      diagnosis: siteAnalysis.diagnosis,
      competitorAnalysis: siteAnalysis.competitorAnalysis,
    })
    .from(siteAnalysis)
    .where(eq(siteAnalysis.brandId, brandId))
    .orderBy(desc(siteAnalysis.createdAt))
    .limit(1);

  if (!record || record.status !== "completed") {
    throw new BoardResearchUnavailableError(
      "Complete discovery and competitor research first.",
    );
  }
  return prepareBoardResearch(record);
}

export function validateDirectionEvidence(
  direction: {
    rationale: { evidenceIds: string[] };
    differentiation: { evidenceIds: string[] };
  },
  evidence: BoardEvidence[],
): void {
  const validIds = new Set(evidence.map((item) => item.id));
  const citedIds = [
    ...direction.rationale.evidenceIds,
    ...direction.differentiation.evidenceIds,
  ];
  const unknown = citedIds.filter((id) => !validIds.has(id));
  if (unknown.length > 0) {
    throw new Error(
      `Creative direction cites unknown evidence: ${unknown.join(", ")}`,
    );
  }
}
