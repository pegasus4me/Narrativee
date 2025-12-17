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
export default function Home() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  return (
    <div className="min-h-screen bg-white overflow-x-hidden relative">
      <div className="relative z-10 rounded-br-4xl rounded-bl-4xl 
       mx-3">
        <Header />

        <main className="max-w-7xl mx-auto px-4 md:px-8 pt-20 pb-32">

          <div className="flex flex-col items-center justify-center text-center">

            {/* Social Proof */}
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
                <span className="text-sm font-light text-gray-600">Used by <span className="font-medium text-gray-900 font-semibold">100+</span> happy customers</span>
              </div>
            </div>

            {/* Nouveau Titre : Plus universel et orienté bénéfice immédiat */}
            <h1 className="text-4xl md:text-6xl xl:text-[6.5rem] leading-[1.1] max-w-5xl text-gray-900 tracking-tight font-medium" style={{ fontFamily: 'var(--font-urbanist)' }}>
              Make sense of your data in minutes
            </h1>

            {/* Nouvelle Description : On enlève le mot "Comprehensive Analysis" qui fait trop lourd */}
            <p className="text-black text-xl md:text-2xl mt-8 max-w-2xl font-light" style={{ fontFamily: 'var(--font-urbanist)' }}>
              Stop staring at spreadsheets. Paste your data and get a clear narrative you can actually read, chat with, and share.
            </p>
          </div>

          <div className="text-center mt-16 max-w-2xl mx-auto">
            {/* On insiste sur la vie privée (Cheval de Troie) */}
            <p style={{ fontFamily: 'var(--font-urbanist)' }} className="text-xs font-light text-gray-400 tracking-wider">
              INSTANT START • NO ACCOUNT REQUIRED • YOUR DATA STAYS PRIVATE • <span onClick={() => window.open("https://narrativee.com/privacy", "_blank")} className="text-black cursor-pointer hover:underline">PRIVACY TERMS</span>
            </p>
            <FileUploadPrompt />
          </div>

        </main>
      </div>

      <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white max-w-[95%] mx-auto px-4 md:px-8 rounded-3xl">
        <div className="text-center mb-12">
          {/* Nouveau titre de section : On vend la clarté, pas l'espace de travail */}
          <h2 className="text-3xl md:text-6xl font-medium text-black mb-4 tracking-tight" style={{ fontFamily: 'var(--font-urbanist)' }}>
            From messy rows to clear insights.
          </h2>
          <p className="text-black max-w-xl mx-auto text-lg font-light">Whether it&apos;s a budget, a project tracker, or sales data, Narrativee tells you what matters so you can move on.</p>
        </div>
        <div>
          <BeforeAfterSlider
            beforeImage={before}
            afterImage={workspace}
          />
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