"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";

import Link from "next/link";
import { useSideBarStore } from "../../state/SideBar.store";
import { authClient } from "../../../lib/auth-client";
import { usePathname, useRouter } from "next/navigation";
import { IoHomeOutline, IoSettingsOutline, IoGitBranchOutline } from "react-icons/io5";
import { FaPenNib } from "react-icons/fa";
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from "react-icons/md";
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
import { MdOutlineCampaign } from "react-icons/md";
import ProfileMenuSidebar from "./profileMenuSidebar";
import ExtensionBanner from "../workspace/ExtensionBanner";

interface Campaign {
  id: string;
  name: string;
  status: "draft" | "active" | "paused" | "completed";
}

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
  substackPublicationName?: string;
  substackPublicationLogo?: string;

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

  const credits = useSideBarStore((state) => state.credits);
  const setCredits = useSideBarStore((state) => state.setCredits);
  const plan = useSideBarStore((state) => state.plan);
  const setPlan = useSideBarStore((state) => state.setPlan);

  const [campaignsOpen, setCampaignsOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    if (session?.user) {
      // Fetch org data
      fetch(`${API_URL}/onboarding`, { credentials: 'include' })
        .then(res => res.json())
        .then((data: any) => setOrgData(data))
        .catch(console.error);

      // Fetch user credits
      fetch(`${API_URL}/user/credits`, { credentials: 'include' })
        .then(res => res.json())
        .then((data: any) => {
          if (data.success && typeof data.credits === 'number') {
            setCredits(data.credits);
            if (data.plan) {
              setPlan(data.plan);
            }
          }
        })
        .catch(console.error);

      // Fetch campaigns for sidebar
      fetch(`${API_URL}/campaigns`, { credentials: 'include' })
        .then(res => res.json())
        .then((data: any) => { if (data.campaigns) setCampaigns(data.campaigns); })
        .catch(console.error);
    }
  }, [session?.user, setCredits, setPlan]);

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
              <div className="flex flex-col gap-0.5">
                <Image src={logo} alt="Logo" width={150} height={120} />
                {orgData?.substackPublicationName && (
                 <div className="flex items-center gap-2 text-xs text-gray-400 bg-accent/10 px-2 py-1 rounded">
                  
                    <Image src={orgData.substackPublicationLogo || logoSide} alt="Publication Logo" width={16} height={16} className="rounded-full" />
                    <span>{orgData.substackPublicationName}</span>
                  </div>
                )}
              </div>
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
          <div className="border-gray-700 space-y-1 mt-10">

            {/* — Overview — */}
            {isSidebarOpen && <p className="px-4 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-600">Overview</p>}
            <Link href="/workspace" className={`w-full py-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <IoHomeOutline size={20} className="shrink-0" />
              {isSidebarOpen && <span className="text-md font-medium">Home</span>}
            </Link>
            <Link href="/workspace/knowledge" className={`w-full py-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <BsDatabaseCheck size={20} className="shrink-0" />
              {isSidebarOpen && <span className="text-md font-medium">Knowledge base</span>}
            </Link>

            {/* — Separator — */}
            <div className={`${isSidebarOpen ? 'mx-4' : 'mx-2'} border-t border-white/[0.06] pt-3 mt-3`} />

            {/* — Tools — */}
            {isSidebarOpen && <p className="px-4 pb-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-600">Tools</p>}
            <Link href="/workspace/post-queue" className={`w-full py-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <FaPenNib size={20} className="shrink-0" />
              {isSidebarOpen && <span className="text-md font-medium">Posts queue</span>}
            </Link>
            <Link href="/workspace/engage" className={`w-full py-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <TbMessageChatbot size={20} className="shrink-0" />
              {isSidebarOpen && <span className="text-md font-medium">Engage</span>}
            </Link>
            <div>
              <div className={`w-full py-2 text-left text-sm text-gray-300 rounded-lg transition-colors flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
                <Link href="/workspace/campaigns" className="flex items-center gap-2 flex-1">
                  <MdOutlineCampaign size={20} className="shrink-0" />
                  {isSidebarOpen && <span className="text-md font-medium">Campaigns</span>}
                </Link>
                {isSidebarOpen && (
                  <button
                    onClick={() => setCampaignsOpen(o => !o)}
                    className="ml-auto p-0.5 hover:bg-gray-700 rounded"
                    aria-label="Toggle campaigns list"
                  >
                    {campaignsOpen ? <MdKeyboardArrowDown size={16} /> : <MdKeyboardArrowRight size={16} />}
                  </button>
                )}
              </div>
              {isSidebarOpen && campaignsOpen && (
                <div className="ml-6 mt-1 space-y-0.5">
                  {campaigns.length === 0 ? (
                    <span className="text-xs text-gray-500 px-2">No campaigns yet</span>
                  ) : (
                    campaigns.map(c => (
                      <Link
                        key={c.id}
                        href={`/workspace/campaigns?id=${c.id}`}
                        className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-400 hover:bg-gray-700 hover:text-gray-200 rounded-md transition-colors truncate"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.status === 'active' ? 'bg-green-400' : c.status === 'paused' ? 'bg-yellow-400' : 'bg-gray-500'}`} />
                        <span className="truncate">{c.name}</span>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
            <Link href="/workspace/inspirations" className={`w-full py-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <LuLibraryBig size={20} className="shrink-0" />
              {isSidebarOpen && <span className="text-md font-medium">Inspiration</span>}
            </Link>
          </div>
          {/* --- Bottom Section ---
              Added `mt-auto` to push this to the bottom
              Added `space-y-2` for spacing between buttons
          */}
          <div className="mt-auto w-full pb-4 space-y-2">

            {/* Credits Display */}
            <div className={`flex items-center text-sm font-medium ${isSidebarOpen ? 'px-4 text-amber-500 bg-amber-500/10 py-2 mx-2 rounded-lg' : 'justify-center text-amber-500 py-2'} select-none`}>
              <span className="shrink-0">⚡</span>
              {isSidebarOpen && (
                <div className="flex flex-col ml-2 w-full">
                  <div className="flex items-center justify-between w-full pr-1">
                    <span>{credits !== null ? `${credits} Credits left` : 'Loading...'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Upgrade Button for Trial Users */}
            {plan === 'free' && (
              <div className={`px-2 ${!isSidebarOpen && 'flex justify-center'}`}>
                <Link
                  href="/pricing"
                  className={`flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-sm font-bold rounded-lg transition-all shadow-md ${isSidebarOpen ? 'w-full' : 'w-10 h-10 rounded-full text-lg'}`}
                >
                  {isSidebarOpen ? 'Upgrade Now' : '↑'}
                </Link>
              </div>
            )}


            {session?.user && (
              <div className={`flex ${!isSidebarOpen ? 'justify-center' : 'px-2'}`}>
                <ProfileMenuSidebar isSidebarOpen={isSidebarOpen} />
              </div>
            )}
            <ExtensionBanner isSidebarOpen={isSidebarOpen} />

          </div>
        </div>
      </aside>
    </>
  );
}