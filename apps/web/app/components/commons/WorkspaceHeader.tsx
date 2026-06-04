"use client";

import Link from "next/link";
import React from "react";
import { authClient } from "@/lib/auth-client";
import Breadcrumbs from "./Breadcrumbs";
import ProfileMenuHeader from "./ProfileMenuHeader";

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

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md">
      <div className="mx-auto w-[90%] px-6 py-4 flex items-center justify-between">
        <Breadcrumbs />
        <div className="flex items-center gap-4">
          <ProfileMenuHeader />
        </div>
      </div>
    </header>
  );
}
