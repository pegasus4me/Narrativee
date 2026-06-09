import { Metadata } from "next";
import NewsletterAuditorClient from "./NewsletterAuditorClient";

export const metadata: Metadata = {
  title: "Free Newsletter Growth & Monetization Audit | Narrativee",
  description: "Enter your newsletter URL, subscriber count, and niche to get deep conversion insights, sponsorship revenue projections, and a prioritized growth checklist.",
  alternates: {
    canonical: "/tools/newsletter-auditor",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://narrativee.com/tools/newsletter-auditor",
    siteName: "Narrativee",
    title: "Free Newsletter Growth & Monetization Audit | Narrativee",
    description: "Deep-audit your newsletter landing page, calculate sponsorship revenue potential, and get a prioritized action plan to grow faster.",
  },
};

export default function NewsletterAuditorPage() {
  return <NewsletterAuditorClient />;
}
