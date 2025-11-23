"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import logo from "../../public/logo.png";
import useLocalStorage from "../hooks/useLocalStorage";

export default function CreatePage() {
  const router = useRouter();

  const [sessionData] = useLocalStorage<{
    sessionId?: string;
    story?: string;
    fileName?: string;
  }>("narrativee-session", {});

  const [story, setStory] = useState("");
  const [audience, setAudience] = useState("");
  const [hasStory, setHasStory] = useState(false);

  useEffect(() => {
    // Load story from localStorage if it exists
    if (sessionData.story) {
      setStory(sessionData.story);
      setHasStory(true);
    }
  }, [sessionData.story]);

  const handleContinue = () => {
    if (!audience || (!hasStory && !story)) {
      alert("Please complete all fields");
      return;
    }

    // Save to localStorage
    const updatedSession = {
      ...sessionData,
      story: hasStory ? sessionData.story : story,
      audience: audience
    };

    localStorage.setItem("narrativee-session", JSON.stringify(updatedSession));

    // Redirect to processing page
    router.push(`/processing`);
  };

  const audiences = [
    {
      value: "team",
      label: "My Team",
      icon: "",
      description: "Internal stakeholders and colleagues"
    },
    {
      value: "executives",
      label: "Executives",
      icon: "",
      description: "C-level and leadership"
    },
    {
      value: "clients",
      label: "Clients",
      icon: "",
      description: "External customers and partners"
    },
    {
      value: "investors",
      label: "Investors",
      icon: "",
      description: "Shareholders and stakeholders"
    }
  ];

  return (
    <div className="">
      {/* Header */}
      <header className="p-4 flex justify-between max-w-[90%] mx-auto">
        <Image src={logo} alt="logo" width={170}/>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full text-sm font-medium text-amber-800 mb-4">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            File uploaded successfully
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-petrona)' }}>
            Let&apos;s understand your needs
          </h1>

        </div>

        <div className="space-y-8">
          {/* Story Input - Only show if not provided */}
          {!hasStory && (
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
              <label className="block text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-petrona)' }}>
                What story do you want to tell?
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Describe the main message or insights you want to communicate
              </p>
              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="e.g., Show Q4 sales growth and highlight top-performing regions..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-400 focus:outline-none resize-none"
                rows={4}
              />
            </div>
          )}

          {/* Show existing story if provided */}
          {hasStory && (
            <div className="bg-amber-50/40 rounded-2xl  p-6">
              <label className="block font-semibold text-xl text-amber-900 mb-2" style={{ fontFamily: 'var(--font-petrona)' }}>
                Your goal:
              </label>
              <p className="text-gray-800  text-sm ml-4">{story}</p>
            </div>
          )}

          {/* Audience Selection */}
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-petrona)' }}>
              Who is your audience?
            </label>
            <p className="text-sm text-gray-600 mb-4 ml-4">
              This helps Narrativee tailor the tone and depth of your presentation
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {audiences.map((aud) => (
                <button
                  key={aud.value}
                  onClick={() => setAudience(aud.value)}
                  className={`
                    p-6 rounded-xl border text-left transition-all
                    ${audience === aud.value
                      ? "border-amber-800 bg-amber-50 shadow-xs"
                      : "border-gray-100 bg-white hover:border-gray-300"
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{aud.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-petrona)' }}>
                        {aud.label}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {aud.description}
                      </p>
                    </div>
                    {audience === aud.value && (
                      <svg className="w-6 h-6 text-amber-800" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="mt-12 flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!audience || (!hasStory && !story)}
            className="px-8 py-4 bg-amber-400 text-black border border-amber-800 text font-semibold rounded-lg hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Continue to Generate Templates
          </button>
        </div>
      </main>
    </div>
  );
}
