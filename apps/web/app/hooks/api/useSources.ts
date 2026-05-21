import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "@/lib/api-config";
import type { Source } from "@/app/types/api";

export const SOURCES_KEY = ["sources"] as const;

async function fetchSources(): Promise<Source[]> {
  const res = await fetch(`${API_URL}/sources`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch sources");
  const data = (await res.json()) as { sources?: Source[] };
  return data.sources ?? [];
}

export function useSources(enabled = true) {
  return useQuery({
    queryKey: SOURCES_KEY,
    queryFn: fetchSources,
    enabled,
  });
}

export function useAddSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { url: string; platform: string }) => {
      const res = await fetch(`${API_URL}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to add source");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SOURCES_KEY });
    },
  });
}

export function useDeleteSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sourceId: string) => {
      await fetch(`${API_URL}/sources/${sourceId}`, {
        method: "DELETE",
        credentials: "include",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SOURCES_KEY });
    },
  });
}
