"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrand, studioPath, rememberBrand } from "@/lib/api/brands";

interface UserWebsiteProps {
  onSubmit?: (url: string, analysisId?: string) => void;
  className?: string;
  placeholder?: string;
  buttonText?: string;
}

export default function UserWebsite({
  onSubmit,
  className = "",
  placeholder = "Enter your website (e.g. acme.com)",
  buttonText = "Start",
}: UserWebsiteProps) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  const attempt = useRef<{ input: string; key: string } | null>(null);

  const cleanUrl = (input: string): string => {
    let trimmed = input.trim();
    if (!trimmed) return "";
    // Remove protocol prefix if already present for cleaner parsing
    trimmed = trimmed.replace(/^https?:\/\//, "");
    // Remove trailing slashes
    trimmed = trimmed.replace(/\/+$/, "");
    return trimmed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending.current) return;
    const formatted = cleanUrl(url);

    if (!formatted) {
      setError("Please enter a website URL");
      return;
    }

    // Basic domain validation
    const domainRegex =
      /^[a-zA-Z0-9][a-zA-Z0-9-._]{1,256}\.[a-zA-Z]{2,}(\/.*)?$/;
    if (!domainRegex.test(formatted) && !formatted.includes("localhost")) {
      setError("Please enter a valid domain (e.g. yourcompany.com)");
      return;
    }

    setError(null);
    setIsLoading(true);
    pending.current = true;
    if (attempt.current?.input !== formatted)
      attempt.current = { input: formatted, key: crypto.randomUUID() };

    try {
      const fullUrl = `https://${formatted}`;

      // Call the backend analysis engine
      const brand = await createBrand({
        url: fullUrl,
        key: attempt.current.key,
      });
      const analysisId = brand.analysisId ?? undefined;
      rememberBrand(brand);

      // Store in storage for seamless session retrieval
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("user_website_url", fullUrl);
        window.sessionStorage.setItem("user_website_domain", formatted);
        if (analysisId)
          window.sessionStorage.setItem("current_analysis_id", analysisId);

        window.localStorage.setItem("user_website_url", fullUrl);
        window.localStorage.setItem("user_website_domain", formatted);
        if (analysisId)
          window.localStorage.setItem("current_analysis_id", analysisId);
      }

      if (onSubmit) {
        onSubmit(fullUrl, analysisId);
      } else {
        router.push(studioPath(brand.id));
      }
    } catch (err) {
      console.error("Analysis submission failed:", err);
      setError(err instanceof Error ? err.message : "Failed to start analysis");
      setIsLoading(false);
    } finally {
      pending.current = false;
    }
  };

  return (
    <div className={`w-full max-w-lg mx-auto ${className}`}>
      <form
        onSubmit={handleSubmit}
        className="flex items-center rounded-full  border-neutral-50 bg-transparent p-1 transition-colors dark:border-neutral-50 sm:p-1.5"
      >
        {/* Input field */}
        <div className="flex min-w-0 flex-1 items-center px-3 sm:px-4">
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null);
            }}
            placeholder={placeholder}
            aria-label="Website URL"
            className="w-full bg-transparent font-sans text-sm font-normal border-neutral-50 text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-white dark:placeholder:text-white/40 sm:text-base"
            disabled={isLoading}
          />
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-black transition-all hover:bg-secondary/90 disabled:cursor-not-allowed sm:px-5 sm:py-2.5"
        >
          {isLoading ? (
            <span>Analyzing...</span>
          ) : (
            <>
              <span>{buttonText}</span>
            </>
          )}
        </button>
      </form>

      {/* Validation error */}
      {error && (
        <p className="mt-2 text-xs text-rose-500 dark:text-rose-400 text-center font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
