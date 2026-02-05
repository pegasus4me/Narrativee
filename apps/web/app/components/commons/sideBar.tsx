"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";

import Link from "next/link";
import { useSideBarStore } from "../../state/SideBar.store";
import { authClient } from "../../../lib/auth-client";
import { usePathname, useRouter } from "next/navigation";
import { IoHomeSharp, IoSettingsSharp, IoLogoSlack } from "react-icons/io5";

import { MdKeyboardDoubleArrowLeft, MdKeyboardArrowDown } from "react-icons/md";
import Image from "next/image";
import { FaMagic } from "react-icons/fa";
import { API_URL } from "@/lib/api-config";
import logo from "../../../public/logoDark.png"
import logoSide from "../../../public/logo.png"

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
  const { data: session } = authClient.useSession();
  const [orgData, setOrgData] = useState<OrgData>({});

  useEffect(() => {
    if (session?.user) {
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
          h-screen bg-white border  
          ${isSidebarOpen ? "w-67" : "w-16"}
          overflow-hidden
        `}
        style={{ fontFamily: 'var(--font-noto)' }}
      >
        {/* 1. h-full: Makes the container take full height 
           2. flex-col: Stacks children vertically
        */}
        <div className="p-3 h-full overflow-y-auto flex flex-col">

          <div className="flex items-center justify-between w-full mb-2">
            {isSidebarOpen ? (
              <Image src={logo} alt="Logo" width={120} height={120} />
            ) : (
              <Image src={logoSide} alt="Logo" width={15} height={15} />
            )}
            <button
              onClick={toggleSidebar}
              className={`hover:bg-gray-200 rounded-md transition-colors p-1 ${!isSidebarOpen ? 'mx-auto' : ''}`}
              aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <MdKeyboardDoubleArrowLeft className={`w-5 h-5 text-gray-600 transition-transform ${!isSidebarOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="space-y-1  font-manrope">
            <Link href="/workspace" className={`w-full py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <IoHomeSharp size={18} className="shrink-0" />
              {isSidebarOpen && <span>Home</span>}
            </Link>

          </div>
          <div className=" border-gray-200 space-y-1">

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