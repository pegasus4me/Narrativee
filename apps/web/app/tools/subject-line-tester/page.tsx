import { Metadata } from "next";
import SubjectLineTesterClient from "./SubjectLineTesterClient";

export const metadata: Metadata = {
  title: "Free Email Subject Line Tester & Grader | Narrativee",
  description: "Test and optimize your email subject lines for maximum open rates. Get an instant score, spam risk check, readability grade, and AI-optimized alternatives.",
  alternates: {
    canonical: "/tools/subject-line-tester",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://narrativee.com/tools/subject-line-tester",
    siteName: "Narrativee",
    title: "Free Email Subject Line Tester & Grader | Narrativee",
    description: "Optimize email open rates. Get real-time scoring, spam trigger words checks, and copy-ready AI-optimized variations.",
  },
};

export default function SubjectLineTesterPage() {
  return <SubjectLineTesterClient />;
}
