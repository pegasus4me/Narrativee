"use client";

import { Calendar, Lightbulb, Sparkles } from "lucide-react";

interface ActionToolbarProps {
    onSchedule?: () => void;
    onInspirations?: () => void;
    onGenerateNotes?: () => void;
}

export default function ActionToolbar({ onSchedule, onInspirations, onGenerateNotes }: ActionToolbarProps) {
    return (
        <div className="flex gap-4 mb-8">
            <button
                onClick={onSchedule}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
            >
                <Calendar className="w-4 h-4" />
                Schedule
            </button>
            <button
                onClick={onInspirations}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
            >
                <Lightbulb className="w-4 h-4" />
                Inspirations
            </button>
            <button
                onClick={onGenerateNotes}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
            >
                <Sparkles className="w-4 h-4" />
                Generate notes
            </button>
        </div>
    );
}
