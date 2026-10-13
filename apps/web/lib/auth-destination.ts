import { studioPath } from "./api/brands";

export function authDestination(): string {
  if (typeof window === "undefined") return "/workspace/studio";
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
    : "/workspace/studio";
}

export const authLink = (page: "signin" | "signup", destination: string) =>
  `/auth/${page}?next=${encodeURIComponent(destination)}`;

export function websiteSetupPath(value: string): string {
  const input = value.trim();
  let website: URL;
  try {
    website = new URL(input.includes("://") ? input : `https://${input}`);
  } catch {
    throw new Error("Enter a valid website, like company.com.");
  }
  if (
    !["http:", "https:"].includes(website.protocol) ||
    !website.hostname.includes(".") ||
    website.username ||
    website.password
  ) {
    throw new Error("Enter a valid website, like company.com.");
  }
  website.hash = "";
  return `/workspace/studio?${new URLSearchParams({
    website: website.toString(),
    setup: "true",
  })}`;
}
