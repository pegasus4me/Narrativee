"use client"
import Image from "next/image";
import logo from "../public/logo.png";
import FileUploadPrompt from "./components/FileUploadPrompt";
import { authClient } from "../lib/auth-client";
import { useMigrateReports } from "./hooks/useMigrateReports";
import { useRouter } from "next/navigation";
import Header from "./components/Header";
import BeforeAfterSlider from "./components/BeforeAfterSlider";
import PrimaryButton from "./components/PrimaryButton";
import workspace from "../public/workspace.png";
export default function Home() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { isMigrating, migratedCount } = useMigrateReports();

  return (
    <div className="min-h-screen bg-white overflow-x-hidden relative">
      {/* Background Stripes */}
      <div className="absolute top-0 left-0 w-full h-[580px] z-0 flex">
        <div className="h-full flex-1 bg-[#FF5C00]"></div>
        <div className="h-full flex-1 bg-[#FF7A00]"></div>
        <div className="h-full flex-1 bg-[#FF9900]"></div>
        <div className="h-full flex-1 bg-[#FFAD33]"></div>
        <div className="h-full flex-1 bg-[#FF9900]"></div>
        <div className="h-full flex-1 bg-[#FF7A00]"></div>
        <div className="h-full flex-1 bg-[#FF5C00]"></div>
        
      </div>

      <div className="relative z-10">
        <Header />

        {/* Hero Content */}
        <main className="max-w-7xl mx-auto px-4 md:px-8 pt-20 pb-32">
          <div className="flex flex-col items-center justify-center text-center">
            <h1 className="text-5xl md:text-6xl xl:text-[6rem] max-w-4xl font-semibold text-white " style={{ fontFamily: 'var(--font-urbanist)' }}>
              <span className="font-medium">turn your data into </span> <span className="font-medium" style={{ fontFamily: 'var(--font-petrona)' }}>narrative reports</span>
            </h1>
            <p className="text-white/90 text-xl md:text-2xl mt-6 max-w-2xl font-light" style={{ fontFamily: 'var(--font-urbanist)' }}>
              The AI-powered workspace that transforms your data into clear narrative reports so teams instantly understand what happened, why it matters, and what to do next.

            </p>

            <div className="mt-12 w-full max-w-xl rounded-lg p-2 ">
              <div className="flex items-center text-white mb-2 justify-center" >
                <p style={{ fontFamily: 'var(--font-urbanist)' }}>get started for free no account required</p>
              </div>
              <FileUploadPrompt />
            </div>
          </div>
          <div className="text-center text-xl font-medium text-gray-500 mt-5" style={{ fontFamily: 'var(--font-urbanist)' }}>
            <p>currently supporting</p>
            <div className="flex items-center justify-center gap-6 mt-4">
              <Image src='/excel.webp' alt="Excel" width={40} height={40} />
              <Image src='/powerbi.webp' alt="Power BI" width={60} height={40} />
              <Image src='/csv.png' alt="CSV" width={40} height={40} />
            </div>
          </div>
        </main>

      </div>

      <section className="py-16 md:py-24 bg-gradient-to-b from-[#FFF0E0] to-white max-w-[95%] mx-auto px-4 md:px-8 rounded-3xl">
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
