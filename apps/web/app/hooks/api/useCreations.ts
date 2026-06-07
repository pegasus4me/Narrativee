import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "@/lib/api-config";
import type {
  CarouselTargetPlatform,
  CreationDraft,
  CreationSession,
  CreationSessionSummary,
} from "@/app/types/api";

export const CREATIONS_KEY = ["creations"] as const;
export const CREATION_SESSION_KEY = (creationId: string) => ["creation-session", creationId] as const;

interface CreateCreationParams {
  sourceId: string;
  articleId: string;
  selectedAngles: string[];
  selectedChannelIds: string[];
  carouselPlatforms?: CarouselTargetPlatform[];
  draftCount: number;
  userGoals?: string;
}

async function readJsonResponse<TResponse>(response: Response, fallbackMessage: string): Promise<TResponse> {
  const rawBody = await response.text();

  try {
    return JSON.parse(rawBody) as TResponse;
  } catch {
    throw new Error(fallbackMessage);
  }
}

/**
 * Fetches the current user's saved creation sessions.
 */
export function useCreationSessions(enabled = true) {
  return useQuery({
    queryKey: CREATIONS_KEY,
    enabled,
    queryFn: async (): Promise<CreationSessionSummary[]> => {
      const response = await fetch(`${API_URL}/creations`, {
        credentials: "include",
      });

      const data = await readJsonResponse<{ creations?: CreationSessionSummary[]; error?: string }>(
        response,
        "The creations library is unavailable. Restart the backend and try again.",
      );
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to fetch creations");
      }

      return data.creations ?? [];
    },
  });
}

/**
 * Creates a saved draft generation session and returns its id.
 */
export function useCreateCreationSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateCreationParams) => {
      const response = await fetch(`${API_URL}/creations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(params),
      });

      const data = await readJsonResponse<{ creationId?: string; error?: string }>(
        response,
        "The creation endpoint is unavailable. Restart the backend and try again.",
      );
      if (!response.ok || !data.creationId) {
        throw new Error(data.error ?? "Failed to create draft session");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CREATIONS_KEY });
    },
  });
}

/**
 * Fetches a previously saved creation session by id.
 */
export function useCreationSession(creationId: string, enabled = true) {
  return useQuery({
    queryKey: CREATION_SESSION_KEY(creationId),
    enabled: enabled && creationId.length > 0,
    queryFn: async (): Promise<CreationSession> => {
      const response = await fetch(`${API_URL}/creations/${creationId}`, {
        credentials: "include",
      });

      const data = await readJsonResponse<{ creation?: CreationSession; error?: string }>(
        response,
        "This saved creation is unavailable. Restart the backend and try again.",
      );
      if (!response.ok || !data.creation) {
        throw new Error(data.error ?? "Failed to fetch creation");
      }

      return data.creation;
    },
  });
}

/**
 * Persists edited drafts for an existing creation session.
 */
export function useUpdateCreationSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { creationId: string; drafts: CreationDraft[] }) => {
      const response = await fetch(`${API_URL}/creations/${params.creationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ drafts: params.drafts }),
      });

      const data = await readJsonResponse<{ success?: boolean; error?: string }>(
        response,
        "The save endpoint is unavailable. Restart the backend and try again.",
      );
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failed to save creation");
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: CREATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: CREATION_SESSION_KEY(variables.creationId) });
    },
  });
}

interface ScheduleCreationDraftParams {
  creationId: string;
  channelId: string;
  variantNumber: number;
  scheduledAt: string;
  text?: string;
}

/**
 * Schedules a draft from a creation session into the social posts calendar.
 */
export function useScheduleCreationDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ScheduleCreationDraftParams) => {
      const response = await fetch(`${API_URL}/creations/${params.creationId}/drafts/${params.channelId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          scheduledAt: params.scheduledAt,
          text: params.text,
          variantNumber: params.variantNumber,
        }),
      });

      const data = await readJsonResponse<{ success?: boolean; error?: string }>(
        response,
        "The scheduling endpoint is unavailable. Restart the backend and try again.",
      );
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failed to schedule draft");
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["drafts", "queue"] });
      queryClient.invalidateQueries({ queryKey: CREATION_SESSION_KEY(variables.creationId) });
    },
  });
}

interface RenderCreationCarouselParams {
  creationId: string;
  channelId: string;
  draft: CreationDraft;
}

/**
 * Renders or re-renders carousel visuals for a saved creation draft.
 */
export function useRenderCreationCarousel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RenderCreationCarouselParams): Promise<{ draft: CreationDraft }> => {
      const response = await fetch(`${API_URL}/creations/${params.creationId}/drafts/${params.channelId}/carousel/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          variantNumber: params.draft.variantNumber,
          draft: params.draft,
        }),
      });

      const data = await readJsonResponse<{ draft?: CreationDraft; error?: string }>(
        response,
        "The carousel renderer is unavailable. Restart the backend and try again.",
      );
      if (!response.ok || !data.draft) {
        throw new Error(data.error ?? "Failed to render carousel");
      }

      return { draft: data.draft };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: CREATION_SESSION_KEY(variables.creationId) });
      queryClient.invalidateQueries({ queryKey: ["credits"] });
    },
  });
}
