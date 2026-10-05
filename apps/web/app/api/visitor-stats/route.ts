import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Counts = { online: number; total: number };
let cached: { counts: Counts; expires: number } | undefined;
let pending: Promise<Counts> | undefined;

async function readCounts(): Promise<Counts> {
  let env: Record<string, unknown> = process.env;
  try {
    env = { ...env, ...getCloudflareContext().env };
  } catch {
    // Local Next.js uses environment variables without a Worker context.
  }
  const key = env.POSTHOG_PERSONAL_API_KEY;
  const projectId = env.POSTHOG_PROJECT_ID;
  if (
    typeof key !== "string" ||
    typeof projectId !== "string" ||
    !/^\d+$/.test(projectId)
  ) {
    throw new Error("Visitor analytics are not configured");
  }

  const response = await fetch(
    `https://eu.posthog.com/api/projects/${projectId}/query/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: {
          kind: "HogQLQuery",
          query: `SELECT
          uniqIf(distinct_id, timestamp > now() - INTERVAL 2 MINUTE),
          uniqIf(distinct_id, event = '$pageview')
          FROM events
          WHERE event IN ('$pageview', 'landing_presence')
          AND properties.$host IN ('narrativee.com', 'www.narrativee.com')`,
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!response.ok) throw new Error("Visitor analytics are unavailable");
  const data = (await response.json()) as { results?: unknown[][] };
  const [online, total] = data.results?.[0] ?? [];
  if (
    typeof online !== "number" ||
    typeof total !== "number" ||
    !Number.isFinite(online) ||
    !Number.isFinite(total) ||
    online < 0 ||
    total < 0
  ) {
    throw new Error("Invalid visitor analytics response");
  }
  return { online, total };
}

export async function GET() {
  try {
    if (!cached || cached.expires <= Date.now()) {
      pending ??= readCounts()
        .then((counts) => {
          cached = { counts, expires: Date.now() + 60000 };
          return counts;
        })
        .finally(() => {
          pending = undefined;
        });
      await pending;
    }
    return NextResponse.json(cached!.counts, {
      headers: { "Cache-Control": "public, max-age=30, s-maxage=60" },
    });
  } catch {
    return NextResponse.json(
      { available: false },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
