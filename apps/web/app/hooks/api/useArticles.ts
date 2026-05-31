import { useQuery, useMutation } from "@tanstack/react-query";
import { API_URL } from "@/lib/api-config";
import type { ArticleListItem } from "@/app/types/api";

export const ARTICLES_KEY = ["articles"] as const;

interface ExtractAnglesParams {
  articleId: string;
  force?: boolean;
}

async function readJsonResponse<TResponse>(response: Response, fallbackMessage: string): Promise<TResponse> {
  const rawBody = await response.text();

  try {
    return JSON.parse(rawBody) as TResponse;
  } catch {
    throw new Error(fallbackMessage);
  }
}

async function fetchArticles(): Promise<ArticleListItem[]> {
  const res = await fetch(`${API_URL}/articles`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch articles");
  const data = await readJsonResponse<{ articles?: ArticleListItem[] }>(
    res,
    "The articles endpoint is unavailable. Restart or redeploy the backend API.",
  );
  return data.articles ?? [];
}

/** Fetches synced newsletter articles for the authenticated user. */
export function useArticles(enabled = true) {
  return useQuery({
    queryKey: ARTICLES_KEY,
    queryFn: fetchArticles,
    enabled,
  });
}

/** Extracts or re-extracts LLM-backed atomic angles from a selected article. */
export function useExtractAngles() {
  return useMutation({
    mutationFn: async (params: ExtractAnglesParams) => {
      const res = await fetch(`${API_URL}/articles/${params.articleId}/ideas`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: params.force === true }),
      });
      const data = await readJsonResponse<{ ideas?: string[]; cached?: boolean; message?: string; error?: string }>(
        res,
        "The angle extraction endpoint is unavailable. Restart or redeploy the backend API.",
      );
      if (!res.ok) throw new Error((data as { message?: string; error?: string }).message || (data as { error?: string }).error || "Failed to extract angles");
      return { ideas: data.ideas ?? [], cached: data.cached === true };
    },
  });
}

/** Fetches one article with its full content and cached angles. */
export function useArticleDetail() {
  return useMutation({
    mutationFn: async (articleId: string) => {
      const res = await fetch(`${API_URL}/articles/${articleId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch article detail");
      return res.json();
    },
  });
}
