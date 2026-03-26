"use client";

import { useState } from "react";
import DailyScheduler from "../../components/workspace/daily-scheduler";
import ActionToolbar from "../../components/workspace/ActionToolbar";
import NotesGeneratorModal from "../../components/workspace/NotesGeneratorModal";

export default function PostQueuePage() {
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

    return (
        <div className="h-full overflow-y-auto">
            <div className="max-w-6xl mx-auto px-8 py-10 flex flex-col gap-0">
                <div className="flex justify-end mb-4">
                    <ActionToolbar onGenerateNotes={() => setIsNoteModalOpen(true)} />
                </div>
                <DailyScheduler />
            </div>

            <NotesGeneratorModal
                isOpen={isNoteModalOpen}
                onClose={() => setIsNoteModalOpen(false)}
            />
        </div>
    );
}
