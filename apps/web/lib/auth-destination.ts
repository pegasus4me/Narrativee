import { studioPath } from "./api/brands";

export function authDestination(): string {
  if (typeof window === "undefined") return "/workspace";
  const params = new URLSearchParams(window.location.search);
  const next = params.get("next");
  if (next) {
    try {
      const target = new URL(next, window.location.origin);
      if (
        target.origin === window.location.origin &&
        (["/workspace", "/workspace/studio", "/workspace/discovery"].includes(
          target.pathname,
        ) ||
          target.pathname.startsWith("/workspace/studio/"))
      ) {
        return `${target.pathname}${target.search}`;
      }
    } catch {
      /* Ignore malformed return destinations. */
    }
  }
  const brandId =
    params.get("brandId") || window.sessionStorage.getItem("pending_brand_id");
  if (brandId) return studioPath(brandId);
  const analysisId = params.get("analysisId");
  return analysisId
    ? `/workspace?analysisId=${encodeURIComponent(analysisId)}`
    : "/workspace";
}

export const authLink = (page: "signin" | "signup", destination: string) =>
  `/auth/${page}?next=${encodeURIComponent(destination)}`;
