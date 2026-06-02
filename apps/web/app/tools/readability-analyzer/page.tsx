import { Metadata } from "next";
import ReadabilityAnalyzerClient from "./ReadabilityAnalyzerClient";

export const metadata: Metadata = {
  title: "Free Newsletter Readability & Read-Time Calculator | Narrativee",
  description: "Analyze your newsletter readability grade level and calculate precise read time. Improve engagement by highlighting complex sentences in real-time.",
  alternates: {
    canonical: "/tools/readability-analyzer",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://narrativee.com/tools/readability-analyzer",
    siteName: "Narrativee",
    title: "Free Newsletter Readability & Read-Time Calculator | Narrativee",
    description: "Instantly grade your newsletter reading level and estimate read time. Highlights complex sentences for clearer, more engaging newsletter copies.",
  },
};

export default function ReadabilityAnalyzerPage() {
  return <ReadabilityAnalyzerClient />;
}
