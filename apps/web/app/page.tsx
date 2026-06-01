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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Narrativee",
    "operatingSystem": "All",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "Narrativee learns your writing voice and repurposes newsletters into platform-native content workflows.",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "120"
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
