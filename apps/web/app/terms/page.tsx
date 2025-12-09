"use client";

import Header from "../components/Header";
import Image from "next/image";
import logo from "../../public/logo.png";
import Link from "next/link";

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="max-w-4xl mx-auto px-6 py-20">
                {/* Title Section */}
                <div className="mb-16">
                    <h1 className="text-5xl md:text-6xl font-medium text-black mb-4" style={{ fontFamily: 'var(--font-petrona)' }}>
                        Terms of Service
                    </h1>
                    <p className="text-gray-400">Last updated: December 8, 2024</p>
                </div>

                {/* Content */}
                <div className="space-y-12">
                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Acceptance of Terms</h2>
                        <p className="text-gray-600 leading-relaxed">
                            By accessing or using Narrativee ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Description of Service</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Narrativee is an AI-powered platform that transforms spreadsheet data into narrative reports. The Service includes report generation, editing, sharing, and related features.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">User Accounts</h2>
                        <ul className="text-gray-600 leading-relaxed space-y-3">
                            <li className="flex gap-3"><span className="text-gray-300">—</span><span>You must provide accurate information when creating an account.</span></li>
                            <li className="flex gap-3"><span className="text-gray-300">—</span><span>You are responsible for maintaining the security of your account credentials.</span></li>
                            <li className="flex gap-3"><span className="text-gray-300">—</span><span>You must notify us immediately of any unauthorized access to your account.</span></li>
                            <li className="flex gap-3"><span className="text-gray-300">—</span><span>You must be at least 18 years old to use the Service.</span></li>
                        </ul>
                    </section>

                    <section className="bg-gray-50 -mx-6 px-6 py-8 rounded-lg">
                        <h2 className="text-xl font-medium text-black mb-4">Acceptable Use</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">You agree not to:</p>
                        <ul className="text-gray-600 leading-relaxed space-y-3">
                            <li className="flex gap-3"><span className="text-gray-300">—</span><span>Use the Service for any illegal purpose</span></li>
                            <li className="flex gap-3"><span className="text-gray-300">—</span><span>Upload malicious files or code</span></li>
                            <li className="flex gap-3"><span className="text-gray-300">—</span><span>Attempt to gain unauthorized access to our systems</span></li>
                            <li className="flex gap-3"><span className="text-gray-300">—</span><span>Interfere with or disrupt the Service</span></li>
                            <li className="flex gap-3"><span className="text-gray-300">—</span><span>Resell or redistribute the Service without permission</span></li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Your Content</h2>
                        <p className="text-gray-600 leading-relaxed">
                            You retain ownership of all data and content you upload to the Service. By using the Service, you grant us a limited license to process your content solely for the purpose of providing the Service. Your uploaded data is processed in your browser and is not stored on our servers.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Intellectual Property</h2>
                        <p className="text-gray-600 leading-relaxed">
                            The Service, including its design, features, and content (excluding user content), is owned by Narrativee and protected by intellectual property laws. You may not copy, modify, or reverse-engineer any part of the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Payment and Subscriptions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 border border-gray-100 rounded-lg">
                                <p className="text-gray-600">Some features require a paid subscription</p>
                            </div>
                            <div className="p-4 border border-gray-100 rounded-lg">
                                <p className="text-gray-600">Payments processed securely through Stripe</p>
                            </div>
                            <div className="p-4 border border-gray-100 rounded-lg">
                                <p className="text-gray-600">Subscriptions renew automatically</p>
                            </div>
                            <div className="p-4 border border-gray-100 rounded-lg">
                                <p className="text-gray-600">Refunds handled case-by-case</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Service Availability</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We strive to maintain high availability but do not guarantee uninterrupted access. We may modify, suspend, or discontinue features at any time with reasonable notice.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Limitation of Liability</h2>
                        <p className="text-gray-600 leading-relaxed">
                            To the maximum extent permitted by law, Narrativee shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service. Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Disclaimer</h2>
                        <p className="text-gray-600 leading-relaxed">
                            The Service is provided "as is" without warranties of any kind. We do not guarantee that AI-generated content will be accurate, complete, or suitable for your specific purposes. You are responsible for reviewing and verifying all generated reports.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Termination</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We may terminate or suspend your account at any time for violation of these terms. You may delete your account at any time. Upon termination, your right to use the Service ceases immediately.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Changes to Terms</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We may update these terms from time to time. We will notify you of significant changes via email or through the Service. Continued use after changes constitutes acceptance.
                        </p>
                    </section>

                    <section className="border-t border-gray-100 pt-12">
                        <h2 className="text-xl font-medium text-black mb-4">Contact</h2>
                        <p className="text-gray-600 leading-relaxed">
                            For questions about these Terms, contact us at{" "}
                            <a href="mailto:contact@narrativee.com" className="text-black underline underline-offset-4 hover:no-underline">
                                contact@narrativee.com
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
                        <a href="/privacy" className="hover:text-black transition-colors">Privacy</a>
                        <a href="/terms" className="text-black">Terms</a>
                        <a href="mailto:contact@narrativee.com" className="hover:text-black transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
