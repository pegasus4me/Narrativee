"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import logo from "../../public/logo.png";
import { Add, Setting7, File, Home4, Slack, Database, Sparkles } from "clicons-react";
import Link from "next/link";
import { useSideBarStore } from "../state/logo-transition/SideBar.store";
import { authClient } from "../../lib/auth-client";
import { reportApi } from "../../lib/apis";
import { usePathname, useRouter } from "next/navigation";
import PrimaryButton from "./PrimaryButton";
import { IoAddCircle, IoFileTrayStacked, IoHomeSharp, IoSettingsSharp, IoLogoSlack, IoChatbubbles } from "react-icons/io5";
import { FaDatabase } from "react-icons/fa";
import { MdKeyboardDoubleArrowLeft } from "react-icons/md";
import SidebarProfile from "./SidebarProfile";

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
  const toggleChat = useSideBarStore((state) => state.toggleChat);
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


      <aside
        className={`
          h-screen  border-r border-gray-200 bg-white
          ${isSidebarOpen ? "w-67" : "w-16"}
          overflow-hidden
        `}
        style={{ fontFamily: 'var(--font-noto)' }}
      >
        {/* 1. h-full: Makes the container take full height 
           2. flex-col: Stacks children vertically
        */}
        <div className="p-3 h-full overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between mb-2" >
            {isSidebarOpen && session?.user ? (
              <SidebarProfile isCollapsed={!isSidebarOpen} />
            ) : (
              null
            )}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">

              </div>
              <button
                onClick={toggleSidebar}
                className={`hover:bg-gray-200 rounded-md transition-colors p-1 ${!isSidebarOpen ? 'mx-auto' : ''}`}
                aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                <MdKeyboardDoubleArrowLeft className={`w-5 h-5 text-gray-600 transition-transform ${!isSidebarOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
          {/* --- Actions (New Report) --- */}
          <div className="space-y-1 pt-4">
            <Link href="/workspace/new" className={`w-full py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <IoAddCircle size={18} className="shrink-0" />
              {isSidebarOpen && <span>New</span>}
            </Link>
            <Link href="/workspace/integrations" className={`w-full py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <FaDatabase size={15

              } className="shrink-0" />
              {isSidebarOpen && <span>Integrations</span>}
            </Link>
            {reportId && !path.endsWith('/workspace') && (
              <button
                onClick={toggleChat}
                className={`w-full py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}
              >
                <IoChatbubbles size={18} className="shrink-0" />
                {isSidebarOpen && <span>Ask AI</span>}
              </button>
            )}
            {isSidebarOpen && (
              <div className="w-full px-4 py-2 text-left text-sm text-gray-700 flex items-center gap-2">
                <IoFileTrayStacked size={14} />
                Workspace
              </div>
            )}
            {isSidebarOpen && (
              <section className="mt-2 h-[calc(100vh-450px)]">
                <div className="space-y-1 h-full overflow-y-auto ml-3 border-l border-gray-200">
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
                              className="truncate flex-1 text-sm"
                              onDoubleClick={(e) => {
                                e.preventDefault();
                                if (session?.user && isValidUUID(report.id)) {
                                  setEditingReportId(report.id);
                                  setEditingName(report.name);
                                }
                              }}
                              style={{ fontFamily: 'var(--font-noto)' }}
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
            )}
          </div>

          {/* --- Bottom Section ---
              Added `mt-auto` to push this to the bottom
              Added `space-y-2` for spacing between buttons
          */}
          <div className="mt-auto pt-4 border-gray-200 space-y-1">
            <button className={`w-full py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}
              onClick={() => router.push("/workspace")}
            >
              <IoHomeSharp size={18} className="shrink-0" />
              {isSidebarOpen && <span>Home</span>}
            </button>

            <Link href="/setting" className={`w-full py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <IoSettingsSharp size={18} className="shrink-0" />
              {isSidebarOpen && <span>Settings</span>}
            </Link>
            <a href="https://narrativecommunity.slack.com" target="_blank" className={`w-full py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <IoLogoSlack size={18} className="shrink-0" />
              {isSidebarOpen && <span>Join slack</span>}
            </a>

          </div>
        </div>
      </aside>
    </>
  );
}