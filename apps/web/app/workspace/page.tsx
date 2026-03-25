"use client";

import { useRouter } from "next/navigation";
import { StatsOverview } from "../components/workspace/StatsOverview";
import { NotesList } from "../components/workspace/NotesList";
import { SubsChart } from "../components/workspace/SubsChart";
import { ActivityChart } from "../components/workspace/ActivityChart";
import { PerformanceChart } from "../components/workspace/PerformanceChart";
import { PostingHeatmap } from "../components/workspace/PostingHeatmap";

const Card = ({ title, children }: { title?: string; children: React.ReactNode }) => (
    <div className="bg-[#1a1b1d] rounded-2xl border border-white/[0.06] p-5">
        {title && <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-4">{title}</p>}
        {children}
    </div>
);

export default function Workspace() {
    return (
        <div className="h-full overflow-y-auto">
            <div className="max-w-6xl mx-auto px-8 py-10 flex flex-col gap-10">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-semibold text-gray-100">Analytics</h1>
                    <p className="text-sm text-gray-500 mt-1">Track your content performance and growth.</p>
                </div>

                {/* Stats row */}
                <StatsOverview />

                {/* Charts row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Card title="Best Time to Post">
                        <ActivityChart />
                    </Card>
                    <Card title="Performance Over Time">
                        <PerformanceChart />
                    </Card>
                </div>

                {/* Heatmap */}
                <Card>
                    <PostingHeatmap />
                </Card>

                {/* Subscribers */}
                <Card title="Subscribers">
                    <SubsChart />
                </Card>

                {/* Notes table */}
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-4">Notes Performance</p>
                    <NotesList />
                </div>

            </div>
        </div>
    );
}
