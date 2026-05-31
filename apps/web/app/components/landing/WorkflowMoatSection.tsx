import type { LucideIcon } from "lucide-react";
import { BarChart3, BrainCircuit, Layers3, Repeat2, SplitSquareVertical } from "lucide-react";

interface MoatCard {
  title: string;
  description: string;
  icon: LucideIcon;
}

const moatCards: MoatCard[] = [
  {
    title: "Content Graph",
    description: "Newsletter history, source channels, drafts, and performance become one compounding context layer.",
    icon: Layers3,
  },
  {
    title: "Angle Engine",
    description: "Narrativee turns one source into contrarian, useful, and emotionally precise angles instead of summaries.",
    icon: SplitSquareVertical,
  },
  {
    title: "Channel Compiler",
    description: "The same idea is rewritten natively for each platform with format, hook, length, and CTA rules.",
    icon: BrainCircuit,
  },
  {
    title: "Voice Memory",
    description: "Your LinkedIn voice can stay polished while X stays punchy and Threads stays conversational.",
    icon: Repeat2,
  },
  {
    title: "Feedback Loop",
    description: "Every publish teaches the system what hooks, CTAs, formats, and timing work for your audience.",
    icon: BarChart3,
  },
];

/** Explains the workflow moat that differentiates Narrativee from generic chat tools. */
export function WorkflowMoatSection() {
  return (
    <section id="moat" className="mx-auto w-full max-w-7xl px-6 py-24 lg:px-8">
      <div className="mb-12 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">Workflow moat</p>
        <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">
          More than a prompt box. A system that gets sharper.
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {moatCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <article
              key={card.title}
              className={`group rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 transition-colors hover:bg-white/[0.06] ${
                index === 0 ? "md:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <div className="mb-10 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white text-black">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-white">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{card.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
