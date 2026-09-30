"use client";

import React, { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import ProfileMenuHeader from "./ProfileMenuHeader";
import { Sparkles } from "lucide-react";
import { reportApi } from "@/lib/apis";

/**
 * WorkspaceHeader component for the workspace shell.
 * Spans full width edge-to-edge across the page with breadcrumb navigation,
 * credits indicator, and user profile dropdown.
 */
export default function WorkspaceHeader(): React.JSX.Element {
  const session = authClient.useSession();
  const user = session.data?.user;
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    if (session.data?.user) {
      reportApi.getUserCredits().then(setCredits).catch(() => {});
    }
  }, [session.data?.user]);

  return (
    <header className="sticky top-0 z-30 w-full h-14 shrink-0 border-b border-zinc-200 dark:border-white/[0.08] bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md transition-colors duration-200">
      <div className="w-full h-full px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 ml-auto">
        
        </div>
      </div>
    </header>
  );
}
