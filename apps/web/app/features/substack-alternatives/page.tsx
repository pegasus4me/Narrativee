import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Cpu, Layers, MessageSquare, Sparkles, Terminal, Users } from "lucide-react";
import { LandingHeader } from "../../components/landing";

export const metadata: Metadata = {
  title: "The 5 Best Substack Alternatives (2026 Comparison)",
  description: "Compare the best Substack alternatives for writers, including beehiiv, Ghost, Medium, WordPress, and Buttondown. Find the right newsletter host.",
  alternates: {
    canonical: "/features/substack-alternatives",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://narrativee.com/features/substack-alternatives",
    siteName: "Narrativee",
    title: "The 5 Best Substack Alternatives (2026 Comparison) | Narrativee",
    description: "Looking to switch from Substack? Read our factual review of beehiiv, Ghost, Medium, WordPress, and Buttondown, and see how to grow your publication.",
  },
};

const alternatives = [
  {
    name: "beehiiv",
    tagline: "Best for hyper-growth and ad-network monetization",
    desc: "beehiiv was built by early Morning Brew engineers specifically for creators looking to monetize and scale. It features advanced referral systems, native ad-networks, extensive custom tracking, and robust newsletter A/B testing out of the box.",
    pros: ["Outstanding built-in referral program", "Native ad network and premium subscription support", "Excellent analytics and tracking options"],
    cons: ["Higher learning curve than Substack", "Paid plans can become expensive as list grows"],
    bestFor: "Professional publishers, business newsletters, and growth-minded creators.",
    icon: Sparkles,
    accent: "text-amber-400",
    borderAccent: "border-amber-500/10"
  },
  {
    name: "Ghost",
    tagline: "Best open-source host for custom design and total control",
    desc: "Ghost is an open-source CMS optimized for creators. Unlike Substack, which takes a 10% cut of subscriptions, Ghost takes 0% platform fees. It allows you to completely customize your theme, configure membership options, and self-host if desired.",
    pros: ["0% platform fees on subscriptions", "Completely customizable layouts and themes", "Rich developer APIs and open-source flexibility"],
    cons: ["Requires technical setup or paid hosting (Ghost(Pro))", "No native ad network or referral system"],
    bestFor: "Independent authors, developers, and brands wanting 100% control over design.",
    icon: Terminal,
    accent: "text-emerald-400",
    borderAccent: "border-emerald-500/10"
  },
  {
    name: "Medium",
    tagline: "Best for built-in readership and casual writers",
    desc: "Medium is a blogging network that allows writers to publish immediately without configuring a domain. Through the Medium Partner Program, you can earn money from reads. While it has huge built-in traffic, it offers very limited custom email branding.",
    pros: ["Immediate access to a built-in readership network", "Partner Program payments based on subscriber reading time", "Zero technical setup or domains required"],
    cons: ["Very limited custom branding or email options", "You do not fully 'own' your subscriber list relationship"],
    bestFor: "Casual authors and writers who prioritize reading discovery over brand ownership.",
    icon: Users,
    accent: "text-blue-400",
    borderAccent: "border-blue-500/10"
  },
  {
    name: "WordPress & Mailpoet",
    tagline: "Best for enterprise brands and full website CMS layout",
    desc: "WordPress powers over 40% of the web. By combining WordPress with newsletter plugins like Mailpoet or third-party integrations, you get a fully fledged content management system, store, and dispatch engine all on a single domain.",
    pros: ["Unlimited themes, plugins, and customization", "Perfect SEO control and page ranking flexibility", "Integrates natively with e-commerce (WooCommerce)"],
    cons: ["Requires regular server maintenance and security patches", "Plugin stacks can become complex and slow"],
    bestFor: "Businesses and publications requiring a comprehensive website alongside their newsletter.",
    icon: Layers,
    accent: "text-purple-400",
    borderAccent: "border-purple-500/10"
  },
  {
    name: "Buttondown",
    tagline: "Best minimalist, privacy-oriented dispatch system",
    desc: "Buttondown is a lightweight newsletter host designed for speed and markdown writing. It is simple, fast, handles subscriber lists elegantly, and maintains strict data privacy compliance without bloated scripts or tracking pixels.",
    pros: ["Extremely clean markdown-first editor", "Fast page loads and simple subscriber forms", "Inexpensive and privacy-oriented design"],
    cons: ["Fewer pre-built marketing features or referrals", "No visual theme design builders"],
    bestFor: "Minimalist writers, developers, and simple weekly dispatches.",
    icon: Cpu,
    accent: "text-pink-400",
    borderAccent: "border-pink-500/10"
  }
];

export default function SubstackAlternativesPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is Narrativee a Substack hosting alternative?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. Narrativee is not a newsletter hosting platform or email client. Rather, Narrativee is an AI content repurposing and distribution engine that plugs into Substack, beehiiv, Ghost, Medium, WordPress, and custom RSS feeds. It helps you grow whichever hosting platform you choose by automatically drafting native social posts for LinkedIn, X (Twitter), and Threads in your writing voice."
        }
      },
      {
        "@type": "Question",
        "name": "Which Substack alternative has 0% platform fees?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Ghost takes 0% platform fees on your paid subscriptions. Unlike Substack's flat 10% fee, you only pay Stripe's payment processing fees. You pay a fixed monthly host rate for Ghost(Pro) or host it yourself on your own server."
        }
      },
      {
        "@type": "Question",
        "name": "Can I move my Substack subscribers to another host?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, all major hosts support importing CSV subscriber lists. You can easily export your email list from Substack's dashboard and import it into beehiiv, Ghost, or Buttondown in minutes."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden pb-24">
      {/* Dynamic SEO FAQs */}
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
          <div className="max-w-4xl mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-300 text-xs font-semibold mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Independent Writer Guide</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-white font-urbanist leading-[1.05]">
              The Best Substack Alternatives.
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-zinc-400 leading-relaxed max-w-3xl font-manrope">
              Looking to host your newsletter somewhere else? Substack is simple, but limits your customization, referral features, and cuts 10% of subscription revenue. We compare the top Substack alternatives to help you choose the best home for your writing.
            </p>
          </div>

          {/* Core Differentiation Box: Narrativee is the bridge */}
          <section className="mb-16 border border-indigo-500/30 rounded-[2.5rem] bg-gradient-to-r from-indigo-950/40 to-cyan-950/20 p-8 sm:p-12 relative overflow-hidden backdrop-blur-xl">
            <div className="absolute right-0 top-0 h-full w-[300px] bg-cyan-500/5 rounded-full blur-[80px]" />
            <div className="max-w-4xl">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Important SEO note for writers</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-2 font-urbanist">
                Narrativee is your social distribution partner, not a host.
              </h2>
              <p className="mt-4 text-sm sm:text-base text-zinc-300 leading-relaxed font-manrope">
                Please note that **Narrativee is not an alternative newsletter hosting provider**. Whichever platform you choose below (or if you decide to stay on Substack!), you still need a repeatable way to drive subscribers. 
              </p>
              <p className="mt-4 text-sm sm:text-base text-zinc-300 leading-relaxed font-manrope">
                Narrativee integrates with **Substack, beehiiv, Ghost, Medium, WordPress, and custom RSS feeds**. It automatically reads your published issues, extracts key topics, and drafts native posts for LinkedIn, X (Twitter), and Threads in your unique writing voice, multiplying your subscription traffic automatically.
              </p>
              <div className="mt-6">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white hover:text-indigo-300 transition-colors underline underline-offset-4"
                >
                  See how Narrativee automates distribution
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </section>

          {/* Directory Grid */}
          <section className="space-y-8 mb-24">
            {alternatives.map((alt) => {
              const Icon = alt.icon;
              return (
                <article 
                  key={alt.name}
                  className={`p-8 sm:p-10 rounded-[2.5rem] border ${alt.borderAccent} bg-white/[0.02] relative overflow-hidden backdrop-blur-md`}
                >
                  <div className="max-w-4xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-xl bg-white/[0.03] border border-white/5 ${alt.accent}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-urbanist">
                          {alt.name}
                        </h2>
                        <p className={`text-xs font-semibold uppercase tracking-wider ${alt.accent} mt-1`}>
                          {alt.tagline}
                        </p>
                      </div>
                    </div>

                    <p className="mt-6 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-3xl">
                      {alt.desc}
                    </p>

                    <div className="mt-6 grid gap-6 sm:grid-cols-2 border-t border-white/[0.05] pt-6">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Pros</h4>
                        <ul className="space-y-1">
                          {alt.pros.map((pro, idx) => (
                            <li key={idx} className="text-xs text-zinc-300 flex items-start gap-1">
                              <span>✓</span>
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Cons</h4>
                        <ul className="space-y-1">
                          {alt.cons.map((con, idx) => (
                            <li key={idx} className="text-xs text-zinc-400 flex items-start gap-1">
                              <span>✗</span>
                              <span>{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 text-xs font-semibold text-zinc-500">
                      Best For: <span className="text-zinc-300">{alt.bestFor}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          {/* Quick Buying Guide FAQ Section */}
          <section className="border border-white/10 rounded-[2.5rem] bg-white/[0.02] p-8 sm:p-12 mb-20">
            <h2 className="text-3xl font-bold text-white tracking-tight font-urbanist mb-8">
              Substack Alternatives FAQ
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Why do creators leave Substack?</h3>
                <p className="text-sm text-zinc-400 leading-relaxed font-manrope">
                  Writers typically migrate away from Substack to gain custom domain control, customize the layout of their homepage, access raw metrics, and avoid Substack's 10% premium subscription fees (which becomes substantial as publication revenue grows).
                </p>
              </div>
              <div className="border-t border-white/[0.05] pt-6">
                <h3 className="text-lg font-bold text-white mb-2">How can I grow my new newsletter?</h3>
                <p className="text-sm text-zinc-400 leading-relaxed font-manrope">
                  No matter which host you choose, organic social discovery is the highest-converting funnel. Auto-repurposing your newsletters into native threads and articles for LinkedIn, X (Twitter), and Threads using tools like **Narrativee** ensures you scale your referral subscriber traffic without extra writing overhead.
                </p>
              </div>
            </div>
          </section>

          {/* Final Call to Action */}
          <section className="rounded-[2.5rem] bg-gradient-to-b from-indigo-900/10 via-cyan-900/5 to-transparent border border-indigo-500/25 p-8 sm:p-16 text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight font-urbanist max-w-2xl mx-auto">
              Ready to automate your social distribution loop?
            </h2>
            <p className="mt-6 text-base text-zinc-400 max-w-lg mx-auto">
              Sync your newsletter from Substack, beehiiv, or custom RSS feeds. Draft high-fidelity updates in your writing style in minutes.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/auth/signup"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
              >
                Sync My Publication Free
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
