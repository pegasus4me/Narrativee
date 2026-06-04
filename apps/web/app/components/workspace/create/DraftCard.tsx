"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Check, Calendar, Save, Loader2, RefreshCw, Sparkles, ChevronLeft, ChevronRight, X, Plus } from "lucide-react";
import { getPlatformLogo, getPlatformLabel } from "../shared/PlatformLogo";
import { API_URL } from "@/lib/api-config";

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
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [editingSlideIdx, setEditingSlideIdx] = useState<number>(0);
  const [localSlides, setLocalSlides] = useState<any[]>([]);
  const [localTheme, setLocalTheme] = useState<any>({
    themePreset: 'obsidian',
    fontFamily: 'Inter',
    backgroundColor: '#0c0c0e',
    textColor: '#ffffff',
    accentColor: '#ffffff',
    watermarkHandle: '@narrativee',
    showAvatar: true,
    showSlideCounter: true
  });
  const [renderingSlides, setRenderingSlides] = useState(false);

  const sliderRef = useRef<HTMLDivElement>(null);
  
  const label = getPlatformLabel(draft.channel.platform);
  const text = draft.content.text || "";
  const slides = draft.content.slides || [];

  // Sync draft data when customizer is opened
  useEffect(() => {
    if (isCustomizerOpen) {
      setLocalSlides(draft.content.slides || []);
      if ((draft.content as any).themeSettings) {
        setLocalTheme((draft.content as any).themeSettings);
      } else {
        // Fallback defaults
        setLocalTheme({
          themePreset: 'obsidian',
          fontFamily: 'Inter',
          backgroundColor: '#0c0c0e',
          textColor: '#ffffff',
          accentColor: '#ffffff',
          watermarkHandle: draft.channel.accountName || '@narrativee',
          showAvatar: true,
          showSlideCounter: true
        });
      }
    }
  }, [isCustomizerOpen, draft]);

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

  // Color theme presets
  const THEME_PRESETS = [
    { id: 'obsidian', name: 'Obsidian Dark', bg: '#0c0c0e', text: '#ffffff', accent: '#ffffff' },
    { id: 'charcoal', name: 'Charcoal Minimal', bg: '#1c1917', text: '#fafafa', accent: '#f59e0b' },
    { id: 'editorial', name: 'Warm Editorial', bg: '#fdfbf7', text: '#1c1917', accent: '#10b981' },
    { id: 'sunset', name: 'Solar Sunset', bg: '#1e1b4b', text: '#fef08a', accent: '#f97316' },
  ];

  const LAYOUT_TYPES = [
    { id: 'title_hook', name: 'Title Hook (Giant center text)' },
    { id: 'metric_focus', name: 'Metric Focus (Number : Description)' },
    { id: 'quote_block', name: 'Editorial Quote (Quotation marks)' },
    { id: 'bullet_list', name: 'Key Blueprint (Numbered list)' },
    { id: 'cta_hub', name: 'Call-To-Action (Follow/swipe)' },
  ];

  const FONTS = ['Inter', 'Playfair Display', 'Outfit', 'Space Grotesk'];

  // Apply visual theme presets
  const handleApplyPreset = (preset: typeof THEME_PRESETS[0]) => {
    setLocalTheme((prev: any) => ({
      ...prev,
      themePreset: preset.id,
      backgroundColor: preset.bg,
      textColor: preset.text,
      accentColor: preset.accent
    }));
  };

  // Backend Satori Re-rendering triggers
  const handleReRender = async (updatedSlides = localSlides, updatedTheme = localTheme) => {
    setRenderingSlides(true);
    try {
      const res = await fetch(`${API_URL}/articles/drafts/${draft.id}/update-carousel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          slides: updatedSlides,
          themeSettings: updatedTheme,
          text: text
        })
      });
      if (!res.ok) throw new Error("Failed to re-render");
      const data = (await res.json()) as any;
      if (data.success && data.draft) {
        setLocalSlides(data.draft.content.slides);
        draft.content.slides = data.draft.content.slides;
        (draft.content as any).themeSettings = data.draft.content.themeSettings;
        // Trigger parent state reload
        onDraftChange(draft.id, text);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update and render slide visuals.");
    } finally {
      setRenderingSlides(false);
    }
  };

  // Add a new slide to the carousel
  const handleAddSlide = () => {
    const newSlide = {
      text: "New actionable slide detail...",
      layoutType: "title_hook",
      imageSearchQuery: "aesthetic",
      backgroundUrl: localSlides[0]?.backgroundUrl || ""
    };
    const newSlides = [...localSlides, newSlide];
    setLocalSlides(newSlides);
    setEditingSlideIdx(newSlides.length - 1);
    handleReRender(newSlides, localTheme);
  };

  // Delete a slide
  const handleDeleteSlide = (idxToDelete: number) => {
    if (localSlides.length <= 2) {
      alert("Carousels must have at least 2 slides (a Title and a CTA).");
      return;
    }
    const newSlides = localSlides.filter((_, idx) => idx !== idxToDelete);
    setLocalSlides(newSlides);
    setEditingSlideIdx(Math.max(0, idxToDelete - 1));
    handleReRender(newSlides, localTheme);
  };

  // Edit slide content/layout locally
  const handleUpdateSlideProp = (idx: number, propName: string, value: any) => {
    const updated = localSlides.map((s, i) => i === idx ? { ...s, [propName]: value } : s);
    setLocalSlides(updated);
  };

  // Refresh single slide unsplash background
  const handleRefreshSlideBg = (idx: number) => {
    const updated = localSlides.map((s, i) => i === idx ? { ...s, refreshBg: true } : s);
    setLocalSlides(updated);
    handleReRender(updated, localTheme);
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
                    onClick={() => {
                      setEditingSlideIdx(idx);
                      setIsCustomizerOpen(true);
                    }}
                    className="shrink-0 snap-center w-[160px] relative cursor-pointer group/slide rounded-lg overflow-hidden border border-zinc-200 bg-[#09090b] shadow-xs hover:border-[#e99ab1] hover:scale-[1.02] transition-all duration-200"
                  >
                    <img
                      src={slide.dataUri}
                      alt={`Slide ${idx + 1}`}
                      className="w-full h-auto object-contain"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover/slide:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover/slide:opacity-100 bg-white/95 backdrop-blur-xs text-[9px] font-bold text-zinc-800 px-2 py-1 rounded-md shadow-xs transition-opacity transform translate-y-1 group-hover/slide:translate-y-0 duration-200">
                        Design Slide
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
                className="mt-1 inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-[#e99ab1] p-0.5 text-xs font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-[#e99ab1]/5"
              >
                <span className="flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#09090b] px-3 py-2 text-zinc-150 transition-colors hover:bg-zinc-900">
                  <Sparkles className="h-4.5 w-4.5 text-white animate-pulse fill-white/20" />
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
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default"
              : "bg-[#e99ab1] text-white hover:bg-[#e99ab1]/90 font-bold"
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

      {/* Premium Fullscreen Visual Carousel Customizer Modal */}
      {isCustomizerOpen && localSlides.length > 0 && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0c0c0e]/98 backdrop-blur-xl p-0 transition-all duration-300 animate-in fade-in animate-out fade-out font-sans select-none text-zinc-200">
          
          {/* Header Dashboard Bar */}
          <header className="flex h-16 w-full items-center justify-between border-b border-zinc-800 px-6 shrink-0">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-[#e99ab1] animate-pulse" />
              <h3 className="text-sm font-bold tracking-tight text-white">Narrativee Visual Customizer</h3>
              <span className="rounded-full bg-[#e99ab1]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#e99ab1] border border-[#e99ab1]/20">
                Satori Canvas Engine
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={renderingSlides}
                onClick={() => handleReRender()}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[#e99ab1] hover:bg-[#e99ab1]/90 disabled:bg-zinc-700 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-md active:scale-98"
              >
                {renderingSlides ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Rendering Canvas...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Apply & Re-render
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => setIsCustomizerOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-700/50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          {/* Main Three-Column Canvas Grid */}
          <div className="flex flex-1 w-full overflow-hidden">
            
            {/* Left Panel: Slide List Manager */}
            <aside className="w-[200px] border-r border-zinc-800 bg-[#070709] p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
              <div className="flex flex-col gap-3">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Slides Strip</p>
                <div className="flex flex-col gap-2.5">
                  {localSlides.map((slide, idx) => (
                    <div
                      key={idx}
                      onClick={() => setEditingSlideIdx(idx)}
                      className={`relative group/strip rounded-xl border p-2 cursor-pointer transition-all duration-200 ${
                        editingSlideIdx === idx 
                          ? "border-[#e99ab1] bg-[#e99ab1]/5 shadow-md shadow-[#e99ab1]/5 scale-102" 
                          : "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700"
                      }`}
                    >
                      <img
                        src={slide.dataUri}
                        alt={`Slide ${idx + 1}`}
                        className="w-full h-auto rounded-md object-contain border border-zinc-800"
                      />
                      <div className="absolute top-1.5 left-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
                        {idx + 1}
                      </div>
                      
                      {/* Delete Trigger */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSlide(idx);
                        }}
                        className="absolute -top-1.5 -right-1.5 hidden group-hover/strip:flex h-5 w-5 items-center justify-center rounded-full bg-red-600 hover:bg-red-500 text-white shadow-md transition-colors"
                      >
                        <X className="h-3 w-3 stroke-[3]" />
                      </button>
                    </div>
                  ))}
                  
                  {/* Add Slide Card */}
                  <button
                    type="button"
                    onClick={handleAddSlide}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-700 hover:border-[#e99ab1] bg-zinc-900/20 hover:bg-[#e99ab1]/5 py-6 px-3 text-center text-zinc-500 hover:text-white transition-all cursor-pointer group"
                  >
                    <Plus className="h-5 w-5 stroke-[2.5] group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold">Add Slide</span>
                  </button>
                </div>
              </div>
            </aside>

            {/* Middle Column: Live Slide Visual Canvas */}
            <main className="flex-1 bg-[#09090b] flex flex-col items-center justify-between p-8 overflow-y-auto">
              
              {/* Aspect Ratio Slide Container */}
              <div className="flex-1 flex items-center justify-center w-full max-h-[62vh]">
                <div className={`relative rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 bg-[#0c0c0e] flex justify-center items-center ${
                  renderingSlides ? "opacity-40 pointer-events-none transition-opacity duration-300" : ""
                }`}>
                  <img
                    src={localSlides[editingSlideIdx]?.dataUri}
                    alt={`Slide ${editingSlideIdx + 1}`}
                    className="max-h-[58vh] max-w-full object-contain select-none shadow-inner"
                  />
                  
                  {/* Rendering overlay */}
                  {renderingSlides && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-xs">
                      <Loader2 className="w-8 h-8 animate-spin text-[#e99ab1]" />
                      <span className="text-xs font-semibold text-white/80">Rendering high-fidelity preview...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Core Slide Content Editor Panel */}
              <div className="w-full max-w-3xl bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 mt-6 shrink-0 shadow-xl">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Slide {editingSlideIdx + 1} Content Editor
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRefreshSlideBg(editingSlideIdx)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/60 rounded-lg px-2.5 py-1 transition-colors"
                    >
                      <RefreshCw className="h-3 w-3" /> Refresh Background (Unsplash)
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Slide Text */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase">Slide Copy Text</label>
                      <textarea
                        value={localSlides[editingSlideIdx]?.text || ""}
                        onChange={(e) => handleUpdateSlideProp(editingSlideIdx, "text", e.target.value)}
                        placeholder="Slide contents..."
                        className="w-full h-24 bg-zinc-950 p-3 border border-zinc-800 rounded-xl text-sm leading-relaxed text-white focus:border-zinc-700 focus:outline-none font-normal resize-none"
                      />
                    </div>
                    
                    {/* Slide Settings */}
                    <div className="flex flex-col gap-3">
                      {/* Layout Swapper */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-zinc-500 uppercase">Slide Structural Layout</label>
                        <select
                          value={localSlides[editingSlideIdx]?.layoutType || "title_hook"}
                          onChange={(e) => handleUpdateSlideProp(editingSlideIdx, "layoutType", e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-300 outline-none focus:border-zinc-700"
                        >
                          {LAYOUT_TYPES.map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Image Search Keyword */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-zinc-500 uppercase">Unsplash Image Keyword</label>
                        <input
                          type="text"
                          value={localSlides[editingSlideIdx]?.imageSearchQuery || ""}
                          onChange={(e) => handleUpdateSlideProp(editingSlideIdx, "imageSearchQuery", e.target.value)}
                          placeholder="e.g. office, minimalist, technology"
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-300 outline-none focus:border-zinc-700"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </main>

            {/* Right Panel: Theme & Style Customizer */}
            <aside className="w-[300px] border-l border-zinc-800 bg-[#070709] p-5 shrink-0 overflow-y-auto flex flex-col gap-6">
              
              {/* Presets */}
              <div className="flex flex-col gap-3">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Theme Presets</p>
                <div className="grid grid-cols-2 gap-2">
                  {THEME_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`flex flex-col gap-1 p-2 rounded-xl border text-left cursor-pointer transition-all ${
                        localTheme.themePreset === preset.id 
                          ? "border-[#e99ab1] bg-[#e99ab1]/5 text-white" 
                          : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <span className="text-[10px] font-bold truncate">{preset.name}</span>
                      <div className="flex gap-1.5 mt-1">
                        <span className="w-3.5 h-3.5 rounded-full border border-zinc-700/50 shadow-xs" style={{ backgroundColor: preset.bg }} />
                        <span className="w-3.5 h-3.5 rounded-full border border-zinc-700/50 shadow-xs" style={{ backgroundColor: preset.accent }} />
                        <span className="w-3.5 h-3.5 rounded-full border border-zinc-700/50 shadow-xs" style={{ backgroundColor: preset.text }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-zinc-800" />

              {/* Typography */}
              <div className="flex flex-col gap-2.5">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Typography Font</p>
                <select
                  value={localTheme.fontFamily || "Inter"}
                  onChange={(e) => setLocalTheme((prev: any) => ({ ...prev, fontFamily: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-300 outline-none focus:border-zinc-700 cursor-pointer"
                >
                  {FONTS.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <hr className="border-zinc-800" />

              {/* Custom Color Pickers */}
              <div className="flex flex-col gap-3">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Custom Theme Palette</p>
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400 font-medium">Background Color</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={localTheme.backgroundColor || "#0c0c0e"} 
                        onChange={(e) => setLocalTheme((prev: any) => ({ ...prev, backgroundColor: e.target.value }))} 
                        className="w-6 h-6 rounded-md border border-zinc-700 bg-transparent cursor-pointer overflow-hidden p-0"
                      />
                      <span className="text-[11px] font-mono text-zinc-500 uppercase">{localTheme.backgroundColor}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400 font-medium">Title/Body Text</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={localTheme.textColor || "#ffffff"} 
                        onChange={(e) => setLocalTheme((prev: any) => ({ ...prev, textColor: e.target.value }))} 
                        className="w-6 h-6 rounded-md border border-zinc-700 bg-transparent cursor-pointer overflow-hidden p-0"
                      />
                      <span className="text-[11px] font-mono text-zinc-500 uppercase">{localTheme.textColor}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400 font-medium">Accent Highlight</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={localTheme.accentColor || "#6366f1"} 
                        onChange={(e) => setLocalTheme((prev: any) => ({ ...prev, accentColor: e.target.value }))} 
                        className="w-6 h-6 rounded-md border border-zinc-700 bg-transparent cursor-pointer overflow-hidden p-0"
                      />
                      <span className="text-[11px] font-mono text-zinc-500 uppercase">{localTheme.accentColor}</span>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-zinc-800" />

              {/* Watermark and branding settings */}
              <div className="flex flex-col gap-3">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Creator Branding</p>
                <div className="flex flex-col gap-2.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase">Creator Social Handle</label>
                    <input
                      type="text"
                      value={localTheme.watermarkHandle || ""}
                      onChange={(e) => setLocalTheme((prev: any) => ({ ...prev, watermarkHandle: e.target.value }))}
                      placeholder="@yourhandle"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-300 outline-none focus:border-zinc-700"
                    />
                  </div>
                  
                  <label className="flex items-center justify-between cursor-pointer select-none group mt-1.5">
                    <span className="text-xs text-zinc-400 font-medium">Show Avatar icon</span>
                    <input 
                      type="checkbox" 
                      checked={!!localTheme.showAvatar} 
                      onChange={(e) => setLocalTheme((prev: any) => ({ ...prev, showAvatar: e.target.checked }))} 
                      className="h-4.5 w-4.5 rounded-md border-zinc-800 text-white bg-zinc-950 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer select-none group">
                    <span className="text-xs text-zinc-400 font-medium">Show Slide Counter</span>
                    <input 
                      type="checkbox" 
                      checked={!!localTheme.showSlideCounter} 
                      onChange={(e) => setLocalTheme((prev: any) => ({ ...prev, showSlideCounter: e.target.checked }))} 
                      className="h-4.5 w-4.5 rounded-md border-zinc-800 text-white bg-zinc-950 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
