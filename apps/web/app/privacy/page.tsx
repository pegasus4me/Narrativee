"use client";

import Header from "../components/Header";
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
                    <p className="text-gray-400">Last updated: December 8, 2024</p>
                </div>

                {/* Content */}
                <div className="space-y-12">
                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Introduction</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Narrativee ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Data We Collect</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            We collect the following types of information:
                        </p>
                        <ul className="text-gray-600 leading-relaxed space-y-3">
                            <li className="flex gap-3">
                                <span className="text-gray-300">—</span>
                                <span><strong className="text-black">Account Information:</strong> Email address and authentication data when you create an account.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-gray-300">—</span>
                                <span><strong className="text-black">Usage Data:</strong> How you interact with our service, including features used and the number of reports created, the content is encrypted using AES-256 encryption.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-gray-300">—</span>
                                <span><strong className="text-black">Payment Information:</strong> Processed securely through Stripe. We do not store credit card details.</span>
                            </li>
                        </ul>
                    </section>

                    <section className="bg-black text-white -mx-6 px-6 py-8 rounded-lg">
                        <h2 className="text-xl font-medium mb-4">Your Data Security</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            We are deeply concerned about privacy and security. This is why your uploaded data is <strong className="text-white">strictly processed in your browser</strong> and never sent to the server or any third party.
                        </p>
                        <p className="text-gray-300 leading-relaxed mb-6">
                            The data-driven reports you create are <strong className="text-white">encrypted using AES-256 encryption</strong> before being stored.
                        </p>
                        <div className="flex gap-4 flex-wrap">
                            <div className="px-4 py-2 bg-white/10 rounded-lg text-sm">
                                🔒 Browser-only processing
                            </div>
                            <div className="px-4 py-2 bg-white/10 rounded-lg text-sm">
                                🛡️ AES-256 encryption
                            </div>
                            <div className="px-4 py-2 bg-white/10 rounded-lg text-sm">
                                📤 Export anytime
                            </div>
                            <div className="px-4 py-2 bg-white/10 rounded-lg text-sm">
                                🗑️ Delete anytime
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">How We Use Your Information</h2>
                        <ul className="text-gray-600 leading-relaxed space-y-3">
                            <li className="flex gap-3"><span className="text-gray-300">—</span><span>To provide and maintain our service</span></li>
                            <li className="flex gap-3"><span className="text-gray-300">—</span><span>To process your transactions</span></li>
                            <li className="flex gap-3"><span className="text-gray-300">—</span><span>To send you service-related communications</span></li>
                            <li className="flex gap-3"><span className="text-gray-300">—</span><span>To improve our service and develop new features</span></li>
                            <li className="flex gap-3"><span className="text-gray-300">—</span><span>To detect and prevent fraud or abuse</span></li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Data Sharing</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We do not sell your personal information. We may share data with trusted third-party services (e.g., payment processors, analytics) only as necessary to operate our service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Data Retention</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We retain your account information for as long as your account is active. You may request deletion of your data at any time by contacting us.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Your Rights & Control</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            You are always in control of your data. You can export or delete your data at any time from your account settings.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 border border-gray-100 rounded-lg">
                                <p className="text-gray-600">Access your personal data</p>
                            </div>
                            <div className="p-4 border border-gray-100 rounded-lg">
                                <p className="text-gray-600">Correct inaccurate data</p>
                            </div>
                            <div className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                                <p className="text-black font-medium">Export your data anytime</p>
                            </div>
                            <div className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                                <p className="text-black font-medium">Delete your data anytime</p>
                            </div>
                            <div className="p-4 border border-gray-100 rounded-lg">
                                <p className="text-gray-600">Withdraw consent at any time</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Cookies</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We use essential cookies for authentication and session management. We do not use tracking cookies for advertising purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Security Measures</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We implement industry-standard security measures including HTTPS encryption, secure authentication, and AES-256 encryption for stored reports. Your raw data never leaves your browser.
                        </p>
                    </section>

                    <section className="border-t border-gray-100 pt-12">
                        <h2 className="text-xl font-medium text-black mb-4">Contact Us</h2>
                        <p className="text-gray-600 leading-relaxed">
                            If you have questions about this Privacy Policy, please contact us at{" "}
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
