"use client";

import { useState, useEffect } from "react";
import { authClient } from "../../../lib/auth-client";
import { Database, Folder, ChevronRight, Loader2, File } from "clicons-react";
import PowerBIEmbed from "./PowerBIEmbed";

interface DatasetSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (dataset: any) => void;
}

interface Workspace {
    id: string;
    name: string;
    isReadOnly: boolean;
    isOnDedicatedCapacity: boolean;
}

interface Dataset {
    id: string;
    name: string;
    addRowsAPIEnabled: boolean;
    configuredBy: string;
    isRefreshable: boolean;
    isEffectiveIdentityRequired: boolean;
    isEffectiveIdentityRolesRequired: boolean;
    isOnPremGatewayRequired: boolean;
}

export function DatasetSelector({ isOpen, onClose, onSelect }: DatasetSelectorProps) {
    const [step, setStep] = useState<"workspaces" | "datasets" | "tables" | "preview" | "embed">("workspaces");
    const [tab, setTab] = useState<"datasets" | "reports">("datasets");
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [tables, setTables] = useState<any[]>([]);
    const [previewData, setPreviewData] = useState<any[]>([]);

    const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
    const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch workspaces when modal opens
    useEffect(() => {
        if (isOpen && step === "workspaces") {
            fetchWorkspaces();
        }
    }, [isOpen, step]);

    // Fetch datasets when workspace is selected
    useEffect(() => {
        if (selectedWorkspace) {
            fetchDatasets(selectedWorkspace.id);
            fetchReports(selectedWorkspace.id);
        }
    }, [selectedWorkspace]);

    // Fetch tables when dataset is selected
    useEffect(() => {
        if (selectedDataset) {
            fetchTables(selectedDataset.id);
        }
    }, [selectedDataset]);

    const fetchWorkspaces = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch("http://localhost:3002/api/powerbi/workspaces", { credentials: "include" });
            if (!response.ok) throw new Error("Failed to fetch workspaces");
            const data = await response.json() as { success: boolean; workspaces: Workspace[]; error?: string };
            if (data.success) setWorkspaces(data.workspaces);
            else throw new Error(data.error || "Failed to fetch workspaces");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDatasets = async (workspaceId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:3002/api/powerbi/datasets?workspaceId=${workspaceId}`, { credentials: "include" });
            if (!response.ok) throw new Error("Failed to fetch datasets");
            const data = await response.json() as { success: boolean; datasets: Dataset[]; error?: string };
            if (data.success) {
                setDatasets(data.datasets);
                setStep("datasets");
            } else throw new Error(data.error || "Failed to fetch datasets");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchReports = async (workspaceId: string) => {
        // Don't set global loading here to avoid flickering if datasets load fast
        try {
            const response = await fetch(`http://localhost:3002/api/powerbi/reports?workspaceId=${workspaceId}`, { credentials: "include" });
            if (response.ok) {
                const data = await response.json();
                setReports(data as any[]);
            }
        } catch (err) {
            console.error("Failed to fetch reports", err);
        }
    };

    const fetchTables = async (datasetId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const workspaceQuery = selectedWorkspace?.id ? `?workspaceId=${selectedWorkspace.id}` : "";
            const response = await fetch(`http://localhost:3002/api/powerbi/datasets/${datasetId}/tables${workspaceQuery}`, { credentials: "include" });
            const data = await response.json() as any;

            if (!response.ok) {
                throw new Error(data.message || data.error || "Failed to fetch tables");
            }

            if (data.success) {
                setTables(data.tables);
                setStep("tables");
            } else throw new Error(data.error || "Failed to fetch tables");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPreview = async (tableName: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch("http://localhost:3002/api/powerbi/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    datasetId: selectedDataset?.id,
                    workspaceId: selectedWorkspace?.id,
                    query: `EVALUATE TOPN(50, '${tableName}')`
                }),
                credentials: "include"
            });

            if (!response.ok) throw new Error("Failed to fetch preview");
            const data = await response.json() as { success: boolean; result?: { results?: { tables?: { rows?: any[] }[] }[] }; error?: string };
            if (data.success && data.result?.results?.[0]?.tables?.[0]?.rows) {
                setPreviewData(data.result.results[0].tables[0].rows);
                setStep("preview");
            } else {
                throw new Error("No data returned or failed query");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        if (step === "preview") {
            setStep("tables");
            setPreviewData([]);
            setSelectedTable(null);
        } else if (step === "tables") {
            setStep("datasets");
            setTables([]);
            setSelectedDataset(null);
        } else if (step === "datasets") {
            setStep("workspaces");
            setDatasets([]);
            setSelectedWorkspace(null);
        } else if (step === "embed") {
            setStep("datasets");
            setSelectedReport(null);
        }
    };

    const handleImport = () => {
        console.log("handleImport called. Selected:", { dataset: selectedDataset, table: selectedTable });
        onSelect({
            dataset: selectedDataset,
            table: selectedTable,
            preview: previewData,
            workspaceId: selectedWorkspace?.id // Added workspaceId
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-transparent backdrop-blur-2xl flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 h-[700px] flex flex-col shadow-2xl border border-gray-100" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        {step !== "workspaces" && (
                            <button onClick={handleBack} className="p-1 hover:bg-gray-100 rounded-full transition-colors mr-2">
                                <ChevronRight className="rotate-180 w-5 h-5 text-gray-500" />
                            </button>
                        )}
                        <h3 className="text-xl font-bold text-gray-900">
                            {step === "workspaces" && "Select Workspace"}
                            {step === "datasets" && selectedWorkspace?.name}
                            {step === "embed" && selectedReport?.name}
                            {step === "tables" && selectedDataset?.name}
                            {step === "preview" && `Preview: ${selectedTable}`}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                if (step === "workspaces") fetchWorkspaces();
                                else if (step === "datasets" && selectedWorkspace) {
                                    fetchDatasets(selectedWorkspace.id);
                                    fetchReports(selectedWorkspace.id);
                                }
                                else if (step === "tables" && selectedDataset) fetchTables(selectedDataset.id);
                            }}
                            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors"
                            title="Refresh list"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isLoading ? "animate-spin" : ""}>
                                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                                <path d="M21 3v5h-5" />
                            </svg>
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">Close</button>
                    </div>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 text-sm">{error}</div>}

                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            {step === "workspaces" && workspaces.map((ws) => (
                                <button key={ws.id} onClick={() => setSelectedWorkspace(ws)} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all group text-left">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors"><Folder size={20} /></div>
                                        <div><p className="font-medium text-gray-900">{ws.name}</p></div>
                                    </div>
                                    <ChevronRight className="text-gray-300 group-hover:text-gray-500 transition-colors" size={20} />
                                </button>
                            ))}



                            {step === "datasets" && (
                                <div className="mb-4 flex gap-4 border-b border-gray-100">
                                    <button
                                        onClick={() => setTab("datasets")}
                                        className={`pb-2 px-1 text-sm font-medium transition-colors relative ${tab === "datasets" ? "text-amber-600" : "text-gray-500 hover:text-gray-700"}`}
                                    >
                                        Datasets
                                        {tab === "datasets" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-600 rounded-full" />}
                                    </button>
                                    <button
                                        onClick={() => setTab("reports")}
                                        className={`pb-2 px-1 text-sm font-medium transition-colors relative ${tab === "reports" ? "text-amber-600" : "text-gray-500 hover:text-gray-700"}`}
                                    >
                                        Reports
                                        {tab === "reports" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-600 rounded-full" />}
                                    </button>
                                </div>
                            )}

                            {step === "datasets" && tab === "datasets" && datasets.map((ds) => (
                                <button key={ds.id} onClick={() => setSelectedDataset(ds)} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all group text-left">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center group-hover:bg-amber-100 transition-colors"><Database size={20} /></div>
                                        <div><p className="font-medium text-gray-900">{ds.name}</p></div>
                                    </div>
                                    <ChevronRight className="text-gray-300 group-hover:text-gray-500 transition-colors" size={20} />
                                </button>
                            ))}

                            {step === "datasets" && tab === "reports" && reports.map((rpt) => (
                                <button key={rpt.id} onClick={() => { setSelectedReport(rpt); setStep("embed"); }} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all group text-left">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors"><File size={20} /></div>
                                        <div><p className="font-medium text-gray-900">{rpt.name}</p></div>
                                    </div>
                                    <div className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">View Report</div>
                                </button>
                            ))}

                            {step === "tables" && (
                                tables.length === 0 ? (
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                                        <p className="font-bold mb-2">No tables found.</p>
                                        <p>This usually happens if:</p>
                                        <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                                            <li>The dataset is <strong>empty</strong> (no data imported).</li>
                                            <li>It uses <strong>DirectQuery</strong> or <strong>Live Connection</strong> (not supported).</li>
                                            <li>You are missing <strong>Build permissions</strong>.</li>
                                        </ul>
                                        <div className="mt-3 pt-3 border-t border-amber-200">
                                            <p className="font-medium">💡 Try this test:</p>
                                            <p className="text-xs mt-1">Create a simple Excel file with 1 table, publish it to this workspace, and try selecting it.</p>
                                        </div>
                                    </div>
                                ) : tables[0]?.isDiagnostic ? (
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                                        <p className="font-bold mb-2">Diagnostic Info: {tables[0].reason}</p>
                                        <p>{tables[0].message}</p>
                                        <p className="mt-1 text-xs text-amber-600">Storage Mode: {tables[0].storageMode}</p>
                                        <div className="mt-3 pt-3 border-t border-amber-200">
                                            <p className="font-medium">💡 Solution:</p>
                                            <p className="text-xs mt-1">Please ensure your dataset is in <strong>Import Mode</strong> and contains at least one table with data.</p>
                                        </div>
                                    </div>
                                ) : (
                                    tables.map((tbl) => (
                                        <button key={tbl.name} onClick={() => { setSelectedTable(tbl.name); fetchPreview(tbl.name); }} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all group text-left">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors"><Database size={20} /></div>
                                                <div><p className="font-medium text-gray-900">{tbl.name}</p></div>
                                            </div>
                                            <div className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium group-hover:bg-green-100 group-hover:text-green-700 transition-colors">Preview</div>
                                        </button>
                                    ))
                                )
                            )}

                            {step === "preview" && (
                                <div>
                                    <div className="mb-4 flex justify-end">
                                        <button onClick={handleImport} className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium">Import Data</button>
                                    </div>
                                    <div className="overflow-x-auto border rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    {previewData.length > 0 && Object.keys(previewData[0]).map((key) => (
                                                        <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{key}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {previewData.map((row, i) => (
                                                    <tr key={i}>
                                                        {Object.values(row).map((val: any, j) => (
                                                            <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{String(val)}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}


                            {step === "embed" && selectedReport && (
                                <PowerBIEmbed
                                    reportId={selectedReport.id}
                                    workspaceId={selectedWorkspace?.id}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
