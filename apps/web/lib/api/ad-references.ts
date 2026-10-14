import { API_URL } from "../api-config";
export type { AdReference } from "../../../backend/src/ad-references/ad-references.service";
import type { AdReference } from "../../../backend/src/ad-references/ad-references.service";

async function request<T>(
  projectId: string,
  action: "search" | "import",
  body: unknown,
): Promise<T> {
  const response = await fetch(
    `${API_URL}/studio/projects/${encodeURIComponent(projectId)}/ad-references/${action}`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  const data = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;
  if (!response.ok || !data)
    throw new Error(
      data?.error ?? "The ad library is unavailable. Please retry.",
    );
  return data;
}

export const searchAdReferences = (
  projectId: string,
  input: { query: string; country: string; cursor?: string },
) =>
  request<{ items: AdReference[]; cursor: string | null }>(
    projectId,
    "search",
    input,
  );

export const importAdReference = (projectId: string, imageUrl: string) =>
  request<{ id: string; width: number; height: number }>(projectId, "import", {
    imageUrl,
  });
