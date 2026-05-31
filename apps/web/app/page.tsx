import {
  AdvantageSection,
  ChannelsSection,
  CtaSection,
  HeroSection,
  LandingHeader,
  WorkflowMoatSection,
} from "./components/landing";

/** Public marketing landing page for Narrativee. */
export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute left-1/2 top-[-20rem] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute right-[-16rem] top-[20rem] h-[32rem] w-[32rem] rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute bottom-[-18rem] left-[-12rem] h-[34rem] w-[34rem] rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative">
        <LandingHeader />
        <HeroSection />
        <WorkflowMoatSection />
        <AdvantageSection />
        <ChannelsSection />
        <CtaSection />
      </div>
    </main>
  );
}
