"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api-config";

interface HeatmapCell {
    dayOfWeek: number; // 0=Sun, 1=Mon ... 6=Sat
    hour: number;      // 0-23
    count: number;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function PostingHeatmap() {
    const [data, setData] = useState<HeatmapCell[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/notes/posting-heatmap`, { credentials: "include" })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((json: any) => setData(json.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Build a 7×24 lookup map
    const map = new Map<string, number>();
    let maxCount = 1;
    for (const cell of data) {
        const key = `${cell.dayOfWeek}-${cell.hour}`;
        map.set(key, cell.count);
        if (cell.count > maxCount) maxCount = cell.count;
    }

    const getIntensity = (count: number) => count / maxCount;

    const getColor = (count: number) => {
        if (count === 0) return "bg-gray-800/60";
        const i = getIntensity(count);
        if (i < 0.25) return "bg-violet-900/50";
        if (i < 0.5) return "bg-violet-700/70";
        if (i < 0.75) return "bg-violet-500/80";
        return "bg-violet-400";
    };

    const totalNotes = data.reduce((sum, c) => sum + c.count, 0);

    return (
        <div className="rounded-xl p-5 ">
            {loading ? (
                <div className="h-40 flex items-center justify-center text-gray-600 text-sm animate-pulse">
                    Loading...
                </div>
            ) : totalNotes === 0 ? (
                <div className="h-40 flex items-center justify-center text-gray-600 text-sm">
                    No notes yet — sync your notes first.
                </div>
            ) : (
                <div className="w-full">
                    {/* Hour labels */}
                    <div className="flex mb-1 ml-8">
                        {HOURS.map(h => (
                            <div key={h} className="flex-1 text-center text-[9px] text-gray-600">
                                {h % 4 === 0 ? `${h}h` : ""}
                            </div>
                        ))}
                    </div>

                    {/* Rows: one per day */}
                    {DAYS.map((day, d) => (
                        <div key={d} className="flex items-center mb-1">
                            <span className="text-[10px] text-gray-500 w-8 shrink-0">{day}</span>
                            {HOURS.map(h => {
                                const count = map.get(`${d}-${h}`) ?? 0;
                                return (
                                    <div
                                        key={h}
                                        title={count > 0 ? `${day} ${h}:00 — ${count} note${count > 1 ? 's' : ''}` : undefined}
                                        className={`flex-1 h-5 rounded-sm mx-px transition-opacity hover:opacity-80 ${getColor(count)}`}
                                    />
                                );
                            })}
                        </div>
                    ))}

                    {/* Legend */}
                    <div className="flex items-center gap-2 mt-3 justify-end">
                        <span className="text-[10px] text-gray-600">Less</span>
                        {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
                            <div
                                key={i}
                                className={`w-4 h-4 rounded-sm ${v === 0 ? "bg-gray-800/60"
                                    : v < 0.25 ? "bg-violet-900/50"
                                        : v < 0.5 ? "bg-violet-700/70"
                                            : v < 0.75 ? "bg-violet-500/80"
                                                : "bg-violet-400"
                                    }`}
                            />
                        ))}
                        <span className="text-[10px] text-gray-600">More</span>
                    </div>
                </div>
            )}
        </div>
    );
}
