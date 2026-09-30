import { and, asc, desc, eq } from "drizzle-orm";
import OpenAI from "openai";
import { db } from "../auth/auth";
import {
  brand,
  siteAnalysis,
  studioMessage,
  studioProject,
} from "../auth/schema/schema";
import {
  brandDiagnosisSchema,
  competitorAnalysisSchema,
  competitorDiscoverySchema,
  type BrandDiagnosis,
  type CompetitorAnalysis,
} from "../analysis/analysis.schema";
import { createAnalysisService } from "../analysis/create-service";
import { normalizePublicUrl } from "../analysis/url-policy";
import { buildCreativeDirectionSystemPrompt } from "./prompts/creative-direction.prompt";

type Turn = { role: "user" | "assistant"; content: string };
export type StudioReply = (system: string, turns: Turn[]) => Promise<string>;

const activeResearchStatuses = new Set([
  "queued",
  "scraping",
  "synthesizing",
  "discovering_competitors",
  "scanning_competitors",
  "comparing_competitors",
]);

export class StudioResearchError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

let openAiClientInstance: OpenAI | null = null;
function getOpenAIClient(): OpenAI {
  if (!openAiClientInstance) {
    openAiClientInstance = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openAiClientInstance;
}

export async function generateStudioReply(
  system: string,
  turns: Turn[],
): Promise<string> {
  const client = getOpenAIClient();
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5.6-luna",
    reasoning: { effort: "medium" },
    input: [{ role: "system", content: system }, ...turns],
  });
  const answer = response.output_text.trim();
  if (!answer) throw new Error("Studio designer returned an empty response");
  return answer;
}

export async function generateStudioReplyStream(
  system: string,
  turns: Turn[],
  onDelta: (delta: string) => void,
): Promise<string> {
  const client = getOpenAIClient();
  const stream = await client.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5.6-luna",
    reasoning: { effort: "medium" },
    input: [{ role: "system", content: system }, ...turns],
    stream: true,
  });

  let answer = "";
  let completed = false;
  for await (const event of stream) {
    if (event.type === "response.output_text.delta") {
      answer += event.delta;
      onDelta(event.delta);
    }
    if (
      event.type === "response.failed" ||
      event.type === "response.incomplete"
    ) {
      throw new Error("Studio designer did not complete its response");
    }
    if (event.type === "response.completed") completed = true;
  }

  if (!completed || !answer.trim()) {
    throw new Error("Studio designer did not complete its response");
  }
  return answer;
}

export async function createStudioProject(brandId: string, userId: string) {
  return db.transaction(async (transaction) => {
    const [ownedBrand] = await transaction
      .select({ id: brand.id })
      .from(brand)
      .where(and(eq(brand.id, brandId), eq(brand.userId, userId)))
      .for("update")
      .limit(1);
    if (!ownedBrand) return null;

    const [discovery] = await transaction
      .select({ id: studioProject.id })
      .from(studioProject)
      .where(
        and(
          eq(studioProject.brandId, brandId),
          eq(studioProject.userId, userId),
        ),
      )
      .orderBy(asc(studioProject.createdAt), asc(studioProject.id))
      .limit(1);
    if (!discovery) {
      await transaction.insert(studioProject).values({ brandId, userId });
    }

    const [project] = await transaction
      .insert(studioProject)
      .values({ brandId, userId })
      .returning({
        id: studioProject.id,
        brandId: studioProject.brandId,
        createdAt: studioProject.createdAt,
      });
    return project ?? null;
  });
}

export async function findOrCreateStudioProject(
  brandId: string,
  userId: string,
) {
  return db.transaction(async (transaction) => {
    const [ownedBrand] = await transaction
      .select({ id: brand.id })
      .from(brand)
      .where(and(eq(brand.id, brandId), eq(brand.userId, userId)))
      .for("update")
      .limit(1);
    if (!ownedBrand) return null;

    const [existing] = await transaction
      .select({ id: studioProject.id, brandId: studioProject.brandId })
      .from(studioProject)
      .where(
        and(
          eq(studioProject.brandId, brandId),
          eq(studioProject.userId, userId),
        ),
      )
      .orderBy(asc(studioProject.createdAt), asc(studioProject.id))
      .limit(1);
    if (existing) return existing;

    const [created] = await transaction
      .insert(studioProject)
      .values({ brandId, userId })
      .returning({ id: studioProject.id, brandId: studioProject.brandId });
    return created ?? null;
  });
}

export async function findStudioProject(id: string, userId: string) {
  const [project] = await db
    .select({
      id: studioProject.id,
      brandId: studioProject.brandId,
      brandName: brand.name,
      brandUrl: brand.url,
      createdAt: studioProject.createdAt,
      updatedAt: studioProject.updatedAt,
    })
    .from(studioProject)
    .innerJoin(brand, eq(studioProject.brandId, brand.id))
    .where(and(eq(studioProject.id, id), eq(studioProject.userId, userId)))
    .limit(1);
  if (!project) return null;

  const [discovery] = await db
    .select({ id: studioProject.id })
    .from(studioProject)
    .where(
      and(
        eq(studioProject.brandId, project.brandId),
        eq(studioProject.userId, userId),
      ),
    )
    .orderBy(asc(studioProject.createdAt), asc(studioProject.id))
    .limit(1);

  const analysis = await readLatestBrandAnalysis(project.brandId);
  const visibleAnalysis = presentBrandAnalysis(analysis);
  const hasBrandDiagnosis = Boolean(visibleAnalysis?.diagnosis);
  const hasCompetitorAnalysis = Boolean(visibleAnalysis?.competitorAnalysis);
  const hasFailedAnalysis =
    analysis?.status === "failed" ||
    analysis?.status === "competitor_analysis_failed";

  return {
    ...project,
    kind:
      discovery?.id === project.id
        ? ("discovery" as const)
        : ("creation" as const),
    brandAnalysisStatus: hasCompetitorAnalysis
      ? "ready"
      : hasBrandDiagnosis
        ? "diagnosis_ready"
        : hasFailedAnalysis
          ? "failed"
          : analysis
            ? "in_progress"
            : "not_started",
    hasBrandDiagnosis,
    hasCompetitorAnalysis,
    analysis: visibleAnalysis,
  };
}

export async function listStudioProjects(brandId: string, userId: string) {
  const [ownedBrand] = await db
    .select({ id: brand.id })
    .from(brand)
    .where(and(eq(brand.id, brandId), eq(brand.userId, userId)))
    .limit(1);
  if (!ownedBrand) return null;

  const projects = await db
    .select({
      id: studioProject.id,
      createdAt: studioProject.createdAt,
      updatedAt: studioProject.updatedAt,
    })
    .from(studioProject)
    .where(
      and(eq(studioProject.brandId, brandId), eq(studioProject.userId, userId)),
    )
    .orderBy(asc(studioProject.createdAt), asc(studioProject.id));

  return projects.map((project, index) => ({
    ...project,
    kind: index === 0 ? ("discovery" as const) : ("creation" as const),
    title: index === 0 ? "Discovery" : `Creation ${index}`,
  }));
}

async function readLatestBrandAnalysis(brandId: string) {
  const [analysis] = await db
    .select({
      id: siteAnalysis.id,
      url: siteAnalysis.url,
      status: siteAnalysis.status,
      progress: siteAnalysis.progress,
      diagnosis: siteAnalysis.diagnosis,
      competitorCandidates: siteAnalysis.competitorCandidates,
      selectedCompetitorUrls: siteAnalysis.selectedCompetitorUrls,
      competitorAnalysis: siteAnalysis.competitorAnalysis,
      error: siteAnalysis.error,
    })
    .from(siteAnalysis)
    .where(eq(siteAnalysis.brandId, brandId))
    .orderBy(desc(siteAnalysis.createdAt))
    .limit(1);
  return analysis ?? null;
}

function presentBrandAnalysis(
  analysis: Awaited<ReturnType<typeof readLatestBrandAnalysis>>,
) {
  if (!analysis) return null;

  const diagnosis = brandDiagnosisSchema.safeParse(analysis.diagnosis);
  const candidates = competitorDiscoverySchema.safeParse({
    candidates: analysis.competitorCandidates,
  });
  const competitorAnalysis = competitorAnalysisSchema.safeParse(
    analysis.competitorAnalysis,
  );

  return {
    ...analysis,
    diagnosis: diagnosis.success ? diagnosis.data : null,
    competitorCandidates: candidates.success ? candidates.data.candidates : [],
    selectedCompetitorUrls: Array.isArray(analysis.selectedCompetitorUrls)
      ? analysis.selectedCompetitorUrls.filter(
          (url): url is string => typeof url === "string",
        )
      : [],
    competitorAnalysis: competitorAnalysis.success
      ? competitorAnalysis.data
      : null,
  };
}

export async function startStudioResearch(
  projectId: string,
  userId: string,
  requestedUrl?: string,
) {
  const project = await findStudioProject(projectId, userId);
  if (!project) return null;

  const website = requestedUrl || project.brandUrl;
  if (!website) throw new StudioResearchError(400, "A website URL is required");
  let url: string;
  try {
    url = normalizePublicUrl(website);
  } catch {
    throw new StudioResearchError(400, "Enter a valid public website URL");
  }
  const current = project.analysis;

  if (current && activeResearchStatuses.has(current.status)) {
    if (current.url !== url) {
      throw new StudioResearchError(409, "A brand scan is already running");
    }
    return { analysisId: current.id, status: current.status };
  }

  const service = createAnalysisService();
  const analysisId = await db.transaction(async (transaction) => {
    if (project.brandUrl !== url) {
      await transaction
        .update(brand)
        .set({ url, updatedAt: new Date() })
        .where(eq(brand.id, project.brandId));
    }

    const [analysis] = await transaction
      .insert(siteAnalysis)
      .values({ brandId: project.brandId, userId, url })
      .returning({ id: siteAnalysis.id });
    if (!analysis) throw new Error("Could not start brand research");
    return analysis.id;
  });

  void service.run(analysisId, url);
  return { analysisId, status: "queued" };
}

function compactDiagnosis(diagnosis: BrandDiagnosis) {
  return {
    companyName: diagnosis.companyName,
    summary: diagnosis.summary,
    observations: diagnosis.observations.slice(0, 10).map((item) => ({
      ...item,
      evidence: item.evidence.slice(0, 2),
    })),
    inferences: diagnosis.inferences.slice(0, 8).map((item) => ({
      ...item,
      evidence: item.evidence.slice(0, 2),
    })),
    contradictions: diagnosis.contradictions.slice(0, 6),
    openQuestions: diagnosis.openQuestions.slice(0, 6),
  };
}

function compactCompetitorAnalysis(analysis: CompetitorAnalysis) {
  return {
    competitors: analysis.competitors.slice(0, 5).map((competitor) => ({
      ...competitor,
      evidence: competitor.evidence.slice(0, 2),
    })),
    categoryPatterns: analysis.categoryPatterns.slice(0, 8),
    similarities: analysis.similarities.slice(0, 8),
    differentiationOpportunities: analysis.differentiationOpportunities.slice(
      0,
      8,
    ),
    caveats: analysis.caveats.slice(0, 6),
  };
}

export async function readStudioMessages(projectId: string) {
  return db
    .select({
      id: studioMessage.id,
      role: studioMessage.role,
      content: studioMessage.content,
      createdAt: studioMessage.createdAt,
    })
    .from(studioMessage)
    .where(eq(studioMessage.projectId, projectId))
    .orderBy(asc(studioMessage.sequence));
}

export async function sendStudioMessage(
  projectId: string,
  userId: string,
  content: string,
  generate: StudioReply = generateStudioReply,
) {
  const project = await findStudioProject(projectId, userId);
  if (!project) return null;

  const previous = await db
    .select({ role: studioMessage.role, content: studioMessage.content })
    .from(studioMessage)
    .where(eq(studioMessage.projectId, projectId))
    .orderBy(desc(studioMessage.sequence))
    .limit(12);
  const analysis = await readLatestBrandAnalysis(project.brandId);
  const diagnosis = brandDiagnosisSchema.safeParse(analysis?.diagnosis);
  const competitorAnalysis = competitorAnalysisSchema.safeParse(
    analysis?.competitorAnalysis,
  );
  const brandContext: Record<string, unknown> = {
    brandName: project.brandName,
    brandUrl: project.brandUrl,
    researchStatus: project.brandAnalysisStatus,
    diagnosis: diagnosis.success
      ? compactDiagnosis(diagnosis.data)
      : readDiagnosisSummary(analysis?.diagnosis),
    competitorAnalysis: competitorAnalysis.success
      ? compactCompetitorAnalysis(competitorAnalysis.data)
      : null,
  };
  const system = buildCreativeDirectionSystemPrompt(brandContext);
  const turns: Turn[] = [
    ...previous.reverse().map((message) => ({
      role: message.role as Turn["role"],
      content: message.content,
    })),
    { role: "user", content },
  ];
  const answer = await generate(system, turns);
  if (!answer.trim())
    throw new Error("Studio designer returned an empty response");

  return saveStudioExchange(projectId, content, answer);
}

export async function saveStudioExchange(
  projectId: string,
  content: string,
  answer: string,
) {
  return db.transaction(async (transaction) => {
    const [userMessage] = await transaction
      .insert(studioMessage)
      .values({ projectId, role: "user", content })
      .returning();
    const [assistantMessage] = await transaction
      .insert(studioMessage)
      .values({ projectId, role: "assistant", content: answer.trim() })
      .returning();
    await transaction
      .update(studioProject)
      .set({ updatedAt: new Date() })
      .where(eq(studioProject.id, projectId));
    if (!userMessage || !assistantMessage)
      throw new Error("Could not save Studio conversation");
    return { userMessage, assistantMessage };
  });
}

function readDiagnosisSummary(value: unknown): { summary: string } | null {
  if (typeof value !== "object" || value === null || !("summary" in value)) {
    return null;
  }
  const summary = value.summary;
  return typeof summary === "string" ? { summary } : null;
}
