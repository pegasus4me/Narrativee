"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronRight, ChevronLeft, Plus, Clock, Trash2, ArrowRight, CheckCircle2, Circle, Calendar as CalendarIcon, User, Sparkles, Loader2, List, XCircle, Zap } from "lucide-react";
import { API_URL } from "@/lib/api-config";
import { enhancePost } from "@/app/actions/agent";

interface Post {
    id: string;
    content: string;
    time?: string;
    status: "draft" | "scheduled" | "published" | "cancelled";
    date: string;
}

interface ProfileData {
    name?: string;
    handle?: string;
    image?: string;
}

const STATUS_CONFIG = {
    published: { label: "Published", color: "text-emerald-400 bg-emerald-900/20 border-emerald-800/30", dot: "bg-emerald-400", icon: CheckCircle2 },
    scheduled: { label: "Scheduled", color: "text-blue-400 bg-blue-900/20 border-blue-800/30", dot: "bg-blue-400", icon: Clock },
    cancelled: { label: "Cancelled", color: "text-red-400 bg-red-900/20 border-red-800/30", dot: "bg-red-400", icon: XCircle },
    draft: { label: "Draft", color: "text-gray-500 bg-gray-800/20 border-gray-700/30", dot: "bg-gray-500", icon: Circle },
};

export default function IDailyScheduler() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [posts, setPosts] = useState<Post[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isExtensionConnected, setIsExtensionConnected] = useState(false);
    const [profile, setProfile] = useState<ProfileData>({});
    const [onboardingData, setOnboardingData] = useState<any>({});
    const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
    const [statusFilter, setStatusFilter] = useState<Post['status'] | "all">("all");
    const [isEnhancing, setIsEnhancing] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [editContent, setEditContent] = useState("");
    const [editTime, setEditTime] = useState("");

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'NARRATIVEE_EXTENSION_READY') setIsExtensionConnected(true);
            if (event.data?.type === 'NARRATIVEE_SCHEDULED_POST_FIRED') {
                const { postId, status } = event.data;
                if (status !== 'published' && status !== 'cancelled') return;
                setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: status as Post['status'] } : p));
                fetch(`${API_URL}/scheduled-notes/${postId}/status`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    credentials: 'include', body: JSON.stringify({ status })
                }).catch(console.error);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`${API_URL}/onboarding`, { credentials: 'include' });
                if (res.ok) {
                    const data: any = await res.json();
                    setOnboardingData(data);
                    setProfile({ name: data.substackPublicationName || data.name, handle: data.substackHandle, image: data.substackPublicationLogo });
                }
            } catch (e) { console.error("Failed to fetch profile:", e); }
        };
        fetchProfile();
    }, []);

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                const res = await fetch(`${API_URL}/scheduled-notes`, { credentials: 'include' });
                if (res.ok) {
                    const data: any = await res.json();
                    const mapped: Post[] = (data.notes || []).map((n: any) => ({
                        id: n.id, content: n.content,
                        time: n.scheduledTime || undefined,
                        status: n.status as Post['status'],
                        date: n.scheduledDate,
                    }));
                    setPosts(mapped);
                }
            } catch (e) { console.error('Failed to fetch scheduled notes:', e); }
        };
        fetchNotes();
    }, []);

    const formatDateKey = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };
    const formatDisplayDate = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const formatMonthYear = (date: Date) => date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const currentDateKey = formatDateKey(selectedDate);
    const isToday = currentDateKey === formatDateKey(new Date());

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
        return days;
    };

    const calendarDays = getDaysInMonth(selectedDate);
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const getPostsForDate = (dateKey: string) => posts.filter(p => p.date === dateKey);

    const savePosts = (newPosts: Post[]) => setPosts(newPosts);

    const persistNote = async (post: Post) => {
        try {
            await fetch(`${API_URL}/scheduled-notes`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                body: JSON.stringify({ id: post.id, content: post.content, scheduledDate: post.date, scheduledTime: post.time || null, status: post.status }),
            });
        } catch (e) { console.error('Failed to save note:', e); }
    };

    const handleEnhance = async () => {
        if (!editContent.trim() || isEnhancing) return;
        setIsEnhancing(true);
        try {
            const savedRules = localStorage.getItem("narrativee_agent_rules");
            const rules: string[] = [];
            if (savedRules) {
                try { const parsed = JSON.parse(savedRules); rules.push(...parsed.map((r: any) => r.content)); } catch (e) { }
            }
            const enhanced = await enhancePost(editContent, {
                rules,
                connectedSources: { publicationName: onboardingData.substackPublicationName, publicationUrl: onboardingData.substackPublicationUrl, profileUrl: onboardingData.substackProfileUrl, bio: onboardingData.substackBio },
                platformPreferences: { writingStyle: onboardingData.writingStyle, language: onboardingData.language }
            });
            setEditContent(enhanced);
        } catch (error) { console.error("Enhancement failed:", error); }
        finally { setIsEnhancing(false); }
    };

    const dispatchMessage = (type: string, payload: any) => {
        if (typeof window !== 'undefined') window.postMessage({ type, payload }, "*");
    };

    const handleSavePost = async (scheduleViaExtension = false) => {
        if (!editContent.trim()) { setIsCreating(false); setEditingId(null); return; }

        if (isCreating) {
            const newPost: Post = { id: crypto.randomUUID(), content: editContent, time: editTime || undefined, status: editTime ? "scheduled" : "draft", date: currentDateKey };
            savePosts([...posts, newPost]);
            await persistNote(newPost);

            if (editTime && scheduleViaExtension) {
                const [hours, minutes] = editTime.split(':').map(Number);
                const scheduledDate = new Date(currentDateKey);
                scheduledDate.setHours(hours ?? 0, minutes ?? 0, 0, 0);
                const scheduledTimestamp = scheduledDate.getTime();
                const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                await fetch(`${API_URL}/scheduled-notes`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                    body: JSON.stringify({ id: newPost.id, content: editContent, scheduledDate: currentDateKey, scheduledTime: editTime, scheduledTimestamp, timezone, status: 'scheduled' }),
                }).catch(console.error);
                dispatchMessage('NARRATIVEE_SCHEDULE_POST', { postId: newPost.id, content: editContent, scheduledTimestamp, timezone, apiUrl: API_URL });
            }
            setIsCreating(false);
        } else if (editingId) {
            const updatedPost = posts.find(p => p.id === editingId);
            savePosts(posts.map(p => p.id === editingId ? { ...p, content: editContent, time: editTime } : p));
            if (updatedPost) await persistNote({ ...updatedPost, content: editContent, time: editTime });
            setEditingId(null);
        }
        setEditContent('');
        setEditTime('');
    };

    const startEditing = (post: Post) => { setEditingId(post.id); setEditContent(post.content); setEditTime(post.time || ""); setIsCreating(false); };
    const startCreating = () => { setIsCreating(true); setEditingId(null); setEditContent(""); setEditTime(""); };

    const deletePost = async (id: string) => {
        if (confirm("Delete this post?")) {
            savePosts(posts.filter(p => p.id !== id));
            try { await fetch(`${API_URL}/scheduled-notes/${id}`, { method: 'DELETE', credentials: 'include' }); }
            catch (e) { console.error('Failed to delete note:', e); }
        }
    };

    const changeDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + days);
        setSelectedDate(newDate);
        setIsCreating(false);
        setEditingId(null);
    };

    const movePostDate = (id: string, daysToAdd: number) => {
        const postToMove = posts.find(p => p.id === id);
        if (!postToMove) return;
        const [y = 0, m = 1, d = 1] = postToMove.date.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        dateObj.setDate(dateObj.getDate() + daysToAdd);
        const newDateKey = formatDateKey(dateObj);
        savePosts(posts.map(p => p.id === id ? { ...p, date: newDateKey } : p));
        persistNote({ ...postToMove, date: newDateKey });
    };

    const toggleStatus = async (id: string) => {
        const post = posts.find(p => p.id === id);
        if (!post) return;
        const cycle: Record<string, Post['status']> = { draft: "scheduled", scheduled: "cancelled", cancelled: "draft", published: "draft" };
        const newStatus = cycle[post.status] || "draft";
        savePosts(posts.map(p => p.id === id ? { ...p, status: newStatus } : p));
        try {
            await fetch(`${API_URL}/scheduled-notes/${id}/status`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                credentials: 'include', body: JSON.stringify({ status: newStatus }),
            });
        } catch (e) { console.error('Failed to update status:', e); }
    };

    const filteredPosts = posts.filter(p => p.date === currentDateKey && (statusFilter === "all" || p.status === statusFilter));
    const totalToday = posts.filter(p => p.date === currentDateKey).length;

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-100">Post Queue</h1>
                    <p className="text-sm text-gray-500 mt-1">Schedule and manage your Substack notes.</p>
                </div>
                <div className="flex items-center gap-3">
                    {isExtensionConnected && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/20 border border-emerald-800/30 rounded-xl">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span className="text-xs text-emerald-400 font-medium">Extension linked</span>
                        </div>
                    )}
                    {/* View Toggle */}
                    <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl border border-white/[0.06] p-1">
                        <button
                            onClick={() => setViewMode("list")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors font-medium ${viewMode === "list" ? "bg-white/10 text-gray-100" : "text-gray-500 hover:text-gray-300"}`}
                        >
                            <List className="w-3 h-3" /> List
                        </button>
                        <button
                            onClick={() => setViewMode("calendar")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors font-medium ${viewMode === "calendar" ? "bg-white/10 text-gray-100" : "text-gray-500 hover:text-gray-300"}`}
                        >
                            <CalendarIcon className="w-3 h-3" /> Calendar
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === "calendar" ? (
                /* ── CALENDAR VIEW ── */
                <div className="bg-[#1a1b1d] rounded-2xl border border-white/[0.06] p-6 flex flex-col gap-4">
                    {/* Month nav */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-200">{formatMonthYear(selectedDate)}</span>
                        <div className="flex items-center gap-1">
                            <button onClick={() => { const d = new Date(selectedDate); d.setMonth(d.getMonth() - 1); setSelectedDate(d); }} className="p-1.5 text-gray-500 hover:text-gray-200 hover:bg-white/5 rounded-lg transition-colors">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={() => setSelectedDate(new Date())} className="px-3 py-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-lg transition-colors font-medium">Today</button>
                            <button onClick={() => { const d = new Date(selectedDate); d.setMonth(d.getMonth() + 1); setSelectedDate(d); }} className="p-1.5 text-gray-500 hover:text-gray-200 hover:bg-white/5 rounded-lg transition-colors">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-1">
                        {weekDays.map(day => (
                            <div key={day} className="text-center text-[10px] font-medium text-gray-600 uppercase tracking-wider py-1">{day}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((date, i) => {
                            if (!date) return <div key={`empty-${i}`} />;
                            const dateKey = formatDateKey(date);
                            const isSelected = dateKey === currentDateKey;
                            const isCurrentToday = dateKey === formatDateKey(new Date());
                            const dayPosts = getPostsForDate(dateKey);
                            return (
                                <div
                                    key={dateKey}
                                    onClick={() => { setSelectedDate(date); setViewMode("list"); }}
                                    className={`relative flex flex-col p-2 rounded-xl border cursor-pointer transition-all min-h-[72px] ${isSelected ? 'bg-violet-900/20 border-violet-700/40' : 'bg-white/[0.02] border-white/[0.04] hover:border-white/10'}`}
                                >
                                    <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isCurrentToday ? 'bg-violet-600 text-white' : isSelected ? 'text-violet-300' : 'text-gray-500'}`}>
                                        {date.getDate()}
                                    </span>
                                    <div className="flex flex-col gap-0.5">
                                        {dayPosts.slice(0, 2).map(post => {
                                            const cfg = STATUS_CONFIG[post.status];
                                            return (
                                                <div key={post.id} className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium ${cfg.color} border`}>
                                                    <div className={`w-1 h-1 rounded-full ${cfg.dot} shrink-0`} />
                                                    <span className="truncate">{post.time || 'Draft'}</span>
                                                </div>
                                            );
                                        })}
                                        {dayPosts.length > 2 && <span className="text-[9px] text-gray-600 pl-1">+{dayPosts.length - 2}</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* ── LIST VIEW ── */
                <div className="flex flex-col gap-4">
                    {/* Date Nav */}
                    <div className="bg-[#1a1b1d] rounded-2xl border border-white/[0.06] px-5 py-4 flex items-center justify-between">
                        <button onClick={() => changeDate(-1)} className="p-1.5 text-gray-500 hover:text-gray-200 hover:bg-white/5 rounded-lg transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex flex-col items-center gap-0.5">
                            <span className="text-sm font-semibold text-gray-200">{formatDisplayDate(selectedDate)}</span>
                            <div className="flex items-center gap-2">
                                {isToday && <span className="text-[10px] text-violet-400 font-medium uppercase tracking-wider">Today</span>}
                                {totalToday > 0 && <span className="text-[10px] text-gray-600">{totalToday} note{totalToday !== 1 ? 's' : ''}</span>}
                            </div>
                        </div>
                        <button onClick={() => changeDate(1)} className="p-1.5 text-gray-500 hover:text-gray-200 hover:bg-white/5 rounded-lg transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl border border-white/[0.06] p-1 self-start">
                        {(["all", "draft", "scheduled", "published", "cancelled"] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setStatusFilter(f as any)}
                                className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-medium capitalize ${statusFilter === f
                                    ? f === 'published' ? 'bg-emerald-900/40 text-emerald-400'
                                    : f === 'scheduled' ? 'bg-blue-900/40 text-blue-400'
                                    : f === 'cancelled' ? 'bg-red-900/40 text-red-400'
                                    : f === 'draft' ? 'bg-white/10 text-gray-300'
                                    : 'bg-white/10 text-gray-100'
                                    : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Posts */}
                    <div className="flex flex-col gap-3">
                        {filteredPosts.map((post) => (
                            <div key={post.id} className={`bg-[#1a1b1d] rounded-xl border transition-all group ${editingId === post.id ? 'border-violet-500/50 ring-1 ring-violet-500/20' : 'border-white/[0.06] hover:border-white/[0.1]'}`}>
                                {editingId === post.id ? (
                                    <div className="p-5 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-3.5 h-3.5 text-gray-500" />
                                            <input
                                                type="time"
                                                value={editTime}
                                                onChange={(e) => setEditTime(e.target.value)}
                                                className="text-xs border border-white/[0.06] bg-white/[0.03] text-gray-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500/50"
                                            />
                                            <button
                                                onClick={handleEnhance}
                                                disabled={isEnhancing || !editContent.trim()}
                                                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-lg disabled:opacity-50 transition-all"
                                            >
                                                {isEnhancing ? <><Loader2 className="w-3 h-3 animate-spin" /> Enhancing...</> : <><Sparkles className="w-3 h-3" /> Enhance</>}
                                            </button>
                                        </div>
                                        <textarea
                                            ref={textareaRef}
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="w-full text-sm text-gray-200 bg-transparent resize-none outline-none min-h-[100px] leading-relaxed"
                                            placeholder="What are you writing about?"
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.04]">
                                            <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-300 text-xs px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">Cancel</button>
                                            <button onClick={() => handleSavePost()} className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-4 py-1.5 rounded-lg transition-colors">Save</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-5">
                                        <div className="flex gap-3">
                                            {profile.image ? (
                                                <img src={profile.image} alt={profile.name || "Profile"} className="w-9 h-9 rounded-full object-cover shrink-0" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-violet-900/40 flex items-center justify-center shrink-0">
                                                    <User className="w-4 h-4 text-violet-400" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-sm font-medium text-gray-200 truncate">{profile.name || "Your Name"}</span>
                                                    {profile.handle && <span className="text-xs text-gray-500">@{profile.handle}</span>}
                                                    {post.time && (
                                                        <><span className="text-gray-700">·</span><span className="text-xs text-gray-500 font-mono">{post.time}</span></>
                                                    )}
                                                </div>
                                                <p onClick={() => startEditing(post)} className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap cursor-text">
                                                    {post.content}
                                                </p>
                                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
                                                    <button
                                                        onClick={() => toggleStatus(post.id)}
                                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors ${STATUS_CONFIG[post.status].color}`}
                                                    >
                                                        <div className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[post.status].dot}`} />
                                                        {STATUS_CONFIG[post.status].label}
                                                    </button>
                                                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => movePostDate(post.id, -1)} title="Previous day" className="p-1.5 text-gray-600 hover:text-gray-300 hover:bg-white/5 rounded-lg transition-colors rotate-180">
                                                            <ArrowRight className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => movePostDate(post.id, 1)} title="Next day" className="p-1.5 text-gray-600 hover:text-gray-300 hover:bg-white/5 rounded-lg transition-colors">
                                                            <ArrowRight className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => deletePost(post.id)} title="Delete" className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Composer */}
                        {isCreating ? (
                            <div className="bg-[#1a1b1d] rounded-xl border border-violet-500/50 ring-1 ring-violet-500/20 p-5 space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">New Note</span>
                                    <div className="w-px h-3 bg-white/10" />
                                    <Clock className="w-3.5 h-3.5 text-gray-600" />
                                    <input
                                        type="time"
                                        value={editTime}
                                        onChange={(e) => setEditTime(e.target.value)}
                                        className="text-xs border border-white/[0.06] bg-white/[0.03] text-gray-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500/50"
                                    />
                                </div>
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full text-sm text-gray-200 bg-transparent resize-none outline-none min-h-[100px] leading-relaxed"
                                    placeholder="What's on your mind?"
                                    autoFocus
                                />
                                <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                                    <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-gray-300 text-xs px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">Cancel</button>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { handleSavePost(false); dispatchMessage("NARRATIVEE_PUBLISH_POST", { content: editContent, time: editTime, date: currentDateKey }); }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/[0.06] text-gray-300 text-xs font-medium rounded-lg transition-all"
                                        >
                                            <Zap className="w-3 h-3 text-orange-400" /> Post Now
                                        </button>
                                        <button onClick={() => handleSavePost(true)} className="flex items-center gap-1.5 px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-all">
                                            <Clock className="w-3 h-3" /> Schedule
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={startCreating}
                                className="flex items-center justify-center gap-2 w-full py-4 rounded-xl border border-dashed border-white/[0.08] text-gray-600 hover:text-gray-300 hover:border-white/20 transition-all text-sm"
                            >
                                <Plus className="w-4 h-4" /> New note
                            </button>
                        )}

                        {/* Empty state */}
                        {filteredPosts.length === 0 && !isCreating && (
                            <div className="flex flex-col items-center justify-center py-16 gap-4">
                                <div className="w-14 h-14 bg-white/[0.03] rounded-2xl border border-white/[0.06] flex items-center justify-center">
                                    <CalendarIcon className="w-6 h-6 text-gray-600" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-gray-400 font-medium mb-1">Nothing scheduled</h3>
                                    <p className="text-gray-600 text-sm">No notes for {formatDisplayDate(selectedDate)}.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {!isToday && (
                        <button onClick={() => setSelectedDate(new Date())} className="text-xs text-gray-500 hover:text-gray-300 self-center transition-colors">
                            ← Back to today
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
