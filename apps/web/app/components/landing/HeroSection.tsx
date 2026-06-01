"use client";

import { ArrowUpRight, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { ProductPreview } from "./ProductPreview";
import {
  LINKEDIN_LOGO,
  X_LOGO,
  INSTAGRAM_LOGO,
  THREADS_LOGO,
  FACEBOOK_LOGO,
  SUBSTACK_LOGO,
  BLUESKY_LOGO
} from "@/app/constants";

/** Hero section introducing Narrativee's core promise. */
export function HeroSection() {
  const { data: session } = authClient.useSession();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isLoggingInDemo, setIsLoggingInDemo] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDemoMode(localStorage.getItem("is_demo_mode") === "true");
    }
  }, []);

  const handleEnterDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoggingInDemo) return;
    setIsLoggingInDemo(true);

    // Set local storage flag for pure frontend mock mode
    localStorage.setItem("is_demo_mode", "true");

    // Micro-animation delay before entering the workspace
    setTimeout(() => {
      window.location.href = "/workspace";
    }, 600);
  };

  const showDashboard = session?.user || isDemoMode;

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col items-center px-6 pb-24 pt-14 text-center lg:px-8 lg:pb-32">

      <h1 className="max-w-5xl text-balance text-5xl font-semibold tracking-[-0.06em] text-white sm:text-7xl lg:text-[6.8rem] lg:leading-[0.92]">
        Turn one newsletter into a native content machine.
      </h1>
      <p className="mt-8 max-w-2xl text-pretty text-base leading-8 text-zinc-400 sm:text-lg">
        Narrativee learns your voice, extracts sharper angles, and compiles platform-native drafts for X, LinkedIn,
        Threads, Instagram, Facebook, Bluesky, and more.
      </p>

      {/* Supported channel social media logos */}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-4 animate-in fade-in duration-700 delay-200">
        {[
          { name: "LinkedIn", logo: LINKEDIN_LOGO },
          { name: "X", logo: X_LOGO },
          { name: "Instagram", logo: INSTAGRAM_LOGO },
          { name: "Threads", logo: THREADS_LOGO },
          { name: "Facebook", logo: FACEBOOK_LOGO },
          { name: "Substack", logo: SUBSTACK_LOGO },
          { name: "Bluesky", logo: BLUESKY_LOGO }
        ].map((channel) => (
          <div
            key={channel.name}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.01] shadow-xl backdrop-blur-md transition-all duration-300 hover:border-white/15 hover:bg-white/[0.04] hover:scale-[1.08] hover:shadow-indigo-500/5 group"
            title={channel.name}
          >
            <img
              src={channel.logo}
              alt={channel.name}
              className="h-5 w-5 object-contain opacity-90 transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0"
            />
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
        {showDashboard ? (
          <Link
            href="/workspace"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
          >
            Dashboard
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <>
            <Link
              href="/auth/signup"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
            >
              Start repurposing
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            <button
              onClick={handleEnterDemo}
              disabled={isLoggingInDemo}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-all hover:bg-white/[0.08] disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
            >
              {isLoggingInDemo ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  Entering...
                </>
              ) : (
                "View workspace"
              )}
            </button>
          </>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-zinc-500">
        {["Voice memory by channel", "Atomic angle extraction", "Feedback loop included"].map((label) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            {label}
          </span>
        ))}
      </div>
      <ProductPreview />

    </section>
  );
}
