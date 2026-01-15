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
import { EngagementScoreChart } from "./components/landing/EngagementScoreChart";
import { TriggerIllustration } from "./components/landing/TriggerIllustration";
import { ConvertIllustration } from "./components/landing/ConvertIllustration";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const { trackEvent } = useGTMTracking();
  const { data: session } = authClient.useSession();
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showBetaPopup, setShowBetaPopup] = useState(false);

  return (
    <div className="min-h-screen max-w-7xl mx-auto">
      <div className="">
        <Header onBetaSignup={() => setShowBetaPopup(true)} />

        {/* Hero Section */}
        <main className="">
          <div className="flex flex-col lg:flex-row lg:items-stretch items-center lg:gap-0 gap-12">

            {/* Text Content */}
            <div className="flex-1 text-center p-6 lg:py-20 lg:px-12">

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-gray-900 font-urbanist mb-6">
                Make your free trials convert more, without guessing who will pay 
              </h1>

              <p className="text-xl text-gray-500 font-urbanist leading-relaxed mb-8 max-w-2xl mx-auto">
                Scores your trial users in real time based on your rules, and nudges them exactly when they're ready to convert — setup in 5 minutes.
              </p>

              <div className="flex justify-center">
                <PrimaryButton
                  onClick={() => setShowBetaPopup(true)}
                >
                  Start Converting Trials — <span className="text-white/70">it's free</span>
                </PrimaryButton>
              </div>
            </div>
          </div>
        </main>

        {/* Product Dashboard Section */}
        <section>
          <div>
            <div className="">
              <Image
                src="/app.png"
                alt="Narrativee Dashboard"
                width={1220}
                height={680}
                className="rounded-sm border border-neutral-200"
                priority
              />
            </div>
          </div>
        </section>

        {/* Problem Section - Before/After */}
        <section id="problem" className="border-b border-neutral-200 py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-primary font-manrope font-semibold text-sm uppercase tracking-wider mb-4 block">
                The Problem
              </span>
              <h2 className="text-4xl md:text-5xl font-medium font-urbanist text-gray-900 mb-6">
                Trial users are slipping through the cracks
              </h2>
            </div>

            {/* Before/After Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* BEFORE Column */}
              <div className="bg-red-50/50 border border-red-100 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <X className="text-red-500" size={20} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 font-manrope">Before Narrativee</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5 shrink-0">
                      <span className="text-red-500 text-xs">✗</span>
                    </div>
                    <p className="text-gray-600 font-manrope">You don't know which trial users are ready to buy</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5 shrink-0">
                      <span className="text-red-500 text-xs">✗</span>
                    </div>
                    <p className="text-gray-600 font-manrope">You send the same generic "upgrade now" email to everyone</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5 shrink-0">
                      <span className="text-red-500 text-xs">✗</span>
                    </div>
                    <p className="text-gray-600 font-manrope">You reach out too late—or too early—and lose the sale</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5 shrink-0">
                      <span className="text-red-500 text-xs">✗</span>
                    </div>
                    <p className="text-gray-600 font-manrope">High-intent users churn before you even notice them</p>
                  </li>
                </ul>
              </div>

              {/* AFTER Column */}
              <div className="bg-green-50/50 border border-green-100 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Zap className="text-green-600" size={20} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 font-manrope">After Narrativee</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5 shrink-0">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <p className="text-gray-600 font-manrope">Engagement scores rank every user by purchase intent</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5 shrink-0">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <p className="text-gray-600 font-manrope">Trigger personalized upgrade nudges at the perfect moment</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5 shrink-0">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <p className="text-gray-600 font-manrope">Convert trials while they're still excited about your product</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5 shrink-0">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <p className="text-gray-600 font-manrope">Turn guesswork into a data-driven conversion system</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        {/* How It Works Section */}
        <section id="solution" className="border-b border-neutral-200 py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-primary font-manrope font-semibold text-sm uppercase tracking-wider mb-4 block">
                How It Works
              </span>
              <h2 className="text-4xl md:text-5xl font-medium font-urbanist text-gray-900 mb-4">
                Start converting more trials in 4 simple steps
              </h2>
            </div>

            {/* Bento Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Step 1: Connect - Full width */}
              <div className="md:col-span-2 border border-neutral-200 rounded-xl hover:border-primary/30 transition-colors overflow-hidden flex flex-col md:flex-row">
                <div className="bg-gray-50 p-6 md:w-1/2 flex items-center justify-center">
                  <Image
                    src="/carbon-5.png"
                    alt="SDK Code Example"
                    width={600}
                    height={340}
                    className="rounded-lg w-full"
                  />
                </div>
                <div className="p-6 md:w-1/2 flex flex-col justify-center">
                  <div className="flex gap-4 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center shrink-0 font-manrope font-bold">
                      1
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 font-manrope">Install in 2 minutes</h3>
                  </div>
                  <p className="text-gray-500 font-manrope leading-relaxed">
                    Drop in our SDK with 3 lines of code. Auto-identifies users and tracks every action without slowing down your app.
                  </p>
                </div>
              </div>

              {/* Step 2: Score - Left column, spans 2 rows */}
              <div className="md:row-span-2 border border-neutral-200 rounded-xl hover:border-primary/30 transition-colors overflow-hidden flex flex-col">
                <div className="bg-gray-50 p-4 flex-1 flex items-center justify-center">
                  <Image
                    src="/create_events.png"
                    alt="Scoring Rules Interface"
                    width={500}
                    height={700}
                    className="rounded-lg w-full"
                  />
                </div>
                <div className="p-5">
                  <div className="flex gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shrink-0 font-manrope font-bold text-sm">
                      2
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 font-manrope">Define your scoring rules</h3>
                  </div>
                  <p className="text-gray-500 text-sm font-manrope leading-relaxed">
                    Assign points to actions that matter: feature usage, page visits, clicks. High score = high intent.
                  </p>
                </div>
              </div>

              {/* Step 3: Trigger - Right top */}
              <div className="border border-neutral-200 rounded-xl hover:border-primary/30 transition-colors overflow-hidden flex flex-col">
                <div className="bg-gray-50 p-4 flex-1 flex items-center justify-center">
                  <Image
                    src="/Workflow.png"
                    alt="Visual Workflow Builder"
                    width={600}
                    height={400}
                    className="rounded-lg w-full"
                  />
                </div>
                <div className="p-5">
                  <div className="flex gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shrink-0 font-manrope font-bold text-sm">
                      3
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 font-manrope">Build your automation</h3>
                  </div>
                  <p className="text-gray-500 text-sm font-manrope leading-relaxed">
                    Set up workflows visually: when a user hits your score threshold, trigger popups, emails, or webhooks automatically.
                  </p>
                </div>
              </div>

              {/* Step 4: Convert - Right bottom */}
              <div className="border border-neutral-200 rounded-xl hover:border-primary/30 transition-colors overflow-hidden flex flex-col">
                <div className="bg-gray-50 p-6 flex-1 flex items-center justify-center">
                  <ConvertIllustration />
                </div>
                <div className="p-5">
                  <div className="flex gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shrink-0 font-manrope font-bold text-sm">
                      4
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 font-manrope">Watch conversions grow</h3>
                  </div>
                  <p className="text-gray-500 text-sm font-manrope leading-relaxed">
                    Real-time analytics show exactly which nudges convert and how much revenue they drive.
                  </p>
                </div>
              </div>
            </div>


            {/* GitHub Link */}
            <div className="text-center mt-10">
              <a
                href="https://github.com/NarrativeeApp/Narrativee-SDK"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                Open Source SDK — Star us on GitHub
              </a>
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <ComparisonTable />

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
                Start Converting Trials — it's free
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
        {
          showVideoModal && (
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
          )
        }

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