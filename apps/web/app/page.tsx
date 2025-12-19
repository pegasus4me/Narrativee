"use client"
import Image from "next/image";
import logo from "../public/logo.png";
import { authClient } from "../lib/auth-client";
import { useMigrateReports } from "./hooks/useMigrateReports";
import { useRouter } from "next/navigation";
import Header from "./components/Header";
import AnnouncementBar from "./components/announcementBar";
import FileUploadPrompt from "./components/FileUploadPrompt";
import workspace from "../public/workspace.png";
import before from "../public/before.png";
import after from "../public/after.png";
import BeforeAfterSlider from "./components/BeforeAfterSlider";
import user1 from "../public/1.png";
import user2 from "../public/2.png";
import user3 from "../public/3.png";
import { useGTMTracking } from "./hooks/useGTMTracking";
import { IoSparkles, IoDocumentText, IoChatbubbles, IoShareSocial, IoFlash, IoShieldCheckmark, IoTime } from "react-icons/io5";

export default function Home() {
  const router = useRouter();
  const { trackEvent } = useGTMTracking();
  const { data: session } = authClient.useSession();

  return (
    <div className="min-h-screen bg-white overflow-x-hidden relative">
      <div className="relative z-10 rounded-br-4xl rounded-bl-4xl mx-3">
        <Header />

        <main className="max-w-[90%] mx-auto px-4 md:px-8 pb-10">

          {/* Hero Section - Two Column Layout */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 mt-10 p- 4">

            {/* Left Column - Text & CTA */}
            <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">

              {/* Social Proof - Updated */}
              <div className="flex items-center gap-3 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex -space-x-3">
                  {[user1, user2, user3].map((img, i) => (
                    <div key={i} className="relative w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-sm">
                      <Image src={img} alt={`User ${i + 1}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col items-start">
                  <div className="flex gap-0.5 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm font-light text-gray-600">Join <span className="font-semibold text-gray-900">50+</span> early adopters</span>
                </div>
              </div>

              {/* Headline */}
              <h1 className="text-4xl md:text-5xl xl:text-8xl leading-[1.1] text-gray-900 tracking-tight font-medium" style={{ fontFamily: 'var(--font-urbanist)' }}>
                Make sense of your data in minutes
              </h1>

              {/* Description */}
              <p className="text-black text-lg md:text-xl mt-6 max-w-lg font-light" style={{ fontFamily: 'var(--font-urbanist)' }}>
                Stop staring at spreadsheets. Upload your data and get a clear narrative you can actually read, chat with, and share.
              </p>

              {/* CTA Section */}
              <div className="mt-8 w-full max-w-md">
                {/* Animated CTA Button */}
                <div className="mb-4 flex justify-center lg:justify-start">
                  <button
                    onClick={() => document.getElementById('file-upload-area')?.scrollIntoView({ behavior: 'smooth' })}
                    className="group relative px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-semibold rounded-2xl shadow-lg shadow-amber-200/50 hover:shadow-xl hover:shadow-amber-300/50 transition-all duration-300 hover:scale-105 overflow-hidden"
                    style={{ fontFamily: 'var(--font-urbanist)' }}
                  >
                    <span className="relative z-10 flex items-center gap-2 text-lg">
                      <IoSparkles className="animate-pulse" size={20} />
                      Get started -<span className="font-light"> No Sign Up Required</span>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-300 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>
                </div>

                {/* Trust badges */}
                <p style={{ fontFamily: 'var(--font-urbanist)' }} className="text-xs font-light text-gray-400 tracking-wider text-center lg:text-left">
                  INSTANT START • NO ACCOUNT REQUIRED • <span onClick={() => {
                    trackEvent({ eventName: 'click_privacy_terms' });
                    window.open("https://narrativee.com/privacy", "_blank");
                  }} className="text-black cursor-pointer hover:underline">PRIVACY TERMS</span>
                </p>
              </div>
            </div>

            {/* Right Column - Before/After Slider */}
            <div
              className="flex-1 w-full max-w-3xl lg:max-w-none p-6 rounded-2xl"
              style={{
                backgroundImage: 'url(/wallapaper.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <BeforeAfterSlider
                className="rounded-xs"
                beforeImage={before}
                afterImage={workspace}
              />
            </div>

          </div>

          {/* File Upload Area - Below Hero */}
          <div id="file-upload-area" className="mt-16 max-w-2xl mx-auto">
            <FileUploadPrompt />
          </div>

        </main>
      </div>

      {/* Problem Section */}
      <section className="py-20 px-4 md:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-amber-500 font-semibold text-sm uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-urbanist)' }}>The Problem</p>
          <h2 className="text-3xl md:text-5xl font-medium text-gray-900 mb-6 tracking-tight" style={{ fontFamily: 'var(--font-urbanist)' }}>
            You have the data. <br />
            <span className="text-gray-800 font-light">But staring at rows won't give you answers.</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light" style={{ fontFamily: 'var(--font-urbanist)' }}>
            Whether it's survey results, sales figures, or research data, making sense of it takes hours. Writing it up? Even longer. And by the time you're done, you've lost the insight.
          </p>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 px-4 md:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-amber-500 font-semibold text-sm uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-urbanist)' }}>The Solution</p>
          <h2 className="text-3xl md:text-5xl font-medium text-gray-900 mb-6 tracking-tight" style={{ fontFamily: 'var(--font-urbanist)' }}>
            Upload. <span className="text-amber-500">Understand.</span> Share.
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light mb-12" style={{ fontFamily: 'var(--font-urbanist)' }}>
            Narrativee reads your spreadsheet and writes a clear, human-readable report in seconds. No formulas. No pivot tables. Just insights.
          </p>

          {/* How It Works - 3 Steps */}
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Image src="/csv.png" alt="CSV" width={48} height={48} className="object-contain" />
                <Image src="/excel.webp" alt="Excel" width={48} height={48} className="object-contain" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-urbanist)' }}>1. Upload</h3>
              <p className="text-gray-500 font-light">Drag your CSV or Excel file. That's it.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <IoSparkles className="text-amber-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-urbanist)' }}>2. Understand</h3>
              <p className="text-gray-500 font-light">Get a narrative report with key findings highlighted.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <IoShareSocial className="text-amber-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-urbanist)' }}>3. Share</h3>
              <p className="text-gray-500 font-light">Export or share a beautiful link with anyone.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 md:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-500 font-semibold text-sm uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-urbanist)' }}>Benefits</p>
            <h2 className="text-3xl md:text-5xl font-medium text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-urbanist)' }}>
              Why people love Narrativee
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4 p-6 rounded-2xl hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <IoTime className="text-green-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-urbanist)' }}>Save Hours Every Week</h3>
                <p className="text-gray-500 font-light">Stop manually writing reports. Let AI do the heavy lifting while you focus on decisions.</p>
              </div>
            </div>
            <div className="flex gap-4 p-6 rounded-2xl hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <IoChatbubbles className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-urbanist)' }}>Chat With Your Data</h3>
                <p className="text-gray-500 font-light">Ask questions, get answers. No SQL, no formulas, just conversation.</p>
              </div>
            </div>
            <div className="flex gap-4 p-6 rounded-2xl hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <IoShieldCheckmark className="text-purple-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-urbanist)' }}>Your Data Stays Private</h3>
                <p className="text-gray-500 font-light">We don't store your data after processing. Period.</p>
              </div>
            </div>
            <div className="flex gap-4 p-6 rounded-2xl hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <IoFlash className="text-amber-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-urbanist)' }}>Instant Results</h3>
                <p className="text-gray-500 font-light">From upload to insight in under 60 seconds. No waiting, no loading bars.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-20 px-4 md:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-amber-500 font-semibold text-sm uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-urbanist)' }}>Built For</p>
          <h2 className="text-3xl md:text-5xl font-medium text-gray-900 mb-12 tracking-tight" style={{ fontFamily: 'var(--font-urbanist)' }}>
            People who hate writing reports
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <p className="text-2xl mb-3">📊</p>
              <h3 className="font-semibold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-urbanist)' }}>Researchers</h3>
              <p className="text-sm text-gray-500">Analyzing survey data, thesis results, or study outcomes.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <p className="text-2xl mb-3">💼</p>
              <h3 className="font-semibold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-urbanist)' }}>Consultants</h3>
              <p className="text-sm text-gray-500">Preparing client decks and performance summaries.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <p className="text-2xl mb-3">📈</p>
              <h3 className="font-semibold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-urbanist)' }}>Marketers</h3>
              <p className="text-sm text-gray-500">Summarizing campaign results and ROI reports.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-4 md:px-8 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-medium text-gray-900 mb-6 tracking-tight" style={{ fontFamily: 'var(--font-urbanist)' }}>
            Ready to stop staring at spreadsheets?
          </h2>
          <p className="text-lg text-gray-600 mb-8 font-light" style={{ fontFamily: 'var(--font-urbanist)' }}>
            Upload your first file and see the magic. No account needed.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-10 py-5 bg-amber-400 text-white font-semibold rounded-2xl shadow-lg hover:bg-gray-900 transition-all duration-300 hover:scale-105 text-lg"
            style={{ fontFamily: 'var(--font-urbanist)' }}
          >
            Get Started Free →
          </button>
        </div>
      </section>

      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <Image src={logo} alt="Narrativee Logo" width={100} />
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <a href="/privacy" className="hover:text-black transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-black transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}