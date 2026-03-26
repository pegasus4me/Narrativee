"use client";

import { StatsOverview } from "../components/workspace/StatsOverview";
import { NotesList } from "../components/workspace/NotesList";
import { GrowthChart } from "../components/workspace/GrowthChart";
import { ActivityChart } from "../components/workspace/ActivityChart";
import { PerformanceChart } from "../components/workspace/PerformanceChart";
import { PostingHeatmap } from "../components/workspace/PostingHeatmap";
import { MetricsAnalysis } from "../components/workspace/MetricsAnalysis";

const Card = ({ title, subtitle, children, className = "" }: {
    title?: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
}) => (
    <div className={`bg-[#1a1b1d] rounded-2xl border border-white/[0.06] p-5 ${className}`}>
        {title && (
            <div className="mb-4">
                <p className="text-sm font-semibold text-gray-200">{title}</p>
                {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
        )}
        {children}
    </div>
);

export default function Workspace() {
    return (
        <div className="h-full overflow-y-auto">
            <div className="max-w-6xl mx-auto px-8 py-10 flex flex-col gap-8">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-semibold text-gray-100">Analytics</h1>
                    <p className="text-sm text-gray-500 mt-1">Track your content performance and growth.</p>
                </div>

                {/* KPI row */}
                <StatsOverview />

                {/* Growth + Performance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Card title="Subscriber Growth" subtitle="Total and paid subscribers over time">
                        <GrowthChart />
                    </Card>
                    <Card title="Engagement Over Time" subtitle="Weekly likes, comments and restacks">
                        <PerformanceChart />
                    </Card>
                </div>

                {/* Heatmap + Best time */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
                    <div className="md:col-span-3">
                        <Card title="Posting Activity" subtitle="Your publishing frequency over the last 6 months">
                            <PostingHeatmap />
                        </Card>
                    </div>
                    <div className="md:col-span-2">
                        <Card title="Best Time to Post" subtitle="When your audience engages most">
                            <ActivityChart />
                        </Card>
                    </div>
                </div>

                {/* AI Analysis */}
                <MetricsAnalysis />

                {/* Notes table */}
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-4">Notes Performance</p>
                    <NotesList />
                </div>

            </div>
        </div>
    );
}
