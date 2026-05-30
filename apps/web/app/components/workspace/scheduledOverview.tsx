"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar, Mail, Loader2 } from "lucide-react";
import { API_URL } from "@/lib/api-config";
import { LINKEDIN_LOGO, X_LOGO, THREADS_LOGO, INSTAGRAM_LOGO, FACEBOOK_LOGO } from "@/app/constants";

import { authClient } from "../../../lib/auth-client";

interface ScheduledPost {
  id: string;
  status: string;
  scheduledAt: string;
  channel?: {
    platform: string;
    accountName: string;
    avatarUrl?: string;
  };
}

const getMockScheduledPosts = () => {
  const today = new Date();
  
  const date1 = new Date(today);
  date1.setDate(today.getDate() + 1);
  date1.setHours(10, 0, 0, 0);

  const date2 = new Date(today);
  date2.setDate(today.getDate() + 1);
  date2.setHours(14, 30, 0, 0);

  const date3 = new Date(today);
  date3.setDate(today.getDate() + 2);
  date3.setHours(9, 15, 0, 0);

  const date4 = new Date(today);
  date4.setDate(today.getDate() + 2);
  date4.setHours(16, 0, 0, 0);

  return [
    {
      id: "mock-p1",
      status: "scheduled",
      scheduledAt: date1.toISOString(),
      channel: { platform: "linkedin", accountName: "Sarah Chen" }
    },
    {
      id: "mock-p2",
      status: "scheduled",
      scheduledAt: date2.toISOString(),
      channel: { platform: "x", accountName: "sarah_growth" }
    },
    {
      id: "mock-p3",
      status: "scheduled",
      scheduledAt: date3.toISOString(),
      channel: { platform: "instagram", accountName: "sarah_insta" }
    },
    {
      id: "mock-p4",
      status: "scheduled",
      scheduledAt: date4.toISOString(),
      channel: { platform: "threads", accountName: "sarah_chen" }
    }
  ];
};

export function ScheduledOverview() {
  const { data: session, isPending } = authClient.useSession();
  const isGuest = !isPending && !session?.user;

  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (!isPending) {
      if (isGuest) {
        setPosts(getMockScheduledPosts());
        setLoading(false);
      } else {
        fetchQueue();
      }
    }
  }, [isPending, isGuest]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/articles/drafts/queue`, { credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as any[];
        // Filter for scheduled posts
        const scheduled = data.filter((p: any) => p.status === "scheduled" && p.scheduledAt);
        setPosts(scheduled);
      }
    } catch (err) {
      console.error("Failed to load queue in overview:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format Month/Year
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthLabel = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Let's build the visual structure matching the image perfectly
  const getOverviewData = () => {
    // If we have actual posts scheduled in this month, display them
    const filtered = posts.filter(p => {
      const d = new Date(p.scheduledAt);
      return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth();
    });

    if (filtered.length > 0) {
      // Group by day of the month
      const groups: Record<number, { dayName: string; posts: typeof filtered }> = {};
      filtered.forEach(p => {
        const d = new Date(p.scheduledAt);
        const dayNum = d.getDate();
        const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
        if (!groups[dayNum]) {
          groups[dayNum] = { dayName, posts: [] };
        }
        groups[dayNum].posts.push(p);
      });

      // Sort by day number ascending
      return Object.entries(groups)
        .map(([day, val]) => ({
          day: parseInt(day),
          dayName: val.dayName,
          items: val.posts.map(p => {
            const dateObj = new Date(p.scheduledAt);
            const timeStr = dateObj.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true
            });
            return {
              id: p.id,
              platform: p.channel?.platform || "substack",
              time: timeStr,
            };
          })
        }))
        .sort((a, b) => a.day - b.day);
    }

    // Empty state for other months
    return [];
  };

  const overviewData = getOverviewData();

  // Helper for platform branding logo
  const getLogo = (platform: string) => {
    switch (platform) {
      case "linkedin":
        return (
          <div className="h-7 w-7 rounded-md flex items-center justify-center shrink-0 ">
            <img
              src={LINKEDIN_LOGO}
              alt="LinkedIn"
              className="h-4 w-4 object-contain"
            />
          </div>
        );
      case "x":
        return (
          <div className="h-7 w-7 rounded-md flex items-center justify-center shrink-0 ">
            <img
              src={X_LOGO}
              alt="X"
              className="h-3.5 w-3.5 object-contain"
            />
          </div>
        );
      case "threads":
        return (
          <div className="h-7 w-7 rounded-md  flex items-center justify-center shrink-0 ">
            <img
              src={THREADS_LOGO}
              alt="Threads"
              width={24}
              
              className="h-4 w-4 object-contain"
            />
          </div>
        );
      case "instagram":
        return (
          <div className="h-7 w-7 rounded-md flex items-center justify-center shrink-0 ">
            <img
              src={INSTAGRAM_LOGO}
              alt="Instagram"
              className="h-4 w-4 object-contain"
            />
          </div>
        );
      case "facebook":
        return (
          <div className="h-7 w-7 rounded-md bg-[#1877F2] flex items-center justify-center shrink-0 ">
            <img
              src={FACEBOOK_LOGO}
              alt="Facebook"
              className="h-4 w-4 object-contain"
            />
          </div>
        );
      default:
        return (
          <div className="h-7 w-7 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 shrink-0 ">
            <Mail className="h-3.5 w-3.5" />
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-sm rounded-2xl border border-zinc-200/90 bg-white p-5  font-sans">
      {/* Title */}
      <h3 className="text-sm font-bold text-zinc-800 tracking-tight mb-4">4. Schedule</h3>

      {/* Date Switcher */}
      <div className="flex items-center justify-between border-y border-zinc-100 py-3 mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-800">{monthLabel}</span>
          <Calendar className="h-3.5 w-3.5 text-indigo-500" />
        </div>
        <button
          onClick={handleNextMonth}
          className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-400 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          <span className="text-xs">Loading queue…</span>
        </div>
      ) : overviewData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-400 text-center px-4">
          <Calendar className="h-8 w-8 text-zinc-200 mb-2" />
          <span className="text-xs font-medium text-zinc-500">No scheduled posts this month</span>
          <span className="text-[10px] text-zinc-400 mt-1">Generate drafts and schedule them to fill the queue.</span>
        </div>
      ) : (
        <div className="space-y-6">
          {overviewData.map((dayGroup) => (
            <div key={dayGroup.day} className="flex gap-4 items-start">
              {/* Day info */}
              <div className="w-10 text-left shrink-0">
                <span className="text-[10px] font-bold text-zinc-400 block leading-tight">{dayGroup.dayName}</span>
                <span className="text-lg font-black text-zinc-800 leading-tight">{dayGroup.day}</span>
              </div>

              {/* Day items */}
              <div className="flex-1 space-y-3.5">
                {dayGroup.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {getLogo(item.platform)}
                      <span className="text-xs font-bold text-zinc-800">{item.time}</span>
                    </div>

                    <span className="rounded-full bg-emerald-50 border border-emerald-100/50 px-2.5 py-0.5 text-[9px] font-bold text-emerald-600 tracking-wide">
                      Scheduled
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Calendar Button */}
      <div className="mt-6 pt-4 border-t border-zinc-100">
        <Link
          href="/workspace/calendar"
          className="flex items-center justify-center w-full py-2.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-700 "
        >
          View calendar
        </Link>
      </div>
    </div>
  );
}
