import { API_URL } from "../api-config";

export interface GoogleFont {
  family: string;
  category: string;
  variants: string[];
}

export async function getGoogleFonts(signal?: AbortSignal): Promise<{
  items: GoogleFont[];
}> {
  const response = await fetch(`${API_URL}/fonts`, {
    credentials: "include",
    signal,
  });
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new Error("Font selection is unavailable. Please try again.");
  }
  const data = (await response.json()) as {
    items: GoogleFont[];
    error?: string;
  };
  if (!response.ok) throw new Error(data.error || "Could not load fonts");
  return data;
}
