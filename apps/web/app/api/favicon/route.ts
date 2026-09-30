import favicon from "@victr/favicon-fetcher";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const inputUrl = searchParams.get("url");
  const wantsJson = searchParams.get("format") === "json" || searchParams.has("json");

  if (!inputUrl || !inputUrl.trim()) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  const trimmed = inputUrl.trim();
  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let hostname = "";
  try {
    hostname = new URL(normalized).hostname;
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  let iconUrl: string | null = null;

  try {
    // 1. Fetch best favicon using @victr/favicon-fetcher
    const result = await favicon.text(normalized);
    if (result && !result.includes("notfound.svg")) {
      iconUrl = result;
    }
  } catch {
    // Fall through to fallback
  }

  // 2. Secondary fallback to Google S2 favicon service if notfound or blocked
  if (!iconUrl && hostname) {
    iconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=128`;
  }

  if (!iconUrl) {
    return wantsJson
      ? NextResponse.json({ url: null, available: false }, { status: 404 })
      : new NextResponse(null, { status: 404 });
  }

  if (wantsJson) {
    return NextResponse.json({ url: iconUrl, available: true });
  }

  // Redirect to resolved favicon with HTTP caching headers
  return NextResponse.redirect(iconUrl, {
    status: 307,
    headers: {
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
