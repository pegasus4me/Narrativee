"use client";

import { TrendingUp } from "lucide-react";
import { FunnelChart, PatternLines } from "@/components/ui/funnel-chart";
import type { FunnelStage } from "@/components/ui/funnel-chart";
import type { CampaignTarget } from "@/app/workspace/campaigns/types";

interface CampaignFunnelProps {
    targets: CampaignTarget[];
}

export function CampaignFunnel({ targets }: CampaignFunnelProps) {
    const total       = targets.length;
    const pending     = targets.filter(t => t.status === "pending").length;
    const replied     = targets.filter(t => t.status === "replied").length;
    const skipped     = targets.filter(t => t.status === "skipped").length;
    const failed      = targets.filter(t => t.status === "failed").length;
    const repliedBack = targets.filter(t => t.targetRepliedBack).length;
    const subscribed  = targets.filter(t => t.targetSubscribed).length;

    const replyRate      = total   > 0 ? Math.round((replied     / total)   * 100) : 0;
    const engagementRate = replied > 0 ? Math.round((repliedBack / replied) * 100) : 0;
    const conversionRate = replied > 0 ? Math.round((subscribed  / replied) * 100) : 0;

    const data: FunnelStage[] = [
        { label: "Targeted",     value: Math.max(total,       1), displayValue: String(total)       },
        { label: `Replied ${replyRate}%`,      value: Math.max(replied,     0.01), displayValue: String(replied)     },
        { label: `Replied Back ${engagementRate}%`, value: Math.max(repliedBack, 0.01), displayValue: String(repliedBack) },
        { label: `Subscribed ${conversionRate}%`,   value: Math.max(subscribed,  0.01), displayValue: String(subscribed)  },
    ];

    return (
        <div className="rounded-2xl h-fit">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <TrendingUp size={13} className="text-primary" />
                    <span className="text-sm font-medium text-gray-300">Conversion Funnel</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                    {pending > 0 && (
                        <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/70 inline-block" />
                            {pending} pending
                        </span>
                    )}
                    {skipped > 0 && (
                        <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-600 inline-block" />
                            {skipped} skipped
                        </span>
                    )}
                    {failed > 0 && (
                        <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                            {failed} failed
                        </span>
                    )}
                </div>
            </div>

            <FunnelChart
                data={data}
                color="var(--chart-5)"
                layers={4}
                showPercentage={false}
                renderPattern={(id, color) => (
                    <PatternLines
                        id={id}
                        height={6}
                        width={8}
                        stroke="rgba(255,255,255,0.35)"
                        strokeWidth={2}
                        orientation={["diagonal"]}
                        background={color}
                    />
                )}
            />
        </div>
    );
}
