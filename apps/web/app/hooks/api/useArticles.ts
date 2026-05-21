import { useQuery, useMutation } from "@tanstack/react-query";
import { API_URL } from "@/lib/api-config";
import type { ArticleListItem } from "@/app/types/api";

export const ARTICLES_KEY = ["articles"] as const;

async function fetchArticles(): Promise<ArticleListItem[]> {
  const res = await fetch(`${API_URL}/articles`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch articles");
  const data = (await res.json()) as { articles?: ArticleListItem[] };
  return data.articles ?? [];
}

export function useArticles(enabled = true) {
  return useQuery({
    queryKey: ARTICLES_KEY,
    queryFn: fetchArticles,
    enabled,
  });
}

export function useExtractAngles() {
  return useMutation({
    mutationFn: async (articleId: string) => {
      const res = await fetch(`${API_URL}/articles/${articleId}/ideas`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { message?: string; error?: string }).message || (data as { error?: string }).error || "Failed to extract angles");
      return data as { ideas: string[]; cached: boolean };
    },
  });
}

export function useArticleDetail() {
  return useMutation({
    mutationFn: async (articleId: string) => {
      const res = await fetch(`${API_URL}/articles/${articleId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch article detail");
      return res.json();
    },
  });
}
