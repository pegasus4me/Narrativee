import { z } from "zod";

export const evidenceSchema = z.object({
  statement: z.string(),
  sourceUrl: z.string(),
  sourceText: z.string(),
});

export const observationSchema = z.object({
  type: z.enum([
    "product",
    "audience_signal",
    "claim",
    "proof",
    "voice",
    "visual",
  ]),
  statement: z.string(),
  confidence: z.number().min(0).max(1),
  evidence: z.array(evidenceSchema),
});

export const inferenceSchema = z.object({
  type: z.enum(["audience", "category", "positioning", "personality"]),
  statement: z.string(),
  confidence: z.number().min(0).max(1),
  evidence: z.array(evidenceSchema),
});

export const questionSchema = z.object({
  question: z.string(),
  reason: z.string(),
  options: z.array(z.string()),
});

export const brandDiagnosisSchema = z.object({
  companyName: z.string(),
  summary: z.string(),
  observations: z.array(observationSchema),
  inferences: z.array(inferenceSchema),
  contradictions: z.array(z.string()),
  openQuestions: z.array(questionSchema),
});

export type BrandDiagnosis = z.infer<typeof brandDiagnosisSchema>;

export const competitorResearchPlanSchema = z.object({
  searches: z.array(z.object({
    angle: z.enum(["direct", "workflow", "substitute", "category"]),
    query: z.string(),
  })),
});

export type CompetitorResearchPlan = z.infer<typeof competitorResearchPlanSchema>;

export const competitorCandidateSchema = z.object({
  name: z.string(),
  url: z.string(),
  relationship: z.enum(["direct", "indirect", "adjacent"]),
  reason: z.string(),
  confidence: z.number().min(0).max(1),
});

export const competitorDiscoverySchema = z.object({
  candidates: z.array(competitorCandidateSchema),
});

export const competitorProfileSchema = z.object({
  name: z.string(),
  url: z.string(),
  positioning: z.string(),
  audience: z.string(),
  primaryClaim: z.string(),
  voice: z.array(z.string()),
  visualPatterns: z.array(z.string()),
  evidence: z.array(evidenceSchema),
});

export const competitorAnalysisSchema = z.object({
  competitors: z.array(competitorProfileSchema),
  categoryPatterns: z.array(z.string()),
  similarities: z.array(z.string()),
  differentiationOpportunities: z.array(z.string()),
  caveats: z.array(z.string()),
});

export type CompetitorCandidate = z.infer<typeof competitorCandidateSchema>;
export type CompetitorAnalysis = z.infer<typeof competitorAnalysisSchema>;
