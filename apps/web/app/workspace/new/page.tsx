"use client";

import FileUploadPrompt from "../../components/FileUploadPrompt";

export default function NewWorkspace() {
    return (
        <div className="flex flex-col h-full items-center justify-center p-4 max-w-3xl mx-auto w-full">
            <div className="w-full space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold text-gray-900 font-serif" style={{ fontFamily: "Petrona, serif" }}>What story does your data tell?</h1>
                    <p className="text-gray-500 text-lg">Connect your sources and let AI uncover the narrative.</p>
                </div>

                <FileUploadPrompt />
            </div>
        </div>
    );
}