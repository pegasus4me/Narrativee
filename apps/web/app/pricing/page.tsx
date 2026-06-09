import { Metadata } from "next";
import PricingClient from "./PricingClient";

export const metadata: Metadata = {
  title: "Pricing Plans for Content Creators",
  description: "Repurpose your newsletter into channel-native posts matching your voice. Start your 14-day free trial on our Starter or Creator plans. Cancel anytime.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://narrativee.com/pricing",
    siteName: "Narrativee",
    title: "Pricing Plans for Content Creators | Narrativee",
    description: "Scale your newsletter growth on social media. Start with our 14-day free trial on the Starter or Creator plan. Cancel anytime.",
  },
};

export default function PricingPage() {
  return <PricingClient />;
}
