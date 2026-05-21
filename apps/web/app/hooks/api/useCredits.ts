import { useQuery } from "@tanstack/react-query";
import { API_URL } from "@/lib/api-config";

export const CREDITS_KEY = ["credits"] as const;

async function fetchCredits(): Promise<number> {
  const res = await fetch(`${API_URL}/user/credits`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch credits");
  const data = (await res.json()) as { credits: number };
  return data.credits;
}

export function useCredits(enabled = true) {
  return useQuery({
    queryKey: CREDITS_KEY,
    queryFn: fetchCredits,
    enabled,
  });
}
