import { API_URL } from "../api-config";
import { StudioApiError } from "./studio";
// Type-only reuse keeps the wire contract aligned without a new shared package.
export type {
  CampaignDocument,
  CampaignLayer,
} from "../../../backend/src/studio/campaign/campaign.types";
export type { CanvasSnapshot } from "../../../backend/src/studio/canvas/canvas.schema";
import type { CanvasSnapshot } from "../../../backend/src/studio/canvas/canvas.schema";

export async function getCanvasSnapshot(projectId: string) {
  return canvasRequest<{ revision: number; snapshot: CanvasSnapshot | null }>(
    projectId,
  );
}
export async function saveCanvasSnapshot(
  projectId: string,
  revision: number,
  snapshot: CanvasSnapshot,
) {
  return canvasRequest<{ revision: number }>(projectId, {
    method: "PUT",
    body: JSON.stringify({ revision, snapshot }),
  });
}
async function canvasRequest<T>(
  projectId: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(
    `${API_URL}/studio/projects/${encodeURIComponent(projectId)}/canvas`,
    {
      ...init,
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    },
  );
  const data = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;
  if (!response.ok || !data)
    throw new StudioApiError(
      response.status,
      data?.error ?? "Canvas saving is unavailable",
    );
  return data;
}
export async function fetchProjectImage(projectId: string, assetId: string) {
  const response = await fetch(
    `${API_URL}/studio/projects/${encodeURIComponent(projectId)}/assets/${encodeURIComponent(assetId)}`,
    { credentials: "include", cache: "no-store" },
  );
  if (!response.ok)
    throw new Error(
      "A creative image could not be loaded. Your saved canvas has not been changed.",
    );
  return response.blob();
}

export const projectImageUrl = (projectId: string, assetId: string) =>
  `${API_URL}/studio/projects/${encodeURIComponent(projectId)}/assets/${encodeURIComponent(assetId)}`;

export async function uploadProjectImage(projectId: string, file: File) {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    !file.size ||
    file.size > 8 * 1024 * 1024
  )
    throw new Error("Choose a PNG, JPEG or WebP image up to 8 MB.");
  const response = await fetch(
    `${API_URL}/studio/projects/${encodeURIComponent(projectId)}/assets`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": file.type },
      body: file,
    },
  );
  const data = (await response.json().catch(() => null)) as {
    id: string;
    width: number;
    height: number;
    error?: string;
  } | null;
  if (!response.ok || !data?.id)
    throw new StudioApiError(
      response.status,
      data?.error ?? "Image upload failed. Please try again.",
    );
  return { id: data.id, width: data.width, height: data.height };
}
