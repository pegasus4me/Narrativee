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
    const [isAnnual, setIsAnnual] = useState(true);
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
        <div className="min-h-screen max-w-7xl mx-auto ">
            {/* Header */}
            <Header />

            <main className="py-20 px-4">
                {/* Hero */}
                <div className="text-center mb-16">
                    <h1
                        className="text-5xl md:text-7xl font-bold text-white mb-6 font-urbanist"
                    >
                        Tools to grow your audience
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Spend less time typing, and more time connecting. Pick the plan that fits your growth goals.
                    </p>

                    {/* ROI Calculator */}
                    <div className="mt-20 mb-12 px-4">
                        {/* <ROICalculator /> */}
                    </div>

                    {/* Toggle */}
                    <div className="flex items-center justify-center gap-4 mb-12">
                        <span className={`text-sm font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
                            Monthly
                        </span>
                        <button
                            onClick={() => setIsAnnual(!isAnnual)}
                            className="relative w-14 h-7 bg-gray-200 rounded-full transition-colors focus:outline-none"
                        >
                            <div
                                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${isAnnual ? 'translate-x-7' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                        <span className={`text-sm font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
                            Yearly <span className="text-primary text-xs ml-1 font-bold">-20%</span>
                        </span>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="max-w-4xl mx-auto">
                    {PricingPlans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`bg-white font-manrope rounded-xl p-8 md:p-12 border transition-all duration-300 flex flex-col md:flex-row md:items-center gap-8 md:gap-16 ${plan.popular
                                ? "border-contrast ring-1 ring-contrast/30 relative shadow-lg"
                                : "border-gray-100 "
                                }`}
                        >
                            {/* Left Side: Info & Price */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <h3
                                        className={`text-4xl font-bold ${plan.name === 'Starter' ? 'text-primary' : 'text-gray-900'}`}
                                        style={{ fontFamily: 'var(--font-petrona)' }}
                                    >
                                        {plan.name}
                                    </h3>
                                    {plan.popular && (
                                        <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-primary/20">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                            </svg>
                                            Popular
                                        </div>
                                    )}
                                </div>

                                <p className="text-gray-500 font-medium mb-6 text-lg">{plan.category}</p>

                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-7xl font-bold text-gray-900 tracking-tight font-urbanist">
                                        ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                                    </span>
                                    <span className="text-gray-500 font-medium">/ month</span>
                                </div>

                                <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                                    {plan.description}
                                </p>

                                {/* CTA Button - Desktop (Left side bottom) */}
                                <div className="hidden md:block">
                                    <PrimaryButton
                                        className="w-full text-lg py-4"
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
                                        {plan.cta}
                                    </PrimaryButton>
                                </div>
                            </div>

                            {/* Divider for mobile */}
                            <div className="border-t border-gray-100 w-full md:hidden"></div>

                            {/* Right Side: Features */}
                            <div className="flex-1 bg-gray-50 p-6 md:p-8 rounded-xl border border-gray-100">
                                <h4 className="font-bold text-gray-900 mb-6 font-urbanist text-xl">What's included:</h4>
                                <ul className="space-y-4">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <Tick2
                                                className="text-primary shrink-0 mt-0.5"
                                                size={20}
                                            />
                                            <span className={`text-[15px] leading-relaxed ${feature.included ? "text-gray-800 font-medium" : "text-gray-400"}`}>
                                                {feature.text}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* CTA Button - Mobile (Bottom) */}
                            <div className="md:hidden w-full mt-4">
                                <PrimaryButton
                                    className="w-full py-4 text-lg"
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
                                    {plan.cta}
                                </PrimaryButton>
                            </div>

                        </div>
                    ))}
                </div>

                <div className="max-w-3xl mx-auto mt-24">
                    <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-petrona)' }}>
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
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
        <div className="border-b border-gray-200 last:border-0">
            <button
                className="w-full py-6 flex items-center justify-between text-left focus:outline-none group"
                onClick={() => setIsOpen(!isOpen)}
            >
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-amber-600 transition-colors" style={{ fontFamily: 'var(--font-petrona)' }}>
                    {question}
                </h3>
                <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
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
                    <p className="text-gray-600 leading-relaxed">
                        {answer}
                    </p>
                </div>
            </div>
        </div>
    );
}
