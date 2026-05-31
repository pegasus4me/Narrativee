import { BLUESKY_LOGO, FACEBOOK_LOGO, INSTAGRAM_LOGO, LINKEDIN_LOGO, MEDIUM_LOGO, SUBSTACK_LOGO, THREADS_LOGO, X_LOGO } from "@/app/constants";

const channels = [
  { name: "Substack", logo: SUBSTACK_LOGO },
  { name: "Medium", logo: MEDIUM_LOGO },
  { name: "LinkedIn", logo: LINKEDIN_LOGO },
  { name: "X", logo: X_LOGO },
  { name: "Threads", logo: THREADS_LOGO },
  { name: "Instagram", logo: INSTAGRAM_LOGO },
  { name: "Facebook", logo: FACEBOOK_LOGO },
  { name: "Bluesky", logo: BLUESKY_LOGO },
];

/** Shows the channels Narrativee is designed to support. */
export function ChannelsSection() {
  return (
    <section id="channels" className="mx-auto w-full max-w-7xl px-6 py-24 lg:px-8">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-8 lg:p-10">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">Native distribution</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
              Built for the channels newsletter creators actually use.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-7 text-zinc-400">
            Start with your newsletter, add manual voice samples per platform, then compile drafts that feel like they
            belong where they are published.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {channels.map((channel) => (
            <div key={channel.name} className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-black/25 p-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white">
                <img src={channel.logo} alt="" className="h-6 w-6 object-contain" />
              </span>
              <span className="text-xs font-medium text-zinc-400">{channel.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
