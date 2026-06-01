import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Sparkles, XCircle } from "lucide-react";
import { LandingHeader } from "../../components/landing";
import { comparisonData } from "../comparisonData";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return Object.keys(comparisonData).map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = comparisonData[slug];
  if (!data) {
    return {
      title: "Comparison | Narrativee",
    };
  }
  return {
    title: data.title,
    description: data.metaDescription,
    alternates: {
      canonical: `/versus/${slug}`,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: `https://narrativee.com/versus/${slug}`,
      siteName: "Narrativee",
      title: data.title,
      description: data.metaDescription,
    },
  };
}

export default async function VersusPage({ params }: PageProps) {
  const { slug } = await params;
  const data = comparisonData[slug];

  if (!data) {
    notFound();
  }

  const isSubject1Us = data.subject1.name === "Narrativee";

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden pb-24">
      {/* Background glow effects */}
      <div className="pointer-events-none fixed inset-0 opacity-80 z-0">
        <div className="absolute left-1/2 top-[-10rem] h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute right-[-10rem] top-[20rem] h-[30rem] w-[30rem] rounded-full bg-zinc-500/10 blur-3xl" />
      </div>

      <div className="relative z-10">
        <LandingHeader />

        <main className="max-w-7xl mx-auto px-6 pt-16 lg:px-8">
          {/* Breadcrumb / Back Link */}
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
          <div className="max-w-4xl mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-300 text-xs font-semibold mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Deep-Dive Factual Comparison</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-white font-urbanist leading-[1.05]">
              {data.headline}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-zinc-400 leading-relaxed max-w-3xl">
              {data.subheading}
            </p>
          </div>

          {/* Verdict Box */}
          <section className="border border-white/10 rounded-[2.5rem] bg-white/[0.02] p-8 sm:p-12 mb-16">
            <div className="grid gap-8 lg:grid-cols-12 items-center">
              {/* Verdict score cards */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.02] text-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 block mb-2">{data.subject1.name}</span>
                  <span className={`text-3xl sm:text-4xl font-bold font-urbanist font-manrope ${data.subject1.color}`}>{data.subject1.rating}</span>
                </div>
                <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] text-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block mb-2">{data.subject2.name}</span>
                  <span className={`text-3xl sm:text-4xl font-bold font-urbanist font-manrope ${data.subject2.color}`}>{data.subject2.rating}</span>
                </div>
              </div>

              {/* Verdict text */}
              <div className="lg:col-span-7">
                <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">The Verdict</h3>
                <h4 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-4 font-urbanist">
                  Which platform should you choose?
                </h4>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {data.verdict}
                </p>
              </div>
            </div>
          </section>

          {/* Quick Summary Section */}
          <section className="grid gap-8 md:grid-cols-2 mb-20">
            <div className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.01]">
              <h3 className="text-lg font-bold text-white mb-3">{data.subject1.name} Summary</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{data.subject1.summary}</p>
            </div>
            <div className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.01]">
              <h3 className="text-lg font-bold text-white mb-3">{data.subject2.name} Summary</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{data.subject2.summary}</p>
            </div>
          </section>

          {/* Comparison Table */}
          <section className="border border-white/10 rounded-[2.5rem] bg-white/[0.02] p-8 sm:p-12 mb-20 overflow-hidden">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-urbanist mb-8">
              Feature-by-Feature Matrix
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="text-xs uppercase tracking-wider text-zinc-500 border-b border-white/10">
                  <tr>
                    <th className="py-4">Capabilities</th>
                    <th className="py-4 px-4 text-white">{data.subject1.name}</th>
                    <th className="py-4 text-white">{data.subject2.name}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {data.features.map((feature, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 font-semibold text-zinc-300">{feature.name}</td>
                      <td className={`py-4 px-4 font-semibold ${feature.isAdvantage1 ? "text-indigo-400" : ""}`}>
                        {feature.subject1Value}
                      </td>
                      <td className="py-4">
                        {feature.subject2Value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Dual Pros and Cons Grid */}
          <section className="grid gap-8 md:grid-cols-2 mb-20">
            {/* Subject 1 Pros/Cons */}
            <div className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.01]">
              <h3 className="text-xl font-bold text-white mb-6 font-urbanist">{data.subject1.name} Pros & Cons</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3">Pros</h4>
                  <ul className="space-y-2">
                    {data.prosCons1.pros.map((pro, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-zinc-300">
                        <CheckCircle2 className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Cons</h4>
                  <ul className="space-y-2">
                    {data.prosCons1.cons.map((con, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-zinc-400">
                        <XCircle className="h-4.5 w-4.5 text-zinc-600 shrink-0 mt-0.5" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Subject 2 Pros/Cons */}
            <div className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.01]">
              <h3 className="text-xl font-bold text-white mb-6 font-urbanist">{data.subject2.name} Pros & Cons</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3">Pros</h4>
                  <ul className="space-y-2">
                    {data.prosCons2.pros.map((pro, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-zinc-300">
                        <CheckCircle2 className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Cons</h4>
                  <ul className="space-y-2">
                    {data.prosCons2.cons.map((con, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-zinc-400">
                        <XCircle className="h-4.5 w-4.5 text-zinc-600 shrink-0 mt-0.5" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Final Call to Action */}
          <section className="rounded-[2.5rem] bg-gradient-to-b from-indigo-900/10 via-zinc-900/5 to-transparent border border-indigo-500/25 p-8 sm:p-16 text-center">
            {isSubject1Us ? (
              <>
                <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight font-urbanist max-w-2xl mx-auto">
                  Experience the smart content repurposing workflow.
                </h2>
                <p className="mt-6 text-base text-zinc-400 max-w-lg mx-auto">
                  Say goodbye to generic prompts and empty scheduler queues. Compile platform-native posts inside one compounding content graph.
                </p>
                <div className="mt-8 flex justify-center">
                  <Link
                    href="/auth/signup"
                    className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
                  >
                    Start Repurposing Free
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight font-urbanist max-w-2xl mx-auto">
                  Tired of generic prompts and manual copy-pasting?
                </h2>
                <p className="mt-6 text-base text-zinc-400 max-w-lg mx-auto">
                  Discover Narrativee—the first dedicated, multi-channel voice compiler and notes scheduler built exclusively for serious writers.
                </p>
                <div className="mt-8 flex justify-center">
                  <Link
                    href="/auth/signup"
                    className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
                  >
                    Try the Narrativee Alternative
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
