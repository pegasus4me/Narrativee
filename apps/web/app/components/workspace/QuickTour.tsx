"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, BarChart2, Zap, BookOpen, PenLine, MessageSquare, Megaphone, ListFilter } from "lucide-react";

const TOUR_KEY = "narrativee_tour_v1";

interface Step {
    icon: React.ReactNode;
    title: string;
    description: string;
    accent: string;
}

const steps: Step[] = [
    {
        icon: <BarChart2 className="w-5 h-5" />,
        title: "Analytics Dashboard",
        description: "All your Substack stats in one place — likes, comments, restacks, subscriber growth, best posting times and engagement trends. Pulled live from your profile via the extension.",
        accent: "text-violet-400",
    },
    {
        icon: <BookOpen className="w-5 h-5" />,
        title: "Knowledge Base",
        description: "Store your bio, goals, topics and writing style. Every AI-generated reply and comment pulls from this so it always sounds like you — not a bot.",
        accent: "text-blue-400",
    },
    {
        icon: <PenLine className="w-5 h-5" />,
        title: "Posts Queue",
        description: "Schedule your Substack notes in advance. The extension picks them up and publishes at the exact time you set — no manual posting needed.",
        accent: "text-emerald-400",
    },
    {
        icon: <MessageSquare className="w-5 h-5" />,
        title: "Engage",
        description: "Pull trending notes from your feed or search any creator's notes. Generate AI comments in your voice and post directly without leaving the app.",
        accent: "text-orange-400",
    },
    {
        icon: <ListFilter className="w-5 h-5" />,
        title: "Creator Watchlists",
        description: "Inside Engage, create lists of creators you follow. Pull all their latest notes at once to stay on top of conversations in your niche.",
        accent: "text-pink-400",
    },
    {
        icon: <Megaphone className="w-5 h-5" />,
        title: "Campaigns",
        description: "Run outreach campaigns to grow your audience. The extension finds commenters on relevant notes and sends personalised replies to bring them to your publication.",
        accent: "text-amber-400",
    },
    {
        icon: <Zap className="w-5 h-5" />,
        title: "Chrome Extension",
        description: "The extension powers everything — it syncs your stats, posts scheduled notes, runs campaigns and pulls feeds. Keep it installed and stay logged into Substack.",
        accent: "text-yellow-400",
    },
];

export function QuickTour() {
    const [visible, setVisible] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!localStorage.getItem(TOUR_KEY)) setVisible(true);
    }, []);

    function dismiss() {
        localStorage.setItem(TOUR_KEY, "1");
        setVisible(false);
    }

    if (!visible) return null;

    const current = steps[step]!;
    const isFirst = step === 0;
    const isLast = step === steps.length - 1;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-md mx-4 bg-[#1a1b1d] border border-white/[0.06] rounded-2xl shadow-2xl overflow-hidden">

                {/* Progress bar */}
                <div className="h-[2px] bg-white/[0.04]">
                    <div
                        className="h-full bg-violet-500/70 transition-all duration-300"
                        style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                    />
                </div>

                {/* Dismiss */}
                <button
                    onClick={dismiss}
                    className="absolute top-4 right-4 p-1 text-gray-600 hover:text-gray-300 hover:bg-white/[0.06] rounded-lg transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="px-6 pt-6 pb-5 flex flex-col gap-5">

                    {/* Step label */}
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                        Step {step + 1} of {steps.length}
                    </p>

                    {/* Icon + title */}
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] ${current.accent} shrink-0`}>
                            {current.icon}
                        </div>
                        <h2 className="text-base font-semibold text-gray-100">{current.title}</h2>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-400 leading-relaxed border-l-2 border-white/[0.06] pl-4">
                        {current.description}
                    </p>

                    {/* Dot indicators */}
                    <div className="flex items-center gap-1.5">
                        {steps.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setStep(i)}
                                className={`rounded-full transition-all duration-200 ${
                                    i === step
                                        ? "w-5 h-1.5 bg-violet-500"
                                        : i < step
                                        ? "w-1.5 h-1.5 bg-violet-500/30"
                                        : "w-1.5 h-1.5 bg-white/[0.08] hover:bg-white/20"
                                }`}
                            />
                        ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                        <button
                            onClick={dismiss}
                            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                        >
                            Skip tour
                        </button>
                        <div className="flex items-center gap-2">
                            {!isFirst && (
                                <button
                                    onClick={() => setStep(s => s - 1)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] rounded-xl transition-all"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" /> Back
                                </button>
                            )}
                            <button
                                onClick={isLast ? dismiss : () => setStep(s => s + 1)}
                                className="flex items-center gap-1 px-4 py-1.5 text-xs font-semibold text-white bg-violet-600/80 hover:bg-violet-600 border border-violet-500/30 rounded-xl transition-all"
                            >
                                {isLast ? "Get started" : <>Next <ChevronRight className="w-3.5 h-3.5" /></>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
