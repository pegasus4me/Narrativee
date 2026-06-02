import { Metadata } from "next";
import SocialHookGeneratorClient from "./SocialHookGeneratorClient";

export const metadata: Metadata = {
  title: "Free Newsletter to LinkedIn & X Hook Generator | Narrativee",
  description: "Turn your newsletter topics into high-converting social media hooks. Generate viral LinkedIn and Twitter posts with real-time interactive feed previews.",
  alternates: {
    canonical: "/tools/social-hook-generator",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://narrativee.com/tools/social-hook-generator",
    siteName: "Narrativee",
    title: "Free Newsletter to LinkedIn & X Hook Generator | Narrativee",
    description: "Convert newsletter outlines into attention-grabbing hooks for LinkedIn and X. Featuring live mobile and desktop interactive social mock previews.",
  },
};

export default function SocialHookGeneratorPage() {
  return <SocialHookGeneratorClient />;
}
