"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import useLocalStorage from "../hooks/useLocalStorage";

export default function FileUploadPrompt() {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [, setSessionData] = useLocalStorage<{
    sessionId?: string;
    story?: string;
    fileName?: string;
    fileSize?: number;
    fileData?: string; // Base64 encoded file
  }>("narrativee-session", {});

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
        alert("Please upload a CSV or Excel file");
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file && !message) return;

    setUploading(true);

    try {
      // Convert file to base64 for storage
      let fileData: string | undefined;
      if (file) {
        fileData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      // Generate temporary session ID
      const sessionId = Math.random().toString(36).substring(7);

      // Save to localStorage using the hook
      setSessionData({
        sessionId,
        story: message || undefined,
        fileName: file?.name || undefined,
        fileSize: file?.size || undefined,
        fileData: fileData || undefined,
      });

      // Redirect to intent page
      router.push(`/create`);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Please try again.");
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        {/* File attachment preview */}
        {file && (
          <div className="mb-3 flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-lg text-sm">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="flex-1 text-gray-700 font-medium truncate">{file.name}</span>
            <span className="text-gray-500 text-xs">{(file.size / 1024).toFixed(1)} KB</span>
            <button
              type="button"
              onClick={removeFile}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Input container */}
        <div className="relative flex items-end gap-2 p-3 bg-white border border-gray-200 rounded-2xl hover:border-gray-300 focus-within:border-amber-400 focus-within:shadow-md transition-all">
          {/* Attachment button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Attach file"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".csv,.xlsx,.xls"
            className="hidden"
          />

          {/* Text input */}
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe what story you want to tell with your data..."
            disabled={uploading}
            className="flex-1 px-2 py-2 text-gray-900 placeholder-gray-400 bg-transparent outline-none resize-none disabled:opacity-50"
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={uploading || (!file && !message)}
            className="p-2 bg-amber-400 text-white rounded-lg hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {uploading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            )}
          </button>
        </div>

        {/* Helper text */}
        <p className="mt-2 text-xs text-gray-500 px-2">
          Upload CSV or Excel files • Max 10MB
        </p>
      </form>
    </div>
  );
}
