import { Navigation } from "./components/landing/navigation";
import { HeroSection } from "./components/landing/hero-section";
import { FeaturesSection } from "./components/landing/features-section";
import { HowItWorksSection } from "./components/landing/how-it-works-section";
import { InfrastructureSection } from "./components/landing/infrastructure-section";
import { MetricsSection } from "./components/landing/metrics-section";
import { IntegrationsSection } from "./components/landing/integrations-section";
import { SecuritySection } from "./components/landing/security-section";
import { DevelopersSection } from "./components/landing/developers-section";
import { TestimonialsSection } from "./components/landing/testimonials-section";
import { PricingSection } from "./components/landing/pricing-section";
import { CtaSection } from "./components/landing/cta-section";
import { FooterSection } from "./components/landing/footer-section";

/** Public marketing landing page for Narrativee. */
export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Narrativee",
    "operatingSystem": "All",
    "applicationCategory": "BusinessApplication",
    "applicationSubCategory": "Social Media Marketing & Newsletter Repurposing Software",
    "screenshot": "https://narrativee.com/dashboard.png",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "Narrativee learns your unique writing voice, extracts high-performing angles from newsletters, and drafts platform-native content workflows for LinkedIn, X, Threads, and Bluesky.",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "120"
    },
    "author": {
      "@type": "Organization",
      "name": "Narrativee",
      "url": "https://narrativee.com"
    }
  };

  return (
    <main className="theme-landing relative min-h-screen font-sans overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <InfrastructureSection />
      {/* <MetricsSection /> */}
      <IntegrationsSection />
      {/* <SecuritySection /> */}
      <DevelopersSection />
      {/*      <TestimonialsSection /> */}
      <PricingSection />
      <CtaSection />
      <FooterSection />
    </main>
  );
}
