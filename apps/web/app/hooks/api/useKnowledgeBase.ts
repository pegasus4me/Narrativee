import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "@/lib/api-config";
import type { KnowledgeBase } from "@/app/types/api";

export const KNOWLEDGE_BASE_KEY = ["knowledge-base"] as const;

const EMPTY_KB: KnowledgeBase = {
  customHooks: [],
  customTemplates: [],
  bannedWords: [],
  brandVoiceTraining: "",
};

async function fetchKnowledgeBase(): Promise<KnowledgeBase> {
  const res = await fetch(`${API_URL}/knowledge-base`, { credentials: "include" });
  if (!res.ok) return EMPTY_KB;
  const data = await res.json();
  const typed = data as Partial<KnowledgeBase>;
  return {
    customHooks: typed.customHooks ?? [],
    customTemplates: typed.customTemplates ?? [],
    bannedWords: typed.bannedWords ?? [],
    brandVoiceTraining: typed.brandVoiceTraining ?? "",
  };
}

export function useKnowledgeBase(enabled = true) {
  return useQuery({
    queryKey: KNOWLEDGE_BASE_KEY,
    queryFn: fetchKnowledgeBase,
    enabled,
  });
}

export function useSaveKnowledgeBase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (kb: KnowledgeBase) => {
      const res = await fetch(`${API_URL}/knowledge-base`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kb),
      });
      if (!res.ok) throw new Error("Failed to save knowledge base");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KNOWLEDGE_BASE_KEY });
    },
  });
}
