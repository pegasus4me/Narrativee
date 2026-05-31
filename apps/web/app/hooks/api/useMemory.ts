import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "@/lib/api-config";
import { KNOWLEDGE_BASE_KEY } from "./useKnowledgeBase";

async function readJsonResponse<TResponse>(response: Response, fallbackMessage: string): Promise<TResponse> {
  const rawBody = await response.text();

  try {
    return JSON.parse(rawBody) as TResponse;
  } catch {
    throw new Error(fallbackMessage);
  }
}

/**
 * Starts backend memory learning for a selected newsletter source.
 */
export function useStartMemoryLearning() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sourceId: string) => {
      const response = await fetch(`${API_URL}/memory/learn`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sourceId }),
      });

      const data = await readJsonResponse<{ error?: string; success?: boolean; status?: string }>(
        response,
        "The memory learning endpoint is unavailable. Deploy or restart the backend API.",
      );
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to start memory learning");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KNOWLEDGE_BASE_KEY });
    },
  });
}
