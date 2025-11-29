"use client"
import Image from "next/image";
import { Button } from "@repo/ui/button";
import logo from "../public/logo.png";
import FileUploadPrompt from "./components/FileUploadPrompt";
import { useEffect, useState } from "react";
import { authClient } from "../lib/auth-client";
import { useMigrateReports } from "./hooks/useMigrateReports";
import template from "../public/example.png"
import ProfileMenu from "./components/ProfileMenu";
export default function Home() {
  const words = ["csv", "sheet", "excel"];
  const words2 = ["narrative", "interactive"];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentIndex2, setCurrentIndex2] = useState(0);
  const { data: session } = authClient.useSession();

  // Auto-migrate localStorage reports when user logs in
  const { isMigrating, migratedCount } = useMigrateReports();

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
    <div className=" to-gray-50">
      {/* Header */}
      <header className="p-4 flex justify-between max-w-[90%] mx-auto">
        <div>
          <Image src={logo} alt="logo" width={170} />
        </div>
        <div className="flex gap-4 items-center">
          {session?.user ? (
            <ProfileMenu />
          ) : (
            <>
              <a href="/auth/signin" className="text-gray-700 hover:text-gray-900">Login</a>
              <Button className="bg-amber-400 border px-5 py-2 rounded-md font-medium text-black hover:bg-amber-500">
                Start for free
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="p-5 mt-5 max-w-[90%] mx-auto ">
        <div className="text-center mb-12  p-2 ">
          <h1 className="text-8xl font-bold text-gray-900 mb-4 max-w-5xl mx-auto" style={{ fontFamily: 'var(--font-petrona)' }}>
            Turn <span className="inline-block text-center px-2 rounded-md bg-amber-400 text-white" style={{ minWidth: '280px', transform: 'rotate(-2deg)' }}>
              <span
                key={currentIndex}
                className="inline-block"
                style={{
                  animation: 'fadeIn 0.5s ease-in-out'
                }}
              >
                {words[currentIndex]}
              </span>
            </span> Data into <span style={{ fontFamily: 'var(--font-petrona)' }}>
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
          <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Transform your Data into clear, interactive and shareable presentations. Describe your goal, upload your data, and get a polished reports with charts, insights, and a storyline in minutes.
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 flex-col">
          <p className="font-normal text-slate-700 p-2 text-lg leading-relaxed" style={{ fontFamily: 'var(--font-petrona)' }}>Get started — no account needed</p>
          <FileUploadPrompt />
        </div>
      </main>

      {/* Template Preview Section */}
      <section className="mx-auto my-16 p-2">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-petrona)' }}>
            Create, Edit and Publish
          </h2>
          <p className="text-lg text-gray-600  mx-auto">
            Interactive reports with charts, insights, and professional formatting
          </p>
        </div>
        <div className="flex justify-center">
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 max-w-[90%] shadow-md">
            <Image
              src={template}
              alt="Report template example"
              width={1100}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>
      </section>

    </div>
  );
}
