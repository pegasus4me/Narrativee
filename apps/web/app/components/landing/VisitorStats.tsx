"use client";

import { useEffect, useState } from "react";
import { usePostHog } from "posthog-js/react";

export default function VisitorStats() {
  const ph = usePostHog();
  const [counts, setCounts] = useState<{
    online: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let polling = false;
    const refresh = async () => {
      if (document.visibilityState !== "visible" || polling) return;
      polling = true;
      ph?.capture("landing_presence");
      try {
        const response = await fetch("/api/visitor-stats", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Unavailable");
        const data = await response.json();
        if (typeof data.online !== "number" || typeof data.total !== "number")
          throw new Error("Invalid counts");
        setCounts(data);
      } catch {
        if (!controller.signal.aborted) setCounts(null);
      } finally {
        polling = false;
      }
    };
    void refresh();
    const interval = window.setInterval(refresh, 60000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      controller.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [ph]);

  if (!counts) return null;
  return (
    <div
      className="col-span-full flex items-center justify-center gap-2 text-[11px] font-normal text-neutral-500"
      title="Online: tracked visitors active in the last 2 minutes. Visitors: unique browser identifiers tracked by PostHog. Updated every minute."
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full bg-emerald-500"
      />
      <span>{counts.online.toLocaleString("en-US")} online</span>
      <span aria-hidden="true">·</span>
      <span>{counts.total.toLocaleString("en-US")} visitors</span>
    </div>
  );
}
