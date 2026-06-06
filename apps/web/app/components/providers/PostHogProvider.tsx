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

    if (searchParams && typeof window !== "undefined" && window.sessionStorage) {
      const source = searchParams.get("utm_source");
      const medium = searchParams.get("utm_medium");
      const campaign = searchParams.get("utm_campaign");
      if (source) window.sessionStorage.setItem("utm_source", source);
      if (medium) window.sessionStorage.setItem("utm_medium", medium);
      if (campaign) window.sessionStorage.setItem("utm_campaign", campaign);
    }
  }, [pathname, searchParams, ph]);

  return null;
}

// Initialize PostHog once on the client side
if (typeof window !== "undefined") {
  posthog.init('phc_cOCA9zK75sqDuz5q0zVbaw6eUFU6CK4z0EydxaI50iU', {
    api_host: 'https://us.i.posthog.com',
    defaults: '2026-01-30',
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
