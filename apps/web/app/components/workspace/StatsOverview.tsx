import { ArrowUpRight, BarChart2, Eye, MessageSquare, ThumbsUp, Users, Calendar, Activity, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { PostsAPI, NotesAPI, Stats, NoteStats, Post, Note } from "@/lib/api/posts";
import { MetricsAnalysis } from "./MetricsAnalysis";

export function StatsOverview() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [noteStats, setNoteStats] = useState<NoteStats | null>(null);
    const [bestDay, setBestDay] = useState<string>("N/A");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [postStatsData, noteStatsData, postsData, notesData] = await Promise.all([
                    PostsAPI.getStats(),
                    NotesAPI.getNoteStats(),
                    PostsAPI.getPosts(),
                    NotesAPI.getNotes()
                ]);

                setStats(postStatsData);
                setNoteStats(noteStatsData);

                // Calculate Best Posting Day based on engagement
                const dayStats: Record<number, { engagement: number, count: number }> = {};

                const processItem = (item: any, type: 'post' | 'note') => {
                    if (!item.publishedAt) return;
                    const date = new Date(item.publishedAt);
                    const day = date.getDay();

                    const likes = item.likes || 0;
                    const comments = item.comments || 0;
                    const shares = type === 'post' ? (item.shares || 0) : (item.restacks || 0);

                    const engagement = likes * 1 + comments * 3 + shares * 5;

                    if (!dayStats[day]) dayStats[day] = { engagement: 0, count: 0 };
                    dayStats[day].engagement += engagement;
                    dayStats[day].count += 1;
                };

                postsData.forEach(p => processItem(p, 'post'));
                notesData.forEach(n => processItem(n, 'note'));

                let maxAvg = -1;
                let topDayStr = "N/A";
                const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

                Object.keys(dayStats).forEach(dayStr => {
                    const day = parseInt(dayStr);
                    const data = dayStats[day] as { engagement: number, count: number };

                    if (data.count > 0) {
                        const avg = data.engagement / data.count;
                        if (avg > maxAvg) {
                            maxAvg = avg;
                            topDayStr = days[day] as string;
                        }
                    }
                });

                if (maxAvg > 0) {
                    setBestDay(topDayStr);
                }

            } catch (error) {
                console.error("Failed to fetch stats overview", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Calculate aggregated Engagement Score
    const totalLikes = (stats?.totalLikes || 0) + (noteStats?.totalLikes || 0);
    const totalComments = (stats?.totalComments || 0) + (noteStats?.totalComments || 0);
    const totalRestacks = noteStats?.totalRestacks || 0; // posts don't strictly have restacks in stats yet

    const engagementScore = totalLikes * 1 + totalComments * 3 + totalRestacks * 5;

    const statItems = [
        {
            label: "Total Likes",
            value: totalLikes.toLocaleString(),
            icon: ThumbsUp,
            color: "text-purple-400",
            bg: "bg-purple-900/20",
            tooltip: "Combined likes from all your Notes and Newsletter Posts"
        },
        {
            label: "Total Comments",
            value: totalComments.toLocaleString(),
            icon: MessageSquare,
            color: "text-orange-400",
            bg: "bg-orange-900/20",
            tooltip: "Combined comments from all your Notes and Newsletter Posts"
        },
        {
            label: "Engagement Score",
            value: engagementScore.toLocaleString(),
            icon: Activity,
            color: "text-green-400",
            bg: "bg-green-900/20",
            tooltip: "Weighted score: 1x Like + 3x Comment + 5x Restack/Share"
        },
        {
            label: "Best Posting Day",
            value: bestDay,
            icon: Calendar,
            color: "text-pink-400",
            bg: "bg-pink-900/20",
            tooltip: "The day of the week your content gets the highest average engagement"
        },
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse h-32 bg-[#1e1f21] rounded-xl w-full"></div>
                ))}
            </div>
        );
    }

    return (
        <div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {statItems.map((stat, index) => (
                    <div
                        key={index}
                        className="p-6 bg-[#1e1f21] rounded-xl hover:border-gray-700 transition-all flex flex-col justify-between"
                    >

                        <div>
                            <div className="flex items-center gap-1.5 mb-1 group relative">
                                <h3 className="text-md font-medium text-gray-400">
                                    {stat.label}
                                </h3>
                                {stat.tooltip && (
                                    <>
                                        <Info className="w-4 h-4 text-gray-500 cursor-help" />
                                        <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-gray-800 text-xs text-gray-200 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none">
                                            {stat.tooltip}
                                            {/* little arrow at bottom */}
                                            <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-gray-800"></div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <h4 className="text-5xl font-bold text-gray-100 truncate">
                                {stat.value}
                            </h4>
                        </div>
                    </div>
                ))}
            </div>
            <MetricsAnalysis />
        </div>
    );
}
