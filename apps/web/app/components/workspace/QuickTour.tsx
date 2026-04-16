"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, BarChart2, Zap, BookOpen, PenLine, MessageSquare, Megaphone, ListFilter } from "lucide-react";

const TOUR_KEY = "narrativee_tour_v1";

interface Step {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
    bg: string;
}

const steps: Step[] = [
    {
        icon: <BarChart2 className="w-7 h-7" />,
        title: "Analytics Dashboard",
        description: "See all your Substack stats in one place — total likes, comments, restacks, subscriber growth, best posting times, and engagement trends. All pulled live from your profile.",
        color: "text-violet-400",
        bg: "bg-violet-500/10",
    },
    {
        icon: <BookOpen className="w-7 h-7" />,
        title: "Knowledge Base",
        description: "Save your writing context — bio, goals, topics, and writing style. This powers all AI features so every generated reply and comment sounds like you.",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
    },
    {
        icon: <PenLine className="w-7 h-7" />,
        title: "Posts Queue",
        description: "Schedule your Substack notes in advance. The extension picks them up and posts automatically at the right time — no manual publishing needed.",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
    },
    {
        icon: <MessageSquare className="w-7 h-7" />,
        title: "Engage",
        description: "Pull trending notes from your Substack feed or search any creator's notes. Generate AI comments that match your voice, then post directly — without leaving the app.",
        color: "text-orange-400",
        bg: "bg-orange-500/10",
    },
    {
        icon: <ListFilter className="w-7 h-7" />,
        title: "Creator Watchlists",
        description: "Inside Engage, create lists of creators you follow. Pull all their latest notes at once to stay on top of the conversations that matter to your niche.",
        color: "text-pink-400",
        bg: "bg-pink-500/10",
    },
    {
        icon: <Megaphone className="w-7 h-7" />,
        title: "Campaigns",
        description: "Run outreach campaigns to grow your audience. The extension finds commenters on relevant notes and auto-generates personalised replies to bring them back to your publication.",
        color: "text-amber-400",
        bg: "bg-amber-500/10",
    },
    {
        icon: <Zap className="w-7 h-7" />,
        title: "Chrome Extension",
        description: "The extension is the engine behind everything — it syncs your stats, posts scheduled notes, runs campaigns, and pulls feeds. Make sure it's installed and you're logged into Substack.",
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
    },
];

export function QuickTour() {
    const [visible, setVisible] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const seen = localStorage.getItem(TOUR_KEY);
        if (!seen) setVisible(true);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-md mx-4 bg-[#1a1b1d] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">

                {/* Progress bar */}
                <div className="h-0.5 bg-white/[0.06]">
                    <div
                        className="h-full bg-violet-500 transition-all duration-300"
                        style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                    />
                </div>

                {/* Close */}
                <button
                    onClick={dismiss}
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-300 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Content */}
                <div className="px-8 pt-8 pb-6 flex flex-col gap-5">

                    {/* Step counter */}
                    <p className="text-[11px] text-gray-600 font-medium uppercase tracking-widest">
                        {step + 1} / {steps.length}
                    </p>

                    {/* Icon + title */}
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${current.bg} ${current.color} shrink-0`}>
                            {current.icon}
                        </div>
                        <h2 className="text-lg font-semibold text-gray-100 leading-tight">{current.title}</h2>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-400 leading-relaxed">{current.description}</p>

                    {/* Dot indicators */}
                    <div className="flex items-center gap-1.5">
                        {steps.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setStep(i)}
                                className={`rounded-full transition-all ${i === step ? "w-4 h-1.5 bg-violet-500" : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"}`}
                            />
                        ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between pt-1">
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
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg transition-all"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" /> Back
                                </button>
                            )}
                            {isLast ? (
                                <button
                                    onClick={dismiss}
                                    className="flex items-center gap-1 px-4 py-1.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-all"
                                >
                                    Get started
                                </button>
                            ) : (
                                <button
                                    onClick={() => setStep(s => s + 1)}
                                    className="flex items-center gap-1 px-4 py-1.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-all"
                                >
                                    Next <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
