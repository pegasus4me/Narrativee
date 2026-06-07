import { useQuery } from "@tanstack/react-query";
import { API_URL } from "@/lib/api-config";

export const CREDITS_KEY = ["credits"] as const;

export interface UserCredits {
  success: boolean;
  credits: number;
  carouselCredits: number;
  plan: string;
}

async function fetchCredits(): Promise<UserCredits> {
  const res = await fetch(`${API_URL}/user/credits`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch credits");
  return (await res.json()) as UserCredits;
}

export function useCredits(enabled = true) {
  return useQuery({
    queryKey: CREDITS_KEY,
    queryFn: fetchCredits,
    enabled,
  });
}

