"use client";

import Link from "next/link";
import React from "react";
import { authClient } from "@/lib/auth-client";
import Breadcrumbs from "./Breadcrumbs";
import ProfileMenuHeader from "./ProfileMenuHeader";
import { useCredits } from "@/app/hooks/api/useCredits";
import { Sparkles } from "lucide-react";

interface UserWithPlan {
  readonly plan?: string;
}

/**
 * Type guard to check if a user object contains a free plan property.
 * Avoids raw unsafe type assertions.
 */
function isFreePlanUser(user: unknown): user is UserWithPlan {
  if (typeof user !== "object" || user === null) {
    return false;
  }
  return "plan" in user && (user as UserWithPlan).plan === "free";
}

/**
 * Premium Sticky Top Header Bar component for the workspace shell.
 * Renders Breadcrumbs navigation, Upgrade Plan button (for free trial users),
 * and the user profile dropdown menu.
 */
export default function WorkspaceHeader(): React.JSX.Element {
  const session = authClient.useSession();
  const user = session.data?.user;
  const isFreePlan = isFreePlanUser(user);
  const { data: creditsData } = useCredits(!!user);
  const credits = creditsData?.credits ?? 0;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/20 bg-[#09090b]/80 backdrop-blur-md">
      <div className="mx-auto w-[90%] px-6 py-4 flex items-center justify-between">
        <Breadcrumbs />
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)] text-amber-300 font-urbanist text-xs select-none">
              <Sparkles className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-pulse" />
              <span className="font-semibold text-white">{credits}</span>
              <span className="text-amber-400/85">Stars</span>
            </div>
          )}
          <ProfileMenuHeader />
        </div>
      </div>
    </header>
  );
}
