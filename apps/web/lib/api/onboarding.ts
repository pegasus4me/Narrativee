import { billingFetch } from "./billing";
import { API_URL } from "../api-config";

export type WorkspaceType = "small_business" | "agency";
export type AgencySize = "1-5" | "6-10" | "11-25" | "26+";

export type OnboardingProfile = {
  workspaceType: WorkspaceType;
  workspaceName: string;
  agencySize: AgencySize | null;
  completedAt: string | null;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await billingFetch(`${API_URL}/onboarding${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "Unable to save onboarding");
  return data;
}

export const getOnboardingProfile = () =>
  request<{ profile: OnboardingProfile | null }>("/profile");

export const saveOnboardingProfile = (
  profile: Omit<OnboardingProfile, "completedAt"> & { complete?: boolean },
) =>
  request<{ profile: OnboardingProfile }>("/profile", {
    method: "PUT",
    body: JSON.stringify({ ...profile, complete: profile.complete ?? false }),
  });
