import { Check, X } from "lucide-react";

const narrativeeAdvantages = [
  "Learns from your newsletter and saved voice samples",
  "Generates by workflow: source → angles → channels → queue",
  "Keeps platform-specific memory and formatting rules",
  "Builds a reusable content graph instead of one-off chats",
];

const genericToolLimits = [
  "Requires re-explaining context every session",
  "Produces generic summaries unless heavily prompted",
  "Treats every platform as the same writing surface",
  "Does not close the loop from published performance",
];

/** Comparison section positioning Narrativee against generic chat assistants. */
export function AdvantageSection() {
  return (
    <section id="workflow" className="mx-auto w-full max-w-7xl px-6 py-24 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-8 lg:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">Why not just ChatGPT?</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
            Generic AI writes. Narrativee operates.
          </h2>
          <p className="mt-6 text-base leading-8 text-zinc-400">
            The product advantage is not “better text.” It is a repeatable creation workflow that remembers your voice,
            understands the source material, adapts to channels, and improves after publishing.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-400/[0.06] p-6">
            <h3 className="text-lg font-semibold text-white">Narrativee</h3>
            <div className="mt-6 space-y-4">
              {narrativeeAdvantages.map((advantage) => (
                <div key={advantage} className="flex gap-3 text-sm leading-6 text-zinc-300">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />
                  <span>{advantage}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold text-white">Generic chat</h3>
            <div className="mt-6 space-y-4">
              {genericToolLimits.map((limit) => (
                <div key={limit} className="flex gap-3 text-sm leading-6 text-zinc-500">
                  <X className="mt-1 h-4 w-4 shrink-0 text-zinc-600" />
                  <span>{limit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
