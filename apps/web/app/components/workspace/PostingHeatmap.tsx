"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api-config";
import { format, subMonths, eachDayOfInterval, startOfWeek, startOfDay } from "date-fns";

interface HeatmapCell {
    date: string; // YYYY-MM-DD
    count: number;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CELL = 14;
const GAP = 3;

export function PostingHeatmap() {
    const [data, setData] = useState<HeatmapCell[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/notes/posting-heatmap`, { credentials: "include" })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((json: unknown) => setData((json as { data?: HeatmapCell[] }).data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const today = startOfDay(new Date());
    const startDate = startOfWeek(subMonths(today, 6));
    const allDays = eachDayOfInterval({ start: startDate, end: today });

    const weeks: Date[][] = [];
    let week: Date[] = [];
    allDays.forEach(day => {
        week.push(day);
        if (week.length === 7) { weeks.push(week); week = []; }
    });
    if (week.length > 0) weeks.push(week);

    const map = new Map<string, number>();
    let maxCount = 1;
    for (const cell of data) {
        map.set(cell.date, cell.count);
        if (cell.count > maxCount) maxCount = cell.count;
    }

    const getColor = (count: number) => {
        if (count === 0) return "#161b22";
        const i = count / maxCount;
        if (i < 0.25) return "#0e4429";
        if (i < 0.5)  return "#006d32";
        if (i < 0.75) return "#26a641";
        return "#39d353";
    };

    const totalNotes = data.reduce((sum, c) => sum + c.count, 0);

    const monthLabels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((w, col) => {
        const first = w[0];
        if (!first) return;
        const month = first.getMonth();
        if (month !== lastMonth) {
            monthLabels.push({ label: format(first, "MMM"), col });
            lastMonth = month;
        }
    });

    const labelColWidth = 28;
    const gridWidth = weeks.length * (CELL + GAP) - GAP;

    return (
        <div className="w-full">
            <h2 className="text-base font-medium mb-4 text-gray-100">Posting Heatmap</h2>
            {loading ? (
                <div className="h-32 flex items-center justify-center text-gray-600 text-sm animate-pulse">
                    Loading...
                </div>
            ) : totalNotes === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center gap-2">
                    <div className="text-gray-500 text-sm">No notes posted in the last 6 months</div>
                    <div className="text-gray-600 text-xs">Start posting to see your activity heatmap</div>
                </div>
            ) : (
                <div className="flex flex-col gap-2 w-full">
                    <div className="text-xs text-gray-500 mb-1">
                        <span className="font-semibold text-white">{totalNotes}</span> notes in the last 6 months
                    </div>

                    <div className="w-full overflow-x-auto pb-1">
                        {/* Month labels */}
                        <div className="relative mb-1" style={{ height: 14, marginLeft: labelColWidth, width: gridWidth }}>
                            {monthLabels.map((m, i) => (
                                <span
                                    key={i}
                                    className="absolute text-[10px] text-gray-500 font-medium"
                                    style={{ left: m.col * (CELL + GAP) }}
                                >
                                    {m.label}
                                </span>
                            ))}
                        </div>

                        {/* Day labels + grid */}
                        <div className="flex" style={{ width: labelColWidth + gridWidth }}>
                            <div
                                className="flex flex-col shrink-0 pr-1 text-[10px] text-gray-500"
                                style={{ width: labelColWidth, gap: GAP }}
                            >
                                {DAY_LABELS.map((d, i) => (
                                    <div key={d} style={{ height: CELL, lineHeight: `${CELL}px` }}>
                                        {i % 2 !== 0 ? d : ""}
                                    </div>
                                ))}
                            </div>

                            <div className="flex" style={{ gap: GAP }}>
                                {weeks.map((wk, wi) => (
                                    <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
                                        {wk.map(dateObj => {
                                            const dateStr = format(dateObj, "yyyy-MM-dd");
                                            const count = map.get(dateStr) ?? 0;
                                            return (
                                                <div
                                                    key={dateStr}
                                                    title={`${count} note${count !== 1 ? "s" : ""} on ${format(dateObj, "EEE, MMM d, yyyy")}`}
                                                    style={{
                                                        width: CELL,
                                                        height: CELL,
                                                        borderRadius: 2,
                                                        backgroundColor: getColor(count),
                                                        border: "1px solid rgba(255,255,255,0.04)",
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-1.5 justify-end mt-1">
                        <span className="text-[10px] text-gray-600">Less</span>
                        {["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"].map((c, i) => (
                            <div
                                key={i}
                                style={{
                                    width: CELL,
                                    height: CELL,
                                    borderRadius: 2,
                                    backgroundColor: c,
                                    border: "1px solid rgba(255,255,255,0.04)",
                                }}
                            />
                        ))}
                        <span className="text-[10px] text-gray-600">More</span>
                    </div>
                </div>
            )}
        </div>
    );
}
