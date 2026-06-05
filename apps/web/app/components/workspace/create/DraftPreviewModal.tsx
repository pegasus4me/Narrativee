"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  X, Heart, MessageCircle, Repeat2, Bookmark, Share, Globe,
  ThumbsUp, MessageSquare, Share2, MoreHorizontal, Check, Loader2,
  Calendar, AlertCircle
} from "lucide-react";
import { ValidationBadge } from "./ValidationBadge";
import {
  BLUESKY_LOGO,
  FACEBOOK_LOGO,
  INSTAGRAM_LOGO,
  LINKEDIN_LOGO,
  THREADS_LOGO,
  X_LOGO,
  SUBSTACK_LOGO,
} from "@/app/constants";

interface DraftPreviewModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly draft: {
    readonly channelId: string;
    readonly platform: string;
    readonly variantNumber: number;
    readonly text: string;
    readonly angle?: string;
  };
  readonly channel: {
    readonly platform: string;
    readonly accountName: string;
    readonly avatarUrl: string | null;
  } | null;
  readonly text: string;
  readonly onTextChange: (newText: string) => void;
  readonly onSave: () => Promise<void>;
  readonly isSaving: boolean;
  readonly validationResults?: Array<{
    readonly platform: string;
    readonly isValid: boolean;
    readonly warnings: string[];
  }>;
  readonly selectedDate: string;
  readonly onDateChange: (date: string) => void;
  readonly selectedTime: string;
  readonly onTimeChange: (time: string) => void;
  readonly onSchedule: () => Promise<void>;
  readonly isScheduling: boolean;
  readonly scheduled: boolean;
  readonly scheduleErrorMsg?: string;
}

const PLATFORM_LOGOS: Record<string, string> = {
  bluesky: BLUESKY_LOGO,
  facebook: FACEBOOK_LOGO,
  instagram: INSTAGRAM_LOGO,
  linkedin: LINKEDIN_LOGO,
  threads: THREADS_LOGO,
  twitter: X_LOGO,
  x: X_LOGO,
  substack: SUBSTACK_LOGO,
};

function getPlatformLogo(platform: string): string {
  return PLATFORM_LOGOS[platform.toLowerCase()] ?? "";
}

/**
 * Premium Draft Preview & Edit Modal
 * Left side: Realistic social media platform preview (LinkedIn, X/Twitter, Instagram, Facebook/Threads/Substack)
 * Right side: Clean markdown/text editor for modifying drafts with status validations
 */
export function DraftPreviewModal({
  isOpen,
  onClose,
  draft,
  channel,
  text,
  onTextChange,
  onSave,
  isSaving,
  validationResults,
  selectedDate,
  onDateChange,
  selectedTime,
  onTimeChange,
  onSchedule,
  isScheduling,
  scheduled,
  scheduleErrorMsg,
}: DraftPreviewModalProps) {
  const [localText, setLocalText] = useState(text);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setLocalText(text);
  }, [text]);

  if (!isOpen) return null;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextVal = e.target.value;
    setLocalText(nextVal);
    onTextChange(nextVal);
  };

  const handleSave = async () => {
    try {
      await onSave();
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
    }
  };

  const platformLower = draft.platform.toLowerCase();
  const accountName = channel?.accountName ?? "Connected Channel";
  const avatarUrl = channel?.avatarUrl || getPlatformLogo(draft.platform) || "";

  // Render social mock feed
  const renderSocialPreview = () => {
    switch (platformLower) {
      case "x":
      case "twitter":
      case "bluesky":
        return (
          <div className="w-full rounded-2xl border border-zinc-800 bg-black p-5 text-zinc-150 font-sans shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0 flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={accountName}
                      className="h-10 w-10 rounded-full object-cover border border-zinc-800"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700/60 text-sm font-semibold uppercase text-zinc-300">
                      {accountName.charAt(0)}
                    </div>
                  )}
                  {getPlatformLogo(draft.platform) && (
                    <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-zinc-950 rounded-full flex items-center justify-center shadow-md p-0.5 border border-zinc-800">
                      <img
                        src={getPlatformLogo(draft.platform)}
                        alt={draft.platform}
                        className="w-3 h-3 object-contain"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-white text-[15px]">{accountName}</span>
                    <span className="inline-block h-3.5 w-3.5 rounded-full bg-[#1d9bf0] text-white flex items-center justify-center p-[2px]">
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="fill-current h-full w-full"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.941.1-1.352.278C14.781 2.53 13.518 1.5 12 1.5c-1.517 0-2.78 1.03-3.42 2.288-.41-.178-.872-.278-1.352-.278-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .941-.1 1.352-.278.64 1.258 1.903 2.288 3.42 2.288 1.518 0 2.781-1.03 3.42-2.288.41.178.872.278 1.352.278 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zm-12.87 3.328l-3.328-3.329 1.484-1.484 1.844 1.844 4.84-4.84 1.483 1.484-6.323 6.325z"></path></svg>
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-light">@{accountName.toLowerCase().replace(/\s+/g, "")}</p>
                </div>
              </div>
              <div className="h-6 w-6">
                <img src={getPlatformLogo(draft.platform)} alt={draft.platform} className="h-full w-full object-contain filter invert opacity-80" />
              </div>
            </div>

            {/* Post Content */}
            <div className="mt-3 text-[15px] leading-relaxed text-zinc-200 whitespace-pre-wrap font-sans break-words">
              {localText || "Compose X post..."}
            </div>

            {/* Timestamp */}
            <div className="mt-4 border-b border-zinc-800 pb-3 text-xs text-zinc-500 font-light">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} · <span className="font-semibold text-white">Narrativee</span>
            </div>

            {/* Engagement metrics */}
            <div className="mt-3 flex items-center justify-between text-zinc-500 text-xs px-2 select-none">
              <button className="flex items-center gap-1.5 hover:text-[#1d9bf0] transition-colors">
                <MessageCircle className="h-4 w-4" />
                <span>12</span>
              </button>
              <button className="flex items-center gap-1.5 hover:text-[#00ba7c] transition-colors">
                <Repeat2 className="h-4 w-4" />
                <span>8</span>
              </button>
              <button className="flex items-center gap-1.5 hover:text-[#f91880] transition-colors">
                <Heart className="h-4 w-4" />
                <span>154</span>
              </button>
              <button className="flex items-center gap-1.5 hover:text-[#1d9bf0] transition-colors">
                <Bookmark className="h-4 w-4" />
                <span>21</span>
              </button>
              <button className="flex items-center gap-1.5 hover:text-[#1d9bf0] transition-colors">
                <Share className="h-4 w-4" />
              </button>
            </div>
          </div>
        );

      case "linkedin":
        return (
          <div className="w-full rounded-2xl border border-zinc-800 bg-[#19191b] p-5 text-zinc-150 font-sans shadow-xl">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0 flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={accountName}
                      className="h-12 w-12 rounded-full object-cover border border-zinc-800"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700/60 text-base font-semibold uppercase text-zinc-300">
                      {accountName.charAt(0)}
                    </div>
                  )}
                  {getPlatformLogo(draft.platform) && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-zinc-950 rounded-full flex items-center justify-center shadow-md p-0.5 border border-zinc-800">
                      <img
                        src={getPlatformLogo(draft.platform)}
                        alt={draft.platform}
                        className="w-3.5 h-3.5 object-contain"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-white text-[14px] hover:underline hover:text-[#0a66c2] cursor-pointer">{accountName}</span>
                    <span className="text-[11px] text-zinc-400 font-light">• 1st</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-light line-clamp-1">Founder @ Narrativee | AI Copywriter & Strategist</p>
                  <p className="text-[10px] text-zinc-500 font-light flex items-center gap-1 mt-0.5">
                    1h · <Globe className="h-3 w-3" />
                  </p>
                </div>
              </div>
              <button className="text-zinc-400 hover:text-white transition-colors">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>

            {/* Post Content */}
            <div className="mt-4 text-[13px] leading-relaxed text-zinc-200 whitespace-pre-wrap break-words">
              {localText || "Write LinkedIn post..."}
            </div>

            {/* Likes count */}
            <div className="mt-4 flex items-center justify-between border-b border-zinc-800 pb-2.5 text-[11px] text-zinc-500">
              <div className="flex items-center gap-1">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#0a66c2] text-white p-0.5">
                  <ThumbsUp className="h-2.5 w-2.5 fill-current text-white" />
                </span>
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#78b543] text-white p-0.5 -ml-1.5">
                  <svg viewBox="0 0 16 16" className="fill-current text-white h-2.5 w-2.5"><path d="M12.9 8.2a1.4 1.4 0 00-1.4 1.4v2.5a2.5 2.5 0 01-5 0v-2.5a1.4 1.4 0 00-2.8 0v2.5a5.3 5.3 0 0010.6 0v-2.5a1.4 1.4 0 00-1.4-1.4z"></path></svg>
                </span>
                <span className="ml-1">45 reactions</span>
              </div>
              <span className="hover:underline cursor-pointer">8 comments · 2 reposts</span>
            </div>

            {/* Action Bar */}
            <div className="mt-2.5 flex items-center justify-between text-zinc-400 text-xs font-semibold px-1 select-none">
              <button className="flex items-center gap-2 hover:bg-white/5 py-2 px-3 rounded-lg transition-colors">
                <ThumbsUp className="h-4 w-4" />
                <span>Like</span>
              </button>
              <button className="flex items-center gap-2 hover:bg-white/5 py-2 px-3 rounded-lg transition-colors">
                <MessageSquare className="h-4 w-4" />
                <span>Comment</span>
              </button>
              <button className="flex items-center gap-2 hover:bg-white/5 py-2 px-3 rounded-lg transition-colors">
                <Repeat2 className="h-4 w-4" />
                <span>Repost</span>
              </button>
              <button className="flex items-center gap-2 hover:bg-white/5 py-2 px-3 rounded-lg transition-colors">
                <Share2 className="h-4 w-4" />
                <span>Send</span>
              </button>
            </div>
          </div>
        );

      case "instagram":
        return (
          <div className="w-full rounded-2xl border border-zinc-800 bg-[#0e0e10] overflow-hidden text-zinc-150 font-sans shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-855">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0 flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={accountName}
                      className="h-8 w-8 rounded-full border border-pink-500 p-[1px] object-cover animate-pulse"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700/60 text-xs font-semibold uppercase text-zinc-300">
                      {accountName.charAt(0)}
                    </div>
                  )}
                  {getPlatformLogo(draft.platform) && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-zinc-950 rounded-full flex items-center justify-center shadow-md p-0.5 border border-zinc-800">
                      <img
                        src={getPlatformLogo(draft.platform)}
                        alt={draft.platform}
                        className="w-2.5 h-2.5 object-contain"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <span className="font-semibold text-white text-xs hover:underline cursor-pointer">{accountName.toLowerCase().replace(/\s+/g, "_")}</span>
                  <span className="text-[10px] text-zinc-500 block">Miami, Florida</span>
                </div>
              </div>
              <MoreHorizontal className="h-5 w-5 text-zinc-400" />
            </div>

            {/* Media Area */}
            <div className="w-full aspect-square bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-zinc-950 flex flex-col items-center justify-center border-b border-zinc-855 relative p-8">
              <div className="absolute inset-0 bg-radial-gradient from-[#eca8d6]/10 to-transparent pointer-events-none" />
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 max-w-[85%] text-center backdrop-blur-md shadow-2xl">
                <p className="text-xs font-mono uppercase tracking-widest text-[#eca8d6] mb-2">Narrativee Visuals</p>
                <h4 className="text-sm font-semibold text-white line-clamp-3 leading-snug">
                  {draft.angle || "Your Actionable Campaign Insights"}
                </h4>
                <p className="mt-3 text-[10px] text-zinc-500 font-mono">Swipe for blueprints</p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-white">
                  <Heart className="h-5 w-5 hover:scale-110 active:scale-95 hover:text-red-500 transition-all cursor-pointer" />
                  <MessageCircle className="h-5 w-5 hover:scale-110 active:scale-95 transition-all cursor-pointer" />
                  <Share className="h-5 w-5 hover:scale-110 active:scale-95 transition-all cursor-pointer" />
                </div>
                <Bookmark className="h-5 w-5 text-white hover:scale-110 active:scale-95 transition-all cursor-pointer" />
              </div>

              {/* Likes count */}
              <p className="text-xs font-semibold text-white">87 likes</p>

              {/* Caption */}
              <div className="text-xs leading-relaxed text-zinc-200 whitespace-pre-wrap break-words">
                <span className="font-semibold text-white mr-1.5">{accountName.toLowerCase().replace(/\s+/g, "_")}</span>
                {localText}
              </div>
              <p className="text-[10px] text-zinc-500 font-light uppercase tracking-wide mt-1.5">3 hours ago</p>
            </div>
          </div>
        );

      default:
        // Substack / Newsletter / generic platform preview
        return (
          <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-150 font-serif shadow-xl">
            <div className="border-b border-zinc-800 pb-4 mb-4 font-sans">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0 flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={accountName}
                      className="h-10 w-10 rounded-full object-cover border border-zinc-800"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700/60 text-sm font-semibold uppercase text-zinc-300">
                      {accountName.charAt(0)}
                    </div>
                  )}
                  {getPlatformLogo(draft.platform) && (
                    <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-zinc-950 rounded-full flex items-center justify-center shadow-md p-0.5 border border-zinc-800">
                      <img
                        src={getPlatformLogo(draft.platform)}
                        alt={draft.platform}
                        className="w-3.5 h-3.5 object-contain"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">{accountName}</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">From Substack Newsletter Publication</p>
                </div>
              </div>
            </div>

            {/* Title / Heading */}
            <h2 className="text-xl font-bold tracking-tight text-white font-sans leading-tight mb-3">
              {draft.angle || "Repurposed Campaign Insight"}
            </h2>

            {/* Content Body */}
            <div className="text-[14px] leading-relaxed text-zinc-300 whitespace-pre-wrap break-words font-serif">
              {localText || "Compose your newsletter draft..."}
            </div>

            <div className="mt-8 pt-4 border-t border-zinc-900 font-sans text-xs text-zinc-650 flex items-center justify-between">
              <span>Read time: 2 min</span>
              <span>Published by {accountName}</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className="relative flex flex-col w-full max-w-6xl h-[85vh] rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <header className="flex h-16 w-full items-center justify-between border-b border-white/5 px-6 bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#eca8d6]" />
            <h3 className="text-sm font-semibold tracking-tight text-white">Live Preview & Edit</h3>
            <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400 capitalize">
              {draft.platform} (Var {draft.variantNumber})
            </span>
          </div>

          <div className="flex items-center gap-3">
            {validationResults && (
              <ValidationBadge
                platform={draft.platform}
                validationResults={validationResults}
              />
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </header>

        {/* Modal Grid */}
        <div className="flex flex-1 flex-col md:flex-row overflow-hidden">

          {/* Right Column: Custom text editor */}
          <section className="w-full md:w-[420px] lg:w-[480px] bg-[#0c0c0e] flex flex-col overflow-y-auto p-6">
            <div className="flex flex-col flex-1 gap-4 justify-between">
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-base text-white">Edit Post Copy</label>
                  <p className="text-xs text-zinc-400">Make tweaks to the generated text copy. Links and tags will auto-highlight on the preview card.</p>
                </div>

                {draft.angle && (
                  <div className="text-xs text-zinc-400 leading-relaxed italic px-3.5 py-2.5 border-l-2 border-[#eca8d6]/30 bg-[#eca8d6]/5 rounded-r-xl">
                    Focus: {draft.angle}
                  </div>
                )}

                <textarea
                  value={localText}
                  onChange={handleTextChange}
                  rows={10}
                  className="w-full resize-none rounded-2xl p-5 text-sm leading-relaxed text-zinc-200 outline-none transition-colors placeholder:text-zinc-650 focus:border-brand/40 focus:ring-1 focus:ring-brand/20 font-sans"
                  placeholder="Compose draft post..."
                />

                {/* Calendar Scheduling section */}
                <div className="border-t border-white/5 pt-5">
                  {scheduled ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 animate-in fade-in duration-200">
                      <Check className="h-5 w-5 text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-emerald-200">Scheduled successfully!</p>
                        <p className="text-[11px] text-emerald-300/80 mt-0.5 font-sans">
                          Post is scheduled for {selectedDate} at {selectedTime}.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-zinc-400 flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-brand" />
                          Schedule Release
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => onDateChange(e.target.value)}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 outline-none transition-all hover:border-zinc-700 focus:border-brand/50 focus:ring-1 focus:ring-brand/30"
                            style={{ colorScheme: 'dark' }}
                          />
                        </div>
                        <div className="relative">
                          <input
                            type="time"
                            value={selectedTime}
                            onChange={(e) => onTimeChange(e.target.value)}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 outline-none transition-all hover:border-zinc-700 focus:border-brand/50 focus:ring-1 focus:ring-brand/30"
                            style={{ colorScheme: 'dark' }}
                          />
                        </div>
                      </div>

                      {scheduleErrorMsg && (
                        <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
                          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-red-200">{scheduleErrorMsg}</p>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={isScheduling}
                        onClick={onSchedule}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand hover:bg-brand/90 text-white py-2.5 text-sm font-base transition-all duration-200 shadow-md shadow-brand/10 hover:shadow-brand/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isScheduling ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Scheduling...
                          </>
                        ) : (
                          <>
                            Schedule {draft.platform} Post
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action row */}
              <div className="border-t border-white/5 pt-5 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-950 px-5 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving || draft.text === localText}
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand hover:bg-brand/90 px-6 py-2.5 text-xs font-semibold text-white shadow-md transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : savedSuccess ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      Saved!
                    </>
                  ) : (
                    <>
                      Apply & Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
          {/* Left Column: Social Feed Preview */}
          <section className="flex-1 flex flex-col bg-[#070709] border-r border-white/5 overflow-y-auto p-6 lg:p-8">
            <div className="w-full max-w-lg mx-auto space-y-4 my-auto">
              {renderSocialPreview()}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
