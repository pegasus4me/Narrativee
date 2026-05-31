import { ArrowRight } from "lucide-react";
import Link from "next/link";

/** Final landing call to action. */
export function CtaSection() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-12 pt-24 lg:px-8">
      <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white text-black">
        <div className="relative px-8 py-16 text-center sm:px-12 lg:px-16">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.18),transparent_55%)]" />
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">Narrativee</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
            Stop rewriting. Start compounding.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-zinc-600">
            Give every newsletter a second life across your channels with memory, angles, drafts, and scheduling in one
            premium workflow.
          </p>
          <div className="mt-9 flex justify-center">
            <Link
              href="/auth/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
            >
              Build my content graph
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
      <footer className="flex flex-col justify-between gap-4 px-2 py-8 text-xs text-zinc-600 sm:flex-row">
        <span>© 2026 Narrativee</span>
        <div className="flex gap-5">
          <Link href="/privacy" className="hover:text-zinc-300">Privacy</Link>
          <Link href="/terms" className="hover:text-zinc-300">Terms</Link>
        </div>
      </footer>
    </section>
  );
}
