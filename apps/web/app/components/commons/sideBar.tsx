"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";

import Link from "next/link";
import { useSideBarStore } from "../../state/SideBar.store";
import { authClient } from "../../../lib/auth-client";
import { usePathname, useRouter } from "next/navigation";
import { IoHomeOutline, IoSettingsOutline, IoGitBranchOutline } from "react-icons/io5";
import { FaPenNib } from "react-icons/fa";
import { MdKeyboardDoubleArrowLeft, MdKeyboardArrowDown } from "react-icons/md";
import Image from "next/image";
import { FaMagic } from "react-icons/fa";
import { API_URL } from "@/lib/api-config";
import logo from "../../../public/narrativee.png"
import logoSide from "../../../public/logo.png"
import { VscLayoutSidebarRight } from "react-icons/vsc";
import { VscLayoutSidebarLeft } from "react-icons/vsc";
import { BsDatabaseCheck } from "react-icons/bs";
import { LuLibraryBig } from "react-icons/lu";
import { TbMessageChatbot } from "react-icons/tb";
import ProfileMenuSidebar from "./profileMenuSidebar";
import ExtensionBanner from "../workspace/ExtensionBanner";

interface Template {
  id: string;
  name: string;
  description: string;
  sections: any[];
}


interface SideBarProps {
  selectedTemplateId?: string | null;
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
          h-screen   
          ${isSidebarOpen ? "w-67" : "w-16"}
          overflow-hidden
          rounded-r-sm
  
        `}
      >
        {/* 1. h-full: Makes the container take full height 
           2. flex-col: Stacks children vertically
        */}
        <div className="p-3 h-full overflow-y-auto flex flex-col bg-black/10">

          <div className="flex items-center justify-between w-full mb-2 ">
            {isSidebarOpen ? (
              <Image src={logo} alt="Logo" width={150} height={120} />
            ) : (
              null
            )}
            <button
              onClick={toggleSidebar}
              className={`hover:bg-gray-700 rounded-md transition-colors p-1 ${!isSidebarOpen ? 'mx-auto' : ''}`}
              aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isSidebarOpen ? <VscLayoutSidebarLeft className={`w-5 h-5 text-gray-400 transition-transform ${!isSidebarOpen ? 'rotate-180' : ''}`} /> : <VscLayoutSidebarRight className={`w-5 h-5 text-gray-400 transition-transform ${!isSidebarOpen ? 'rotate-180' : ''}`} />}
            </button>
          </div>
          <div className=" border-gray-700 space-y-4 mt-10 ">
            <Link href="/workspace" className={`w-full py-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <IoHomeOutline size={20} className="shrink-0" />
              {isSidebarOpen && <span className="text-md font-medium">Home</span>}
            </Link>
            <Link href="/workspace/knowledge" className={`w-full py-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <BsDatabaseCheck size={20} className="shrink-0" />
              {isSidebarOpen && <span className="text-md font-medium">Knowledge base</span>}
            </Link>
            <Link href="/workspace/post-queue" className={`w-full py-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <FaPenNib size={20} className="shrink-0" />
              {isSidebarOpen && <span className="text-md font-medium">Posts queue</span>}
            </Link>
            <Link href="/workspace/engage" className={`w-full py-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <TbMessageChatbot size={20} className="shrink-0" />
              {isSidebarOpen && <span className="text-md font-medium">Engage</span>}
            </Link>
            <Link href="#" className={`w-full py-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <IoGitBranchOutline size={20} className="shrink-0" />
              {isSidebarOpen && <span className="text-md font-medium">Cross Post <span className="text-xs text-gray-500 bg-yellow-500 px-2 py-0.5 rounded-full text-white">Soon</span></span>}
            </Link>
            <Link href="/setting" className={`w-full py-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <FaMagic size={20} className="shrink-0" />
              {isSidebarOpen && <span className="text-md font-medium">Feature request</span>}
            </Link>
            <Link href="/workspace/inspirations" className={`w-full py-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <LuLibraryBig size={20} className="shrink-0" />
              {isSidebarOpen && <span className="text-md font-medium">Inspiration</span>}
            </Link>
          </div>
          {/* --- Bottom Section ---
              Added `mt-auto` to push this to the bottom
              Added `space-y-2` for spacing between buttons
          */}
          <div className="mt-auto w-full pb-4">
            <ExtensionBanner isSidebarOpen={isSidebarOpen} />
            {session?.user && (
              <div className={`flex ${!isSidebarOpen ? 'justify-center' : 'px-2'}`}>
                <ProfileMenuSidebar isSidebarOpen={isSidebarOpen} />
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}