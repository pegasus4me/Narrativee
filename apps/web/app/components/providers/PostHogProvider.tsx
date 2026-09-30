"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

// Auto-capture pageviews on route change (App Router compatible)
function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (pathname && ph) {
      let url = window.origin + pathname;
      if (searchParams?.toString()) {
        url = url + "?" + searchParams.toString();
      }
      ph.capture("$pageview", { $current_url: url });
    }

    if (searchParams && typeof window !== "undefined") {
      const source = searchParams.get("utm_source");
      const medium = searchParams.get("utm_medium");
      const campaign = searchParams.get("utm_campaign");
      if (source && window.sessionStorage) window.sessionStorage.setItem("utm_source", source);
      if (medium && window.sessionStorage) window.sessionStorage.setItem("utm_medium", medium);
      if (campaign && window.sessionStorage) window.sessionStorage.setItem("utm_campaign", campaign);

      const utms: Record<string, string> = {};
      (["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "ref"] as const).forEach(
        (param) => {
          const val = searchParams.get(param);
          if (val) utms[param] = val;
        }
      );
      if (Object.keys(utms).length > 0 && ph) {
        ph.register(utms);
      }
    }
  }, [pathname, searchParams, ph]);

  return null;
}

const POSTHOG_KEY =
  process.env.NEXT_PUBLIC_POSTHOG_KEY || "phc_cOCA9zK75sqDuz5q0zVbaw6eUFU6CK4z0EydxaI50iU";
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

// Initialize PostHog once on the client side
if (typeof window !== "undefined") {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "always",
    autocapture: true,
    capture_pageview: false, // We handle it manually above (App Router safe)
    capture_pageleave: true,
  });
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageview />
      </Suspense>
      {children}
    </PHProvider>
  );
}
