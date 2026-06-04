"use client";

import type { ScheduledQueuePost } from "./queue.types";

interface CalendarGridProps {
  currentDate: Date;
  selectedDate: Date | null;
  posts: ScheduledQueuePost[];
  onSelectDate: (date: Date) => void;
  onSelectPost: (post: ScheduledQueuePost) => void;
  formatTime: (d: string) => string;
}

const HOURS = Array.from({ length: 24 }, (_unusedValue, index) => index);

function getPostsForDate(posts: ScheduledQueuePost[], date: Date): ScheduledQueuePost[] {
  return posts.filter((post) => {
    const postDate = new Date(post.scheduledAt);
    return postDate.getFullYear() === date.getFullYear() && postDate.getMonth() === date.getMonth() && postDate.getDate() === date.getDate();
  });
}

function getWeekDays(date: Date): Date[] {
  const startOfWeek = new Date(date);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(date.getDate() - date.getDay());

  return Array.from({ length: 7 }, (_unusedValue, index) => {
    const weekDate = new Date(startOfWeek);
    weekDate.setDate(startOfWeek.getDate() + index);
    return weekDate;
  });
}

function getPostsForHour(posts: ScheduledQueuePost[], date: Date, hour: number): ScheduledQueuePost[] {
  return getPostsForDate(posts, date).filter((post) => new Date(post.scheduledAt).getHours() === hour);
}

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
}

function getPlatformColor(platform?: string): string {
  if (platform === "linkedin") return "border-blue-400/30 bg-blue-500/10 text-blue-100";
  if (platform === "x") return "border-zinc-600 bg-zinc-900 text-zinc-100";
  if (platform === "threads") return "border-zinc-500/30 bg-zinc-800/70 text-zinc-100";
  if (platform === "instagram") return "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-100";
  return "border-rose-400/30 bg-rose-500/10 text-rose-100";
}

export function CalendarGrid({ currentDate, selectedDate, posts, onSelectDate, onSelectPost, formatTime }: CalendarGridProps) {
  const weekDays = getWeekDays(currentDate);

  return (
    <div className="animate-in fade-in duration-200">
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
        <div className="grid grid-cols-[72px_repeat(7,minmax(140px,1fr))] border-b border-zinc-800 bg-zinc-950">
          <div className="border-r border-zinc-800 px-3 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">
            GMT
          </div>
          {weekDays.map((date) => {
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => onSelectDate(date)}
                className={`border-r border-zinc-800 px-3 py-3 text-left transition-colors last:border-r-0 ${
                  isSelected ? "bg-brand/10 text-white font-semibold" : "hover:bg-brand/5"
                }`}
              >
                <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  isToday ? "bg-brand text-white" : "text-zinc-100"
                }`}>
                  {date.getDate()}
                </span>
              </button>
            );
          })}
        </div>

        <div className="max-h-[760px] overflow-auto">
          <div className="grid grid-cols-[72px_repeat(7,minmax(140px,1fr))]">
            {HOURS.map((hour) => (
              <div key={hour} className="contents">
                <div className="sticky left-0 z-10 border-r border-t border-zinc-800 bg-zinc-950 px-3 py-2 text-right text-[11px] font-medium text-zinc-500">
                  {formatHour(hour)}
                </div>

                {weekDays.map((date) => {
                  const hourPosts = getPostsForHour(posts, date, hour);
                  const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

                  return (
                    <button
                      key={`${date.toISOString()}-${hour}`}
                      type="button"
                      onClick={() => onSelectDate(date)}
                      className={`min-h-[72px] border-r border-t border-zinc-800 p-1.5 text-left transition-colors last:border-r-0 ${
                        isSelected ? "bg-brand/5" : "hover:bg-brand/2.5"
                      }`}
                    >
                      <div className="flex min-h-[58px] flex-col gap-1">
                        {hourPosts.map((post) => (
                          <span
                            key={post.id}
                            role="button"
                            tabIndex={0}
                            onClick={(event) => {
                              event.stopPropagation();
                              onSelectPost(post);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                event.stopPropagation();
                                onSelectPost(post);
                              }
                            }}
                            title={`${post.channel?.platform?.toUpperCase()}: ${post.content?.text || ""}`}
                            className={`block rounded-md border px-2 py-1.5 text-[11px] leading-4 transition-transform hover:scale-[1.01] ${getPlatformColor(post.channel?.platform)}`}
                          >
                            <span className="block font-semibold">{formatTime(post.scheduledAt)}</span>
                            <span className="line-clamp-2 opacity-90">
                              {post.channel?.accountName || post.channel?.platform || "Scheduled post"}
                            </span>
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
