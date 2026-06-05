import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Share2, Sparkles } from "lucide-react";
import { LandingHeader } from "../../components/landing";
import { useCaseData } from "../useCaseData";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return Object.keys(useCaseData).map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = useCaseData[slug];
  if (!data) {
    return {
      title: "Integrations & Use Cases",
    };
  }
  return {
    title: data.title,
    description: data.metaDescription,
    alternates: {
      canonical: `/use-case/${slug}`,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: `https://narrativee.com/use-case/${slug}`,
      siteName: "Narrativee",
      title: data.title,
      description: data.metaDescription,
    },
  };
}

export default async function UseCasePage({ params }: PageProps) {
  const { slug } = await params;
  const data = useCaseData[slug];

  if (!data) {
    notFound();
  }

  // Generate dynamic JSON-LD scripts for HowTo and FAQPage schemas
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": `How to Connect ${data.sourcePlatform} to ${data.targetPlatform}`,
    "description": data.subheading,
    "step": data.steps.map((step, idx) => ({
      "@type": "HowToStep",
      "position": idx + 1,
      "name": step.title,
      "text": step.description,
    })),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": data.faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden pb-24">
      {/* Dynamic SEO Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Background glow effects */}
      <div className="pointer-events-none fixed inset-0 opacity-80 z-0">
        <div className="absolute left-1/2 top-[-10rem] h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute left-[-10rem] top-[20rem] h-[30rem] w-[30rem] rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative z-10">
        <LandingHeader />

        <main className="max-w-7xl mx-auto px-6 pt-16 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Home
            </Link>
          </div>

          {/* Hero Section */}
          <div className="max-w-4xl mb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-300 text-xs font-semibold mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Direct Creator Integration</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-white font-urbanist leading-[1.05]">
              {data.heading}
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-zinc-400 leading-relaxed max-w-3xl">
              {data.subheading}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/auth/signup"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
              >
                Start Automating Free
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* Intro block */}
          <section className="mb-20">
            <div className="border border-white/10 rounded-[2.5rem] bg-zinc-950/60 p-8 sm:p-12 relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-[400px] h-[200px] bg-indigo-500/5 rounded-full blur-[100px]" />
              <div className="grid gap-12 lg:grid-cols-12 items-center">
                <div className="lg:col-span-7">
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Overview</span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-2 font-urbanist">
                    Connect {data.sourcePlatform} directly with {data.targetPlatform}
                  </h3>
                  <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed font-manrope">
                    {data.introText}
                  </p>
                </div>
                <div className="lg:col-span-5 flex justify-center items-center relative">
                  {/* Visual design logic for integrations */}
                  <div className="flex items-center gap-6 p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
                    <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 text-white font-bold text-sm tracking-wider uppercase">
                      {data.sourcePlatform}
                    </div>
                    <div className="h-10 w-10 rounded-full bg-indigo-500/25 border border-indigo-500/35 flex items-center justify-center">
                      <Share2 className="h-4 w-4 text-indigo-300" />
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 text-white font-bold text-sm tracking-wider uppercase">
                      {data.targetPlatform}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Setup Guide Steps */}
          <section className="mb-24">
            <h2 className="text-3xl font-bold text-white tracking-tight font-urbanist mb-12">
              Setup Instructions: How to automate the workflow.
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {data.steps.map((step, idx) => (
                <div key={idx} className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.01] flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-indigo-400 font-mono">Step 0{idx + 1}</span>
                    <h3 className="text-lg font-urbanist font-bold text-white mt-3 mb-2">{step.title}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-manrope">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ Section */}
          <section className="border border-white/10 rounded-[2.5rem] bg-white/[0.02] p-8 sm:p-12 mb-20">
            <h2 className="text-3xl font-bold text-white tracking-tight font-urbanist mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {data.faqs.map((faq, idx) => (
                <div key={idx} className={idx > 0 ? "border-t border-white/[0.05] pt-6" : ""}>
                  <h3 className="text-lg font-bold text-white mb-2">{faq.question}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed font-manrope">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Final Call to Action */}
          <section className="rounded-[2.5rem] bg-gradient-to-b from-indigo-900/10 via-cyan-900/5 to-transparent border border-indigo-500/25 p-8 sm:p-16 text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight font-urbanist max-w-2xl mx-auto">
              Automate your custom creator repurposing workflow today.
            </h2>
            <p className="mt-6 text-base text-zinc-400 max-w-lg mx-auto">
              Ready to grow your newsletter natively across platforms? Try the #1 recommended content repurposing tool.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/auth/signup"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
              >
                Get Started Free
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
