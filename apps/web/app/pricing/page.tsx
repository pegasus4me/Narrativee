"use client";

import { authClient } from "../../lib/auth-client";
import { useState, useEffect } from "react";
import { Tick2 } from "clicons-react";
import PrimaryButton from "../components/commons/PrimaryButton";
import { PricingPlans } from "../../lib/pricingData";
import Header from "../components/commons/Header";
import { API_URL } from "@/lib/api-config";
import { useRouter } from "next/navigation";
import { useGTMTracking } from "../hooks/useGTMTracking";

export default function PricingPage() {
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
        <div className="min-h-screen bg-[#09090b] text-white relative overflow-hidden pb-24">
            {/* Elegant glowing background blur */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-[120px] pointer-events-none" />

            {/* Header */}
            <Header />

            <main className="max-w-7xl mx-auto py-16 px-6 relative z-10">
                {/* Hero section with glowing gradient heading */}
                <div className="text-center mb-16">
                    <h1
                        className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent mb-6 font-urbanist animate-in fade-in duration-500"
                    >
                        The only tool you need to grow 🗻
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
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
                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${isAnnual ? 'translate-x-7 bg-primary' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                        <span className={`text-sm font-semibold transition-colors ${isAnnual ? 'text-white' : 'text-zinc-500'}`}>
                            Yearly <span className="bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full text-xs font-bold ml-1.5">-20%</span>
                        </span>
                    </div>
                </div>

                {/* Pricing Grid - Clean Side-by-Side Vertical Columns */}
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    {PricingPlans.map((plan) => {
                        const hasPopularTag = plan.popular === true;
                        return (
                            <div
                                key={plan.name}
                                className={`font-manrope bg-[#121214]/60 backdrop-blur-md rounded-2xl p-8 md:p-10 transition-all duration-300 flex flex-col justify-between border ${
                                    hasPopularTag 
                                        ? 'border-primary/30 hover:border-primary/50 relative overflow-hidden shadow-2xl shadow-primary/5' 
                                        : 'border-white/[0.06] hover:border-white/[0.12] hover:bg-[#151518]/80'
                                }`}
                            >
                                {hasPopularTag && (
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none" />
                                )}

                                {/* Top Section: Info, Price and Features */}
                                <div>
                                    <div className="flex items-center justify-between gap-3 mb-2">
                                        <h3
                                            className="text-3xl font-bold text-white tracking-tight"
                                            style={{ fontFamily: 'var(--font-petrona)' }}
                                        >
                                            {plan.name}
                                        </h3>
                                        {hasPopularTag && (
                                            <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-primary/25 shadow-sm">
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="mr-0.5">
                                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                </svg>
                                                Popular
                                            </div>
                                        )}
                                    </div>

                                    {plan.category ? (
                                        <p className="text-primary font-semibold mb-6 text-xs tracking-wider uppercase">{plan.category}</p>
                                    ) : (
                                        <div className="h-6 mb-6" /> // keeping cards perfectly aligned
                                    )}

                                    <div className="flex items-baseline gap-2 mb-6">
                                        <span className="text-6xl font-bold text-white tracking-tight font-urbanist bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
                                            ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                                        </span>
                                        <span className="text-sm text-zinc-500">/ month</span>
                                    </div>

                                    <p className="text-zinc-400 leading-relaxed mb-8 text-sm min-h-[48px]">
                                        {plan.description}
                                    </p>

                                    <div className="border-t border-white/[0.06] my-6"></div>

                                    {/* Features List */}
                                    <ul className="space-y-4 mb-8">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3 animate-in fade-in duration-300">
                                                <Tick2
                                                    className="text-emerald-400 shrink-0 mt-0.5"
                                                    size={18}
                                                />
                                                <span className={`text-sm leading-relaxed ${feature.included ? "text-zinc-200" : "text-zinc-600 line-through"}`}>
                                                    {feature.text}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Bottom Section: CTA button */}
                                <div className="mt-auto">
                                    <PrimaryButton
                                        className="w-full text-base py-3.5 transition-transform hover:scale-[1.01]"
                                        onClick={() => {
                                            trackItemSelection(
                                                plan.name,
                                                isAnnual ? plan.annualPrice : plan.monthlyPrice,
                                                'USD',
                                                'Subscription'
                                            );
                                            handleCheckout(plan);
                                        }}
                                    >
                                        {session?.user ? "Upgrade Now" : plan.cta}
                                    </PrimaryButton>
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
                            question="How do AI credits work?"
                            answer="One AI credit is used each time you generate a comment or a note using the Narrativee extension. Your credits refresh at the start of your monthly billing cycle."
                        />
                        <FAQItem
                            question="Can I cancel anytime?"
                            answer="Yes, you can cancel your subscription at any time. You'll continue to have access to your credits and features until the end of your billing period."
                        />
                        <FAQItem
                            question="What happens if I run out of credits?"
                            answer="If you use all your credits before the month ends, the AI features will pause until your next billing date. You can also upgrade your plan at any time to instantly unlock more."
                        />
                        <FAQItem
                            question="Do you offer a free trial?"
                            answer="Yes! All paid plans include a 7-day free trial so you can experience the magic firsthand before committing. No hidden fees."
                        />
                    </div>
                </div>
            </main>
        </div>
    );
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
