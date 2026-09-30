import { API_URL } from "../api-config";

async function readApiJson<T>(response: Response): Promise<T> {
  const body = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      `Analysis API returned ${response.status} ${response.statusText} instead of JSON. Check that the backend is running at ${API_URL}.`,
    );
  }
  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error("Analysis API returned invalid JSON");
  }
}

export interface Evidence {
  statement: string;
  sourceUrl: string;
  sourceText: string;
}

export interface Observation {
  type: "product" | "audience_signal" | "claim" | "proof" | "voice" | "visual";
  statement: string;
  confidence: number;
  evidence: Evidence[];
}

export interface Inference {
  type: "audience" | "category" | "positioning" | "personality";
  statement: string;
  confidence: number;
  evidence: Evidence[];
}

export interface Question {
  question: string;
  reason: string;
  options: string[];
}

export interface BrandDiagnosis {
  companyName: string;
  summary: string;
  observations: Observation[];
  inferences: Inference[];
  contradictions: string[];
  openQuestions: Question[];
}

export interface CompetitorCandidate {
  name: string;
  url: string;
  relationship: "direct" | "indirect" | "adjacent";
  reason: string;
  confidence: number;
}

export interface CompetitorProfile {
  name: string;
  url: string;
  positioning: string;
  audience: string;
  primaryClaim: string;
  voice: string[];
  visualPatterns: string[];
  evidence: Evidence[];
}

export interface CompetitorAnalysis {
  competitors: CompetitorProfile[];
  categoryPatterns: string[];
  similarities: string[];
  differentiationOpportunities: string[];
  caveats: string[];
  visualReferences?: Array<{
    url: string;
    title: string;
    screenshot: string | null;
    branding: unknown;
  }>;
}

export interface DiscoveryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export type AnalysisStatus =
  | "queued"
  | "scraping"
  | "synthesizing"
  | "discovering_competitors"
  | "awaiting_competitor_confirmation"
  | "scanning_competitors"
  | "comparing_competitors"
  | "competitor_analysis_failed"
  | "completed"
  | "failed";

export interface SiteAnalysis {
  id: string;
  brandId?: string | null;
  url: string;
  status: AnalysisStatus;
  progress: number;
  diagnosis: BrandDiagnosis | null;
  competitorCandidates: CompetitorCandidate[] | null;
  selectedCompetitorUrls: string[] | null;
  competitorAnalysis: CompetitorAnalysis | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnalysisResponse {
  analysisId: string;
  status: string;
}

export async function createSiteAnalysis(url: string): Promise<CreateAnalysisResponse> {
  const response = await fetch(`${API_URL}/site-analyses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ url }),
  });

  const data = await readApiJson<{ error?: string } & Partial<CreateAnalysisResponse>>(response);

  if (!response.ok) {
    throw new Error(data.error || "Failed to start site analysis");
  }

  return data as CreateAnalysisResponse;
}

export async function getSiteAnalysis(id: string): Promise<SiteAnalysis> {
  const response = await fetch(`${API_URL}/site-analyses/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const data = await readApiJson<{ error?: string } & Partial<SiteAnalysis>>(response);

  if (!response.ok) {
    throw new Error(data.error || "Failed to load site analysis");
  }

  return data as SiteAnalysis;
}

export async function confirmCompetitors(
  id: string,
  urls: string[],
): Promise<void> {
  const response = await fetch(
    `${API_URL}/site-analyses/${encodeURIComponent(id)}/competitors`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ urls }),
    },
  );

  if (!response.ok) {
    const data = await readApiJson<{ error?: string }>(response);
    throw new Error(data.error || "Unable to start competitor analysis");
  }
}

export async function getDiscoveryMessages(id: string): Promise<DiscoveryMessage[]> {
  const response = await fetch(`${API_URL}/site-analyses/${encodeURIComponent(id)}/messages`, { credentials: "include" });
  const data = await readApiJson<{ error?: string; messages?: DiscoveryMessage[] }>(response);
  if (!response.ok) throw new Error(data.error || "Unable to load conversation");
  return data.messages ?? [];
}

export async function sendDiscoveryMessage(id: string, content: string, images: string[] = []): Promise<string> {
  const response = await fetch(`${API_URL}/site-analyses/${encodeURIComponent(id)}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ content, images }),
  });
  const data = await readApiJson<{ error?: string; answer?: string }>(response);
  if (!response.ok) throw new Error(data.error || "Unable to send message");
  return data.answer ?? "";
}
