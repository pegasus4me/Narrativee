import { API_URL } from "../api-config";
import type {
  AnalysisStatus,
  BrandDiagnosis,
  CompetitorAnalysis,
  CompetitorCandidate,
} from "./analysis";

export interface StudioAnalysis {
  id: string;
  url: string;
  status: AnalysisStatus;
  progress: number;
  diagnosis: BrandDiagnosis | null;
  competitorCandidates: CompetitorCandidate[];
  selectedCompetitorUrls: string[];
  competitorAnalysis: CompetitorAnalysis | null;
  error: string | null;
}

export interface StudioMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface StudioProject {
  id: string;
  brandId: string;
  kind: "discovery" | "creation";
  brandName: string;
  brandUrl: string | null;
  createdAt: string;
  updatedAt: string;
  brandAnalysisStatus:
    | "not_started"
    | "in_progress"
    | "diagnosis_ready"
    | "ready"
    | "failed";
  hasBrandDiagnosis: boolean;
  hasCompetitorAnalysis: boolean;
  analysis: StudioAnalysis | null;
}

export interface StudioChat {
  id: string;
  kind: "discovery" | "creation";
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudioBoardRun {
  runId: string;
  createdAt: string;
  concept: string;
  critique: {
    brandFit: number;
    distinctiveness: number;
    legibility: number;
    strengths: string[];
    issues: string[];
    verdict: string;
  };
}

export type StudioBoardStatus =
  | { status: "idle" }
  | { status: "running"; stage: string }
  | { status: "failed"; error: string }
  | ({ status: "ready" } & StudioBoardRun);

export class StudioApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const endpoint = `${API_URL}/studio/projects${path}`;
  const response = await fetch(endpoint, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new StudioApiError(
      response.status,
      `Studio API returned HTML instead of JSON for /studio/projects${path} (HTTP ${response.status}). Check that the backend is running with the latest Studio routes.`,
    );
  }
  let body: T & { error?: string };
  try {
    body = (await response.json()) as T & { error?: string };
  } catch {
    throw new StudioApiError(
      response.status,
      "Studio API returned invalid JSON",
    );
  }
  if (!response.ok) {
    throw new StudioApiError(
      response.status,
      body.error ?? "Studio is unavailable",
    );
  }
  return body;
}

export const createStudioProject = (brandId: string) =>
  request<{ id: string; brandId: string; createdAt: string }>("", {
    method: "POST",
    body: JSON.stringify({ brandId }),
  });

export const openStudioProject = (brandId: string, signal?: AbortSignal) =>
  request<{ id: string; brandId: string }>(
    `?brandId=${encodeURIComponent(brandId)}`,
    { signal },
  );

export const listStudioProjects = (brandId: string, signal?: AbortSignal) =>
  request<StudioChat[]>(`?brandId=${encodeURIComponent(brandId)}&view=chats`, {
    signal,
  }).then((chats) => {
    if (!Array.isArray(chats)) {
      throw new Error("Studio API is out of date. Restart the backend.");
    }
    return chats;
  });

export const getStudioProject = (id: string, signal?: AbortSignal) =>
  request<{ project: StudioProject; messages: StudioMessage[] }>(
    `/${encodeURIComponent(id)}`,
    { signal },
  );

export const getStudioBoard = (id: string, signal?: AbortSignal) =>
  request<StudioBoardStatus>(`/${encodeURIComponent(id)}/board`, { signal });

export const getStudioBoardHistory = (id: string, signal?: AbortSignal) =>
  request<StudioBoardRun[]>(`/${encodeURIComponent(id)}/board/history`, {
    signal,
  });

export const generateStudioBoard = (id: string) =>
  request<StudioBoardStatus>(`/${encodeURIComponent(id)}/board`, {
    method: "POST",
    body: "{}",
  });

export async function getStudioBoardFile(
  id: string,
  name: "board.png" | "direction.json" | "critique.json",
  runId?: string,
  signal?: AbortSignal,
): Promise<Blob> {
  const query = runId ? `?runId=${encodeURIComponent(runId)}` : "";
  const response = await fetch(
    `${API_URL}/studio/projects/${encodeURIComponent(id)}/board/files/${name}${query}`,
    { credentials: "include", cache: "no-store", signal },
  );
  if (!response.ok) {
    throw new StudioApiError(response.status, "Could not load board file");
  }
  return response.blob();
}

export const startStudioResearch = (id: string, url?: string) =>
  request<{ analysisId: string; status: string }>(
    `/${encodeURIComponent(id)}/research`,
    { method: "POST", body: JSON.stringify(url ? { url } : {}) },
  );

export const sendStudioMessage = (id: string, content: string) =>
  request<{ userMessage: StudioMessage; assistantMessage: StudioMessage }>(
    `/${encodeURIComponent(id)}/messages`,
    { method: "POST", body: JSON.stringify({ content }) },
  );

type StudioStreamEvent =
  | { type: "delta"; text: string }
  | {
      type: "done";
      userMessage: StudioMessage;
      assistantMessage: StudioMessage;
    }
  | { type: "error"; error: string };

export async function streamStudioMessage(
  id: string,
  content: string,
  onDelta: (text: string) => void,
): Promise<{ userMessage: StudioMessage; assistantMessage: StudioMessage }> {
  const response = await fetch(
    `${API_URL}/studio/projects/${encodeURIComponent(id)}/messages/stream`,
    {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    },
  );
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new StudioApiError(
      response.status,
      body?.error ?? "The designer is unavailable",
    );
  }
  if (!response.body)
    throw new Error("Streaming is unavailable in this browser");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let completed: {
    userMessage: StudioMessage;
    assistantMessage: StudioMessage;
  } | null = null;

  function readLine(line: string) {
    if (!line.trim()) return;
    const event = JSON.parse(line) as StudioStreamEvent;
    if (event.type === "delta") onDelta(event.text);
    if (event.type === "error") throw new Error(event.error);
    if (event.type === "done") {
      completed = {
        userMessage: event.userMessage,
        assistantMessage: event.assistantMessage,
      };
    }
  }

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    let end = buffer.indexOf("\n");
    while (end !== -1) {
      readLine(buffer.slice(0, end));
      buffer = buffer.slice(end + 1);
      end = buffer.indexOf("\n");
    }
    if (done) break;
  }
  readLine(buffer);
  if (!completed)
    throw new Error("The designer stream ended before completion");
  return completed;
}
