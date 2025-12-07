import React from 'react';

interface ReportFooterProps {
    reportData: {
        metadata: {
            fileName: string;
            rowCount: number;
            columns: string[];
        };
    };
}

export default function ReportFooter({ reportData }: ReportFooterProps) {
    return (
        <div className="border-t border-gray-200 bg-white px-6 py-2 z-10">
            <div className="flex items-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Data Name</span>
                    <span className="font-medium text-gray-900 truncate max-w-[300px]" style={{ fontFamily: "var(--font-mono)" }}>
                        {reportData.metadata.fileName}
                    </span>
                </div>

                <div className="h-4 w-px bg-gray-300"></div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Rows</span>
                    <span className="font-medium text-gray-900" style={{ fontFamily: "var(--font-mono)" }}>
                        {reportData.metadata.rowCount.toLocaleString()}
                    </span>
                </div>

                <div className="h-4 w-px bg-gray-300"></div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Columns</span>
                    <span className="font-medium text-gray-900" style={{ fontFamily: "var(--font-mono)" }}>
                        {reportData.metadata.columns.length}
                    </span>
                </div>
            </div>
        </div>
    );
}
