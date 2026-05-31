import { ArrowUpRight, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";
import { ProductPreview } from "./ProductPreview";

/** Hero section introducing Narrativee's core promise. */
export function HeroSection() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col items-center px-6 pb-24 pt-14 text-center lg:px-8 lg:pb-32">
      <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 shadow-2xl shadow-white/5 backdrop-blur">
        <Sparkles className="h-3.5 w-3.5 text-white" />
        The content operating system for newsletter creators
      </div>

      <h1 className="max-w-5xl text-balance text-5xl font-semibold tracking-[-0.06em] text-white sm:text-7xl lg:text-[6.8rem] lg:leading-[0.92]">
        Turn one newsletter into a native content machine.
      </h1>

      <ProductPreview />

      <p className="mt-8 max-w-2xl text-pretty text-base leading-8 text-zinc-400 sm:text-lg">
        Narrativee learns your voice, extracts sharper angles, and compiles platform-native drafts for X, LinkedIn,
        Threads, Instagram, Facebook, Bluesky, and more.
      </p>

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/auth/signup"
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
        >
          Start repurposing
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
        <Link
          href="/workspace"
          className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/[0.08]"
        >
          View workspace
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-zinc-500">
        {["Voice memory by channel", "Atomic angle extraction", "Feedback loop included"].map((label) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            {label}
          </span>
        ))}
      </div>

    </section>
  );
}
