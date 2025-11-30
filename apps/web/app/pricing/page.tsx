"use client";

import Image from "next/image";
import { Button } from "@repo/ui/button";
import logo from "../../public/logo.png";
import ProfileMenu from "../components/ProfileMenu";
import { authClient } from "../../lib/auth-client";
import { useState } from "react";
import { CheckmarkBadge } from "clicons-react";
export default function PricingPage() {
    const { data: session } = authClient.useSession();
    const [isAnnual, setIsAnnual] = useState(true);

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header */}
            <header className="p-4 flex justify-between max-w-[90%] mx-auto">
                <a href="/">
                    <Image src={logo} alt="logo" width={170} />
                </a>
                <div className="flex gap-4 items-center">
                    {session?.user ? (
                        <ProfileMenu />
                    ) : (
                        <>
                            <a href="/auth/signin" className="text-gray-700 hover:text-gray-900">Login</a>
                            <Button className="bg-amber-400 border px-5 py-2 rounded-md font-medium text-black hover:bg-amber-500">
                                Start for free
                            </Button>
                        </>
                    )}
                </div>
            </header>

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
                        Choose the plan that's right for you. All plans include a 14-day free trial.
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

                    {/* Free Plan */}
                    <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-petrona)' }}>Free</h3>
                        <p className="text-gray-500 mb-6 text-sm">Perfect for trying out Narrativee</p>
                        <div className="mb-6">
                            <span className="text-4xl font-bold text-gray-900">$0</span>
                            <span className="text-gray-500">/month</span>
                        </div>
                        <Button className="w-full bg-gray-100 text-gray-900 hover:bg-gray-200 border-0 mb-8">
                            Get Started
                        </Button>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-sm text-gray-600">
                                <CheckmarkBadge className="text-green-500 shrink-0" size={18} />
                                <span>3 reports per month</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-gray-600">
                                <CheckmarkBadge className="text-green-500 shrink-0" size={18} />
                                <span>Basic charts & visualizations</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-gray-600">
                                <CheckmarkBadge className="text-green-500 shrink-0" size={18} />
                                <span>Export to PDF</span>
                            </li>
                        </ul>
                    </div>

                    {/* Pro Plan */}
                    <div className="bg-white rounded-2xl p-8 border-2 border-amber-400 shadow-lg relative transform md:-translate-y-4">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-400 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                            Most Popular
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-petrona)' }}>Pro</h3>
                        <p className="text-gray-500 mb-6 text-sm">For professionals and creators</p>
                        <div className="mb-6">
                            <span className="text-4xl font-bold text-gray-900">${isAnnual ? '29' : '39'}</span>
                            <span className="text-gray-500">/month</span>
                        </div>
                        <Button className="w-full bg-amber-400 text-black hover:bg-amber-500 border-0 mb-8">
                            Start Free Trial
                        </Button>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-sm text-gray-600">
                                <CheckmarkBadge className="text-amber-500 shrink-0" size={18} />
                                <span>Unlimited reports</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-gray-600">
                                <CheckmarkBadge className="text-amber-500 shrink-0" size={18} />
                                <span>Advanced AI analysis</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-gray-600">
                                <CheckmarkBadge className="text-amber-500 shrink-0" size={18} />
                                <span>Custom branding</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-gray-600">
                                <CheckmarkBadge className="text-amber-500 shrink-0" size={18} />
                                <span>Priority support</span>
                            </li>
                        </ul>
                    </div>

                    {/* Enterprise Plan */}
                    <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-petrona)' }}>Enterprise</h3>
                        <p className="text-gray-500 mb-6 text-sm">For large teams and organizations</p>
                        <div className="mb-6">
                            <span className="text-4xl font-bold text-gray-900">Custom</span>
                        </div>
                        <Button className="w-full bg-gray-900 text-white hover:bg-gray-800 border-0 mb-8">
                            Contact Sales
                        </Button>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-sm text-gray-600">
                                <CheckmarkBadge className="text-gray-900 shrink-0" size={18} />
                                <span>Everything in Pro</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-gray-600">
                                <CheckmarkBadge className="text-gray-900 shrink-0" size={18} />
                                <span>SSO & Advanced Security</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-gray-600">
                                <CheckmarkBadge className="text-gray-900 shrink-0" size={18} />
                                <span>Dedicated Success Manager</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-gray-600">
                                <CheckmarkBadge className="text-gray-900 shrink-0" size={18} />
                                <span>Custom integrations</span>
                            </li>
                        </ul>
                    </div>

                </div>

                {/* FAQ Section */}
                <div className="max-w-3xl mx-auto mt-24">
                    <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-petrona)' }}>
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-lg font-bold mb-2">Can I cancel anytime?</h3>
                            <p className="text-gray-600">Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold mb-2">What happens to my reports if I downgrade?</h3>
                            <p className="text-gray-600">Your existing reports will remain accessible, but you may lose access to premium features like advanced analytics or custom branding for new reports.</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold mb-2">Do you offer refunds?</h3>
                            <p className="text-gray-600">We offer a 14-day money-back guarantee if you're not satisfied with our Pro plan.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
