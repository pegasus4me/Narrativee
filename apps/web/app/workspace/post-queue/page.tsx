"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  Link2,
  Loader2,
  Check,
  Plus,
  Trash2,
  Clock,
  Edit3,
  Send,
  Calendar,
  X,
} from "lucide-react";
import { LINKEDIN_LOGO, X_LOGO, FACEBOOK_LOGO, INSTAGRAM_LOGO, THREADS_LOGO } from "@/app/constants";

import TimeZoneComponent from "@/app/components/workspace/timezone";
import { API_URL } from "@/lib/api-config";
import TimezoneSelect, { getBrowserTimezone, toUTCISOString } from "@/app/components/workspace/TimezoneSelect";
import { CalendarGrid } from "@/app/components/workspace/queue/CalendarGrid";
import { hasScheduledAt, type QueuePost, type ScheduledQueuePost } from "@/app/components/workspace/queue/queue.types";

const platformLogos: Record<string, string> = {
  linkedin: LINKEDIN_LOGO,
  x: X_LOGO,
  facebook: FACEBOOK_LOGO,
  instagram: INSTAGRAM_LOGO,
  threads: THREADS_LOGO
};

interface ApiErrorResponse {
  details?: string;
  error?: string;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

export default function PostQueuePage() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<QueuePost[]>([]);

  // Calendar view states
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [activeModalPost, setActiveModalPost] = useState<QueuePost | null>(null);

  // Mutation states
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [savingEditId, setSavingEditId] = useState<string | null>(null);

  const [reschedulingPostId, setReschedulingPostId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newTimezone, setNewTimezone] = useState(() => getBrowserTimezone());
  const [savingRescheduleId, setSavingRescheduleId] = useState<string | null>(null);

  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [unschedulingId, setUnschedulingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    void fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/articles/drafts/queue`, { credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as QueuePost[];
        setPosts(data || []);
      }
    } catch (e) {
      console.error("Failed to load schedule queue:", e);
    } finally {
      setLoading(false);
    }
  };

  // 1. Edit post content
  const handleSaveEdit = async (postId: string) => {
    if (!editText.trim()) return;
    setSavingEditId(postId);
    try {
      const res = await fetch(`${API_URL}/articles/drafts/${postId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editText }),
      });
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, content: { ...p.content, text: editText } } : p))
        );
        if (activeModalPost && activeModalPost.id === postId) {
          setActiveModalPost((prev) => prev ? ({
            ...prev,
            content: { ...prev.content, text: editText },
          }) : prev);
        }
        setEditingPostId(null);
      }
    } catch (e) {
      console.error("Failed to update post content:", e);
    } finally {
      setSavingEditId(null);
    }
  };

  // 2. Reschedule post
  const handleReschedule = async (postId: string) => {
    if (!newDate || !newTime) return;
    setSavingRescheduleId(postId);
    try {
      const scheduledAt = toUTCISOString(newDate, newTime, newTimezone);
      const res = await fetch(`${API_URL}/articles/drafts/${postId}/schedule`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt }),
      });
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, scheduledAt, status: "scheduled" } : p))
        );
        if (activeModalPost && activeModalPost.id === postId) {
          setActiveModalPost((prev) => prev ? ({
            ...prev,
            scheduledAt,
            status: "scheduled",
          }) : prev);
        }
        setReschedulingPostId(null);
      }
    } catch (e) {
      console.error("Failed to reschedule post:", e);
    } finally {
      setSavingRescheduleId(null);
    }
  };

  // 3. Unschedule post
  const handleUnschedule = async (postId: string) => {
    setUnschedulingId(postId);
    try {
      const res = await fetch(`${API_URL}/articles/drafts/${postId}/unschedule`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        if (activeModalPost && activeModalPost.id === postId) {
          setActiveModalPost(null);
        }
      }
    } catch (e) {
      console.error("Failed to unschedule post:", e);
    } finally {
      setUnschedulingId(null);
    }
  };

  // 4. Publish post now
  const handlePublishNow = async (postId: string) => {
    setPublishingId(postId);
    try {
      const res = await fetch(`${API_URL}/articles/drafts/${postId}/publish-now`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, status: "published", publishedAt: new Date().toISOString() } : p))
        );
        if (activeModalPost && activeModalPost.id === postId) {
          setActiveModalPost(null);
        }
      } else {
        const data = (await res.json()) as ApiErrorResponse;
        alert(`Failed to publish: ${data.details || data.error || "Unknown error"}`);
      }
    } catch (e: unknown) {
      console.error("Failed to publish post immediately:", e);
      alert(`Error publishing post: ${getErrorMessage(e)}`);
    } finally {
      setPublishingId(null);
    }
  };

  // 5. Delete post draft completely
  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to permanently delete this post?")) return;
    setDeletingId(postId);
    try {
      const res = await fetch(`${API_URL}/articles/drafts/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        if (activeModalPost && activeModalPost.id === postId) {
          setActiveModalPost(null);
        }
      }
    } catch (e) {
      console.error("Failed to delete post:", e);
    } finally {
      setDeletingId(null);
    }
  };

  // Start Inline Edit
  const startEditing = (postId: string, text: string) => {
    setEditingPostId(postId);
    setEditText(text);
  };

  // Start Inline Reschedule
  const startRescheduling = (postId: string, currentScheduledAt: string) => {
    setReschedulingPostId(postId);
    const dateObj = new Date(currentScheduledAt);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const hh = String(dateObj.getHours()).padStart(2, '0');
    const minStr = String(dateObj.getMinutes()).padStart(2, '0');

    setNewDate(`${yyyy}-${mm}-${dd}`);
    setNewTime(`${hh}:${minStr}`);
  };

  // Formatting helpers
  const formatFriendlyDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today, " + date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow, " + date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  };

  const formatFriendlyTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const formatWeekRange = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(date.getDate() - date.getDay());

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startLabel = startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endLabel = endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    return `${startLabel} - ${endLabel}`;
  };

  // Helper to get days of the current month in grid format (including padding days)
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Number of days in the month
    const totalDays = new Date(year, month + 1, 0).getDate();
    // Starting day of the week (0 = Sunday, 6 = Saturday)
    const startDayOfWeek = firstDay.getDay();

    const days = [];

    // 1. Previous month padding days
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthTotalDays - i),
        isCurrentMonth: false,
      });
    }

    // 2. Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // 3. Next month padding days (up to 42 total cells to fit 6 rows)
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const getPostsForDate = (date: Date) => {
    return scheduledPosts.filter((post) => {
      const postDate = new Date(post.scheduledAt);
      return (
        postDate.getFullYear() === date.getFullYear() &&
        postDate.getMonth() === date.getMonth() &&
        postDate.getDate() === date.getDate()
      );
    });
  };

  // Group scheduled posts by Date
  const scheduledPosts = posts.filter((post) => post.status === "scheduled").filter(hasScheduledAt);
  const publishedPosts = posts.filter((p) => p.status === "published");

  // Group scheduled posts by friendly date key
  const groupedScheduledPosts = scheduledPosts.reduce<Record<string, ScheduledQueuePost[]>>((groups, post) => {
    const friendlyKey = formatFriendlyDate(post.scheduledAt);
    if (!groups[friendlyKey]) {
      groups[friendlyKey] = [];
    }
    groups[friendlyKey].push(post);
    return groups;
  }, {});

  return (
    <div className="w-full min-w-0 px-5 py-8 sm:px-8 md:px-10 lg:px-12 xl:px-14">
      {/* Header section */}
      <header className="mb-10 flex flex-col gap-6 border-b border-zinc-100 pb-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-3xl lg:max-w-none lg:flex-1">
          <div className="flex items-start gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
                Calendar 
              </h1>
            </div>
          </div>
        </div>

       <TimeZoneComponent timezone={Intl.DateTimeFormat().resolvedOptions().timeZone} />
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
          <Loader2 className="h-7 w-7 animate-spin text-zinc-600" />
          <p className="mt-2 text-xs">Fetching your post-dispatch queue slots…</p>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* Main timeline area */}
          <div className="min-w-0">
            {scheduledPosts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 px-8 py-16 text-center">
                <p className="mx-auto max-w-md text-sm text-zinc-600">
                  Calendar and publish slots are completely wired up! Go select an atomic idea and schedule its post.
                </p>
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="/workspace/create/new"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-800"
                  >
                    <Lightbulb className="h-4 w-4" />
                    Create social drafts
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* Calendar grid controls header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-bold text-zinc-900 min-w-[120px]">
                      {formatWeekRange(currentDate)}
                    </h2>
                    <div className="flex rounded-xl border border-zinc-200/80 bg-white p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          const previousWeek = new Date(currentDate);
                          previousWeek.setDate(currentDate.getDate() - 7);
                          setCurrentDate(previousWeek);
                        }}
                        className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-50 transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date();
                          setCurrentDate(today);
                          setSelectedDate(today);
                        }}
                        className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold text-zinc-600 hover:bg-zinc-50 transition-colors border-x border-zinc-100"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const nextWeek = new Date(currentDate);
                          nextWeek.setDate(currentDate.getDate() + 7);
                          setCurrentDate(nextWeek);
                        }}
                        className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-50 transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-1 text-[10px] font-bold text-zinc-500">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`rounded-lg px-3 py-1.5 transition-colors ${viewMode === "grid" ? "bg-white text-zinc-900 " : "hover:text-zinc-800"}`}
                    >
                      Week
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("timeline")}
                      className={`rounded-lg px-3 py-1.5 transition-colors ${viewMode === "timeline" ? "bg-white text-zinc-900" : "hover:text-zinc-800"}`}
                    >
                      List Timeline
                    </button>
                  </div>
                </div>

                {viewMode === "grid" ? (
                  <CalendarGrid
                    currentDate={currentDate}
                    selectedDate={selectedDate}
                    posts={scheduledPosts}
                    onSelectDate={setSelectedDate}
                    onSelectPost={setActiveModalPost}
                    formatTime={formatFriendlyTime}
                  />
                ) : (
                  <div className="flex flex-col gap-8 animate-in fade-in duration-200">
                    {Object.keys(groupedScheduledPosts).map((friendlyDate) => (
                      <div key={friendlyDate} className="flex flex-col gap-3">
                        {/* Date timeline divider */}
                        <div className="flex items-center gap-3 border-b border-zinc-100 pb-2">
                          <Calendar className="h-4 w-4 text-zinc-400" />
                          <h3 className="text-xs font-bold text-zinc-600">
                            {friendlyDate}
                          </h3>
                        </div>

                        {/* Posts under this date */}
                        <div className="grid gap-4">
                          {(groupedScheduledPosts[friendlyDate] ?? []).map((post) => {
                            const isEditing = editingPostId === post.id;
                            const isRescheduling = reschedulingPostId === post.id;

                            return (
                              <div
                                key={post.id}
                                className="rounded-2xl border border-zinc-200 bg-white p-5 transition-shadow flex flex-col gap-4 relative overflow-hidden"
                              >
                                {/* Card top bar */}
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    {/* Platform Logo stamp with rounded border */}
                                    <div className="relative h-8 w-8 shrink-0">
                                      {post.channel?.avatarUrl ? (
                                        <img
                                          src={post.channel.avatarUrl}
                                          alt=""
                                          className="h-8 w-8 rounded-full object-cover border border-zinc-100"
                                        />
                                      ) : (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-black border border-zinc-100">
                                          {(post.channel?.accountName || post.channel?.platform || "?").charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                      <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white p-0.5 border border-zinc-100">
                                        <img
                                          src={platformLogos[post.channel?.platform ?? ""] || INSTAGRAM_LOGO}
                                          alt=""
                                          className="h-full w-full object-contain"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-bold text-zinc-800">
                                        {post.channel?.accountName || "Social Post Connection"}
                                      </h4>
                                      <span className="text-[12px] text-black block font-light">
                                        {post.article?.title || "Repurposed Newsletter"}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 rounded-full bg-zinc-50 border border-zinc-100/80 px-2.5 py-1 text-[10px] font-semibold text-zinc-600">
                                    <Clock className="h-3 w-3 text-zinc-400" />
                                    <span>{formatFriendlyTime(post.scheduledAt)}</span>
                                  </div>
                                </div>

                                {/* Card Content or Editor */}
                                {isEditing ? (
                                  <div className="flex flex-col gap-2">
                                    <textarea
                                      value={editText}
                                      onChange={(e) => setEditText(e.target.value)}
                                      className="w-full min-h-[120px] rounded-xl border border-zinc-200 p-3 text-xs leading-relaxed text-zinc-800 focus:outline-none font-normal"
                                    />
                                    <div className="flex justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setEditingPostId(null)}
                                        className="rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-1.5 text-[11px] font-semibold text-zinc-600 transition-colors"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        disabled={savingEditId === post.id}
                                        onClick={() => handleSaveEdit(post.id)}
                                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50"
                                      >
                                        {savingEditId === post.id ? (
                                          <>
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Saving...
                                          </>
                                        ) : (
                                          <>
                                            <Check className="h-3 w-3" />
                                            Save Changes
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xs text-zinc-800 leading-relaxed font-sans whitespace-pre-wrap">
                                    {post.content?.text || ""}
                                  </p>
                                )}

                                {/* Reschedule inline overlay */}
                                {isRescheduling && (
                                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/20 p-4 mt-2 grid gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-800">
                                      <Calendar className="h-3.5 w-3.5" />
                                      Reschedule Publishing Slot
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <input
                                          type="date"
                                          value={newDate}
                                          onChange={(e) => setNewDate(e.target.value)}
                                          className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none"
                                        />
                                      </div>
                                      <div>
                                        <input
                                          type="time"
                                          value={newTime}
                                          onChange={(e) => setNewTime(e.target.value)}
                                          className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-1">
                                      <button
                                        type="button"
                                        onClick={() => setReschedulingPostId(null)}
                                        className="rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-1.5 text-[11px] font-semibold text-zinc-600 transition-colors"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        disabled={savingRescheduleId === post.id}
                                        onClick={() => handleReschedule(post.id)}
                                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 text-[11px] font-semibold transition-colors"
                                      >
                                        {savingRescheduleId === post.id ? (
                                          <>
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Updating...
                                          </>
                                        ) : (
                                          <>
                                            <Check className="h-3 w-3" />
                                            Reschedule
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Card Footer action bar */}
                                {!isEditing && !isRescheduling && (
                                  <div className="flex items-center justify-between border-t border-zinc-100 pt-3 mt-1 flex-wrap gap-3">
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => startEditing(post.id, post.content?.text ?? "")}
                                        className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-800 transition-colors"
                                      >
                                        <Edit3 className="h-3.5 w-3.5" />
                                        Edit Text
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => startRescheduling(post.id, post.scheduledAt)}
                                        className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-800 transition-colors ml-3"
                                      >
                                        <Calendar className="h-3.5 w-3.5" />
                                        Reschedule
                                      </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        disabled={unschedulingId === post.id}
                                        onClick={() => handleUnschedule(post.id)}
                                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-2.5 py-1 text-[10px] font-bold text-zinc-600 transition-colors disabled:opacity-50"
                                      >
                                        {unschedulingId === post.id ? (
                                          <>
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Drafting...
                                          </>
                                        ) : (
                                          <>
                                            <X className="h-3.5 w-3.5" />
                                            Remove Queue
                                          </>
                                        )}
                                      </button>

                                      <button
                                        type="button"
                                        disabled={publishingId === post.id}
                                        onClick={() => handlePublishNow(post.id)}
                                        className="inline-flex items-center gap-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white px-2.5 py-1 text-[10px] font-bold text-zinc-600 transition-colors disabled:opacity-50"
                                      >
                                        {publishingId === post.id ? (
                                          <>
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Sending...
                                          </>
                                        ) : (
                                          <>
                                            <Send className="h-3 w-3" />
                                            Publish Now
                                          </>
                                        )}
                                      </button>

                                      <button
                                        type="button"
                                        disabled={deletingId === post.id}
                                        onClick={() => handleDeletePost(post.id)}
                                        className="text-zinc-400 hover:text-rose-600 transition-colors p-1 ml-1"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right sidebar queue context details */}
          <div className="flex flex-col gap-6">
            {/* Sidebar widgets */}

            {/* Context Widget: Schedule Queue Stats */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <h3 className="text-xs font-bold text-zinc-400 mb-4">Queue Insights</h3>
              <div className="grid gap-3">
                <div className="bg-zinc-50/50 rounded-xl p-3.5 border border-zinc-100">
                  <span className="text-[10px] font-semibold text-zinc-400 block">Total Scheduled</span>
                  <strong className="text-2xl font-bold text-zinc-800 block mt-1">{scheduledPosts.length} posts</strong>
                </div>

                <div className="bg-zinc-50/50 rounded-xl p-3.5 border border-zinc-100">
                  <span className="text-[10px] font-semibold text-zinc-400 block">Dispatch Rate</span>
                  <strong className="text-sm font-semibold text-zinc-700 block mt-1">2 posts per day suggested</strong>
                </div>
              </div>
            </div>

            {/* Context Widget: Published Timeline */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <h3 className="text-xs font-bold text-zinc-400 mb-3 flex items-center justify-between">
                <span>Recently Published</span>
                <span className="rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-[8px] font-bold px-2 py-0.5">
                  History
                </span>
              </h3>

              {publishedPosts.length === 0 ? (
                <p className="text-xs text-zinc-400 font-light text-center py-6 border border-dashed border-zinc-100 rounded-xl">
                  No social posts dispatched yet.
                </p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {publishedPosts.slice(0, 5).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 bg-zinc-50/30 p-2.5 rounded-xl border border-zinc-100"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative h-6 w-6 shrink-0">
                          {p.channel?.avatarUrl ? (
                            <img
                              src={p.channel.avatarUrl}
                              alt=""
                              className="h-6 w-6 rounded-full object-cover border border-zinc-100"
                            />
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[9px] font-bold text-black border border-zinc-100">
                              {(p.channel?.accountName || p.channel?.platform || "?").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-white p-0.5 border border-zinc-100">
                            <img
                              src={platformLogos[p.channel?.platform ?? ""] || INSTAGRAM_LOGO}
                              alt=""
                              className="h-full w-full object-contain"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-zinc-800 font-medium truncate">
                          {p.channel?.accountName || "Post Connection"}
                        </p>
                      </div>
                      <span className="text-[9px] text-zinc-400 shrink-0">
                        {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Premium Post Detail & Actions Modal Popup */}
      {activeModalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          {/* Modal Backdrop close helper */}
          <div
            className="absolute inset-0 cursor-default"
            onClick={() => {
              setActiveModalPost(null);
              setEditingPostId(null);
              setReschedulingPostId(null);
            }}
          />

          <div className="relative w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-7  animate-in zoom-in-95 duration-150 flex flex-col gap-4">
            {/* Header section */}
            <div className="flex items-start justify-between gap-4 pb-3.5 ">
              <div className="flex items-center gap-3">
                <div className="relative h-9 w-9 shrink-0">
                  {activeModalPost.channel?.avatarUrl ? (
                    <img
                      src={activeModalPost.channel.avatarUrl}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover border border-zinc-100"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-black border border-zinc-100">
                      {(activeModalPost.channel?.accountName || activeModalPost.channel?.platform || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white p-0.5 border border-zinc-100">
                    <img
                      src={platformLogos[activeModalPost.channel?.platform ?? ""] || INSTAGRAM_LOGO}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 leading-none">
                    {activeModalPost.channel?.accountName || "Social Connection"}
                  </h4>
                  <span className="text-[11px] text-zinc-400 block mt-1 truncate max-w-[240px]">
                    {activeModalPost.article?.title || "Repurposed Newsletter"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 rounded-full bg-zinc-50 border border-zinc-100 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-600">
                  <Clock className="h-3 w-3 text-zinc-400" />
                  <span>{activeModalPost.scheduledAt ? formatFriendlyTime(activeModalPost.scheduledAt) : "Unscheduled"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModalPost(null);
                    setEditingPostId(null);
                    setReschedulingPostId(null);
                  }}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Post Draft Text or Editor */}
            {editingPostId === activeModalPost.id ? (
              <div className="flex flex-col gap-2.5">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full min-h-[220px] rounded-xl border border-zinc-200 p-3 text-xs leading-relaxed text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 font-normal font-sans"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPostId(null)}
                    className="rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-1.5 text-[11px] font-semibold text-zinc-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingEditId === activeModalPost.id}
                    onClick={() => handleSaveEdit(activeModalPost.id)}
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50"
                  >
                    {savingEditId === activeModalPost.id ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-50/50 rounded-2xl p-4 min-h-[180px] max-h-[300px] overflow-y-auto">
                <p className="text-xs text-zinc-800 leading-relaxed font-sans whitespace-pre-wrap">
                  {activeModalPost.content?.text || ""}
                </p>
              </div>
            )}

            {/* Inline Reschedule Fields */}
            {reschedulingPostId === activeModalPost.id && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/20 p-4 grid gap-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-800">
                  <Calendar className="h-3.5 w-3.5" />
                  Select New Publishing Date & Time
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setReschedulingPostId(null)}
                    className="rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-1.5 text-[11px] font-semibold text-zinc-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingRescheduleId === activeModalPost.id}
                    onClick={() => handleReschedule(activeModalPost.id)}
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 text-[11px] font-semibold transition-colors"
                  >
                    {savingRescheduleId === activeModalPost.id ? "Updating..." : "Reschedule"}
                  </button>
                </div>
              </div>
            )}

            {/* Action Bar Footer */}
            {editingPostId !== activeModalPost.id && reschedulingPostId !== activeModalPost.id && (
              <div className="flex items-center justify-between pt-4 mt-1 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => startEditing(activeModalPost.id, activeModalPost.content?.text ?? "")}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-500  transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit Text
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (activeModalPost.scheduledAt) {
                        startRescheduling(activeModalPost.id, activeModalPost.scheduledAt);
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-500 transition-colors"
                  >
                    <Calendar className="h-4 w-4" />
                    Reschedule
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={unschedulingId === activeModalPost.id}
                    onClick={() => handleUnschedule(activeModalPost.id)}
                    className="inline-flex items-center gap-1  px-3 py-1.5 text-[10px] font-bold text-zinc-600 transition-colors disabled:opacity-50"
                  >
                    {unschedulingId === activeModalPost.id ? "Drafting..." : "Unschedule"}
                  </button>

                  <button
                    type="button"
                    disabled={publishingId === activeModalPost.id}
                    onClick={() => handlePublishNow(activeModalPost.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary hover:bg-zinc-800 text-white px-3 py-1.5 text-[10px] font-bold transition-colors disabled:opacity-50"
                  >
                    {publishingId === activeModalPost.id ? "Sending..." : "Publish Now"}
                  </button>

                  <button
                    type="button"
                    disabled={deletingId === activeModalPost.id}
                    onClick={() => handleDeletePost(activeModalPost.id)}
                    className="text-zinc-400 hover:text-rose-600 transition-colors p-1 ml-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
