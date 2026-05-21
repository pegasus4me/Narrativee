import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "@/lib/api-config";
import type { Draft } from "@/app/types/api";

export const DRAFTS_QUEUE_KEY = ["drafts", "queue"] as const;
export const DRAFTS_LATEST_KEY = ["drafts", "latest"] as const;
export const DRAFTS_ACTIVE_KEY = ["drafts", "active"] as const;

async function fetchDraftsQueue(): Promise<Draft[]> {
  const res = await fetch(`${API_URL}/articles/drafts/queue`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch drafts queue");
  return (await res.json()) as Draft[];
}

async function fetchLatestDraft(): Promise<{ article: { id: string; title: string; createdAt: string } | null; drafts: Draft[] } | null> {
  const res = await fetch(`${API_URL}/articles/drafts/latest`, { credentials: "include" });
  if (!res.ok) return null;
  const data = await res.json();
  const typed = data as { article?: { id: string; title: string; createdAt: string }; drafts?: Draft[] };
  if (typed.article && typed.drafts && typed.drafts.length > 0) return { article: typed.article, drafts: typed.drafts };
  return null;
}

async function fetchActiveDrafts(): Promise<Draft[]> {
  const res = await fetch(`${API_URL}/articles/drafts/active`, { credentials: "include" });
  if (!res.ok) return [];
  return (await res.json()) as Draft[];
}

export function useDraftsQueue(enabled = true) {
  return useQuery({
    queryKey: DRAFTS_QUEUE_KEY,
    queryFn: fetchDraftsQueue,
    enabled,
  });
}

export function useLatestDraft(enabled = true) {
  return useQuery({
    queryKey: DRAFTS_LATEST_KEY,
    queryFn: fetchLatestDraft,
    enabled,
  });
}

export function useActiveDrafts(enabled = true) {
  return useQuery({
    queryKey: DRAFTS_ACTIVE_KEY,
    queryFn: fetchActiveDrafts,
    enabled,
  });
}

export function useScheduleDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { draftId: string; scheduledAt: string }) => {
      const res = await fetch(`${API_URL}/articles/drafts/${params.draftId}/schedule`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: params.scheduledAt }),
      });
      if (!res.ok) throw new Error("Failed to schedule draft");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRAFTS_QUEUE_KEY });
      queryClient.invalidateQueries({ queryKey: DRAFTS_LATEST_KEY });
    },
  });
}

export function useUnscheduleDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draftId: string) => {
      const res = await fetch(`${API_URL}/articles/drafts/${draftId}/unschedule`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to unschedule draft");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRAFTS_QUEUE_KEY });
    },
  });
}

export function usePublishDraftNow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draftId: string) => {
      const res = await fetch(`${API_URL}/articles/drafts/${draftId}/publish-now`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to publish draft");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRAFTS_QUEUE_KEY });
    },
  });
}

export function useUpdateDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { draftId: string; text: string; articleId?: string }) => {
      const url = params.articleId
        ? `${API_URL}/articles/${params.articleId}/drafts/${params.draftId}`
        : `${API_URL}/articles/drafts/${params.draftId}`;
      const res = await fetch(url, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: params.text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to save draft");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRAFTS_LATEST_KEY });
      queryClient.invalidateQueries({ queryKey: DRAFTS_ACTIVE_KEY });
    },
  });
}

export function useDeleteDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draftId: string) => {
      const res = await fetch(`${API_URL}/articles/drafts/${draftId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete draft");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRAFTS_QUEUE_KEY });
      queryClient.invalidateQueries({ queryKey: DRAFTS_LATEST_KEY });
    },
  });
}

export function useGenerateDrafts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { articleId: string; selectedAngles: string[]; attachLink: boolean }) => {
      const res = await fetch(`${API_URL}/articles/${params.articleId}/drafts`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedAngles: params.selectedAngles,
          attachLink: params.attachLink,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { message?: string; error?: string }).message || (data as { error?: string }).error || "Failed to generate drafts");
      return data as { drafts: Draft[] };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRAFTS_LATEST_KEY });
      queryClient.invalidateQueries({ queryKey: DRAFTS_ACTIVE_KEY });
    },
  });
}
