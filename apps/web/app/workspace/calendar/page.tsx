"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, X, Clock } from "lucide-react";
import { CalendarGrid } from "@/app/components/workspace/queue/CalendarGrid";
import TimeZoneComponent from "@/app/components/workspace/timezone";
import { useDraftsQueue } from "@/app/hooks/api";
import type { Draft } from "@/app/types/api";
import type { ScheduledQueuePost } from "@/app/components/workspace/queue/queue.types";

function formatFriendlyTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatWeekRange(date: Date): string {
  const startOfWeek = new Date(date);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(date.getDate() - date.getDay());

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const startLabel = startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endLabel = endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return `${startLabel} - ${endLabel}`;
}

function isScheduledDraft(draft: Draft): draft is Draft & { scheduledAt: string } {
  return draft.status === "scheduled" && typeof draft.scheduledAt === "string" && draft.scheduledAt.length > 0;
}

function toCalendarPost(draft: Draft & { scheduledAt: string }): ScheduledQueuePost {
  return {
    id: draft.id,
    status: draft.status,
    scheduledAt: draft.scheduledAt,
    channel: draft.channel,
    content: draft.content,
  };
}

/**
 * Dedicated weekly calendar view for scheduled social posts.
 */
export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedPost, setSelectedPost] = useState<ScheduledQueuePost | null>(null);
  const { data: drafts, isLoading, error } = useDraftsQueue(true);

  const scheduledPosts = useMemo(
    () => (drafts ?? []).filter(isScheduledDraft).map(toCalendarPost),
    [drafts],
  );

  const moveWeek = (offset: number): void => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + offset);
    setCurrentDate(nextDate);
  };

  const selectToday = (): void => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  return (
    <div className="w-full min-w-0 px-5 py-8 sm:px-8 md:px-10 lg:px-12 xl:px-14">
      <header className="mb-8 flex flex-col gap-6 border-b border-zinc-800 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-zinc-500" />
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">Calendar</h1>
          </div>
          <p className="mt-2 text-sm text-zinc-500">{formatWeekRange(currentDate)}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex rounded-lg border border-zinc-800 bg-zinc-950 p-1">
            <button
              type="button"
              onClick={() => moveWeek(-7)}
              className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={selectToday}
              className="rounded-md border-x border-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => moveWeek(7)}
              className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <TimeZoneComponent timezone={Intl.DateTimeFormat().resolvedOptions().timeZone} />
        </div>
      </header>

      {isLoading ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin text-brand" />
            Loading calendar...
          </div>
        </div>
      ) : error instanceof Error ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-5">
          <p className="text-sm font-medium text-red-200">Unable to load calendar</p>
          <p className="mt-1 text-xs text-red-300/80">{error.message}</p>
        </div>
      ) : (
        <div className="w-full min-w-0">
          <CalendarGrid
            currentDate={currentDate}
            selectedDate={selectedDate}
            posts={scheduledPosts}
            onSelectDate={setSelectedDate}
            onSelectPost={setSelectedPost}
            formatTime={formatFriendlyTime}
          />
        </div>
      )}

      {/* Premium Post Detail Modal Overlay */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          {/* Backdrop close capture */}
          <div
            className="absolute inset-0 cursor-default"
            onClick={() => setSelectedPost(null)}
          />

          <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-150 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Scheduled Slot Detail</p>
                <h4 className="text-sm font-semibold text-zinc-100 mt-1">
                  {selectedPost.channel?.accountName || selectedPost.channel?.platform || "Scheduled post"}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Clock className="h-3.5 w-3.5 text-zinc-500" />
                <span>{new Date(selectedPost.scheduledAt).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
                <span className="text-zinc-600">•</span>
                <span>{formatFriendlyTime(selectedPost.scheduledAt)}</span>
              </div>
            </div>

            <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5 max-h-[300px] overflow-y-auto">
              <p className="text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap">
                {selectedPost.content?.text || "No content preview available."}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] text-xs font-medium text-zinc-200 px-4 py-2 transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
