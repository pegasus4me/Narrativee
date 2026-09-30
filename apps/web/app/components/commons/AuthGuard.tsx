"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { authClient } from "../../../lib/auth-client";
import { usePostHog } from "posthog-js/react";
import { useBrands } from "../workspace/BrandProvider";
import { authLink } from "@/lib/auth-destination";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const ph = usePostHog();
  const { active, loading, error } = useBrands();
  const pathname = usePathname();
  const params = useSearchParams();
  const discovery = pathname === "/workspace/discovery";
  const legacy = pathname === "/workspace" && Boolean(params.get("analysisId"));
  const isGuestAllowed = Boolean(active) && (discovery || legacy);
  // An invalid discovery shows recovery controls in the sidebar; its body is always empty.
  const showRecovery = discovery && Boolean(error);
  const destination = `${pathname}${params.size ? `?${params}` : ""}`;

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
  ]);

  // Keep the layout visually consistent while checking session
  if (isPending || loading) {
    return null;
  }

  if (!session?.user && !isGuestAllowed && !showRecovery) {
    return null;
  }

  return <>{children}</>;
}
