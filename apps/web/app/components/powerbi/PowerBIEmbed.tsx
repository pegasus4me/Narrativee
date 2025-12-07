import React, { useEffect, useState } from 'react';
import { PowerBIEmbed as PowerBIEmbedReact } from 'powerbi-client-react';
import { models } from 'powerbi-client';

const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://api.narrativee.com'
    : 'http://localhost:3002';

interface PowerBIEmbedProps {
    reportId: string;
    workspaceId?: string;
    onBack?: () => void;
}

export default function PowerBIEmbed({ reportId, workspaceId, onBack }: PowerBIEmbedProps) {
    const [embedConfig, setEmbedConfig] = useState<models.IReportEmbedConfiguration | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                setIsLoading(true);
                const workspaceQuery = workspaceId ? `?workspaceId=${workspaceId}` : '';
                const response = await fetch(`${API_BASE_URL}/api/powerbi/reports/${reportId}/config${workspaceQuery}`, {
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch embed config');
                }

                const config = await response.json() as models.IReportEmbedConfiguration;
                setEmbedConfig(config);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (reportId) {
            fetchConfig();
        }
    }, [reportId, workspaceId]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mb-4"></div>
                <p className="text-gray-500">Loading Report...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-96 bg-red-50 rounded-lg p-6 text-center">
                <div className="text-red-500 mb-2">⚠️ Error Loading Report</div>
                <p className="text-gray-700">{error}</p>
                {onBack && (
                    <button onClick={onBack} className="mt-4 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        Go Back
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {onBack && (
                <div className="flex items-center justify-between mb-4 px-1">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        ← Back to Datasets
                    </button>
                    <div className="text-xs text-gray-400">Power BI Embedded</div>
                </div>
            )}

            <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden min-h-[600px]">
                {embedConfig && (
                    <PowerBIEmbedReact
                        embedConfig={embedConfig}
                        eventHandlers={
                            new Map([
                                ['loaded', function () { console.log('Report loaded'); }],
                                ['error', function (event) { console.log('Report error', event?.detail); }]
                            ])
                        }
                        cssClassName={"h-full w-full"}
                        getEmbeddedComponent={(embeddedReport) => {
                            // @ts-ignore
                            window.report = embeddedReport;
                        }}
                    />
                )}
            </div>
        </div>
    );
}
