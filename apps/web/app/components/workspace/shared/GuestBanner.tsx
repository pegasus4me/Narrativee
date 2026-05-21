"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function GuestBanner() {
  return (
    <div className="mb-8 rounded-2xl border border-indigo-500/20 bg-primary/10 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-urbanist animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-start gap-3">
        <div>
          <strong className="text-2xl font-bold text-zinc-900 block">Workspace Sandbox Mode</strong>
          <span className="text-md font-medium text-zinc-900 block mt-0.5">
            You are playing with a live sandbox demo. Sign in or create a free account to unlock real pipelines!
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/auth/signup"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 text-xs font-bold transition-all shadow-xs shrink-0"
        >
          Sign Up Free
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
        <Link
          href="/auth/signin"
          className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 px-4 py-2.5 text-xs font-bold transition-all shrink-0"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
