"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronRight, ChevronLeft, Plus, Clock, Trash2, ArrowRight, CheckCircle2, Circle, Calendar as CalendarIcon, User, Sparkles, Loader2, List } from "lucide-react";
import { API_URL } from "@/lib/api-config";
import { enhancePost } from "@/app/actions/agent";

interface Post {
    id: string;
    content: string;
    time?: string;
    status: "draft" | "scheduled" | "published";
    date: string; // YYYY-MM-DD
}

interface ProfileData {
    name?: string;
    handle?: string;
    image?: string;
}

export default function IDailyScheduler() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [posts, setPosts] = useState<Post[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isExtensionConnected, setIsExtensionConnected] = useState(false);
    const [profile, setProfile] = useState<ProfileData>({});
    const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

    // AI Enhancement state
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [showEnhanceButton, setShowEnhanceButton] = useState(false);
    const [enhanceButtonPosition, setEnhanceButtonPosition] = useState({ x: 0, y: 0 });
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Listen for extension handshake
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'NARRATIVEE_EXTENSION_READY') {
                setIsExtensionConnected(true);
            }
            // Mark a post as published when its alarm fires
            if (event.data?.type === 'NARRATIVEE_SCHEDULED_POST_FIRED') {
                const { postId } = event.data;
                setPosts(prev => prev.map(p =>
                    p.id === postId ? { ...p, status: 'published' as const } : p
                ));
                // Persist status change to DB
                fetch(`${API_URL}/scheduled-notes/${postId}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ status: 'published' })
                }).catch(console.error);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // Fetch profile data from onboarding
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`${API_URL}/onboarding`, { credentials: 'include' });
                if (res.ok) {
                    const data: any = await res.json();
                    setProfile({
                        name: data.substackPublicationName || data.name,
                        handle: data.substackHandle,
                        image: data.substackPublicationLogo
                    });
                }
            } catch (e) {
                console.error("Failed to fetch profile:", e);
            }
        };
        fetchProfile();
    }, []);

    // Form state for creating/editing
    const [editContent, setEditContent] = useState("");
    const [editTime, setEditTime] = useState("");

    // Helper: Format Date to YYYY-MM-DD
    const formatDateKey = (date: Date): string => {
        return date.toISOString().split('T')[0] || "";
    };

    // Helper: Format Display Date (e.g., "Friday, Feb 7")
    const formatDisplayDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    };

    const formatMonthYear = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const currentDateKey = formatDateKey(selectedDate);
    const isToday = currentDateKey === formatDateKey(new Date());

    // --- Calendar Logic ---
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        // Pad empty days at start of month
        for (let i = 0; i < firstDay === 0 ? 6 : firstDay - 1; i++) {
            days.push(null);
        }
        // Add actual days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const calendarDays = getDaysInMonth(selectedDate);
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const getPostsForDate = (dateKey: string) => {
        return posts.filter(p => p.date === dateKey);
    };

    // Load from database
    useEffect(() => {
        const fetchNotes = async () => {
            try {
                const res = await fetch(`${API_URL}/scheduled-notes`, { credentials: 'include' });
                console.log('[Scheduler] GET /scheduled-notes status:', res.status);
                if (res.ok) {
                    const data: any = await res.json();
                    console.log('[Scheduler] Loaded notes from DB:', data.notes?.length || 0);
                    const mapped: Post[] = (data.notes || []).map((n: any) => ({
                        id: n.id,
                        content: n.content,
                        time: n.scheduledTime || undefined,
                        status: n.status as Post['status'],
                        date: n.scheduledDate,
                    }));
                    setPosts(mapped);
                } else {
                    console.error('[Scheduler] GET failed:', await res.text());
                }
            } catch (e) {
                console.error('Failed to fetch scheduled notes:', e);
            }
        };
        fetchNotes();
    }, []);

    // Save helper — updates local state only (API calls happen at the call site)
    const savePosts = (newPosts: Post[]) => {
        setPosts(newPosts);
    };

    // Persist a single note to the DB
    const persistNote = async (post: Post) => {
        try {
            const res = await fetch(`${API_URL}/scheduled-notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    id: post.id,
                    content: post.content,
                    scheduledDate: post.date,
                    scheduledTime: post.time || null,
                    status: post.status,
                }),
            });
            console.log('[Scheduler] POST /scheduled-notes status:', res.status, await res.json());
        } catch (e) {
            console.error('Failed to save note:', e);
        }
    };

    // Handle text selection to show enhance button
    const handleTextSelection = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);

        if (selectedText.length > 3) {
            // Show button near cursor - position it above the textarea
            const rect = textarea.getBoundingClientRect();
            setEnhanceButtonPosition({
                x: rect.left + rect.width / 2,
                y: rect.top - 10
            });
            setShowEnhanceButton(true);
        } else {
            setShowEnhanceButton(false);
        }
    };

    // Handle AI enhancement
    const handleEnhance = async () => {
        if (!editContent.trim() || isEnhancing) return;

        setIsEnhancing(true);
        setShowEnhanceButton(false);

        try {
            // Load rules from localStorage
            const savedRules = localStorage.getItem("narrativee_agent_rules");
            const rules: string[] = [];
            if (savedRules) {
                try {
                    const parsed = JSON.parse(savedRules);
                    rules.push(...parsed.map((r: any) => r.content));
                } catch (e) { }
            }

            const enhanced = await enhancePost(editContent, {
                rules,
                platformPreferences: { writingStyle: "casual" }
            });

            setEditContent(enhanced);
        } catch (error) {
            console.error("Enhancement failed:", error);
        } finally {
            setIsEnhancing(false);
        }
    };

    // Hide enhance button on click outside
    useEffect(() => {
        const handleClickOutside = () => setShowEnhanceButton(false);
        if (showEnhanceButton) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showEnhanceButton]);

    const handleSavePost = async (scheduleViaExtension = false) => {
        if (!editContent.trim()) {
            setIsCreating(false);
            setEditingId(null);
            return;
        }

        if (isCreating) {
            const newPost: Post = {
                id: crypto.randomUUID(),
                content: editContent,
                time: editTime || undefined,
                status: editTime ? "scheduled" : "draft",
                date: currentDateKey
            };
            savePosts([...posts, newPost]);
            await persistNote(newPost);

            // Register the alarm in the extension if scheduling
            if (editTime && scheduleViaExtension) {
                const [hours, minutes] = editTime.split(':').map(Number);
                const scheduledDate = new Date(currentDateKey);
                scheduledDate.setHours(hours ?? 0, minutes ?? 0, 0, 0);
                dispatchMessage('NARRATIVEE_SCHEDULE_POST', {
                    postId: newPost.id,
                    content: editContent,
                    scheduledTimestamp: scheduledDate.getTime()
                });
            }

            setIsCreating(false);
        } else if (editingId) {
            const updatedPost = posts.find(p => p.id === editingId);
            const updated = posts.map(p => p.id === editingId ? { ...p, content: editContent, time: editTime } : p);
            savePosts(updated);
            if (updatedPost) {
                await persistNote({ ...updatedPost, content: editContent, time: editTime });
            }
            setEditingId(null);
        }

        setEditContent('');
        setEditTime('');
    };

    const startEditing = (post: Post) => {
        setEditingId(post.id);
        setEditContent(post.content);
        setEditTime(post.time || "");
        setIsCreating(false);
    };

    const startCreating = () => {
        setIsCreating(true);
        setEditingId(null);
        setEditContent("");
        setEditTime("");
    };

    const deletePost = async (id: string) => {
        if (confirm("Are you sure you want to delete this post?")) {
            savePosts(posts.filter(p => p.id !== id));
            try {
                await fetch(`${API_URL}/scheduled-notes/${id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });
            } catch (e) {
                console.error('Failed to delete note:', e);
            }
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
        const movedPost = posts.find(p => p.id === id);
        if (movedPost) {
            persistNote({ ...movedPost, date: newDateKey });
        }
    };

    // Dispatch message to Chrome Extension
    const dispatchMessage = (type: string, payload: any) => {
        if (typeof window !== 'undefined') {
            window.postMessage({ type, payload }, "*");
            console.log(`[Narrativee] Dispatched: ${type}`, payload);
        }
    };

    const toggleStatus = async (id: string) => {
        const post = posts.find(p => p.id === id);
        if (!post) return;

        const statusCycle: Record<string, "draft" | "scheduled" | "published"> = {
            draft: "scheduled",
            scheduled: "published",
            published: "draft"
        };
        const newStatus = statusCycle[post.status] || "draft";

        savePosts(posts.map(p => p.id === id ? { ...p, status: newStatus } : p));

        try {
            await fetch(`${API_URL}/scheduled-notes/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: newStatus }),
            });
        } catch (e) {
            console.error('Failed to update status:', e);
        }
    };

    const filteredPosts = posts.filter(p => p.date === currentDateKey);

    return (
        <div className="flex flex-col h-full rounded-lg overflow-hidden">
            {/* Header Navigation */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#2D2E2F]">
                <div className="flex items-center gap-1" title={isExtensionConnected ? "Extension Connected" : "Extension Not Found"}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isExtensionConnected ? 'bg-green-500' : 'bg-gray-600'}`} />
                    <span className="text-[9px] text-gray-500">{isExtensionConnected ? 'Linked' : ''}</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => changeDate(-1)}
                        className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-md transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex flex-col items-center justify-center min-w-[140px]">
                        <span className="text-gray-200 font-medium text-xs flex items-center gap-2">
                            {formatDisplayDate(selectedDate)}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                            {isToday && <span className="text-[10px] text-blue-400 font-medium uppercase tracking-wider">Today</span>}
                            {/* Connection Indicator */}
                        </div>
                    </div>

                    <button
                        onClick={() => changeDate(1)}
                        className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-md transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {!isToday && (
                    <button onClick={() => setSelectedDate(new Date())} className="text-xs text-gray-400 hover:text-gray-200 font-medium">
                        Today
                    </button>
                )}

                {/* View Toggle */}
                <div className="flex bg-[#1e1f21] rounded-lg p-0.5 ml-auto border border-[#2D2E2F]">
                    <button
                        onClick={() => setViewMode("list")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === "list" ? "bg-[#2a2b2d] text-gray-200 shadow-sm border border-gray-600/50" : "text-gray-500 hover:text-gray-300"}`}
                    >
                        <List className="w-3.5 h-3.5" />
                        List
                    </button>
                    <button
                        onClick={() => setViewMode("calendar")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === "calendar" ? "bg-[#2a2b2d] text-gray-200 shadow-sm border border-gray-600/50" : "text-gray-500 hover:text-gray-300"}`}
                    >
                        <CalendarIcon className="w-3.5 h-3.5" />
                        Grid
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-5 bg-[#161718] overflow-y-auto space-y-3">

                {viewMode === "calendar" ? (
                    <div className="bg-[#1e1f21]/40 rounded-xl border border-[#2D2E2F] p-5 h-full flex flex-col">
                        <div className="grid grid-cols-7 gap-2 mb-2">
                            {weekDays.map(day => (
                                <div key={day} className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-2 flex-1">
                            {calendarDays.map((date, i) => {
                                if (!date) return <div key={`empty-${i}`} className="bg-transparent" />;

                                const dateKey = formatDateKey(date);
                                const isCurrentDate = dateKey === currentDateKey;
                                const isCurrentToday = dateKey === formatDateKey(new Date());
                                const dayPosts = getPostsForDate(dateKey);

                                return (
                                    <div
                                        key={dateKey}
                                        onClick={() => {
                                            setSelectedDate(date);
                                            setViewMode("list");
                                        }}
                                        className={`relative flex flex-col p-2 rounded-lg border cursor-pointer hover:border-gray-500 transition-all min-h-[80px]
                                        ${isCurrentDate ? 'bg-blue-900/10 border-blue-500/50 ring-1 ring-blue-500/20' : 'bg-[#2a2b2d]/30 border-[#2D2E2F]'}
                                    `}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-sm font-medium ${isCurrentToday ? 'text-blue-400 bg-blue-400/10 w-6 h-6 flex items-center justify-center rounded-full' : isCurrentDate ? 'text-gray-200' : 'text-gray-400'}`}>
                                                {date.getDate()}
                                            </span>
                                            {dayPosts.length > 0 && (
                                                <span className="text-[10px] bg-gray-700/50 text-gray-300 px-1.5 py-0.5 rounded-full font-medium">
                                                    {dayPosts.length}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex-1 overflow-y-auto flex flex-col gap-1 no-scrollbar mt-1">
                                            {dayPosts.slice(0, 3).map(post => (
                                                <div key={post.id} className="flex items-center gap-1.5">
                                                    {post.status === 'published' ? (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                                    ) : post.status === 'scheduled' ? (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                                    ) : (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0" />
                                                    )}
                                                    <span className="text-[10px] text-gray-400 truncate font-medium">
                                                        {post.time || 'Draft'}
                                                    </span>
                                                </div>
                                            ))}
                                            {dayPosts.length > 3 && (
                                                <div className="text-[10px] text-gray-500 pl-3">
                                                    +{dayPosts.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* List of Posts */}
                        {filteredPosts.map((post) => (
                            <div key={post.id} className={`bg-[#1e1f21]/20 p-3 rounded-md  transition-all group ${editingId === post.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-700 hover:border-gray-600'}`}>

                                {editingId === post.id ? (
                                    // EDIT MODE
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="w-4 h-4 text-gray-500" />
                                            <input
                                                type="time"
                                                value={editTime}
                                                onChange={(e) => setEditTime(e.target.value)}
                                                className="text-sm border border-gray-600 bg-[#2a2b2d] text-gray-200 rounded px-2 py-1 outline-none focus:border-blue-500"
                                            />

                                            {/* Enhance Button - always visible when editing */}
                                            <button
                                                onClick={handleEnhance}
                                                disabled={isEnhancing || !editContent.trim()}
                                                className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-md hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                {isEnhancing ? (
                                                    <>
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                        Enhancing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-3 h-3" />
                                                        Enhance
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <textarea
                                            ref={textareaRef}
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            onSelect={handleTextSelection}
                                            onMouseUp={handleTextSelection}
                                            className="w-full text-base text-gray-200 bg-transparent resize-none outline-none min-h-[80px]"
                                            placeholder="What are you writing about?"
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-700">
                                            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-200 text-sm px-3 py-1">Cancel</button>
                                            <button onClick={() => handleSavePost()} className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-md hover:bg-blue-500">Save</button>
                                        </div>
                                    </div>
                                ) : (
                                    // VIEW MODE - Substack-like card
                                    <div className="relative">
                                        {/* Profile + Content Row */}
                                        <div className="flex gap-3">
                                            {/* Avatar */}
                                            {profile.image ? (
                                                <img
                                                    src={profile.image}
                                                    alt={profile.name || "Profile"}
                                                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                                                    <User className="w-5 h-5 text-gray-500" />
                                                </div>
                                            )}

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                {/* Name + Handle + Time */}
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="text-sm font-medium text-gray-200 truncate">
                                                        {profile.name || "Your Name"}
                                                    </span>
                                                    {profile.handle && (
                                                        <span className="text-xs text-gray-500">@{profile.handle}</span>
                                                    )}
                                                    <span className="text-gray-600">·</span>
                                                    <span className={`text-xs font-mono ${post.time ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {post.time || "No time"}
                                                    </span>
                                                </div>

                                                {/* Post Content */}
                                                <div onClick={() => startEditing(post)} className="cursor-text">
                                                    <p className="text-base text-gray-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                                                </div>

                                                {/* Status + Actions Row */}
                                                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-700/50">
                                                    <button onClick={() => toggleStatus(post.id)} className="text-xs flex items-center gap-1 hover:opacity-70 transition-opacity">
                                                        {post.status === 'published' ? (
                                                            <span className="flex items-center gap-1 text-green-400"><CheckCircle2 className="w-3 h-3" /> Published</span>
                                                        ) : post.status === 'scheduled' ? (
                                                            <span className="flex items-center gap-1 text-blue-400"><Clock className="w-3 h-3" /> Scheduled</span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-gray-500"><Circle className="w-3 h-3" /> Draft</span>
                                                        )}
                                                    </button>

                                                    {/* Action Menu */}
                                                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => movePostDate(post.id, -1)} title="Previous Day" className="rotate-180 p-1 text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded">
                                                            <ArrowRight className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => movePostDate(post.id, 1)} title="Next Day" className="p-1 text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded">
                                                            <ArrowRight className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => deletePost(post.id)} title="Delete" className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-900/30 rounded">
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

                        {/* Create New Block */}
                        {isCreating ? (
                            <div className="bg-[#1e1f21] p-4 rounded-lg border border-blue-500 ring-1 ring-blue-500">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">New Post</span>
                                        <div className="h-3 w-px bg-gray-600" />
                                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                                        <input
                                            type="time"
                                            value={editTime}
                                            onChange={(e) => setEditTime(e.target.value)}
                                            className="text-sm border border-gray-600 bg-[#2a2b2d] text-gray-200 rounded px-2 py-1 outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full text-base text-gray-200 bg-transparent resize-none outline-none min-h-[80px]"
                                        placeholder="What's on your mind?"
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-700">
                                        <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-200 text-sm px-3 py-1">Cancel</button>
                                        <button onClick={() => {
                                            // Post Now: immediate publish via extension
                                            handleSavePost(false);
                                            dispatchMessage("NARRATIVEE_PUBLISH_POST", {
                                                content: editContent,
                                                time: editTime,
                                                date: currentDateKey
                                            });
                                        }} className="bg-[#2a2b2d] border border-gray-600 text-gray-200 text-sm px-3 py-1.5 rounded-md hover:bg-gray-700">
                                            Post Now
                                        </button>
                                        <button onClick={() => handleSavePost(true)} className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-md hover:bg-blue-500">Schedule</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={startCreating}
                                className="rounded-lg p-5 flex flex-col items-center justify-center text-gray-500 hover:text-gray-300 hover:border-gray-500 transition-colors cursor-pointer"
                            >
                                <Plus className="w-5 h-5 mb-1" />
                                <span className="text-sm">Schedule new note</span>
                            </div>
                        )}

                        {filteredPosts.length === 0 && !isCreating && (
                            <div className="text-center py-8 text-gray-500 text-sm">
                                No posts for {formatDisplayDate(selectedDate)}
                            </div>
                        )}
                    </>
                )}

            </div>
        </div>
    );
}
