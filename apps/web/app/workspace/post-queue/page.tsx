"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  Loader2,
  Calendar,
} from "lucide-react";

import TimeZoneComponent from "@/app/components/workspace/timezone";
import { API_URL } from "@/lib/api-config";
import { authClient } from "@/lib/auth-client";
import { getBrowserTimezone, toUTCISOString } from "@/app/components/workspace/TimezoneSelect";
import { getPlatformLogo } from "@/app/components/workspace/shared/PlatformLogo";
import { CalendarGrid } from "@/app/components/workspace/queue/CalendarGrid";
import { QueuePostCard } from "@/app/components/workspace/queue/QueuePostCard";
import { PostDetailModal } from "@/app/components/workspace/queue/PostDetailModal";
import { useDraftsQueue } from "@/app/hooks/api/useDrafts";

interface QueuePost {
  id: string;
  status: string;
  scheduledAt: string;
  publishedAt?: string;
  content: { text: string };
  channel: { platform: string; accountName?: string; avatarUrl?: string };
  article?: { title?: string };
}

const MOCK_QUEUE_POSTS: QueuePost[] = (() => {
  const today = new Date();
  const dateTomorrow = new Date(today); dateTomorrow.setDate(today.getDate() + 1); dateTomorrow.setHours(14, 0, 0, 0);
  const dateToday = new Date(today); dateToday.setHours(18, 30, 0, 0);
  const dateYesterday = new Date(today); dateYesterday.setDate(today.getDate() - 1); dateYesterday.setHours(10, 15, 0, 0);
  return [
    { id: "mock-post-1", status: "scheduled", scheduledAt: dateTomorrow.toISOString(), content: { text: "I spent 30 hours analyzing why some newsletters go viral on LinkedIn.\n\nHere is the 3-step repurposing formula:\n\n1. Hook: Start with a contrarian result\n2. Body: Expand with 3 clear bullets\n3. Call to Action: Point to the original article" }, channel: { platform: "linkedin", accountName: "Sarah Chen (Founder)", avatarUrl: "https://images.squarespace-cdn.com/content/v1/687a750f2d0df239a6910948/df95c93a-1179-4c69-98f8-061719c5634b/Sarah+Chen.jpg" } },
    { id: "mock-post-2", status: "scheduled", scheduledAt: dateToday.toISOString(), content: { text: "90% of content repurposing is waste.\n\nMost creators copy-paste their newsletters to Twitter. It fails.\n\nHere is the system I use to translate deep essays into high-performing threads" }, channel: { platform: "x", accountName: "sarah_growth", avatarUrl: "https://images.squarespace-cdn.com/content/v1/687a750f2d0df239a6910948/df95c93a-1179-4c69-98f8-061719c5634b/Sarah+Chen.jpg" } },
    { id: "mock-post-3", status: "published", publishedAt: dateYesterday.toISOString(), scheduledAt: dateYesterday.toISOString(), content: { text: "The best newsletter creators don't rewrite. They translate.\n\nHere is how we grew our Threads channel using nothing but Substack archives." }, channel: { platform: "threads", accountName: "sarah_chen", avatarUrl: "https://images.squarespace-cdn.com/content/v1/687a750f2d0df239a6910948/df95c93a-1179-4c69-98f8-061719c5634b/Sarah+Chen.jpg" } },
  ];
})();

export default function PostQueuePage() {
  const session = authClient.useSession();
  const isGuest = !session.isPending && !session.data?.user;
  const isLoggedIn = !session.isPending && !!session.data?.user;

  const { data: queueData, isLoading: queueLoading } = useDraftsQueue(isLoggedIn);
  const [posts, setPosts] = useState<QueuePost[]>([]);

  useEffect(() => {
    if (isGuest && !session.isPending) setPosts(MOCK_QUEUE_POSTS);
    else if (queueData) setPosts(queueData as QueuePost[]);
  }, [isGuest, session.isPending, queueData]);

  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [activeModalPost, setActiveModalPost] = useState<QueuePost | null>(null);

  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [savingEditId, setSavingEditId] = useState<string | null>(null);

  const [reschedulingPostId, setReschedulingPostId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newTimezone] = useState(() => getBrowserTimezone());
  const [savingRescheduleId, setSavingRescheduleId] = useState<string | null>(null);

  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [unschedulingId, setUnschedulingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSaveEdit = async (postId: string) => {
    if (!editText.trim()) return;
    if (isGuest) {
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, content: { ...p.content, text: editText } } : p)));
      if (activeModalPost?.id === postId) setActiveModalPost((prev) => prev ? { ...prev, content: { ...prev.content, text: editText } } : null);
      setEditingPostId(null);
      return;
    }
    setSavingEditId(postId);
    try {
      const res = await fetch(`${API_URL}/articles/drafts/${postId}`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: editText }) });
      if (res.ok) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, content: { ...p.content, text: editText } } : p)));
        if (activeModalPost?.id === postId) setActiveModalPost((prev) => prev ? { ...prev, content: { ...prev.content, text: editText } } : null);
        setEditingPostId(null);
      }
    } catch { /* ignore */ } finally { setSavingEditId(null); }
  };

  const handleReschedule = async (postId: string) => {
    if (!newDate || !newTime) return;
    const scheduledAt = toUTCISOString(newDate, newTime, newTimezone);
    if (isGuest) {
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, scheduledAt, status: "scheduled" } : p)));
      if (activeModalPost?.id === postId) setActiveModalPost((prev) => prev ? { ...prev, scheduledAt, status: "scheduled" } : null);
      setReschedulingPostId(null);
      return;
    }
    setSavingRescheduleId(postId);
    try {
      const res = await fetch(`${API_URL}/articles/drafts/${postId}/schedule`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scheduledAt }) });
      if (res.ok) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, scheduledAt, status: "scheduled" } : p)));
        if (activeModalPost?.id === postId) setActiveModalPost((prev) => prev ? { ...prev, scheduledAt, status: "scheduled" } : null);
        setReschedulingPostId(null);
      }
    } catch { /* ignore */ } finally { setSavingRescheduleId(null); }
  };

  const handleUnschedule = async (postId: string) => {
    if (isGuest) { setPosts((prev) => prev.filter((p) => p.id !== postId)); if (activeModalPost?.id === postId) setActiveModalPost(null); return; }
    setUnschedulingId(postId);
    try {
      const res = await fetch(`${API_URL}/articles/drafts/${postId}/unschedule`, { method: "POST", credentials: "include" });
      if (res.ok) { setPosts((prev) => prev.filter((p) => p.id !== postId)); if (activeModalPost?.id === postId) setActiveModalPost(null); }
    } catch { /* ignore */ } finally { setUnschedulingId(null); }
  };

  const handlePublishNow = async (postId: string) => {
    if (isGuest) { setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, status: "published", publishedAt: new Date().toISOString() } : p))); if (activeModalPost?.id === postId) setActiveModalPost(null); return; }
    setPublishingId(postId);
    try {
      const res = await fetch(`${API_URL}/articles/drafts/${postId}/publish-now`, { method: "POST", credentials: "include" });
      if (res.ok) { setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, status: "published", publishedAt: new Date().toISOString() } : p))); if (activeModalPost?.id === postId) setActiveModalPost(null); }
      else { const data = (await res.json()) as { details?: string; error?: string }; alert(`Failed to publish: ${data.details || data.error || "Unknown error"}`); }
    } catch (e: unknown) { alert(`Error publishing post: ${e instanceof Error ? e.message : "Unknown error"}`); } finally { setPublishingId(null); }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to permanently delete this post?")) return;
    if (isGuest) { setPosts((prev) => prev.filter((p) => p.id !== postId)); if (activeModalPost?.id === postId) setActiveModalPost(null); return; }
    setDeletingId(postId);
    try {
      const res = await fetch(`${API_URL}/articles/drafts/${postId}`, { method: "DELETE", credentials: "include" });
      if (res.ok) { setPosts((prev) => prev.filter((p) => p.id !== postId)); if (activeModalPost?.id === postId) setActiveModalPost(null); }
    } catch { /* ignore */ } finally { setDeletingId(null); }
  };

  const startEditing = (postId: string, text: string) => { setEditingPostId(postId); setEditText(text); };
  const startRescheduling = (postId: string, currentScheduledAt: string) => {
    setReschedulingPostId(postId);
    const d = new Date(currentScheduledAt);
    setNewDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
    setNewTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
  };

  const formatFriendlyDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return "Today, " + date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow, " + date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  };

  const formatFriendlyTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  const scheduledPosts = posts.filter((p) => p.status === "scheduled" && p.scheduledAt);
  const publishedPosts = posts.filter((p) => p.status === "published");

  const groupedScheduledPosts = scheduledPosts.reduce<Record<string, QueuePost[]>>((groups, post) => {
    const key = formatFriendlyDate(post.scheduledAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(post);
    return groups;
  }, {});

  const loading = session.isPending || (isLoggedIn && queueLoading);

  const cardProps = (post: QueuePost) => ({
    post,
    isEditing: editingPostId === post.id,
    editText,
    onEditTextChange: setEditText,
    isSavingEdit: savingEditId === post.id,
    isRescheduling: reschedulingPostId === post.id,
    newDate,
    newTime,
    onNewDateChange: setNewDate,
    onNewTimeChange: setNewTime,
    isSavingReschedule: savingRescheduleId === post.id,
    isUnscheduling: unschedulingId === post.id,
    isPublishing: publishingId === post.id,
    isDeletingPost: deletingId === post.id,
    onStartEdit: () => startEditing(post.id, post.content.text),
    onCancelEdit: () => setEditingPostId(null),
    onSaveEdit: () => handleSaveEdit(post.id),
    onStartReschedule: () => startRescheduling(post.id, post.scheduledAt),
    onCancelReschedule: () => setReschedulingPostId(null),
    onSaveReschedule: () => handleReschedule(post.id),
    onUnschedule: () => handleUnschedule(post.id),
    onPublishNow: () => handlePublishNow(post.id),
    onDelete: () => handleDeletePost(post.id),
    formatTime: formatFriendlyTime,
  });

  return (
    <div className="w-full min-w-0 px-5 py-8 sm:px-8 md:px-10 lg:px-12 xl:px-14">
      <header className="mb-10 flex flex-col gap-6 border-b border-zinc-100 pb-8 lg:flex-row lg:items-start lg:justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">Calendar</h1></div>
        <TimeZoneComponent timezone={Intl.DateTimeFormat().resolvedOptions().timeZone} />
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
          <Loader2 className="h-7 w-7 animate-spin text-zinc-600" />
          <p className="mt-2 text-xs">Fetching your post-dispatch queue slots...</p>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            {scheduledPosts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 px-8 py-16 text-center">
                <p className="mx-auto max-w-md text-sm text-zinc-600">Calendar and publish slots are completely wired up! Go select an atomic idea and schedule its post.</p>
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link href="/workspace/create" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-800">
                    <Lightbulb className="h-4 w-4" /> Create social drafts
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-bold text-zinc-900 min-w-[120px]">{currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2>
                    <div className="flex rounded-xl border border-zinc-200/80 bg-white p-0.5">
                      <button type="button" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-50 transition-colors"><ChevronLeft className="h-4 w-4" /></button>
                      <button type="button" onClick={() => { const t = new Date(); setCurrentDate(t); setSelectedDate(t); }} className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold text-zinc-600 hover:bg-zinc-50 transition-colors border-x border-zinc-100">Today</button>
                      <button type="button" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-50 transition-colors"><ChevronRight className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="flex rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-1 text-[10px] font-bold text-zinc-500">
                    <button type="button" onClick={() => setViewMode("grid")} className={`rounded-lg px-3 py-1.5 transition-colors ${viewMode === "grid" ? "bg-white text-zinc-900" : "hover:text-zinc-800"}`}>Calendar Grid</button>
                    <button type="button" onClick={() => setViewMode("timeline")} className={`rounded-lg px-3 py-1.5 transition-colors ${viewMode === "timeline" ? "bg-white text-zinc-900" : "hover:text-zinc-800"}`}>List Timeline</button>
                  </div>
                </div>

                {viewMode === "grid" ? (
                  <CalendarGrid
                    currentDate={currentDate}
                    selectedDate={selectedDate}
                    posts={scheduledPosts}
                    onSelectDate={setSelectedDate}
                    onSelectPost={(p) => setActiveModalPost(p as QueuePost)}
                    formatTime={formatFriendlyTime}
                  />
                ) : (
                  <div className="flex flex-col gap-8 animate-in fade-in duration-200">
                    {Object.keys(groupedScheduledPosts).map((friendlyDate) => (
                      <div key={friendlyDate} className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 border-b border-zinc-100 pb-2">
                          <Calendar className="h-4 w-4 text-zinc-400" />
                          <h3 className="text-xs font-bold text-zinc-600">{friendlyDate}</h3>
                        </div>
                        <div className="grid gap-4">
                          {(groupedScheduledPosts[friendlyDate] ?? []).map((post) => (
                            <QueuePostCard key={post.id} {...cardProps(post)} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-6">
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

            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <h3 className="text-xs font-bold text-zinc-400 mb-3 flex items-center justify-between">
                <span>Recently Published</span>
                <span className="rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-[8px] font-bold px-2 py-0.5">History</span>
              </h3>
              {publishedPosts.length === 0 ? (
                <p className="text-xs text-zinc-400 font-light text-center py-6 border border-dashed border-zinc-100 rounded-xl">No social posts dispatched yet.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {publishedPosts.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-3 bg-zinc-50/30 p-2.5 rounded-xl border border-zinc-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative h-6 w-6 shrink-0">
                          {p.channel?.avatarUrl ? (
                            <img src={p.channel.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover border border-zinc-100" />
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[9px] font-bold text-black border border-zinc-100">
                              {(p.channel?.accountName || p.channel?.platform || "?").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-white p-0.5 border border-zinc-100">
                            <img src={getPlatformLogo(p.channel?.platform)} alt="" className="h-full w-full object-contain" />
                          </div>
                        </div>
                        <p className="text-xs text-zinc-800 font-medium truncate">{p.channel?.accountName || "Post Connection"}</p>
                      </div>
                      <span className="text-[9px] text-zinc-400 shrink-0">{p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeModalPost && (
        <PostDetailModal
          {...cardProps(activeModalPost)}
          onClose={() => { setActiveModalPost(null); setEditingPostId(null); setReschedulingPostId(null); }}
        />
      )}
    </div>
  );
}
