import { useMutation } from "@tanstack/react-query";
import { API_URL } from "@/lib/api-config";

/**
 * Mutation to mark the user as onboarded.
 * Calls POST /api/user/onboard on the backend.
 */
export function useCompleteOnboarding() {
  return useMutation({
    mutationFn: async (): Promise<{ success: boolean; message: string }> => {
      const res = await fetch(`${API_URL}/user/onboard`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to complete onboarding");
      }
      return res.json() as Promise<{ success: boolean; message: string }>;
    },
  });
}
