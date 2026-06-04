"use client";

import React from "react";
import AuthGuard from "../components/commons/AuthGuard";
import { SideBar } from "../components/commons/sideBar";
import WorkspaceHeader from "../components/commons/WorkspaceHeader";

/** Authenticated shell for every workspace route. */
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="theme-landing flex h-screen w-full bg-[#09090b] overflow-hidden text-zinc-100 font-sans">
        <SideBar />
        <main className="flex-1 min-w-0 overflow-y-auto antialiased">
          <WorkspaceHeader />
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
