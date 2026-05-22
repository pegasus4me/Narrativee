"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Check, Calendar, Save, Loader2, RefreshCw, Sparkles, ChevronLeft, ChevronRight, X } from "lucide-react";
import { getPlatformLogo, getPlatformLabel } from "../shared/PlatformLogo";

interface DraftChannel {
  platform: string;
  accountName?: string;
  avatarUrl?: string;
}

interface DraftItem {
  id: string;
  status?: string;
  channel: DraftChannel;
  content: { text?: string; type?: string; slides?: any[] };
  scheduledAt?: string;
}

interface DraftCardProps {
  draft: DraftItem;
  isScheduled: boolean;
  isSaving: boolean;
  isSaved: boolean;
  onDraftChange: (id: string, text: string) => void;
  onCopy: (id: string, text: string) => void;
  onSave: (id: string, text: string) => void;
  onSchedule: (id: string) => void;
  onConvertToCarousel?: (id: string) => void;
  onRefreshCarouselBg?: (id: string) => void;
}

export function DraftCard({
  draft,
  isScheduled,
  isSaving,
  isSaved,
  onDraftChange,
  onCopy,
  onSave,
  onSchedule,
  onConvertToCarousel,
  onRefreshCarouselBg,
}: DraftCardProps) {
  const [copiedLocal, setCopiedLocal] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  const label = getPlatformLabel(draft.channel.platform);
  const text = draft.content.text || "";
  const slides = draft.content.slides || [];

  useEffect(() => {
    if (activeSlideIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveSlideIndex(null);
      else if (e.key === "ArrowRight") {
        setActiveSlideIndex((prev) => (prev !== null && prev < slides.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowLeft") {
        setActiveSlideIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSlideIndex, slides.length]);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopiedLocal(true);
    onCopy(draft.id, text);
    setTimeout(() => setCopiedLocal(false), 2000);
  };

  const scrollSlider = (direction: "left" | "right") => {
    if (sliderRef.current) {
      const { scrollLeft } = sliderRef.current;
      const scrollTo = direction === "left" ? scrollLeft - 180 : scrollLeft + 180;
      sliderRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col justify-between rounded-md border border-zinc-50 p-5 transition-all border-zinc-200 bg-zinc-50/10 hover:border-zinc-300">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative h-8 w-8 shrink-0">
              {draft.channel.avatarUrl ? (
                <img src={draft.channel.avatarUrl} alt="" className="h-8 w-8 rounded-sm object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-black">
                  {(draft.channel.accountName || label).charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full p-0.5">
                <img
                  src={getPlatformLogo(draft.channel.platform)}
                  alt={draft.channel.platform}
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-900 leading-tight">{label}</p>
              <p className="text-[10px] text-zinc-500 font-light">{draft.channel.accountName || "Connected Channel"}</p>
            </div>
          </div>
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[9px] font-semibold text-zinc-600 uppercase">
            {draft.status === "scheduled" ? "Scheduled" : draft.status === "published" ? "Published" : "Draft"}
          </span>
        </div>

        {draft.content.type === "carousel" ? (
          <div className="flex flex-col gap-4">
            {/* Slide Carousel Preview */}
            <div className="relative group/carousel w-full">
              <div
                ref={sliderRef}
                className="flex gap-2.5 overflow-x-auto pb-3 snap-x scroll-smooth hide-scrollbar"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {slides.map((slide: any, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => setActiveSlideIndex(idx)}
                    className="shrink-0 snap-center w-[160px] relative cursor-pointer group/slide rounded-lg overflow-hidden border border-zinc-200 bg-white shadow-xs hover:border-indigo-400 hover:scale-[1.02] transition-all duration-200"
                  >
                    <img
                      src={slide.dataUri}
                      alt={`Slide ${idx + 1}`}
                      className="w-full h-auto object-contain"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover/slide:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover/slide:opacity-100 bg-white/95 backdrop-blur-xs text-[9px] font-bold text-zinc-800 px-2 py-1 rounded-md shadow-xs transition-opacity transform translate-y-1 group-hover/slide:translate-y-0 duration-200">
                        View Slide
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {slides.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => scrollSlider("left")}
                    className="absolute left-1.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 backdrop-blur-xs border border-zinc-200 text-zinc-700 shadow-sm opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-white hover:scale-105 active:scale-95 z-10"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollSlider("right")}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 backdrop-blur-xs border border-zinc-200 text-zinc-700 shadow-sm opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-white hover:scale-105 active:scale-95 z-10"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </>
              )}

              <div className="absolute top-1.5 right-1.5 rounded-full bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[9px] font-bold text-white shadow-sm pointer-events-none">
                {slides.length} slides
              </div>
            </div>

            {draft.channel.platform === "linkedin" && (
              <textarea
                value={text}
                onChange={(e) => onDraftChange(draft.id, e.target.value)}
                placeholder="LinkedIn text post..."
                className="w-full h-32 bg-white p-3 border border-zinc-200 rounded-lg text-sm leading-relaxed text-zinc-800 focus:border-zinc-300 focus:outline-none focus:ring-0 font-normal resize-none"
              />
            )}
            
            {draft.channel.platform === "instagram" && (
              <textarea
                value={text}
                onChange={(e) => onDraftChange(draft.id, e.target.value)}
                placeholder="Instagram caption..."
                className="w-full h-20 bg-white p-3 border border-zinc-200 rounded-lg text-sm leading-relaxed text-zinc-800 focus:border-zinc-300 focus:outline-none focus:ring-0 font-normal resize-none"
              />
            )}
            
            {draft.channel.platform !== "linkedin" && draft.channel.platform !== "instagram" && (
              <textarea
                value={text}
                onChange={(e) => onDraftChange(draft.id, e.target.value)}
                className="w-full h-32 bg-white p-3 border border-zinc-200 rounded-lg text-sm leading-relaxed text-zinc-800 focus:border-zinc-300 focus:outline-none focus:ring-0 font-normal resize-none"
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <textarea
              value={text}
              onChange={(e) => onDraftChange(draft.id, e.target.value)}
              className="w-full h-44 bg-white p-3.5 border border-zinc-200 rounded-lg text-sm leading-relaxed text-zinc-800 focus:border-zinc-300 focus:outline-none focus:ring-0 font-normal resize-none"
            />
            {onConvertToCarousel && (draft.channel.platform === "linkedin" || draft.channel.platform === "instagram") && (
              <button
                type="button"
                onClick={() => onConvertToCarousel(draft.id)}
                className="mt-1 inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-0.5 text-xs font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-indigo-100/50"
              >
                <span className="flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-white px-3 py-2 text-zinc-800 transition-colors hover:bg-zinc-50/50">
                  <Sparkles className="h-4.5 w-4.5 text-indigo-500 animate-pulse fill-indigo-100" />
                  Convert to Carousel
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-zinc-100/50 pt-4">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            {copiedLocal ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => onSave(draft.id, text)}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" />
                Saving...
              </>
            ) : isSaved ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 text-zinc-400" />
                Save
              </>
            )}
          </button>

          {draft.content.type === "carousel" && onRefreshCarouselBg && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => onRefreshCarouselBg(draft.id)}
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5 text-zinc-400" />
                  Refresh BG
                </>
              )}
            </button>
          )}
        </div>

        <button
          type="button"
          disabled={isScheduled}
          onClick={() => onSchedule(draft.id)}
          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            isScheduled
              ? "bg-emerald-50 text-emerald-800 border border-emerald-100 cursor-default"
              : "bg-primary text-white hover:bg-zinc-800"
          }`}
        >
          {isScheduled ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Scheduled
            </>
          ) : (
            <>
              <Calendar className="h-3.5 w-3.5" />
              Schedule
            </>
          )}
        </button>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {activeSlideIndex !== null && slides.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-md p-4 transition-all duration-300 animate-in fade-in animate-out fade-out">
          {/* Close button */}
          <button
            type="button"
            onClick={() => setActiveSlideIndex(null)}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/10 z-50"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Previous button */}
          {activeSlideIndex > 0 && (
            <button
              type="button"
              onClick={() => setActiveSlideIndex(activeSlideIndex - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/10 z-50"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Next button */}
          {activeSlideIndex < slides.length - 1 && (
            <button
              type="button"
              onClick={() => setActiveSlideIndex(activeSlideIndex + 1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/10 z-50"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Main Slide Image */}
          <div className="flex flex-col items-center gap-4 max-w-full max-h-[85vh] z-40">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-900 flex justify-center items-center">
              <img
                src={slides[activeSlideIndex].dataUri}
                alt={`Slide ${activeSlideIndex + 1}`}
                className="max-w-full max-h-[70vh] object-contain select-none"
              />
            </div>
            
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-sm font-bold text-white/90">
                Slide {activeSlideIndex + 1} of {slides.length}
              </p>
              {slides[activeSlideIndex].imageSearchQuery && (
                <p className="text-xs text-white/40 font-light">
                  Keyword: {slides[activeSlideIndex].imageSearchQuery}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
