"use client"
import Image from "next/image";
import { Button } from "@repo/ui/button";
import logo from "../public/logo.png";
import FileUploadPrompt from "./components/FileUploadPrompt";
import { useEffect, useState } from "react";
import { authClient } from "../lib/auth-client";
import { useMigrateReports } from "./hooks/useMigrateReports";
import template from "../public/example.png"
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "./components/Header";
export default function Home() {
  const router = useRouter();
  const words = ["csv", "sheet", "excel"];
  const words2 = ["narrative", "interactive"];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentIndex2, setCurrentIndex2] = useState(0);
  const { data: session } = authClient.useSession();

  // Auto-migrate localStorage reports when user logs in
  const { isMigrating, migratedCount } = useMigrateReports();
  console.log('dddd', session)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [words.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex2((prev) => (prev + 1) % words2.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [words2.length]);

  return (
    <div className="to-gray-50 overflow-x-hidden">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <main className="p-4 md:p-5 mt-5 max-w-[95%] md:max-w-[90%] mx-auto">
        <div className="text-center mb-8 md:mb-12 p-2">
          <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold text-gray-900 mb-4 max-w-5xl mx-auto leading-tight" style={{ fontFamily: 'var(--font-petrona)' }}>
            Turn your <span className="inline-block text-center px-2 rounded-md bg-amber-400 text-white transform -rotate-2 my-2 md:my-0" style={{ minWidth: 'auto', width: 'auto', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>
              <span
                key={currentIndex}
                className="inline-block px-2 border border-amber-500/20
        shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-2px_0_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.05)]
        active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]
        active:translate-y-[1px]"
                style={{
                  animation: 'fadeIn 0.5s ease-in-out'
                }}
              >
                {words[currentIndex]}
              </span>
            </span> <br className="md:hidden" /> Data into <span style={{ fontFamily: 'var(--font-petrona)' }}>
              <span
                key={currentIndex2}
                className="inline-block"
                style={{
                  animation: 'fadeIn 0.5s ease-in-out'
                }}
              >
                {words2[currentIndex2]}
              </span>
            </span> reports
          </h1>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto px-4" style={{ fontFamily: 'var(--font-noto)' }}>
            Transform your data into interactive and editable reports. Upload your files, describe your goal, and get polished charts, insights, and a compelling storyline—in minutes.
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center p-2 md:p-6 flex-col">
          <p className="font-normal text-slate-700 p-2 text-base md:text-lg leading-relaxed text-center" style={{ fontFamily: 'var(--font-petrona)' }}>Get started — no account needed</p>
          <div className="w-full max-w-md md:max-w-xl">
            <FileUploadPrompt />
          </div>
        </div>
      </main>

      {/* Template Preview Section */}
      <section className="mx-auto my-10 md:my-16 p-2">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-petrona)' }}>
            Create, Edit and Publish
          </h2>
          <p className="text-base md:text-lg text-gray-600 mx-auto px-4">
            Interactive reports with charts, insights, and professional formatting
          </p>
        </div>
        <div className="flex justify-center">
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 max-w-[80%] md:max-w-[80%] shadow-xs [mask-image:linear-gradient(to_bottom,black_85%,transparent)]">
            <video
              src="/presentation.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-[90%] mx-auto py-8 md:py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center">
            <Image src={logo} alt="Narrativee Logo" width={120} />
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <a href="mailto:contact@narrativee.com" className="text-gray-600 hover:text-amber-600 transition-colors text-sm font-medium">
              contact@narrativee.com
            </a>
            <a
              href="https://x.com/narrativee_io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-black transition-colors"
              aria-label="Follow us on X"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>


    </div>
  );
}
