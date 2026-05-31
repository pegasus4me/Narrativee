import { Brain, CalendarDays, FileText, GitBranch, MessagesSquare, RadioTower } from "lucide-react";

const draftCards = [
  {
    platform: "LinkedIn",
    title: "Contrarian founder lesson",
    body: "Most delegation problems are actually control problems. Here is the uncomfortable part leaders avoid...",
  },
  {
    platform: "X",
    title: "Punchy high-signal take",
    body: "You do not have a delegation problem. You have a control problem. Fear dressed as standards is still fear.",
  },
  {
    platform: "Threads",
    title: "Native reflection",
    body: "Tiny founder confession: sometimes “high standards” is just anxiety wearing a very expensive coat.",
  },
];

/** Product preview showing the Narrativee workflow in context. */
export function ProductPreview() {
  return (
    <div className="mt-16 w-full rounded-[2rem] border border-white/10 bg-white/[0.035] p-2 text-left shadow-[0_40px_140px_rgba(0,0,0,0.65)] backdrop-blur">
      <div className="overflow-hidden rounded-[1.55rem] border border-white/10 bg-[#09090b]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-400/80" />
            <span className="h-3 w-3 rounded-full bg-amber-300/80" />
            <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
          </div>
          <span className="text-xs text-zinc-500">narrativee.com/workspace/create</span>
        </div>

        <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
          <aside className="hidden border-r border-white/10 bg-white/[0.025] p-5 lg:block">
            <div className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Workflow</div>
            {[
              { icon: FileText, label: "Newsletter source", active: true },
              { icon: Brain, label: "Voice memory", active: true },
              { icon: GitBranch, label: "Angle engine", active: true },
              { icon: MessagesSquare, label: "Channel compiler", active: false },
              { icon: CalendarDays, label: "Queue calendar", active: false },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`mb-2 flex items-center gap-3 rounded-2xl px-3 py-3 text-sm ${
                    item.active ? "bg-white text-black" : "text-zinc-500"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </div>
              );
            })}
          </aside>

          <div className="p-5 sm:p-7">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Creation session</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Founder newsletter → native social drafts</h2>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
                <RadioTower className="h-3.5 w-3.5" />
                Voice ready
              </span>
            </div>

            <div className="mb-5 grid gap-3 md:grid-cols-3">
              {["Learning voice", "Extracting angles", "Compiling drafts"].map((label, index) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-3 h-1.5 rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-white" style={{ width: `${92 - index * 16}%` }} />
                  </div>
                  <p className="text-xs font-medium text-zinc-300">{label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {draftCards.map((draft) => (
                <article key={draft.platform} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                      {draft.platform}
                    </span>
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">{draft.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">{draft.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
