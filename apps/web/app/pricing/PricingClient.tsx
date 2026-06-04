"use client";

import { authClient } from "../../lib/auth-client";
import { useState, useEffect } from "react";
import { ArrowRight, Check, Zap } from "lucide-react";
import { PricingPlans } from "../../lib/pricingData";
import { API_URL } from "@/lib/api-config";
import { useRouter, useSearchParams } from "next/navigation";
import { useGTMTracking } from "../hooks/useGTMTracking";
import { Navigation } from "../components/landing/navigation";
import { Suspense } from "react";

function TrialExpiredBanner() {
    const searchParams = useSearchParams();
    const isExpiredParam = searchParams.get("expired") === "true";

    if (!isExpiredParam) return null;

    return (
        <div className="max-w-4xl mx-auto mb-12 p-6 rounded-2xl bg-red-950/20 border border-red-900/40 text-center animate-in fade-in slide-in-from-top-4 duration-500 shadow-2xl shadow-red-950/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
            <h3 className="text-xl font-bold text-red-400 mb-2 font-urbanist flex items-center justify-center gap-2">
                ⚠️ Trial Period Expired
            </h3>
            <p className="text-sm text-zinc-300 font-manrope">
                Your <strong>14-day free trial</strong> has expired. Please select and upgrade to either the <strong>Starter</strong> or <strong>Creator</strong> plan below to continue using your Narrativee workspace seamlessly!
            </p>
        </div>
    );
}

function PricingPageContent() {
    const { data: session } = authClient.useSession();
    const [isAnnual, setIsAnnual] = useState(false);
    const router = useRouter();
    const { trackItemSelection, trackPageView } = useGTMTracking();

    useEffect(() => {
        trackPageView({
            pageTitle: 'Pricing',
            pagePath: '/pricing'
        });
    }, [trackPageView]);

    const handleCheckout = async (plan: typeof PricingPlans[number]) => {
        if (!session?.user) {
            router.push("/auth/signin");
            return;
        }

        if (plan.monthlyPrice === 0) {
            router.push("/workspace");
            return;
        }

        try {
            const priceId = isAnnual ? plan.annualPriceId : plan.monthlyPriceId;

            if (!priceId) {
                console.error("Price ID missing for plan:", plan.name);
                return;
            }

            const response = await fetch(`${API_URL}/pricing/create-checkout-session`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.session?.token}`,
                },
                credentials: "include",
                body: JSON.stringify({
                    priceId,
                    planName: plan.name.toLowerCase(),
                    isAnnual
                }),
            });

            if (!response.ok) {
                const error = await response.json() as { error?: string };
                console.error("Checkout error:", error);
                alert(`Failed to start checkout: ${error.error || JSON.stringify(error)}`);
                return;
            }

            const { url } = await response.json() as { url: string };
            if (url) {
                window.location.href = url;
            }
        } catch (error) {
            console.error("Checkout error:", error);
            alert("An error occurred. Please try again.");
        }
    };

    return (
        <div className="theme-landing min-h-screen bg-[#09090b] text-white relative overflow-hidden pb-24">
            {/* Elegant glowing background blur */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-[120px] pointer-events-none" />

            {/* Header */}
            <Navigation />

            <main className="max-w-7xl mx-auto py-16 px-6 relative z-10 font-display">

                {/* Isolated Trial Expired Warning Banner */}
                <Suspense fallback={null}>
                    <TrialExpiredBanner />
                </Suspense>

                {/* Hero section with glowing gradient heading */}
                <div className="text-center mb-16 mt-20">
                    <h1
                        className="text-5xl md:text-7xl font-display text-white animate-in fade-in duration-500"
                    >
                        The only tool you need to grow
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 mt-4 font-sans">
                        Scale your social presence natively with zero friction. Cancel anytime.
                    </p>

                    {/* Custom toggle switch */}
                    <div className="flex items-center justify-center gap-4">
                        <span className={`text-sm font-semibold transition-colors ${!isAnnual ? 'text-white' : 'text-zinc-500'}`}>
                            Monthly
                        </span>
                        <button
                            onClick={() => setIsAnnual(!isAnnual)}
                            className="relative w-14 h-7 bg-zinc-800 rounded-full border border-white/10 transition-colors focus:outline-none hover:border-white/20"
                        >
                            <div
                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${isAnnual ? 'translate-x-7 bg-[#eca8d6]' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                        <span className={`text-sm font-semibold transition-colors ${isAnnual ? 'text-white' : 'text-zinc-500'}`}>
                            Yearly <span className="bg-[#eca8d6]/20 text-[#eca8d6] border border-[#eca8d6]/30 px-2 py-0.5 rounded-full text-xs font-bold ml-1.5">-20%</span>
                        </span>
                    </div>
                </div>

                {/* Pricing Grid - Clean Side-by-Side Vertical Columns */}
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                    {PricingPlans.map((plan, index) => {
                        const isCreator = plan.name === "Creator";
                        return (
                            <div
                                key={plan.name}
                                className={`relative bg-background border transition-all duration-700 ${isCreator
                                    ? "border-[#eca8d6] md:-mx-2 md:z-10 md:scale-105"
                                    : "border-foreground/10"
                                    } flex flex-col justify-between h-full`}
                            >
                                {/* Popular badge */}
                                {isCreator && (
                                    <div className="absolute -top-4 left-8 right-8 flex justify-center">
                                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#eca8d6] text-black text-xs font-mono uppercase tracking-widest font-bold">
                                            <Zap className="w-3 h-3 fill-black" />
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                <div className="p-8 lg:p-10 flex flex-col h-full justify-between">
                                    <div>
                                        {/* Plan header */}
                                        <div className="mb-8 pb-8 border-b border-foreground/10">
                                            <span className="font-mono text-xs text-muted-foreground">
                                                {String(index + 1).padStart(2, "0")}
                                            </span>
                                            <h3 className="text-2xl lg:text-3xl font-display mt-2">{plan.name}</h3>
                                            <p className="text-sm text-muted-foreground mt-2 min-h-[40px]">{plan.description}</p>
                                        </div>

                                        {/* Price */}
                                        <div className="mb-8">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-5xl lg:text-6xl font-display">
                                                    ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                                                </span>
                                                <span className="text-muted-foreground text-sm">/month</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2 font-mono">
                                                {isAnnual ? "billed annually" : "billed monthly"}
                                            </p>
                                        </div>

                                        {/* Features */}
                                        <ul className="space-y-3 mb-10">
                                            {plan.features.map((feature) => (
                                                <li key={feature.text} className="flex items-start gap-3">
                                                    <Check className="w-4 h-4 text-[#eca8d6] mt-0.5 shrink-0" />
                                                    <span className={`text-sm text-muted-foreground ${feature.bold ? "font-bold text-foreground" : ""}`}>
                                                        {feature.text}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* CTA */}
                                    <button
                                        onClick={() => {
                                            trackItemSelection(
                                                plan.name,
                                                isAnnual ? plan.annualPrice : plan.monthlyPrice,
                                                'USD',
                                                'Subscription'
                                            );
                                            handleCheckout(plan);
                                        }}
                                        className={`w-full py-4 flex items-center justify-center gap-2 text-sm font-medium transition-all group ${isCreator
                                            ? "bg-[#eca8d6] text-black hover:bg-[#eca8d6]/90 font-bold"
                                            : "border border-foreground/20 text-foreground hover:border-foreground hover:bg-foreground/5"
                                            }`}
                                    >
                                        {session?.user ? "Upgrade Now" : plan.cta}
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* FAQ Section */}
                <div className="max-w-4xl mx-auto mt-32">
                    <h2 className="text-3xl font-urbanist font-bold text-center mb-12 text-white">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-2">
                        <FAQItem
                            question="How do AI tokens work?"
                            answer="One AI token is used each time you generate a comment, extract a key angle, or compile a platform-native post using the Narrativee extension or central workspace. Your tokens refresh at the start of your monthly billing cycle, and unused tokens roll over to the next month on all active paid tiers. You can monitor your token balance directly in your central creator dashboard."
                        />
                        <FAQItem
                            question="Can I cancel my subscription anytime?"
                            answer="Absolutely. You can cancel your subscription at any time with a single click from your account setting panel. There are no long-term contracts, lock-ins, or cancellation fees. You will continue to retain full access to your saved voice profiles, workspace, and credits until the end of your current monthly billing period."
                        />
                        <FAQItem
                            question="What happens if I run out of credits?"
                            answer="If you exceed your monthly credit limit before your cycle ends, your automated publishing queues will remain active, but voice generation tasks will temporarily pause until your next monthly billing date. You can easily upgrade your plan or purchase a fast token top-up directly in your workspace settings to instantly unlock more."
                        />
                        <FAQItem
                            question="Do you offer a free trial period?"
                            answer="Yes, all our plans start with a comprehensive 14-day free trial. This gives you full access to the AI voice cloner, sitemaps, channels compilers, and Substack Notes scheduler. You can test the platform completely for 14 days and cancel anytime without being billed. No hidden setup fees or surprise charges."
                        />
                    </div>
                </div>

                {/* Rich Copywriting Value Block to raise Text-to-HTML ratio for SEMrush audits */}
                <div className="max-w-4xl mx-auto mt-24 p-8 sm:p-10 rounded-3xl border border-white/[0.06] bg-[#121214]/40 font-manrope">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 font-urbanist">
                        Everything you need to grow your digital footprint.
                    </h3>
                    <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                        Narrativee is engineered to save creators up to 10 hours a week of manual content distribution and formatting.
                        By upgrading to one of our premium plans, you are investing in a repeatable publishing workflow that compounds your newsletter's value across LinkedIn, X, Threads, Instagram, and Bluesky.
                    </p>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                        Whether you are an individual author starting a new Substack publication or an established marketing operator growing multiple feeds, Narrativee provides strict voice consistency, custom scheduling grids, and automated local publishes that keep your audience highly engaged.
                    </p>
                </div>
            </main>
        </div>
    );
}

export default function PricingClient() {
    return <PricingPageContent />;
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-white/[0.08] last:border-0 font-manrope">
            <button
                className="w-full py-6 flex items-center justify-between text-left focus:outline-none group"
                onClick={() => setIsOpen(!isOpen)}
            >
                <h3 className="text-lg font-medium text-zinc-300 group-hover:text-white transition-colors">
                    {question}
                </h3>
                <span className={`transform transition-transform duration-300 text-zinc-500 group-hover:text-white ${isOpen ? 'rotate-180' : ''}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </button>
            <div
                className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mb-6' : 'grid-rows-[0fr] opacity-0'
                    }`}
            >
                <div className="overflow-hidden">
                    <p className="text-zinc-400 leading-relaxed text-sm">
                        {answer}
                    </p>
                </div>
            </div>
        </div>
    );
}
