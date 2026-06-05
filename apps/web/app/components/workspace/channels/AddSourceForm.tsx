"use client";

import { useState } from "react";
import { Loader2, Plus, Rss } from "lucide-react";

interface AddSourceFormProps {
  onSubmit: (url: string, platform: string) => Promise<void>;
  isSubmitting: boolean;
  error: string;
  success: string;
}

export function AddSourceForm({ onSubmit, isSubmitting, error, success }: AddSourceFormProps) {
  const [syncTab, setSyncTab] = useState<"substack" | "custom_rss">("substack");
  const [urlInput, setUrlInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;
    await onSubmit(urlInput, syncTab);
    setUrlInput("");
  };

  return (
    <div className="rounded-2xl p-6 sm:p-8">
      <div className="flex items-center gap-4 border-b border-zinc-100 pb-3 mb-5">
        <button
          type="button"
          onClick={() => { setSyncTab("substack"); setUrlInput(""); }}
          className={`pb-1.5 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${syncTab === "substack" ? "border-orange-500 text-orange-600" : "border-transparent text-zinc-400 hover:text-zinc-600"
            }`}
        >
          <img src="https://cdn.worldvectorlogo.com/logos/substack-1.svg" alt="" className="h-3.5 w-3.5 object-contain" />
          Substack
        </button>
        <button
          type="button"
          onClick={() => { setSyncTab("custom_rss"); setUrlInput(""); }}
          className={`pb-1.5 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${syncTab === "custom_rss" ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-400 hover:text-zinc-600"
            }`}
        >
          <Rss className="h-3.5 w-3.5 shrink-0" />
          Other Newsletters & Blogs
        </button>
      </div>

      <div>
        <p className="mb-5 text-xs text-white">
          {syncTab === "substack"
            ? "Enter your Substack publication URL\u2014we normalize to the RSS feed and import issues automatically."
            : "Enter your blog URL or RSS feed URL\u2014we support WordPress, Medium, Ghost, Beehiiv or any custom RSS feed."}
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder={syncTab === "substack" ? "https://yourname.substack.com" : "https://myblog.com or https://medium.com/feed/@username"}
            className="min-h-[44px] flex-1  rounded-xl  px-4 text-sm text-white outline-none placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-50/25 border border-zinc-50"
            disabled={isSubmitting}
            required
          />
          <button
            type="submit"
            disabled={isSubmitting || !urlInput}
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {syncTab === "substack" ? "Sync Substack" : "Sync feed"}
          </button>
        </form>
      </div>

      {error && <div className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {success && <div className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>}
    </div>
  );
}
