import { deliveryMarker } from "../usage/operations";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "../auth/auth";
import { loadBrandBrainContext } from "../brand-brain/context";
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
import { readCanvas } from "./canvas/canvas.service";
import { studioCanvasContext } from "./canvas/canvas.context";
import type {
  CreativeAgent,
  CreativeAgentSelection,
  StudioAgentAnswer,
} from "./agent-team";
import type { VisualApproval } from "./visual-approval";

export function presentStudioMessage(
  message: typeof studioMessage.$inferSelect,
) {
  const { approvalData, approvalStatus, ...visible } = message;
  return {
    ...visible,
    approval:
      approvalData && approvalStatus
        ? {
            status: approvalStatus,
            kind: approvalData.kind,
            brief: approvalData.brief,
          }
        : null,
  };
}

export type StudioReplyOptions = { model: string };
export type Turn = { role: "user" | "assistant"; content: string };
export type StudioReply = (
  system: string,
  turns: Turn[],
  options?: StudioReplyOptions,
) => Promise<string>;

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
      title: studioProject.title,
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
    title: project.title ?? "Untitled",
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
      title: studioProject.title,
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
    title: project.title ?? (index === 0 ? "Discovery" : "Untitled"),
  }));
}

export async function renameStudioProject(
  id: string,
  userId: string,
  title: string,
) {
  const [project] = await db
    .update(studioProject)
    .set({ title, updatedAt: new Date() })
    .where(and(eq(studioProject.id, id), eq(studioProject.userId, userId)))
    .returning({ id: studioProject.id, title: studioProject.title });
  return project ?? null;
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

export async function readStudioMessages(
  projectId: string,
  thread?: CreativeAgentSelection,
) {
  const messages = await db
    .select()
    .from(studioMessage)
    .where(
      and(
        eq(studioMessage.projectId, projectId),
        thread ? eq(studioMessage.thread, thread) : undefined,
      ),
    )
    .orderBy(asc(studioMessage.sequence));
  return messages.map(presentStudioMessage);
}

export async function loadStudioConversation(
  projectId: string,
  userId: string,
  content: string,
  thread: CreativeAgentSelection = "team",
) {
  const project = await findStudioProject(projectId, userId);
  if (!project) return null;

  const previous = await db
    .select({ role: studioMessage.role, content: studioMessage.content })
    .from(studioMessage)
    .where(
      and(
        eq(studioMessage.projectId, projectId),
        eq(studioMessage.thread, thread),
      ),
    )
    .orderBy(desc(studioMessage.sequence))
    .limit(12);
  const sharedMessages = await readStudioTeamContext(projectId);
  const analysis = await readLatestBrandAnalysis(project.brandId);
  const diagnosis = brandDiagnosisSchema.safeParse(analysis?.diagnosis);
  const competitorAnalysis = competitorAnalysisSchema.safeParse(
    analysis?.competitorAnalysis,
  );
  const brandBrain = await loadBrandBrainContext(project.brandId);
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
    brandBrain,
    teamConversation: sharedMessages,
    studioMode: project.kind,
    canvas:
      project.kind === "creation"
        ? studioCanvasContext((await readCanvas(projectId, userId)).snapshot)
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
  return { project, system, turns };
}

export async function readStudioTeamContext(projectId: string) {
  const messages = await db
    .select({
      role: studioMessage.role,
      agent: studioMessage.agent,
      thread: studioMessage.thread,
      content: studioMessage.content,
    })
    .from(studioMessage)
    .where(eq(studioMessage.projectId, projectId))
    .orderBy(desc(studioMessage.sequence))
    .limit(24);
  return messages.reverse();
}

export async function saveStudioExchange(
  projectId: string,
  content: string,
  answer: string,
  agent: CreativeAgent = "brand",
  thread: CreativeAgentSelection = "team",
  contributions: StudioAgentAnswer[] = [],
  approval?: VisualApproval,
) {
  return db.transaction(async (transaction) => {
    if (approval || contributions.some((reply) => reply.approval))
      await transaction
        .update(studioMessage)
        .set({ approvalStatus: "rejected" })
        .where(
          and(
            eq(studioMessage.projectId, projectId),
            eq(studioMessage.thread, thread),
            eq(studioMessage.approvalStatus, "pending"),
          ),
        );
    const [userMessage] = await transaction
      .insert(studioMessage)
      .values({ projectId, role: "user", thread, content })
      .returning();
    const collaborationMessages = contributions.length
      ? await transaction
          .insert(studioMessage)
          .values(
            contributions.map((reply) => ({
              projectId,
              role: "assistant",
              thread: "team" as const,
              agent: reply.agent,
              content: reply.content.trim(),
              approvalData: reply.approval ?? null,
              approvalStatus: reply.approval ? ("pending" as const) : null,
            })),
          )
          .returning()
      : [];
    const [assistantMessage] = await transaction
      .insert(studioMessage)
      .values({
        projectId,
        role: "assistant",
        agent,
        thread,
        content: answer.trim(),
        approvalData: approval ?? null,
        approvalStatus: approval ? "pending" : null,
      })
      .returning();
    await transaction
      .update(studioProject)
      .set({ updatedAt: new Date() })
      .where(eq(studioProject.id, projectId));
    if (!userMessage || !assistantMessage)
      throw new Error("Could not save Studio conversation");
    await transaction.execute(deliveryMarker());
    return {
      userMessage: presentStudioMessage(userMessage),
      assistantMessage: presentStudioMessage(assistantMessage),
      collaborationMessages: collaborationMessages.map(presentStudioMessage),
    };
  });
}

function readDiagnosisSummary(value: unknown): { summary: string } | null {
  if (typeof value !== "object" || value === null || !("summary" in value)) {
    return null;
  }
  const summary = value.summary;
  return typeof summary === "string" ? { summary } : null;
}
