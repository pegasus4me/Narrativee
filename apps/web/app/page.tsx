"use client"
import Image from "next/image";
import logo from "../public/logo.png";
import { authClient } from "../lib/auth-client";
import { useMigrateReports } from "./hooks/useMigrateReports";
import { useRouter } from "next/navigation";
import Header from "./components/Header";
import BeforeAfterSlider from "./components/BeforeAfterSlider";
import PrimaryButton from "./components/PrimaryButton";
import workspace from "../public/workspace.png";
import FileUploadPrompt from "./components/FileUploadPrompt";
import AnnouncementBar from "./components/announcementBar";
export default function Home() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { isMigrating, migratedCount } = useMigrateReports();

  return (
    <div className="min-h-screen bg-[#FBFBFB] overflow-x-hidden relative"

    >
      <div className="relative z-10 rounded-br-4xl rounded-bl-4xl mb-3 mx-3"
        style={{
          background: "radial-gradient(at 53% 78%, rgba(255, 196, 0, 0.12) 0px, transparent 50%), radial-gradient(at 71% 91%, rgba(255, 156, 26, 0.37) 0px, transparent 50%), radial-gradient(at 31% 91%, rgba(255, 225, 0, 0.17) 0px, transparent 50%)"
        }}
      >
        <Header />
        {/* Hero Content */}
        <main className="max-w-7xl mx-auto px-4 md:px-8 pt-20 pb-32">
          <AnnouncementBar />
          <div className="flex flex-col items-center justify-center text-center">
            <h1 className="text-5xl md:text-6xl xl:text-[5.5rem] leading-[1.1] max-w-5xl text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-urbanist)' }}>
              <span className="font-semibold text-slate-950/50">Turn your <span className="font-semibold text-gray-800">data</span> into</span> <br />
              <span className="font-normal italic text-gray-800 text-amber-500">narrative</span> <span className="font-normal text-gray-800" style={{ fontFamily: 'var(--font-petrona)' }}>reports</span>
            </h1>
            <p className=" text-slate-950/50 text-xl md:text-2xl mt-8 max-w-xl font-medium" style={{ fontFamily: 'var(--font-urbanist)' }}>
              Upload your data. Get a comprehensive analysis you can chat with and share—in minutes
            </p>
          </div>
          <div className="text-center mt-16  max-w-2xl mx-auto">
            <p style={{ fontFamily: 'var(--font-urbanist)' }} className="text-xs font-medium text-gray-400 tracking-wider mb-3">Get started (no account required) • See our <a href="/privacy" className="font-semibold text-gray-800  hover:text-gray-600 transition-colors">privacy terms</a></p>
            <FileUploadPrompt />
          </div>


          <div className="text-center mt-6 pt-2  max-w-lg mx-auto">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">currently supporting</p>
            <div className="flex items-center justify-center gap-10 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
              <Image src='/excel.webp' alt="Excel" width={32} height={32} />
              <Image src='/powerbi.webp' alt="Power BI" width={48} height={32} />
              <Image src='/csv.png' alt="CSV" width={32} height={32} />
            </div>
          </div>
        </main>
      </div>

      <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white max-w-[95%] mx-auto px-4 md:px-8 rounded-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-6xl font-medium text-black mb-4 tracking-tight" style={{ fontFamily: 'var(--font-urbanist)' }}>
            A workspace designed for simplicity and collaboration
          </h2>
        </div>
        <div>
          <Image
            src={workspace}
            alt="Narrativee Workspace"
            width={2000}
            height={2000}
            className="w-full h-auto object-cover rounded-2xl border"
          />
        </div>
      </section>

      {/* Final CTA */}
      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <Image src={logo} alt="Narrativee Logo" width={100} />
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <a href="/privacy" className="hover:text-black transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-black transition-colors">Terms</a>
            <a href="mailto:contact@narrativee.com" className="hover:text-black transition-colors">Contact</a>
            <a
              href="https://x.com/narrativee_io"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black transition-colors"
            >
              Twitter
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
