"use client";

import { useState } from "react";
import DailyScheduler from "../../components/workspace/daily-scheduler";
import ActionToolbar from "../../components/workspace/ActionToolbar";
import NotesGeneratorModal from "../../components/workspace/NotesGeneratorModal";

export default function PostQueuePage() {
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

    return (
        <div className="h-full p-8 overflow-y-auto relative ">
            <div className="max-w-7xl mx-auto h-full flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl text-gray-100">Post Queue</h1>
                    <p className="text-gray-400">Manage your scheduled content and draft ideas.</p>
                    
                </div>

                {/* Creation Tools */}
                <div className="p-4 rounded-xl">
                    <ActionToolbar
                        onGenerateNotes={() => setIsNoteModalOpen(true)}
                    />
                </div>

                <div className="flex-1 min-h-[800px]">
                    <DailyScheduler />
                </div>
            </div>

            {/* Notes Generator Modal */}
            <NotesGeneratorModal
                isOpen={isNoteModalOpen}
                onClose={() => setIsNoteModalOpen(false)}
            />
        </div>
    );
}
