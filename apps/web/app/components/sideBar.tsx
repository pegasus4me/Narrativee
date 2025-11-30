"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import logo from "../../public/logo.png";
import { Add, Setting7, File, Home4 } from "clicons-react";
import Link from "next/link";
import { useSideBarStore } from "../state/logo-transition/SideBar.store";
import { authClient } from "../../lib/auth-client";
import { reportApi } from "../../lib/apis";
import { usePathname, useRouter } from "next/navigation";


interface Template {
  id: string;
  name: string;
  description: string;
  sections: any[];
}

interface ReportData {
  success: boolean;
  template: Template;
  metadata: {
    fileName: string;
    rowCount: number;
    columns: string[];
  };
}

interface SideBarProps {
  selectedTemplateId?: string | null;
}

interface SavedReport {
  id: string;
  name: string;
  fileName: string;
  createdAt: string;
}

export function SideBar({ selectedTemplateId }: SideBarProps) {
  const params = useParams();
  const path = usePathname()
  const router = useRouter()
  console.log("PATH", path)
  const reportId = params.reportID as string;
  const isSidebarOpen = useSideBarStore((state) => state.opened);
  const toggleSidebar = useSideBarStore((state) => state.toggleSidebar);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const { data: session } = authClient.useSession();
  const [reportName, setReportName] = useState("");
  const nameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [credits, setCredits] = useState<number | null>(null);

  // Check if reportId is a valid UUID
  const isValidUUID = (id: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  // Handle report name change with debouncing
  const handleNameChange = (newName: string) => {
    setReportName(newName);

    // Only save to backend if authenticated and UUID
    if (!session?.user || !isValidUUID(reportId)) {
      return;
    }

    // Clear previous timeout
    if (nameTimeoutRef.current) {
      clearTimeout(nameTimeoutRef.current);
    }

    // Debounce: Wait 1 second after user stops typing
    nameTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('📝 Updating report name from sidebar:', newName);
        await reportApi.updateReport(reportId, { name: newName });
        console.log('✅ Report name updated');
      } catch (error) {
        console.error('❌ Failed to update report name:', error);
      }
    }, 1000);
  };

  // Handle updating report name in workspace list
  const handleWorkspaceNameUpdate = async (id: string, newName: string) => {
    if (!session?.user || !isValidUUID(id)) {
      return;
    }

    try {
      await reportApi.updateReport(id, { name: newName });
      // Update local state
      setSavedReports(reports =>
        reports.map(r => r.id === id ? { ...r, name: newName } : r)
      );
      setEditingReportId(null);
      console.log('✅ Report name updated in workspace');
    } catch (error) {
      console.error('❌ Failed to update report name:', error);
    }
  };

  useEffect(() => {
    if (session?.user) {
      reportApi.getUserCredits().then(setCredits).catch(console.error);
    }
  }, [session?.user]);

  useEffect(() => {
    // Load report data from localStorage or backend
    const loadReportData = async () => {
      try {
        if (session?.user && isValidUUID(reportId)) {
          // Fetch from backend
          const report = await reportApi.getReportById(reportId);
          const data: ReportData = {
            success: true,
            template: {
              id: report.id,
              name: report.name,
              description: `${report.audience} - ${report.reportStyle}`,
              sections: []
            },
            metadata: {
              fileName: report.fileName,
              rowCount: 0,
              columns: [],
              ...report.metadata, // Spread metadata to override defaults if they exist
            }
          };
          setReportData(data);
          setReportName(report.name);
          setIsLoading(false);
        } else {
          // Load from localStorage
          const stored = localStorage.getItem(`report-${reportId}`);
          if (stored) {
            const data = JSON.parse(stored);
            setReportData(data);
            setReportName(data.template?.name || "");
            setIsLoading(false);
          } else {
            // Still loading from API
            setTimeout(loadReportData, 1000);
          }
        }
      } catch (error) {
        console.error("Error loading report:", error);
        setIsLoading(false);
      }
    };

    if (reportId) {
      loadReportData();
    }
  }, [reportId, session?.user]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (nameTimeoutRef.current) {
        clearTimeout(nameTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Get all reports from backend or localStorage
    const getAllReports = async () => {
      try {
        if (session?.user) {
          // Fetch from backend
          console.log('📦 Fetching all reports from backend...');
          const reports = await reportApi.getAllReports();
          setSavedReports(reports.map(r => ({
            id: r.id,
            name: r.name,
            fileName: r.fileName,
            createdAt: r.createdAt
          })));
        } else {
          // Get from localStorage for anonymous users
          const reports: SavedReport[] = [];

          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);

            if (key && key.startsWith('report-')) {
              try {
                const reportData = JSON.parse(localStorage.getItem(key) || '{}');
                const id = key.replace('report-', '');

                if (reportData.success && reportData.template && reportData.metadata) {
                  reports.push({
                    id,
                    name: reportData.template.name || 'Untitled Report',
                    fileName: reportData.metadata.fileName || 'Unknown File',
                    createdAt: new Date().toISOString(),
                  });
                }
              } catch (error) {
                console.error('Error parsing report:', error);
              }
            }
          }

          setSavedReports(reports);
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
      }
    };

    getAllReports();
  }, [reportId, session?.user]);

  return (
    <>
      {/* Collapse/Expand Button */}
      <button
        onClick={toggleSidebar}
        className={`
          fixed top-1/2 -translate-y-1/2 z-50 
           transition-all duration-300 bg-neutral-100 h-20 rounded-r-md
          ${isSidebarOpen ? 'left-80' : 'left-0'}
        `}
        aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <svg
          className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${isSidebarOpen ? '' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <aside
        className={`
          h-screen bg-white border-r border-gray-200 transition-all duration-300
          ${isSidebarOpen ? "w-80" : "w-0"}
          overflow-hidden
        `}
      >
        {/* 1. h-full: Makes the container take full height 
           2. flex-col: Stacks children vertically
        */}
        <div className="p-6 h-full overflow-y-auto flex flex-col">

          {/* --- Top Section (Report Status) --- */}
          <div className="mb-6">
            <div className="mb-5">
              <Image src={logo} alt="logo" width={140} />
            </div>

            {reportData && !path.endsWith('/workspace') && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">
                    Data Name
                  </label>
                  <p className="text-sm font-medium text-gray-900 mt-1 wrap-break-words overflow-hidden" style={{ fontFamily: "var(--font-mono)" }}>
                    {reportData.metadata.fileName}
                  </p>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <label className="text-xs text-gray-500 uppercase tracking-wide">
                    Data Summary
                  </label>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Rows:</span>
                      <span className="font-medium text-gray-900" style={{ fontFamily: "var(--font-mono)" }}>
                        {reportData.metadata.rowCount}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 text-md">Columns:</span>
                      <span className="font-medium text-gray-900" style={{ fontFamily: "var(--font-mono)" }}>
                        {reportData.metadata.columns.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!path.endsWith('/workspace') && isLoading && (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            )}
          </div>

          {/* --- Actions (New Report) --- */}
          <div className="space-y-2 pt-4 border-t border-gray-200">
            <Link href="/" className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-2">
              <Add size={20} />
              New Report
            </Link>
            <section>
              <h4 className="px-4 text-sm font-medium text-gray-900 mb-2">Workspace</h4>
              <div className="">
                {/* Loop through created reports */}
                {savedReports.length > 0 ? (
                  savedReports.map((report) => (
                    <div
                      key={report.id}
                      className={`px-4 py-2 text-left text-sm rounded-md transition-colors ${reportId === report.id
                          ? 'text-natural-500 font-medium bg-neutral-100'
                          : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      {editingReportId === report.id ? (
                        <div className="flex items-center gap-2">
                          <File className="size-4" strokeWidth={1.5} />
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => handleWorkspaceNameUpdate(report.id, editingName)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleWorkspaceNameUpdate(report.id, editingName);
                              } else if (e.key === 'Escape') {
                                setEditingReportId(null);
                              }
                            }}
                            autoFocus
                            className="flex-1 px-1 py-0.5 border border-amber-400 rounded focus:outline-none"
                          />
                        </div>
                      ) : (
                        <Link href={`/workspace/${report.id}`} className="flex items-center gap-2">
                          <File className="size-4" strokeWidth={1.5} />
                          <span
                            className="truncate flex-1"
                            onDoubleClick={(e) => {
                              e.preventDefault();
                              if (session?.user && isValidUUID(report.id)) {
                                setEditingReportId(report.id);
                                setEditingName(report.name);
                              }
                            }}
                          >
                            {report.name}
                          </span>
                        </Link>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="px-4 py-2 text-xs text-gray-500 italic">No reports yet</p>
                )}
              </div>
            </section>
          </div>

          {/* --- Bottom Section ---
              Added `mt-auto` to push this to the bottom
              Added `space-y-2` for spacing between buttons
          */}
          <div className="mt-auto pt-4 border-t border-gray-200 space-y-2">
            <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              onClick={() => router.push("/workspace")}
            >
              <Home4 size={20} />
              Wour workspace
            </button>

            <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2">
              <Setting7 size={20} />
              Settings
            </button>

            <div suppressHydrationWarning>
              {session?.user ? (
                <div className="pt-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
                    <Image
                      src={session.user.image || '/default-avatar.png'}
                      alt={session.user.name || 'User'}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{session.user.name}</p>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-900" style={{ fontFamily: 'var(--font-petrona)' }}>Free plan</p>
                        {credits !== null && (
                          <span className="text-xs text-amber-600 font-medium ml-2">{credits} credits</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <button className="w-full bg-amber-400 border px-5 py-2 rounded-md font-medium text-black text-sm hover:bg-amber-500 transition-colors text-center">
                  Login to save your work
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}