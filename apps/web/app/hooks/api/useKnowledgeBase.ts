import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "@/lib/api-config";
import type { KnowledgeBase } from "@/app/types/api";

export const KNOWLEDGE_BASE_KEY = ["knowledge-base"] as const;

const EMPTY_KB: KnowledgeBase = {
  customHooks: [],
  customTemplates: [],
  bannedWords: [],
  brandVoiceTraining: "",
  voiceMemory: {
    sources: [],
    profile: {
      tone: "",
      vocabulary: "",
      sentenceLength: "",
      humorLevel: "",
      opinionatedVsNeutral: "",
      ctaStyle: "",
      topicsToAvoid: "",
      frequentPhrases: "",
    },
    strictness: 50,
    status: "idle",
    lastLearnedAt: null,
    lastLearnedSourceId: null,
  },
};

function normalizeKnowledgeBase(typed: Partial<KnowledgeBase>): KnowledgeBase {
  const rawVoiceMemory = typed.voiceMemory ?? EMPTY_KB.voiceMemory;
  const rawProfile = rawVoiceMemory.profile ?? EMPTY_KB.voiceMemory.profile;
  return {
    customHooks: typed.customHooks ?? [],
    customTemplates: typed.customTemplates ?? [],
    bannedWords: typed.bannedWords ?? [],
    brandVoiceTraining: typed.brandVoiceTraining ?? "",
    voiceMemory: {
      sources: Array.isArray(rawVoiceMemory.sources) ? rawVoiceMemory.sources : [],
      strictness: typeof rawVoiceMemory.strictness === "number" ? rawVoiceMemory.strictness : 50,
      status: rawVoiceMemory.status === "learning" || rawVoiceMemory.status === "ready" || rawVoiceMemory.status === "failed"
        ? rawVoiceMemory.status
        : "idle",
      lastLearnedAt: typeof rawVoiceMemory.lastLearnedAt === "string" ? rawVoiceMemory.lastLearnedAt : null,
      lastLearnedSourceId: typeof rawVoiceMemory.lastLearnedSourceId === "string" ? rawVoiceMemory.lastLearnedSourceId : null,
      profile: {
        tone: rawProfile.tone ?? "",
        vocabulary: rawProfile.vocabulary ?? "",
        sentenceLength: rawProfile.sentenceLength ?? "",
        humorLevel: rawProfile.humorLevel ?? "",
        opinionatedVsNeutral: rawProfile.opinionatedVsNeutral ?? "",
        ctaStyle: rawProfile.ctaStyle ?? "",
        topicsToAvoid: rawProfile.topicsToAvoid ?? "",
        frequentPhrases: rawProfile.frequentPhrases ?? "",
      },
    },
  };
}

async function fetchKnowledgeBase(): Promise<KnowledgeBase> {
  const res = await fetch(`${API_URL}/knowledge-base`, { credentials: "include" });
  if (!res.ok) return EMPTY_KB;
  const data = await res.json();
  const typed = data as Partial<KnowledgeBase>;
  return normalizeKnowledgeBase(typed);
}

export function useKnowledgeBase(enabled = true, refetchInterval?: number | false) {
  return useQuery({
    queryKey: KNOWLEDGE_BASE_KEY,
    queryFn: fetchKnowledgeBase,
    enabled,
    refetchInterval,
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
