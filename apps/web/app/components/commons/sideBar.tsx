"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import logo from "../../public/logo.png";
import { Add, Setting7, File, Home4, Slack, Database, Sparkles } from "clicons-react";
import Link from "next/link";
import { useSideBarStore } from "../../state/SideBar.store";
import { authClient } from "../../../lib/auth-client";
import { reportApi } from "../../../lib/apis";
import { usePathname, useRouter } from "next/navigation";
import PrimaryButton from "./PrimaryButton";
import { IoAddCircle, IoFileTrayStacked, IoHomeSharp, IoSettingsSharp, IoLogoSlack, IoChatbubbles } from "react-icons/io5";
import { FaDatabase } from "react-icons/fa";
import { MdKeyboardDoubleArrowLeft, MdKeyboardArrowDown } from "react-icons/md";
import { AnimatePresence, motion } from "framer-motion";
import { LuWorkflow } from "react-icons/lu";
import { FaMagic } from "react-icons/fa";
import { API_URL } from "@/lib/api-config";

import ProfileMenu from "./ProfileMenu";
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

interface OrgData {
  orgName?: string;
  orgLogo?: string;
  orgUrl?: string;
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
  const { data: session } = authClient.useSession();
  const [credits, setCredits] = useState<number | null>(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(true);
  const [orgData, setOrgData] = useState<OrgData>({});

  useEffect(() => {
    if (session?.user) {
      reportApi.getUserCredits().then(setCredits).catch(console.error);
      // Fetch org data
      fetch(`${API_URL}/onboarding`, { credentials: 'include' })
        .then(res => res.json())
        .then((data: any) => setOrgData(data))
        .catch(console.error);
    }
  }, [session?.user]);

  return (
    <>


      <aside
        className={`
          h-screen bg-white border rounded-lg ml-1
          ${isSidebarOpen ? "w-67" : "w-16"}
          overflow-hidden
        `}
        style={{ fontFamily: 'var(--font-noto)' }}
      >
        {/* 1. h-full: Makes the container take full height 
           2. flex-col: Stacks children vertically
        */}
        <div className="p-3 h-full overflow-y-auto flex flex-col">
          {/* Org Header */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
           <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">  
             {orgData.orgLogo ? (
              <img
                src={orgData.orgLogo}
                alt="Org Logo"
                className="w-6 h-6 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-manrope">
                  {orgData.orgName?.charAt(0)?.toUpperCase() || 'N'}
                </span>
              </div>
            )}
           </div>
            {isSidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 text-sm truncate font-manrope">
                  {orgData.orgName || 'My Workspace'}
                </p>
                {orgData.orgUrl && (
                  <p className="text-xs text-gray-400 truncate">{orgData.orgUrl.replace(/^https?:\/\//, '')}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mb-2" >
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

          <div className="space-y-1 pt-4 font-manrope">
            <Link href="/workspace" className={`w-full py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <IoHomeSharp size={18} className="shrink-0" />
              {isSidebarOpen && <span>Home</span>}
            </Link>
            <div className="mt-4">
              <Link href="/workspace/workflows" className={`w-full py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
                <LuWorkflow size={18} className="shrink-0" />
                {isSidebarOpen && <span>Workflow</span>}
              </Link>
              <Link href="/workspace/dashboard" className={`w-full py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
                <FaDatabase size={15

                } className="shrink-0" />
                {isSidebarOpen && <span>Audience</span>}
              </Link>
            </div>
          </div>
          <div className="mb-2 mt-10 border-gray-200 space-y-1">

            <Link href="/setting" className={`w-full py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <IoSettingsSharp size={18} className="shrink-0" />
              {isSidebarOpen && <span>Settings</span>}
            </Link>
            <Link href="/setting" className={`w-full py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <FaMagic size={18} className="shrink-0" />
              {isSidebarOpen && <span>Feature request</span>}
            </Link>
            <a href="https://narrativecommunity.slack.com" target="_blank" className={`w-full py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <IoLogoSlack size={18} className="shrink-0" />
              {isSidebarOpen && <span>Join slack</span>}
            </a>

          </div>
          {/* --- Bottom Section ---
              Added `mt-auto` to push this to the bottom
              Added `space-y-2` for spacing between buttons
          */}

        </div>
      </aside>
    </>
  );
}