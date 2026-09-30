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

export interface LogoPathSpec {
  d: string;
  fill: "foreground" | "accent" | "none";
  stroke: "foreground" | "accent" | "none";
  strokeWidth: number;
}

export interface LogoStyleSpec {
  background: string;
  foreground: string;
  accent: string;
  fontFamily:
    | "Instrument Sans"
    | "Manrope"
    | "Belleza"
    | "Stack Sans Notch";
  fontWeight: number;
  letterSpacing: number;
}

export type CreatorCanvasEvent =
  | { type: "stage"; text: string }
  | {
      type: "direction_start";
      runId: string;
      index: number;
      name: string;
      angle: string;
      brandName: string;
    }
  | {
      type: "direction_style";
      runId: string;
      index: number;
      style: LogoStyleSpec;
    }
  | {
      type: "direction_path";
      runId: string;
      index: number;
      pathIndex: number;
      path: LogoPathSpec;
    }
  | { type: "direction_complete"; runId: string; index: number };

type StudioStreamEvent =
  | { type: "delta"; text: string }
  | {
      type: "done";
      userMessage: StudioMessage;
      assistantMessage: StudioMessage;
    }
  | { type: "error"; error: string }
  | CreatorCanvasEvent;

async function readStudioStream(
  id: string,
  content: string,
  endpoint: "messages" | "creator",
  onEvent: (event: StudioStreamEvent) => void,
): Promise<{ userMessage: StudioMessage; assistantMessage: StudioMessage }> {
  const response = await fetch(
    `${API_URL}/studio/projects/${encodeURIComponent(id)}/${endpoint}/stream`,
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
    if (event.type === "error") throw new Error(event.error);
    if (event.type === "done") {
      completed = {
        userMessage: event.userMessage,
        assistantMessage: event.assistantMessage,
      };
    }
    if (event.type !== "done") onEvent(event);
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

export const streamStudioMessage = (
  id: string,
  content: string,
  onDelta: (text: string) => void,
) =>
  readStudioStream(id, content, "messages", (event) => {
    if (event.type === "delta") onDelta(event.text);
  });

export const streamStudioCreatorMessage = (
  id: string,
  content: string,
  onDelta: (text: string) => void,
  onCanvasEvent: (event: CreatorCanvasEvent) => void,
) =>
  readStudioStream(id, content, "creator", (event) => {
    if (event.type === "delta") onDelta(event.text);
    else if (event.type !== "error" && event.type !== "done")
      onCanvasEvent(event);
  });
