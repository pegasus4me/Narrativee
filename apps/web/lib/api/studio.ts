import { billingFetch, notifyBilling } from "./billing";
import { API_URL } from "../api-config";
import type { CampaignDocument } from "./studio-canvas";
import type { CampaignOutput } from "../studio-outputs";
import type { CampaignGeneration } from "../../../backend/src/studio/campaign/campaign.types";
export type { CampaignGeneration } from "../../../backend/src/studio/campaign/campaign.types";
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
  agent?: AgentActivity["agent"] | null;
  thread?: StudioAgentSelection;
  content: string;
  createdAt: string;
  approval?: {
    status: "pending" | "executing" | "completed" | "rejected" | "failed";
    kind: "campaign_creation" | "logo_exploration";
    brief: string;
  } | null;
}

export interface StudioProject {
  id: string;
  brandId: string;
  kind: "discovery" | "creation";
  brandName: string;
  title: string;
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
  const response = await billingFetch(endpoint, {
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

export const renameStudioProject = (id: string, title: string) =>
  request<{ id: string; title: string }>(`/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });

export const getStudioGenerationCost = (
  id: string,
  outputs: CampaignOutput[],
) =>
  request<{ maxCredits: number }>(
    `/${encodeURIComponent(id)}/generation-cost`,
    {
      method: "POST",
      body: JSON.stringify({ outputs }),
    },
  ).then((quote) => {
    if (!Number.isSafeInteger(quote.maxCredits) || quote.maxCredits < 1)
      throw new Error("Generation cost is unavailable");
    return quote;
  });

export const startStudioResearch = (id: string, url?: string) =>
  request<{ analysisId: string; status: string }>(
    `/${encodeURIComponent(id)}/research`,
    { method: "POST", body: JSON.stringify(url ? { url } : {}) },
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
  fontFamily: "Instrument Sans" | "Manrope" | "Belleza" | "Stack Sans Notch";
  fontWeight: number;
  letterSpacing: number;
}

export type CreatorCanvasEvent =
  | AgentActivity
  | TeamChatEvent
  | { type: "campaign_scene"; document: CampaignDocument }
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

export interface AgentActivity {
  type: "agent_activity";
  agent: "research" | "brand" | "creator";
  status: "working" | "complete" | "error";
  text: string;
}

export const STUDIO_CANVAS_EVENT = "narrativee:studio-canvas";

export type StudioCanvasEvent =
  | CreatorCanvasEvent
  | {
      type: "image_upload";
      image: { id: string; width: number; height: number; name: string };
    };

export function dispatchStudioCanvasEvent(
  projectId: string,
  event: StudioCanvasEvent,
): Promise<void> {
  if (event.type !== "campaign_scene" && event.type !== "image_upload") {
    window.dispatchEvent(
      new CustomEvent(STUDIO_CANVAS_EVENT, { detail: { projectId, event } }),
    );
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    let handled = false;
    window.dispatchEvent(
      new CustomEvent(STUDIO_CANVAS_EVENT, {
        detail: {
          projectId,
          event,
          respondWith: (result: Promise<void>) => {
            handled = true;
            result.then(resolve, reject);
          },
        },
      }),
    );
    if (!handled)
      reject(new Error("Open the Studio canvas before generating a creative."));
  });
}

type StudioStreamEvent =
  | { type: "delta"; text: string }
  | { type: "reply_agent"; agent: AgentActivity["agent"] }
  | {
      type: "done";
      userMessage: StudioMessage;
      assistantMessage: StudioMessage;
      collaborationMessages?: StudioMessage[];
      approvalMessage?: StudioMessage;
    }
  | { type: "error"; error: string; code?: string }
  | CreatorCanvasEvent;

export type StudioAgentSelection = "team" | AgentActivity["agent"];
export type TeamChatEvent =
  | { type: "conversation_thread"; thread: "team" }
  | { type: "team_message"; agent: AgentActivity["agent"]; content: string };

async function readStudioStream(
  id: string,
  content: string,
  endpoint: "messages" | "creator" | `approvals/${string}`,
  onEvent: (event: StudioStreamEvent) => void | Promise<void>,
  agent?: StudioAgentSelection,
  decision?: { action: "approve" | "reject" | "refresh"; feedback: string },
  outputs?: CampaignOutput[],
  generation?: CampaignGeneration,
): Promise<{
  userMessage: StudioMessage;
  assistantMessage: StudioMessage;
  collaborationMessages?: StudioMessage[];
  approvalMessage?: StudioMessage;
}> {
  const response = await billingFetch(
    `${API_URL}/studio/projects/${encodeURIComponent(id)}/${endpoint}/stream`,
    {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(decision ?? { content, agent, outputs, generation }),
    },
  );
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
      message?: string;
    } | null;
    throw new StudioApiError(
      response.status,
      body?.error ??
        body?.message ??
        (response.status === 404
          ? "Designer endpoint not found (check backend status)"
          : response.status === 401
            ? "Session expired, please sign in again"
            : "The designer is unavailable"),
    );
  }
  if (!response.body)
    throw new Error("Streaming is unavailable in this browser");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let replyingAgent: AgentActivity["agent"] | null = null;
  let completed: {
    userMessage: StudioMessage;
    assistantMessage: StudioMessage;
    collaborationMessages?: StudioMessage[];
    approvalMessage?: StudioMessage;
  } | null = null;

  async function readLine(line: string) {
    if (!line.trim()) return;
    const event = JSON.parse(line) as StudioStreamEvent;
    if (event.type === "error") {
      notifyBilling(event.code);
      throw new Error(event.error);
    }
    if (event.type === "reply_agent") replyingAgent = event.agent;
    if (event.type === "done") {
      completed = {
        userMessage: event.userMessage,
        assistantMessage: {
          ...event.assistantMessage,
          agent: event.assistantMessage.agent ?? replyingAgent,
        },
        collaborationMessages: event.collaborationMessages,
        approvalMessage: event.approvalMessage,
      };
    }
    if (event.type !== "done") await onEvent(event);
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      let end = buffer.indexOf("\n");
      while (end !== -1) {
        await readLine(buffer.slice(0, end));
        buffer = buffer.slice(end + 1);
        end = buffer.indexOf("\n");
      }
      if (done) break;
    }
    await readLine(buffer);
    if (!completed)
      throw new Error("The designer stream ended before completion");
    return completed;
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
    notifyBilling();
  }
}

export const streamStudioMessage = (
  id: string,
  content: string,
  onDelta: (text: string) => void,
  agent?: StudioAgentSelection,
  onReplyAgent?: (agent: AgentActivity["agent"]) => void,
  onActivity?: (activity: AgentActivity) => void,
  onTeamEvent?: (event: TeamChatEvent) => void,
) =>
  readStudioStream(
    id,
    content,
    "messages",
    (event) => {
      if (event.type === "delta") onDelta(event.text);
      if (event.type === "reply_agent") onReplyAgent?.(event.agent);
      if (event.type === "agent_activity") onActivity?.(event);
      if (event.type === "conversation_thread" || event.type === "team_message")
        onTeamEvent?.(event);
    },
    agent,
  );

export const streamStudioCreatorMessage = (
  id: string,
  content: string,
  onDelta: (text: string) => void,
  onCanvasEvent: (event: CreatorCanvasEvent) => void | Promise<void>,
  agent?: StudioAgentSelection,
  onReplyAgent?: (agent: AgentActivity["agent"]) => void,
  outputs?: CampaignOutput[],
  generation?: CampaignGeneration,
) =>
  readStudioStream(
    id,
    content,
    "creator",
    (event) => {
      if (event.type === "delta") onDelta(event.text);
      else if (event.type === "reply_agent") onReplyAgent?.(event.agent);
      else if (event.type !== "error" && event.type !== "done")
        return onCanvasEvent(event);
    },
    agent,
    undefined,
    outputs,
    generation,
  );

export const streamStudioApproval = (
  id: string,
  messageId: string,
  action: "approve" | "reject" | "refresh",
  feedback: string,
  onDelta: (text: string) => void,
  onCanvasEvent: (event: CreatorCanvasEvent) => void | Promise<void>,
  onReplyAgent: (agent: AgentActivity["agent"]) => void,
) =>
  readStudioStream(
    id,
    "",
    `approvals/${encodeURIComponent(messageId)}`,
    (event) => {
      if (event.type === "delta") onDelta(event.text);
      else if (event.type === "reply_agent") onReplyAgent(event.agent);
      else if (event.type !== "error" && event.type !== "done")
        return onCanvasEvent(event);
    },
    undefined,
    { action, feedback },
  );

export interface StudioAgentSettings {
  model: string | null;
  imageModel: string | null;
  videoModel: string | null;
  responseLength: "brief" | "balanced" | "detailed";
  instructions: string;
}
export interface StudioAgentSettingsPanel {
  settings: StudioAgentSettings;
  models: string[];
  defaultModel: string;
  imageModels: string[];
  videoModels: string[];
  defaultImageModel: string;
  defaultVideoModel: string;
  videoGenerationAvailable: boolean;
  mediaModelDetails: Record<string, StudioMediaModelDetails>;
}
export interface StudioMediaModelDetails {
  label: string;
  provider: string;
  kind: "image" | "video";
  connected: boolean;
}
export const getStudioAgentSettings = (
  id: string,
  agent: AgentActivity["agent"],
  signal?: AbortSignal,
) =>
  request<StudioAgentSettingsPanel>(
    `/${encodeURIComponent(id)}/agents/${agent}/settings`,
    { signal },
  );
export const saveStudioAgentSettings = (
  id: string,
  agent: AgentActivity["agent"],
  settings: StudioAgentSettings,
) =>
  request<StudioAgentSettings>(
    `/${encodeURIComponent(id)}/agents/${agent}/settings`,
    { method: "PATCH", body: JSON.stringify(settings) },
  );
