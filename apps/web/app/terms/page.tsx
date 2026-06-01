import { Metadata } from "next";
import Header from "../components/commons/Header";
import Image from "next/image";
import logo from "../../public/logo.png";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read the Terms of Service for Narrativee. Learn about account guidelines, acceptable use, data rights, payment policies, and limitations of liability.",
  alternates: {
    canonical: "/terms",
  },
};

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
                    <p className="text-gray-400">Last updated: January 6, 2026</p>
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
                            Narrativee is a SaaS platform designed to help Substack creators grow their publications faster. The Service provides tools for scheduling and auto-publishing notes, generating AI-written content in your voice, automating engagement with trending posts, and tracking publication analytics — all from a single dashboard backed by a Chrome extension.
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
                            <li className="flex gap-3"><span className="text-gray-300">—</span><span>Use the Service for any illegal purpose or to violate any laws.</span></li>
                            <li className="flex gap-3"><span className="text-gray-300">—</span><span>Upload malicious code, viruses, or harmful software.</span></li>
                            <li className="flex gap-3"><span className="text-gray-300">—</span><span>Attempt to gain unauthorized access to our systems or other users' accounts.</span></li>
                            <li className="flex gap-3"><span className="text-gray-300">—</span><span>Interfere with or disrupt the integrity or performance of the Service.</span></li>
                            <li className="flex gap-3"><span className="text-gray-300">—</span><span>Resell, duplicate, or reproduce any part of the Service without express permission.</span></li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Data Rights & Ownership</h2>
                        <p className="text-gray-600 leading-relaxed">
                            You retain all rights to the data you send to Narrativee ("Customer Data"). By using the Service, you grant Narrativee a license to collect, host, store, and analyzing Customer Data solely for the purpose of providing and improving the Service. You represent and warrant that you have obtained all necessary consents from your end-users to share their data with Narrativee.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Intellectual Property</h2>
                        <p className="text-gray-600 leading-relaxed">
                            The Service, including its software, code, design, features, and documentation, is the exclusive property of Narrativee and its licensors. You may not copy, modify, distribute, sell, or lease any part of our software or included documentation, nor may you reverse engineer or attempt to extract the source code of that software.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Payment and Subscriptions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 border border-gray-100 rounded-lg">
                                <p className="text-gray-600">Subscriptions are billed in advance on a recurring basis.</p>
                            </div>
                            <div className="p-4 border border-gray-100 rounded-lg">
                                <p className="text-gray-600">Payments are processed securely via Stripe.</p>
                            </div>
                            <div className="p-4 border border-gray-100 rounded-lg">
                                <p className="text-gray-600">You may cancel your subscription at any time.</p>
                            </div>
                            <div className="p-4 border border-gray-100 rounded-lg">
                                <p className="text-gray-600">Refunds are handled on a case-by-case basis.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Service Availability</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We strive to maintain high availability of the Service but do not guarantee 100% uptime. We may momentarily suspend the Service for maintenance or upgrades. We are not liable for any disruptions or data loss resulting from such downtimes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Limitation of Liability</h2>
                        <p className="text-gray-600 leading-relaxed">
                            To the maximum extent permitted by law, Narrativee shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of the Service. Our total liability for any claim shall not exceed the amount paid by you to Narrativee in the 12 months preceding the claim.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Disclaimer</h2>
                        <p className="text-gray-600 leading-relaxed">
                            The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that the Service will meet your specific requirements or that its operation will be uninterrupted or error-free.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Termination</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We reserve the right to suspend or terminate your account if you violate these Terms or misuse the Service. You may terminate your account at any time via your account settings.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-black mb-4">Changes to Terms</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We may update these Terms from time to time. We will notify you of material changes via email or a notice within the Service. Your continued use of the Service after such changes constitutes your acceptance of the new Terms.
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
