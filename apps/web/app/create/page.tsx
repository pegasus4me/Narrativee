"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import ProgressiveLoader from "../components/ProgressiveLoader";
import Image from "next/image";
import logo from "../../public/logo.png";
import useLocalStorage from "../hooks/useLocalStorage";
import { authClient } from "../../lib/auth-client";
import { ReportAPI } from "../../lib/apis";
import PrimaryButton from "../components/PrimaryButton";
export default function CreatePage() {
  const router = useRouter();
  const apis = new ReportAPI();
  const session = authClient.useSession()
  console.log("session", session)
  const [sessionData] = useLocalStorage<{
    sessionId?: string;
    story?: string;
    fileName?: string;
    fileSize?: number;
    fileData?: string; // Base64 encoded file
  }>("narrativee-session", {});

  const [story, setStory] = useState("");
  const [audience, setAudience] = useState("");
  const [reportStyle, setReportStyle] = useState(""); // New state for style
  const [hasStory, setHasStory] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [rowLimitError, setRowLimitError] = useState<string | null>(null);

  useEffect(() => {
    // Load story from localStorage if it exists
    if (sessionData.story) {
      setStory(sessionData.story);
      setHasStory(true);
    }
  }, [sessionData.story]);

  const handleContinue = async () => {
    if (!audience || (!hasStory && !story) || !reportStyle) {
      alert("Please complete all fields");
      return;
    }

    // Get the file from localStorage
    const fileData = sessionData.fileData;
    const fileName = sessionData.fileName;

    if (!fileData || !fileName) {
      alert("File data not found. Please upload a file again.");
      router.push('/');
      return;
    }

    setIsGenerating(true);

    try {
      // Convert base64 back to File object
      const base64Parts = fileData.split(',');
      if (base64Parts.length < 2 || !base64Parts[1]) {
        throw new Error('Invalid file data format');
      }
      const byteString = atob(base64Parts[1]);

      const mimeTypePart = base64Parts[0]?.split(':')[1];
      if (!mimeTypePart) {
        throw new Error('Invalid MIME type format');
      }
      const mimeParts = mimeTypePart.split(';');
      const mimeString = mimeParts[0] || 'application/octet-stream';
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      const file = new File([blob], fileName, { type: mimeString });

      // Generate temporary reportId
      const tempReportId = Math.random().toString(36).substring(7);
      console.log('Generated reportId:', tempReportId);

      // Call API using the client
      const data = await apis.generateReport({
        file,
        story: hasStory ? sessionData.story! : story,
        audience,
        reportStyle,
      });
      console.log('Report generated successfully:', data);
      console.log('Data has template?', !!data.template);

      // Use reportId from backend if available (authenticated user), otherwise use tempReportId
      const reportId = data.reportId || tempReportId;
      console.log('Using reportId:', reportId, '(from backend:', !!data.reportId, ')');

      // Store the report data in localStorage (as backup for both cases)
      const storageKey = `report-${reportId}`;
      localStorage.setItem(storageKey, JSON.stringify(data));
      console.log('Saved to localStorage with key:', storageKey);

      // Verify it was saved
      const saved = localStorage.getItem(storageKey);
      console.log('Verification - data was saved?', !!saved);

      // Redirect to workspace after data is saved
      console.log('Redirecting to /workspace/' + reportId);
      router.push(`/workspace/${reportId}`);

    } catch (error: any) {
      console.error('Error generating report:', error);

      // Handle 403 from Axios error (Report Limit Reached)
      if (error.response?.status === 403 && error.response?.data?.requiresAuth) {
        setShowLimitModal(true);
        setIsGenerating(false);
        return;
      }

      // Handle 400 from Axios error (Row Limit Reached)
      if (error.response?.status === 400 && error.response?.data?.error === 'Too many rows') {
        setRowLimitError(error.response.data.message);
        setIsGenerating(false);
        return;
      }

      alert('Failed to generate report. Please try again.');
      setIsGenerating(false);
    }
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

  // Options matching the prompt types in ReportPrompt.ts
  const styles = [
    {
      value: "executive",
      label: "Strategic Brief",
      icon: "⚡",
      description: "Concise, impactful, bottom-line first"
    },
    {
      value: "story",
      label: "Narrative Story",
      icon: "📖",
      description: "Engaging, human-centric, flow-driven"
    },
    {
      value: "detailed",
      label: "Deep Analysis",
      icon: "🔍",
      description: "Thorough, methodological, precise"
    }
  ];

  return (
    <div className="">
      {/* Limit Reached Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-petrona)' }}>
                Report Limit Reached
              </h2>

              <p className="text-gray-600 mb-6">
                You can only generate <strong>1 report</strong> without an account.
                Create a free account to generate more <strong>reports</strong> with betters outputs and unlock chat features!
              </p>

              <div className="space-y-3">
                <a
                  href="/auth/signup"
                  className="block w-full px-6 py-3 bg-amber-400 text-black font-semibold rounded-lg hover:bg-amber-500 transition-colors"
                >
                  Create Free Account
                </a>

                <a
                  href="/auth/signin"
                  className="block w-full px-6 py-3 border-2 border-gray-200 text-gray-700 font-medium rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Sign In
                </a>

                <button
                  onClick={() => setShowLimitModal(false)}
                  className="block w-full px-6 py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Row Limit Error Modal */}
      {rowLimitError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-petrona)' }}>
                File Too Large
              </h2>

              <p className="text-gray-600 mb-6">
                {rowLimitError}
              </p>

              <div className="space-y-3">
                <a
                  href="/auth/signup"
                  className="block w-full px-6 py-3 bg-amber-400 text-black font-semibold rounded-lg hover:bg-amber-500 transition-colors"
                >
                  Sign Up
                </a>

                <button
                  onClick={() => setRowLimitError(null)}
                  className="block w-full px-6 py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="p-4 flex justify-between max-w-[90%] mx-auto">
        <Image src={logo} alt="logo" width={170} />
      </header>

      {/* Progressive Loader Overlay */}
      {isGenerating && <ProgressiveLoader />}

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full text-sm font-medium text-amber-800 mb-4">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            File and context uploaded successfully
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-petrona)' }}>
            Let&apos;s understand your goal
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
                    p-6 rounded-md border text-left transition-all
                    ${audience === aud.value
                      ? "border-amber-800 bg-amber-50/50 shadow-xs"
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

          {/* Style/Goal Selection */}
          <div className="mb-6">
            <label
              className="block text-lg font-semibold text-gray-900 mb-2"
              style={{ fontFamily: 'var(--font-petrona)' }}
            >
              What is your main objective?
            </label>

            <p className="text-sm text-gray-600 mb-4 ml-4">
              This tells to Narrativee whether to write a
              persuasive narrative report or an objective report.
              It ensures the tone matches your intent.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {styles.map((style) => (
                <button
                  key={style.value}
                  onClick={() => setReportStyle(style.value)}
                  className={`
                    p-4 rounded-md border text-left transition-all h-full
                    ${reportStyle === style.value
                      ? "border-amber-800 bg-amber-50/50"
                      : "border-gray-100 bg-white hover:border-gray-300"
                    }
                  `}
                >
                  <div className="flex flex-col gap-2">
                    <span className="text-2xl">{style.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900" style={{ fontFamily: 'var(--font-petrona)' }}>
                        {style.label}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        {style.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="mt-12 flex justify-center">
          <PrimaryButton
            onClick={handleContinue}
            disabled={!audience || (!hasStory && !story) || !reportStyle || isGenerating}
            className=""
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                Generating...
              </>
            ) : (
              'Generate your report'
            )}
          </PrimaryButton>
        </div>
      </main>
    </div>
  );
}