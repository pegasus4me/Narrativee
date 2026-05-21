"use client";

interface CalendarPost {
  id: string;
  scheduledAt: string;
  channel?: { platform?: string; accountName?: string };
  content?: { text?: string };
}

interface CalendarGridProps {
  currentDate: Date;
  selectedDate: Date | null;
  posts: CalendarPost[];
  onSelectDate: (date: Date) => void;
  onSelectPost: (post: CalendarPost) => void;
  formatTime: (d: string) => string;
}

function getDaysInMonth(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const startDayOfWeek = firstDay.getDay();

  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  const prevMonthTotalDays = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month - 1, prevMonthTotalDays - i), isCurrentMonth: false });
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }
  return days;
}

function getPostsForDate(posts: CalendarPost[], date: Date) {
  return posts.filter((post) => {
    const postDate = new Date(post.scheduledAt);
    return postDate.getFullYear() === date.getFullYear() && postDate.getMonth() === date.getMonth() && postDate.getDate() === date.getDate();
  });
}

export function CalendarGrid({ currentDate, selectedDate, posts, onSelectDate, onSelectPost, formatTime }: CalendarGridProps) {
  return (
    <div className="flex flex-col animate-in fade-in duration-200">
      <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {getDaysInMonth(currentDate).map(({ date, isCurrentMonth }, idx) => {
          const dayPosts = getPostsForDate(posts, date);
          const isToday = date.toDateString() === new Date().toDateString();
          const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

          return (
            <div
              key={idx}
              onClick={() => onSelectDate(date)}
              className={`min-h-[110px] rounded-2xl border p-2 flex flex-col justify-between transition-all cursor-pointer relative select-none ${
                isSelected
                  ? "border-indigo-600 bg-indigo-50/10 ring-1 ring-indigo-500"
                  : isToday
                  ? "border-zinc-950 bg-zinc-50/30"
                  : isCurrentMonth
                  ? "border-zinc-200 bg-white hover:border-zinc-300"
                  : "border-zinc-100 bg-zinc-50/20 text-zinc-300 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                {isToday ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">{date.getDate()}</span>
                ) : (
                  <span className={`text-[10px] font-bold ${isCurrentMonth ? "text-zinc-700" : "text-zinc-400"}`}>{date.getDate()}</span>
                )}
                {dayPosts.length > 0 && (
                  <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[8px] font-bold text-zinc-500 border border-zinc-200/50">{dayPosts.length}</span>
                )}
              </div>

              <div className="mt-2 flex-1 flex flex-col gap-1 overflow-hidden">
                {dayPosts.slice(0, 3).map((post) => {
                  const platformColor =
                    post.channel?.platform === "linkedin" ? "bg-blue-50 text-blue-750 border-blue-100"
                    : post.channel?.platform === "x" ? "bg-zinc-900 text-zinc-100 border-zinc-800"
                    : post.channel?.platform === "threads" ? "bg-zinc-50 text-zinc-900 border-zinc-200"
                    : post.channel?.platform === "instagram" ? "bg-fuchsia-50 text-fuchsia-850 border-fuchsia-100"
                    : "bg-pink-50 text-pink-750 border-pink-100";

                  return (
                    <div
                      key={post.id}
                      onClick={(e) => { e.stopPropagation(); onSelectPost(post); }}
                      title={`${post.channel?.platform?.toUpperCase()}: ${post.content?.text || ""}`}
                      className={`flex items-center gap-1 rounded-lg border px-1.5 py-0.5 text-[9px] font-medium truncate cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all hover:brightness-95 ${platformColor}`}
                    >
                      <span className="shrink-0 text-[8px] font-semibold opacity-85">{formatTime(post.scheduledAt)}</span>
                      <span className="truncate opacity-90">{post.channel?.accountName || post.channel?.platform}</span>
                    </div>
                  );
                })}
                {dayPosts.length > 3 && (
                  <div className="text-[8px] font-bold text-zinc-400 text-center mt-0.5">+ {dayPosts.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
