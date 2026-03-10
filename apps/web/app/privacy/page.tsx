"use client";

import Header from "../components/commons/Header";
import Image from "next/image";
import logo from "../../public/logo.png";
import Link from "next/link";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-[#0d0d0f] text-white">
            <Header />

            <main className="max-w-4xl mx-auto px-6 py-20">
                {/* Title Section */}
                <div className="mb-16">
                    <h1 className="text-5xl md:text-6xl font-medium text-primary mb-4" style={{ fontFamily: 'var(--font-petrona)' }}>
                        Privacy Policy
                    </h1>
                    <p className="text-white">Last updated: January 6, 2026</p>
                </div>

                {/* Content */}
                <div className="space-y-12 text-gray-300">
                    <section>
                        <h2 className="text-xl font-medium text-white mb-4">Introduction</h2>
                        <p className="text-gray-400 leading-relaxed">
                            Narrativee ("we", "our", or "us") is dedicated to protecting your privacy. This Privacy Policy outlines how our web application and official Chrome Extension collect, use, and safeguard your data when you use our AI copilot for Substack growth.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white mb-4">Data We Collect</h2>
                        <p className="text-gray-400 leading-relaxed mb-4">
                            We only collect data necessary to provide our service:
                        </p>
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-gray-100 mb-2">1. Account Information</h3>
                                <p className="text-gray-400">Information you provide when signing up on narrativee.com, including your email address, name, sub-domain, and billing details (securely processed by Stripe).</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-100 mb-2">2. Chrome Extension Data</h3>
                                <p className="text-gray-400">
                                    When you install and use the Narrativee Chrome Extension, we interact with your active Substack.com session:
                                </p>
                                <ul className="text-gray-400 leading-relaxed space-y-2 mt-2 ml-4">
                                    <li className="flex gap-2"><span className="text-gray-300">—</span><span><strong>Website Content:</strong> We read posts from your Substack feed to provide AI commenting capabilities, and read your own posts to train your unique AI writing voice.</span></li>
                                    <li className="flex gap-2"><span className="text-gray-300">—</span><span><strong>User Activity:</strong> The extension automates actions on your behalf (like publishing scheduled notes or posting approved comments).</span></li>
                                    <li className="flex gap-2"><span className="text-gray-300">—</span><span><strong>Substack Statistics:</strong> We sync your public audience and engagement metrics to your Narrativee dashboard for display purposes. <strong>None of this scraped Substack data is saved to our databases.</strong> The extension merely acts as a facilitator entirely within your local browser.</span></li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="bg-[#1a1b1c] border border-[#2e3033] text-white -mx-6 px-6 py-8 rounded-lg">
                        <h2 className="text-xl font-medium mb-4">Data Security & Storage (Zero Database Policy for Substack)</h2>
                        <p className="text-gray-400 leading-relaxed mb-4">
                            Your trust is paramount. All interaction between Substack and Narrativee happens entirely locally in your browser. Our backend servers do not store your Substack posts, comments, or scraped statistics.
                        </p>
                        <div className="flex gap-4 flex-wrap">
                            <div className="px-4 py-2 bg-white/10 rounded-lg text-sm">
                                ✅ Zero Substack Data on Servers
                            </div>
                            <div className="px-4 py-2 bg-white/10 rounded-lg text-sm">
                                💻 Local Extension Storage
                            </div>
                            <div className="px-4 py-2 bg-white/10 rounded-lg text-sm">
                                🔐 No Password Scraping
                            </div>
                            <div className="px-4 py-2 bg-white/10 rounded-lg text-sm">
                                🗑️ Full Data Deletion Available
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white mb-4">How We Use Your Information</h2>
                        <ul className="text-gray-400 leading-relaxed space-y-3">
                            <li className="flex gap-3"><span className="text-gray-500">—</span><span>To clone your writing voice and generate authentic Substack notes.</span></li>
                            <li className="flex gap-3"><span className="text-gray-500">—</span><span>To auto-publish content to your Substack account based on your schedule.</span></li>
                            <li className="flex gap-3"><span className="text-gray-500">—</span><span>To provide AI-generated engagement options for the posts on your feed.</span></li>
                            <li className="flex gap-3"><span className="text-gray-500">—</span><span>To display analytics and metrics regarding your Substack growth on our dashboard.</span></li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white mb-4">Data Sharing (We Don't Sell Your Data)</h2>
                        <p className="text-gray-400 leading-relaxed">
                            We <strong>never sell or transfer</strong> your data to third parties. We share information only with trusted service providers necessary to operate our Service (such as LLM providers like OpenRouter to generate content, Stripe for payments, and secure cloud infrastructure). These providers are strictly bound by confidentiality terms and only process data for the purpose of the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white mb-4">Chrome Extension Details</h2>
                        <p className="text-gray-400 leading-relaxed mb-4">
                            Our Chrome extension requires specific permissions to function:
                        </p>
                        <ul className="text-gray-400 leading-relaxed space-y-3">
                            <li className="flex gap-3"><span className="text-gray-500">—</span><span><strong>activeTab & tabs:</strong> Required to interact with your active auth session on Substack.com to automate tasks.</span></li>
                            <li className="flex gap-3"><span className="text-gray-500">—</span><span><strong>storage:</strong> Used to securely save your writing style preferences, bio, and tone settings locally in your browser.</span></li>
                            <li className="flex gap-3"><span className="text-gray-500">—</span><span><strong>Host permissions:</strong> We require access to `*.substack.com` to perform the automations, and `*.narrativee.com` to sync with your dashboard queue.</span></li>
                        </ul>
                    </section>

                    <section className="border-t border-[#2e3033] pt-12">
                        <h2 className="text-xl font-medium text-white mb-4">Contact Us</h2>
                        <p className="text-gray-400 leading-relaxed">
                            If you have questions about this Privacy Policy, your Chrome Extension data, or general data practices, please contact us at{" "}
                            <a href="mailto:contact@narrativee.com" className="text-white underline underline-offset-4 hover:text-primary transition-colors">
                                contact@narrativee.com
                            </a>
                        </p>
                    </section>
                </div>
            </main>

            <footer className="py-12 px-6 border-t border-[#2e3033] mt-20">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <Link href="/">
                        <Image src={logo} alt="Narrativee" width={100} />
                    </Link>
                    <div className="flex items-center gap-8 text-sm text-gray-500">
                        <a href="/privacy" className="text-white hover:text-primary transition-colors">Privacy</a>
                        <a href="/terms" className="hover:text-white transition-colors">Terms</a>
                        <a href="mailto:contact@narrativee.com" className="hover:text-white transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
