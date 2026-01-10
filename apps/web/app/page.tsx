"use client"
import Image from "next/image";
import logo from "../public/logo.png";
import { authClient } from "../lib/auth-client";
import { useRouter } from "next/navigation";
import Header from "./components/commons/Header";
import Footer from "./components/commons/Footer";

import { useGTMTracking } from "./hooks/useGTMTracking";
import PrimaryButton from "./components/commons/PrimaryButton";
import { Target, TrendingUp, Zap, Users, BarChart3, Bell, ArrowRight, X, Play } from "lucide-react";
import { ROICalculator } from "./components/pricing/ROICalculator";
import { HeaderROICalculator } from "./components/pricing/HeaderROICalculator";
import { ComparisonTable } from "./components/landing/ComparisonTable";
import BetaSignupPopup from "./components/commons/BetaSignupPopup";
import CenterBetaModal from "./components/commons/CenterBetaModal";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const { trackEvent } = useGTMTracking();
  const { data: session } = authClient.useSession();
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showBetaPopup, setShowBetaPopup] = useState(false);

  return (
    <div className="min-h-screen max-w-7xl mx-auto border border-neutral-200 mx-auto">
      <div className="">
        <Header onBetaSignup={() => setShowBetaPopup(true)} />
        <HeaderROICalculator />

        {/* Hero Section */}
        <main className=" border-b border-t border-neutral-200 ">
          <div className="flex flex-col lg:flex-row lg:items-stretch items-center lg:gap-0 gap-12">

            {/* Text Content */}
            <div className="flex-1 text-center p-6 lg:py-20 lg:px-12">

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-gray-900 font-urbanist mb-6">
                Don't let high-intent trials slip away.<br />
                <span className="text-tertiary ">Turn them into paying customers.</span>
              </h1>

              <p className="text-xl text-gray-500 font-urbanist leading-relaxed mb-8 max-w-2xl mx-auto">
                Track your trial users' behavior, score their intent, and show them tailored targeted nudges at the right moment.
              </p>

              <div className="flex justify-center">
                <PrimaryButton
                  onClick={() => setShowBetaPopup(true)}
                >
                  Join Beta Program — <span className="text-white/70">it's free</span>
                </PrimaryButton>
              </div>
            </div>
          </div>
        </main>

        {/* Demo Video Section */}
        <section className="border-b border-neutral-200 bg-gray-50">
          <div className="w-full">
            <div className="relative aspect-video overflow-hidden w-full">
              <iframe
                src="https://www.loom.com/embed/be00088402064ee2a68080f00c89904e"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section id="problem" className="border-b border-neutral-200 py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <span className="text-primary font-manrope font-semibold text-sm uppercase tracking-wider mb-4 block">
              The Problem
            </span>
            <h2 className="text-4xl md:text-5xl font-medium font-urbanist text-gray-900 mb-6">
              You're flying blind during the most critical 14 days.
            </h2>
            <p className="text-xl text-gray-500 font-urbanist leading-relaxed max-w-3xl mx-auto mb-12">
              Every trial user starts with intent. Some explore once and ghost. Some binge your features at 2am. Some hover on your pricing page but never click. You're treating them all the same—and losing thousands every month.
            </p>

            {/* Problem Cards */}
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="border border-neutral-200 rounded-lg p-6">
                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mb-4">
                  <Users className="text-red-500" size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 font-manrope mb-2">No visibility</h3>
                <p className="text-gray-500 text-sm font-manrope">
                  You don't know who's exploring vs. who's stuck at the paywall.
                </p>
              </div>
              <div className="border border-neutral-200 rounded-lg p-6">
                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="text-orange-500" size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 font-manrope mb-2">Generic messaging</h3>
                <p className="text-gray-500 text-sm font-manrope">
                  Same emails, same popups for everyone. Low engagement, low conversions.
                </p>
              </div>
              <div className="border border-neutral-200 rounded-lg p-6">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <Bell className="text-gray-500" size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 font-manrope mb-2">Missed timing</h3>
                <p className="text-gray-500 text-sm font-manrope">
                  By the time you reach out, they've already churned.
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* Comparison Section */}
        <ComparisonTable />
        {/* Solution Section */}
        <section id="solution" className="border-b border-neutral-200 py-24 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <span className="text-primary font-manrope font-semibold text-sm uppercase tracking-wider mb-4 block">
                How It Works
              </span>
              <h2 className="text-4xl md:text-5xl font-medium font-urbanist text-gray-900 mb-6">
                Know exactly when a trial user is ready to upgrade —<br />
                <span className="text-primary">and what to show them.</span>
              </h2>
              <p className="text-xl text-gray-500 font-urbanist leading-relaxed max-w-3xl mx-auto mb-6">
                Narrativee tracks user behavior, calculates engagement scores, and triggers personalized nudges at the perfect moment.
              </p>
              <a
                href="https://github.com/NarrativeeApp/Narrativee-SDK"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                Open Source SDK — Star us on GitHub
              </a>
            </div>

            {/* Step 1: Track */}
            <div className="flex flex-col md:flex-row items-center gap-16 mb-24">
              <div className="flex-1 space-y-6">
                <h3 className="text-3xl font-manrope text-gray-900">Track Engagement</h3>
                <p className="text-lg text-gray-600 font-manrope leading-relaxed">
                  Install our lightweight SDK in minutes. It automatically identifies users and tracks their journey from trial sign-up to their "Aha!" moment.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-gray-600 font-medium">
                    <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-primary">✓</div>
                    Single line initialization
                  </li>
                  <li className="flex items-center gap-3 text-gray-600 font-medium">
                    <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-primary">✓</div>
                    Auto-capture user traits
                  </li>
                </ul>
              </div>
              <div className="flex-1 relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-3xl blur-2xl opacity-50"></div>
                <Image
                  src="/carbon-3.png"
                  alt="SDK Initialization Code"
                  width={600}
                  height={400}
                  className="relative rounded-xl shadow-2xl border border-gray-200/50"
                />
              </div>
            </div>

            {/* Step 2: Trigger */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-16 mb-24">
              <div className="flex-1 space-y-6">
                <h3 className="text-3xl font-manrope text-gray-900">Trigger Moments</h3>
                <p className="text-lg text-gray-600 font-manrope leading-relaxed">
                  Don't just watch, act. Pass custom events and metadata to Narrativee. We use this data to power your workflows.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-gray-600 font-medium">
                    <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-primary">✓</div>
                    Track any custom event
                  </li>
                  <li className="flex items-center gap-3 text-gray-600 font-medium">
                    <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-primary">✓</div>
                    Pass rich metadata for segmentation
                  </li>
                </ul>
              </div>
              <div className="flex-1 relative">
                <div className="absolute -inset-4 bg-gradient-to-l from-indigo-500/20 to-primary/20 rounded-3xl blur-2xl opacity-50"></div>
                <Image
                  src="/carbon-5.png"
                  alt="SDK Event Tracking Code"
                  width={600}
                  height={400}
                  className="relative rounded-xl shadow-2xl border border-gray-200/50"
                />
              </div>
            </div>

            {/* Step 3: Render (React Component) */}
            <div className="flex flex-col md:flex-row items-center gap-16 ">
              <div className="flex-1 space-y-6">
                <h3 className="text-3xl font-manrope text-gray-900">Render Anywhere</h3>
                <p className="text-lg text-gray-600 font-manrope leading-relaxed">
                  The SDK handles the logic, you handle the UI. Use our <code className="text-primary font-geist-mono bg-primary/5 px-2 py-1 rounded">NarrativeeTrigger</code> component to conditionally render popups, banners, or any React component when a workflow fires.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-gray-600 font-medium">
                    <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-primary">✓</div>
                    Fully type-safe
                  </li>
                  <li className="flex items-center gap-3 text-gray-600 font-medium">
                    <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-primary">✓</div>
                    Works with your existing components
                  </li>
                </ul>
              </div>
              <div className="flex-1 relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-3xl blur-2xl opacity-50"></div>
                {/* Code Block since we don't have an image yet */}
                <Image
                  src="/component.png"
                  alt="SDK Render Component"
                  width={600}
                  height={400}
                  className="relative rounded-xl shadow-2xl border border-gray-200/50"
                />
              </div>
            </div>

            {/* Step 4: Dashboard Result */}
            <div className="mt-32 text-center">
              <div className="mb-12">
                <h3 className="text-3xl font-manrope text-gray-900 mb-4">Track perfomances in your portail</h3>
                <p className="text-xl text-gray-500 font-urbanist">
                  Watch your dashboard light up with real-time user insights and revenue attribution.
                </p>
              </div>

              <div className="relative w-full  mx-auto">
                <Image
                  src="/app.png"
                  alt="Narrativee Dashboard"
                  width={1200}
                  height={800}
                  className="relative border"
                  priority
                />
              </div>
            </div>

          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-b border-neutral-200 py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-primary font-manrope font-semibold text-sm uppercase tracking-wider mb-4 block">
                Features
              </span>
              <h2 className="text-4xl md:text-5xl font-medium font-urbanist text-gray-900 mb-6">
                Everything you need to convert trials
              </h2>
            </div>

            {/* Feature Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Feature 1 */}
              <div className="flex gap-5 p-6 border border-neutral-200 rounded-xl hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0">
                  <BarChart3 className="text-primary" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 font-manrope mb-2">Engagement Scoring</h3>
                  <p className="text-gray-500 text-sm font-manrope leading-relaxed">
                    Assign points to user actions. See at a glance who's hot and who's cold.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex gap-5 p-6 border border-neutral-200 rounded-xl hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0">
                  <Zap className="text-primary" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 font-manrope mb-2">Visual Workflows</h3>
                  <p className="text-gray-500 text-sm font-manrope leading-relaxed">
                    Drag-and-drop workflow builder. No code required. Trigger popups, emails, or webhooks.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex gap-5 p-6 border border-neutral-200 rounded-xl hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0">
                  <Target className="text-primary" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 font-manrope mb-2">Smart Popups</h3>
                  <p className="text-gray-500 text-sm font-manrope leading-relaxed">
                    Show the right message at the right time. Personalized CTAs that convert.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex gap-5 p-6 border border-neutral-200 rounded-xl hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0">
                  <TrendingUp className="text-primary" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 font-manrope mb-2">Conversion Analytics</h3>
                  <p className="text-gray-500 text-sm font-manrope leading-relaxed">
                    Track popup clicks, conversion rates, and ROI. Know exactly what's working.
                  </p>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="flex gap-5 p-6 border border-neutral-200 rounded-xl hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0">
                  <Users className="text-primary" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 font-manrope mb-2">User Profiles</h3>
                  <p className="text-gray-500 text-sm font-manrope leading-relaxed">
                    See every user's journey: events, scores, plan, and metadata in one place.
                  </p>
                </div>
              </div>

              {/* Feature 6 */}
              <div className="flex gap-5 p-6 border border-neutral-200 rounded-xl hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0">
                  <Bell className="text-primary" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 font-manrope mb-2">Lightweight SDK</h3>
                  <p className="text-gray-500 text-sm font-manrope leading-relaxed">
                    2-minute integration. Works with React, Next.js, and vanilla JS. No performance hit.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* CTA Section */}
        <section className="py-20 px-6 bg-tertiary text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-medium font-urbanist mb-6">
              Ready to convert more trials?
            </h2>
            <p className="text-xl text-white/70 font-urbanist mb-8">
              Start identifying your highest-intent trial users today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PrimaryButton
                onClick={() => setShowBetaPopup(true)}
                className="text-tertiary font-bold py-4 px-8 rounded-xl hover:bg-gray-100 transition-colors inline-flex items-center justify-center gap-2"
              >
                Join Beta Program — it's free
                <ArrowRight size={18} />
              </PrimaryButton>
              <button
                onClick={() => router.push('/pricing')}
                className="border border-white/30 text-white font-semibold py-4 px-8 rounded-xl hover:bg-white/10 transition-colors"
              >
                View Pricing
              </button>
            </div>
          </div>
        </section>


        {/* Video Demo Modal */}
        {showVideoModal && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowVideoModal(false)}
          >
            <div
              className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowVideoModal(false)}
                className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors"
              >
                <X size={28} />
              </button>
              <iframe
                src="https://www.loom.com/embed/be00088402064ee2a68080f00c89904e?autoplay=1"
                frameBorder="0"
                allowFullScreen
                className="w-full h-full"
                allow="autoplay"
              />
            </div>
          </div>
        )}

        {/* Beta Signup Popups */}
        <BetaSignupPopup />
        <CenterBetaModal
          isOpen={showBetaPopup}
          onClose={() => setShowBetaPopup(false)}
        />

        <Footer />

      </div>
    </div>
  );
}