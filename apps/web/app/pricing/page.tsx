"use client";

import { authClient } from "../../lib/auth-client";
import { useState } from "react";
import { Tick2 } from "clicons-react";
import PrimaryButton from "../components/PrimaryButton";
import { PricingPlans } from "../components/pricingData";
import Header from "../components/Header";

import { useRouter } from "next/navigation";
import { sendGTMEvent } from "../../lib/gtm";

export default function PricingPage() {
    const { data: session } = authClient.useSession();
    const [isAnnual, setIsAnnual] = useState(true);
    const router = useRouter();

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

            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV === 'production' ? "https://api.narrativee.com" : "http://localhost:3002");
            const response = await fetch(`${backendUrl}/api/pricing/create-checkout-session`, {
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
        <div className="min-h-screen bg-gray-50/50">
            {/* Header */}
            <Header />

            <main className="py-20 px-4">
                {/* Hero */}
                <div className="text-center mb-16">
                    <h1
                        className="text-5xl md:text-6xl font-bold text-gray-900 mb-6"
                        style={{ fontFamily: 'var(--font-petrona)' }}
                    >
                        Simple, transparent pricing
                    </h1>
                    <p
                        className="text-xl text-gray-600 max-w-2xl mx-auto mb-8"
                        style={{ fontFamily: 'var(--font-noto)' }}
                    >
                        Start for free. Upgrade to get the capacity that matches your needs.
                    </p>

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
                            Yearly <span className="text-amber-600 text-xs ml-1 font-bold">-20%</span>
                        </span>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 px-4">
                    {PricingPlans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`bg-white rounded-2xl p-8 border shadow-sm hover:shadow-md transition-shadow ${plan.popular
                                ? "border-2 border-amber-400 shadow-lg relative transform md:-translate-y-4"
                                : "border-gray-200"
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-400 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                    Most Popular
                                </div>
                            )}
                            <h3 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-petrona)' }}>{plan.name}</h3>
                            <p className="text-gray-500 mb-6 text-sm">{plan.subtitle}</p>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-gray-900">${isAnnual ? plan.annualPrice : plan.monthlyPrice}</span>
                                <span className="text-gray-500">/month</span>
                            </div>
                            <PrimaryButton className="w-full mb-8" onClick={() => {
                                sendGTMEvent('click_pricing', { plan: plan.name, price: isAnnual ? plan.annualPrice : plan.monthlyPrice });
                                handleCheckout(plan);
                            }}>
                                {plan.cta}
                            </PrimaryButton>
                            <ul className="space-y-4">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
                                        <Tick2
                                            className={`${plan.color === 'gray' ? 'text-green-500' :
                                                plan.color === 'amber' ? 'text-amber-500' :
                                                    'text-gray-900'
                                                } shrink-0`}
                                            size={18}
                                        />
                                        <span className={feature.included ? "text-neutral-500" : "text-neutral-200"}>{feature.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* FAQ Section */}
                <div className="max-w-3xl mx-auto mt-24">
                    <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-petrona)' }}>
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        <FAQItem
                            question="Can I cancel anytime?"
                            answer="Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period."
                        />
                        <FAQItem
                            question="What happens to my reports if I downgrade?"
                            answer="Your existing reports will remain accessible, but you may lose access to premium features like advanced analytics or custom branding for new reports."
                        />
                        <FAQItem
                            question="Do you offer refunds?"
                            answer="We offer a 14-day money-back guarantee if you're not satisfied with our Pro plan."
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
