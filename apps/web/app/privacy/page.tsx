"use client";

import Header from "../components/commons/Header";
import Image from "next/image";
import logo from "../../public/logo.png";
import Link from "next/link";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="max-w-4xl mx-auto px-6 py-20">
                {/* Title Section */}
                <div className="mb-16">
                    <h1 className="text-5xl md:text-6xl font-medium text-black mb-4" style={{ fontFamily: 'var(--font-petrona)' }}>
                        Privacy Policy
                    </h1>
                    <p className="text-gray-400">Last updated: January 6, 2026</p>
                </div>

                {/* Content */}
                <div className="space-y-12">
                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Introduction</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Narrativee ("we", "our", or "us") is dedicated to protecting your privacy and the privacy of your users. This Privacy Policy outlines how we collect, use, store, and safeguard your information when you use our tracking and conversion optimization platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Data We Collect</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            We collect two categories of information:
                        </p>
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-black mb-2">1. Account Information</h3>
                                <p className="text-gray-600">Information you provide when signing up, including your email address, name, billing details (processed by Stripe), and company information.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-black mb-2">2. End-User Data</h3>
                                <p className="text-gray-600">
                                    When you install the Narrativee SDK, we collect data about your users ("End-Users") to provide our service. This includes:
                                </p>
                                <ul className="text-gray-600 leading-relaxed space-y-2 mt-2 ml-4">
                                    <li className="flex gap-2"><span className="text-gray-300">—</span><span>User identifiers (IDs, emails if provided)</span></li>
                                    <li className="flex gap-2"><span className="text-gray-300">—</span><span>Behavioral data (events, page views, clicks)</span></li>
                                    <li className="flex gap-2"><span className="text-gray-300">—</span><span>Device and browser information</span></li>
                                    <li className="flex gap-2"><span className="text-gray-300">—</span><span>Engagement metrics and traits you specifically choose to track</span></li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="bg-black text-white -mx-6 px-6 py-8 rounded-lg">
                        <h2 className="text-xl font-medium mb-4">Data Security & Storage</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            We employ industry-standard security measures to protect data both in transit and at rest.
                        </p>
                        <div className="flex gap-4 flex-wrap">
                            <div className="px-4 py-2 bg-white/10 rounded-lg text-sm">
                                🔒 Encrypted in transit (HTTPS/TLS)
                            </div>
                            <div className="px-4 py-2 bg-white/10 rounded-lg text-sm">
                                🛡️ Encrypted at rest
                            </div>
                            <div className="px-4 py-2 bg-white/10 rounded-lg text-sm">
                                🔑 Strict access controls
                            </div>
                            <div className="px-4 py-2 bg-white/10 rounded-lg text-sm">
                                🗑️ Data deletion requests honored
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">How We Use Your Information</h2>
                        <ul className="text-gray-600 leading-relaxed space-y-3">
                            <li className="flex gap-3"><span className="text-gray-300">—</span><span>To provide granular analytics on your trial users.</span></li>
                            <li className="flex gap-3"><span className="text-gray-300">—</span><span>To calculate engagement scores and segments.</span></li>
                            <li className="flex gap-3"><span className="text-gray-300">—</span><span>To trigger automated workflows and personalization layers defined by you.</span></li>
                            <li className="flex gap-3"><span className="text-gray-300">—</span><span>To improve our algorithms and platform performance.</span></li>
                            <li className="flex gap-3"><span className="text-gray-300">—</span><span>To communicate with you about your account and updates.</span></li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Data Sharing</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We do not sell your data or your End-User Data. We share information only with trusted third-party service providers (e.g., Stripe for payments, cloud infrastructure providers) necessary to operate our Service. These providers are bound by strict confidentiality agreements.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Data Retention</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We retain Account Information and End-User Data for as long as your account is active or as needed to provide you the Service. You can request the deletion of your account and all associated data at any time.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Your Rights & Control</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            As a Customer, you have the right to access, correct, or delete your account data. You are also responsible for complying with applicable privacy laws (such as GDPR or CCPA) regarding the collection of your End-Users' data.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 border border-gray-100 rounded-lg">
                                <p className="text-gray-600">Access your business data</p>
                            </div>
                            <div className="p-4 border border-gray-100 rounded-lg">
                                <p className="text-gray-600">Export end-user event logs</p>
                            </div>
                            <div className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                                <p className="text-black font-medium">Request full data deletion</p>
                            </div>
                            <div className="p-4 border border-gray-100 rounded-lg">
                                <p className="text-gray-600">Manage team access</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Cookies</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We use essential cookies for service authentication and session management. We may use analytics cookies to understand how you use our dashboard, which you can opt-out of. Our SDK technology relies on standard web technologies to track user sessions.
                        </p>
                    </section>

                    <section className="border-t border-gray-100 pt-12">
                        <h2 className="text-xl font-medium text-black mb-4">Contact Us</h2>
                        <p className="text-gray-600 leading-relaxed">
                            If you have questions about this Privacy Policy or data practices, please contact our Data Protection Officer at{" "}
                            <a href="mailto:mydata@narrativee.com" className="text-black underline underline-offset-4 hover:no-underline">
                                mydata@narrativee.com
                            </a>
                        </p>
                    </section>
                </div>
            </main>

            <footer className="py-12 px-6 border-t border-gray-100 mt-20">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <Link href="/">
                        <Image src={logo} alt="Narrativee" width={100} />
                    </Link>
                    <div className="flex items-center gap-8 text-sm text-gray-400">
                        <a href="/privacy" className="text-black">Privacy</a>
                        <a href="/terms" className="hover:text-black transition-colors">Terms</a>
                        <a href="mailto:contact@narrativee.com" className="hover:text-black transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
