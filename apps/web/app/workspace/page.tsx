"use client";

import { useRouter } from "next/navigation";
import { StatsOverview } from "../components/workspace/StatsOverview";
import { NotesList } from "../components/workspace/NotesList";
import { SubsChart } from "../components/workspace/SubsChart";
import { ActivityChart } from "../components/workspace/ActivityChart";
import { PerformanceChart } from "../components/workspace/PerformanceChart";
import { PostingHeatmap } from "../components/workspace/PostingHeatmap";
import { ArrowRight } from "lucide-react";

export default function Workspace() {
    const router = useRouter();

    return (
        <div className="h-full p-8 overflow-y-auto relative">
            <div className="max-w-7xl mx-auto flex flex-col gap-8">

                {/* Stats Overview */}
                <div>
                    <h2 className="text-xl font-semibold mb-6 text-gray-100">Overview</h2>
                    <StatsOverview />
                </div>

                {/* Top charts: activity + performance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#1e1f21] rounded-xl p-5 border border-gray-800">
                        <h2 className="text-base font-medium mb-4 text-gray-100">Best Time to Post</h2>
                        <ActivityChart />
                    </div>
                    <div className="bg-[#1e1f21] rounded-xl p-5 border border-gray-800">
                        <h2 className="text-base font-medium mb-4 text-gray-100">Performance Over Time</h2>
                        <PerformanceChart />
                    </div>
                </div>

                {/* Posting Heatmap + Subscribers side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#1e1f21] rounded-xl p-5 border border-gray-800">
                        <h2 className="text-base font-medium mb-4 text-gray-100">Posting Heatmap</h2>
                        <PostingHeatmap />
                    </div>
                    <div className="bg-[#1e1f21] rounded-xl p-5 border border-gray-800">
                        <h2 className="text-base font-medium mb-4 text-gray-100">Subscribers</h2>
                        <SubsChart />
                    </div>
                </div>

                {/* Notes Performance */}
                <div>
                    <h2 className="text-xl font-light mb-6 text-gray-100">Notes Performance</h2>
                    <NotesList />
                </div>

                {/* Navigation to Queue */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div
                        onClick={() => router.push("/workspace/post-queue")}
                        className="group bg-[#1e1f21] p-8 rounded-xl border border-gray-700 shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all cursor-pointer flex flex-col items-center text-center gap-4"
                    >
                        <div className="w-12 h-12 bg-blue-900/50 text-blue-400 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <ArrowRight className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-100 group-hover:text-blue-400">Open Post Queue</h3>
                            <p className="text-gray-400 mt-1">
                                Create content, generate notes, and manage your schedule.
                            </p>
                        </div>
                    </div>

                    <div className="bg-[#1e1f21] p-8 rounded-xl border border-gray-700 border-dashed flex items-center justify-center text-gray-500">
                        <span className="text-sm">More widgets coming soon...</span>
                    </div>
                </div>

            </div>
        </div>
    );
}