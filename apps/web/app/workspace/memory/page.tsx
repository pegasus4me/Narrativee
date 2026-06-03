"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Link2, Plus, Rss, Trash2, Brain } from "lucide-react";
import { useKnowledgeBase, useSaveKnowledgeBase } from "@/app/hooks/api";
import { useAddSource, useDeleteSource, useSources } from "@/app/hooks/api/useSources";
import { VoiceMemoryStudio } from "@/app/components/workspace/knowledge-base/VoiceMemoryStudio";
import type { KnowledgeBase, Source } from "@/app/types/api";

export default function MemoryPage() {
  const { data: knowledgeBase, isLoading } = useKnowledgeBase(true);
  const { data: sourcesData, isLoading: isSourcesLoading } = useSources(true);
  const addSource = useAddSource();
  const deleteSource = useDeleteSource();
  const saveKnowledgeBase = useSaveKnowledgeBase();
  const [draftKnowledgeBase, setDraftKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [hasSaved, setHasSaved] = useState(false);
  const [newsletterUrl, setNewsletterUrl] = useState("");
  const [sourceError, setSourceError] = useState("");
  const [sourceSuccess, setSourceSuccess] = useState("");

  const sources: Source[] = sourcesData ?? [];

  useEffect(() => {
    if (knowledgeBase) {
      setDraftKnowledgeBase(knowledgeBase);
    }
  }, [knowledgeBase]);

  useEffect(() => {
    if (!hasSaved) return;
    const timerId = setTimeout(() => setHasSaved(false), 1800);
    return () => clearTimeout(timerId);
  }, [hasSaved]);

  const handleSave = async (): Promise<void> => {
    if (!draftKnowledgeBase) return;
    await saveKnowledgeBase.mutateAsync(draftKnowledgeBase);
    setHasSaved(true);
  };

  const handleConnectNewsletter = async (): Promise<void> => {
    if (!newsletterUrl.trim()) return;
    setSourceError("");
    setSourceSuccess("");
    try {
      await addSource.mutateAsync({ url: newsletterUrl.trim(), platform: "substack" });
      setSourceSuccess("Newsletter connected successfully.");
      setNewsletterUrl("");
    } catch (error: unknown) {
      setSourceError(error instanceof Error ? error.message : "Failed to connect newsletter.");
    }
  };

  const handleDisconnectSource = (sourceId: string): void => {
    if (!confirm("Disconnect this newsletter from memory?")) return;
    deleteSource.mutate(sourceId);
  };

  return (
    <div className="mx-auto w-[90%] space-y-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-100 font-urbanist">Memory</h1>
          <p className="mt-1 text-sm text-gray-500">

          </p>
        </div>
        <button
          type="button"
          disabled={saveKnowledgeBase.isPending || !draftKnowledgeBase}
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-gray-200 disabled:opacity-50"
        >
          {saveKnowledgeBase.isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving...
            </>
          ) : hasSaved ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Saved
            </>
          ) : (
            "Save Memory"
          )}
        </button>
      </div>

      <section className=" p-5">
        <h2 className="text-sm font-semibold text-gray-100">Connected newsletters</h2>
        <p className="mt-1 text-xs text-gray-400">Connect your Substack to pull your writing style directly into memory training.</p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="url"
              value={newsletterUrl}
              onChange={(event) => setNewsletterUrl(event.target.value)}
              placeholder="https://yourname.substack.com"
              className="w-full rounded-xl border border-white/10 bg-[#0d0d0d] py-2.5 pl-10 pr-3 text-sm text-gray-200 placeholder:text-gray-500 outline-none focus:border-white/20"
            />
          </div>
          <button
            type="button"
            disabled={addSource.isPending || !newsletterUrl.trim()}
            onClick={handleConnectNewsletter}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-gray-200 disabled:opacity-50"
          >
            {addSource.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Connect newsletter
          </button>
        </div>

        {sourceError && <p className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">{sourceError}</p>}
        {sourceSuccess && <p className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">{sourceSuccess}</p>}

        <div className="mt-4 space-y-2">
          {isSourcesLoading ? (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading connected newsletters...
            </div>
          ) : sources.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-[#111111] px-3 py-3 text-xs text-gray-500">
              No newsletter connected yet.
            </div>
          ) : (
            sources.map((source) => (
              <div key={source.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#111111] px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-gray-200">{source.url.replace("https://", "").replace("/feed", "")}</p>
                  <p className="mt-1 text-[11px] text-gray-500">{source.articleCount ?? 0} articles synced</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDisconnectSource(source.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-gray-300 hover:bg-white/5"
                >
                  <Trash2 className="h-3 w-3" />
                  Disconnect
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {isLoading || !draftKnowledgeBase ? (
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-5 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading memory...
        </div>
      ) : (
        <>
          {/* Brand Voice Rules Section */}
          <section className="rounded-2xl border border-white/10 bg-zinc-950/40 p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-400" />
                Brand Voice Rules
              </h2>
              <p className="mt-1 text-xs text-gray-400">
                Teach our AI how you write. Paste an example newsletter section or describe your voice rules (e.g. no buzzwords, use conversational punctuation).
              </p>
            </div>
            <textarea
              rows={6}
              value={draftKnowledgeBase.brandVoiceTraining || ""}
              onChange={(e) => setDraftKnowledgeBase({ ...draftKnowledgeBase, brandVoiceTraining: e.target.value })}
              placeholder="Example: I write in first-person, keep sentences extremely short, and prefer to explain complex topics using counter-intuitive analogies. Never use corporate marketing speak..."
              className="w-full px-4 py-3 text-xs rounded-xl bg-zinc-900 border border-white/10 text-zinc-100 placeholder:text-zinc-650 outline-none focus:border-white/20 transition-all resize-y font-light leading-relaxed"
            />
          </section>

          <VoiceMemoryStudio
            voiceMemory={draftKnowledgeBase.voiceMemory}
            onChange={(voiceMemory) => setDraftKnowledgeBase({ ...draftKnowledgeBase, voiceMemory })}
          />
        </>
      )}
    </div>
  );
}
