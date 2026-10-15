"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { authClient } from "../../../lib/auth-client";
import { usePostHog } from "posthog-js/react";
import { useBrands } from "../workspace/BrandProvider";
import { authLink } from "@/lib/auth-destination";
import { getOnboardingProfile } from "@/lib/api/onboarding";
import { studioPath } from "@/lib/api/brands";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const userId = session?.user.id;
  const ph = usePostHog();
  const { active, loading, error } = useBrands();
  const pathname = usePathname();
  const params = useSearchParams();
  const onboardingPath = pathname === "/workspace/onboarding";
  const websiteSetup = onboardingPath && params.has("website");
  const [onboardingStatus, setOnboardingStatus] = useState<
    "loading" | "complete" | "incomplete" | "unknown"
  >("loading");
  const discovery = pathname === "/workspace/discovery";
  const legacy = pathname === "/workspace" && Boolean(params.get("analysisId"));
  const isGuestAllowed = Boolean(active) && (discovery || legacy);
  // An invalid discovery shows recovery controls in the sidebar; its body is always empty.
  const showRecovery = discovery && Boolean(error);
  const destination = `${pathname}${params.size ? `?${params}` : ""}`;

  useEffect(() => {
    if (isPending) return;
    if (!userId) {
      setOnboardingStatus("unknown");
      return;
    }
    let mounted = true;
    setOnboardingStatus("loading");
    void getOnboardingProfile()
      .then(({ profile }) => {
        if (mounted)
          setOnboardingStatus(profile?.completedAt ? "complete" : "incomplete");
      })
      .catch(() => {
        if (mounted) setOnboardingStatus("unknown");
      });
    return () => {
      mounted = false;
    };
  }, [isPending, userId]);

  useEffect(() => {
    if (!isPending && !loading) {
      if (!session?.user && !isGuestAllowed && !showRecovery) {
        // Not logged in and no active analysis => redirect to signin
        router.replace(authLink("signin", destination));
      } else if (session?.user) {
        // Identify the user in PostHog so all events are linked
        ph?.identify(session.user.id, {
          email: session.user.email,
          name: session.user.name,
        });
        if (
          onboardingStatus === "incomplete" &&
          !onboardingPath
        ) {
          router.replace("/workspace/onboarding");
        } else if (
          onboardingStatus === "complete" &&
          onboardingPath &&
          !websiteSetup
        ) {
          router.replace(active?.id ? studioPath(active.id) : "/workspace/studio");
        } else if (
          onboardingStatus === "complete" &&
          pathname === "/workspace" &&
          !legacy
        ) {
          router.replace(active?.id ? studioPath(active.id) : "/workspace/studio");
        }
      }
    }
  }, [
    isPending,
    session,
    router,
    ph,
    isGuestAllowed,
    loading,
    showRecovery,
    destination,
    onboardingStatus,
    onboardingPath,
    websiteSetup,
    pathname,
    legacy,
    active?.id,
  ]);

  // Keep the layout visually consistent while checking session
  if (
    isPending ||
    loading ||
    (session?.user && onboardingStatus === "loading")
  ) {
    return null;
  }

  if (!session?.user && !isGuestAllowed && !showRecovery) {
    return null;
  }

  return <>{children}</>;
}
