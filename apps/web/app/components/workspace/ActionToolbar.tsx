"use client";

import { Calendar, Lightbulb, Sparkles } from "lucide-react";
import Link from "next/link";

interface ActionToolbarProps {
    onSchedule?: () => void;
    onGenerateNotes?: () => void;
}

export default function ActionToolbar({ onSchedule, onGenerateNotes }: ActionToolbarProps) {
    return (
        <div className="flex gap-4 mb-8">
            <Link
                href="/workspace/inspirations"
                className="bg-primary hover:bg-primary/80 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
            >
                <Lightbulb className="w-4 h-4" />
                Inspirations
            </Link>
            <button
                onClick={onGenerateNotes}
                className="bg-primary hover:bg-primary/80 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
            >
                <Sparkles className="w-4 h-4" />
                Generate notes
            </button>
        </div>
    );
}
