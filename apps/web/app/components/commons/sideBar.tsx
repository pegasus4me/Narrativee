"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";

import Link from "next/link";
import { useSideBarStore } from "../../state/SideBar.store";
import { authClient } from "../../../lib/auth-client";
import { usePathname, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api-config";
import logo from "../../../public/logo.png"
import Image from "next/image";
import { Home, Lightbulb, CalendarDays, Link2, Instagram, Rss, BookOpen } from "lucide-react";

import { LINKEDIN_LOGO, X_LOGO, THREADS_LOGO, FACEBOOK_LOGO } from "@/app/constants";
import ProfileMenuSidebar from "./profileMenuSidebar";
import PrimaryButton from "./PrimaryButton";
import PricingPopUp from "../workspace/pricingPopUp";

const PLATFORM_META: Record<string, { label: string; icon: React.ReactNode }> = {
  linkedin: {
    label: "LinkedIn",
    icon: <img src={LINKEDIN_LOGO} alt="LinkedIn" className="w-5 h-5 object-contain" />,
  },
  x: {
    label: "X (Twitter)",
    icon: <img src={X_LOGO} alt="X (Twitter)" className="w-5 h-5 object-contain mix-blend-multiply" />,
  },
  instagram: {
    label: "Instagram",
    icon: <Instagram className="w-5 h-5 text-[#E1306C]" />,
  },
  threads: {
    label: "Threads",
    icon: <img src={THREADS_LOGO} alt="Threads" className="w-5 h-5 object-contain" />,
  },
  facebook: {
    label: "Facebook",
    icon: <img src={FACEBOOK_LOGO} alt="Facebook" className="w-5 h-5 object-contain" />,
  },
};





interface SideBarProps {
  selectedTemplateId?: string | null;
}



export function SideBar({ selectedTemplateId }: SideBarProps) {
  const params = useParams();
  const path = usePathname()
  const router = useRouter()
  console.log("PATH", path)
  const isSidebarOpen = useSideBarStore((state) => state.opened);
  const toggleSidebar = useSideBarStore((state) => state.toggleSidebar);
  const { data: session } = authClient.useSession();

  const credits = useSideBarStore((state) => state.credits);
  const setCredits = useSideBarStore((state) => state.setCredits);
  const plan = useSideBarStore((state) => state.plan);
  const setPlan = useSideBarStore((state) => state.setPlan);

  const [campaignsOpen, setCampaignsOpen] = useState(false);
  const [channels, setChannels] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [showPricing, setShowPricing] = useState(false);

  useEffect(() => {
    if (session === undefined) return;

    if (session?.user) {
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

      // Fetch connected channels
      fetch(`${API_URL}/channels`, { credentials: 'include' })
        .then(res => res.json())
        .then((data: any) => {
          if (data.channels) {
            setChannels(data.channels);
          }
        })
        .catch(console.error);

      // Fetch connected newsletters
      fetch(`${API_URL}/sources`, { credentials: 'include' })
        .then(res => res.json())
        .then((data: any) => {
          if (data.sources) {
            setSources(data.sources);
          }
        })
        .catch(console.error);
    } else {
      // Guest Sandbox Mode: Populate beautiful fake data in sidebar!
      setChannels([
        {
          id: "mock-channel-1",
          platform: "linkedin",
          accountName: "Sarah Chen (Founder)",
          avatarUrl: "https://images.squarespace-cdn.com/content/v1/687a750f2d0df239a6910948/df95c93a-1179-4c69-98f8-061719c5634b/Sarah+Chen.jpg"
        },
        {
          id: "mock-channel-2",
          platform: "x",
          accountName: "sarah_growth",
          avatarUrl: "https://images.squarespace-cdn.com/content/v1/687a750f2d0df239a6910948/df95c93a-1179-4c69-98f8-061719c5634b/Sarah+Chen.jpg"
        },
        {
          id: "mock-channel-3",
          platform: "threads",
          accountName: "sarah_chen",
          avatarUrl: "https://images.squarespace-cdn.com/content/v1/687a750f2d0df239a6910948/df95c93a-1179-4c69-98f8-061719c5634b/Sarah+Chen.jpg"
        },
        {
          id: "mock-channel-4",
          platform: "instagram",
          accountName: "sarah_insta",
          avatarUrl: "https://images.squarespace-cdn.com/content/v1/687a750f2d0df239a6910948/df95c93a-1179-4c69-98f8-061719c5634b/Sarah+Chen.jpg"
        }
      ]);
      setSources([
        {
          id: "mock-source-1",
          url: "https://creators.substack.com/feed",
          avatarUrl: null
        }
      ]);
    }
  }, [session, setCredits, setPlan]);

  return (
    <>


      <aside
        className={`
          h-screen   
          ${isSidebarOpen ? "w-60" : "w-16"}
          overflow-hidden
        `}
      >
        {/* 1. h-full: Makes the container take full height 
           2. flex-col: Stacks children vertically
        */}
        <div className="p-3 h-full overflow-y-auto flex flex-col text-black">

          <div className="flex items-center justify-center w-full mb-2 ">

            <div className="flex flex-col gap-0.5">
              <Image src={logo} alt="Logo" width={150} height={120} />
            </div>
          </div>
          <div>
            <Link href="/workspace/create" className="w-full block">
              <PrimaryButton
                className="w-full mt-4 text-[16px]4 bg-primary"
              >
                + New
              </PrimaryButton>
            </Link>
          </div>
          <div className="border-gray-700 space-y-1 mt-10 font-urbanist">

            <Link href="/workspace" className={`w-full  text-left text-[16px]  py-1 px-4 flex  items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <Home className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="text-md font-medium">Home</span>}
            </Link>
            <Link href="/workspace/create" className={`w-full text-left text-[16px] py-1 px-4 flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <Lightbulb className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="text-md font-medium">Create</span>}
            </Link>


            {/* — Tools — */}
            <Link href="/workspace/post-queue" className={`w-full text-left text-[16px] py-1 px-4 flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <CalendarDays className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="text-md font-medium">Schedule</span>}
            </Link>
            <Link href="/workspace/channels" className={`w-full text-left text-[16px] py-1 px-4 flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <Link2 className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="text-md font-medium">Channels</span>}
            </Link>



            <div className="py-2">
              <small className="text-xs text-gray-500 px-4">Connected channels</small>
              <div className="mt-2 space-y-1">
                {channels.length > 0 ? (
                  channels.map((channel) => {
                    const meta = PLATFORM_META[channel.platform];
                    if (!meta) return null;
                    return (
                      <div key={channel.id} className={`flex items-center gap-3 py-1.5 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4 hover:bg-zinc-100 rounded-lg mx-2 transition-colors cursor-pointer'}`}>
                        <div className="relative shrink-0 flex items-center justify-center">
                          {channel.avatarUrl ? (
                            <img src={channel.avatarUrl} alt={channel.accountName} className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-semibold text-zinc-600">
                              {(channel.accountName || meta.label).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-sm [&>img]:w-2.5 [&>img]:h-2.5 [&>svg]:w-2.5 [&>svg]:h-2.5">
                            {meta.icon}
                          </div>
                        </div>
                        {isSidebarOpen && <span className="text-sm font-medium text-zinc-700 truncate">{channel.accountName || meta.label}</span>}
                      </div>
                    );
                  })
                ) : (
                  <div className={`px-4 text-xs text-zinc-400 ${!isSidebarOpen && 'text-center'}`}>
                    {isSidebarOpen ? 'No channels connected' : '-'}
                  </div>
                )}
              </div>
            </div>
            <div className="py-2">
              <small className="text-xs text-gray-500 px-4">Connected newsletters</small>
              <div className="mt-2 space-y-1">
                {sources.length > 0 ? (
                  sources.map((source) => {
                    const getInitials = (urlStr: string) => {
                      try {
                        const domain = new URL(urlStr).hostname;
                        const part = domain.split('.')[0];
                        return (part && typeof part === 'string' ? part : 'S').substring(0, 1).toUpperCase();
                      } catch {
                        return 'S';
                      }
                    };

                    const getFaviconUrl = (urlStr: string) => {
                      try {
                        const url = new URL(urlStr);
                        return `${url.protocol}//${url.hostname}/favicon.ico`;
                      } catch {
                        return null;
                      }
                    };

                    const favicon = getFaviconUrl(source.url);
                    const imgUrl = source.avatarUrl || favicon;

                    return (
                      <div key={source.id} className={`flex items-center gap-3 py-1.5 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4 hover:bg-zinc-100 rounded-lg mx-2 transition-colors cursor-pointer'}`}>
                        <div className="relative shrink-0 flex items-center justify-center w-6 h-6">
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt="Substack Avatar"
                              className="w-6 h-6 rounded-full object-cover border border-zinc-100"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = document.getElementById(`sidebar-fallback-${source.id}`);
                                if (fallback) fallback.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div
                            id={`sidebar-fallback-${source.id}`}
                            className={`w-6 h-6 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-[10px] font-bold text-orange-600 ${imgUrl ? 'hidden' : ''
                              }`}
                          >
                            {getInitials(source.url)}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-sm border border-zinc-100 p-0.5">
                            <img src="https://cdn.worldvectorlogo.com/logos/substack-1.svg" alt="Substack" className="w-2.5 h-2.5 object-contain" />
                          </div>
                        </div>
                        {isSidebarOpen && (
                          <span className="text-sm font-medium text-zinc-700 truncate">
                            {source.url.replace('https://', '').replace('/feed', '')}
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className={`px-4 text-xs text-zinc-400 ${!isSidebarOpen && 'text-center'}`}>
                    {isSidebarOpen ? 'No newsletters connected' : '-'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- Bottom Section ---
              Added `mt-auto` to push this to the bottom
              Added `space-y-2` for spacing between buttons
          */}
          <div className="mt-auto w-full pb-4 space-y-2">

            {session?.user && (plan === 'free' || !plan) && isSidebarOpen && (
              <div className="mx-2 p-3 bg-zinc-50 border border-zinc-200/50 rounded-xl space-y-2.5 font-urbanist">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Free Trial
                  </span>
                  <span className="text-[11px] font-medium text-zinc-500">
                    {credits !== null ? `${credits}/40 credits` : "40 credits"}
                  </span>
                </div>
                <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, Math.max(0, ((credits ?? 40) / 40) * 100))}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPricing(true)}
                  className="block w-full text-center text-xs font-light text-white bg-primary hover:bg-zinc-800 py-2 rounded-lg transition-colors shadow-xs"
                >
                   pricing ( - 20% off ) 
                </button>
              </div>
            )}

            {session?.user && (plan === 'free' || !plan) && !isSidebarOpen && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowPricing(true)}
                  title={`Upgrade - ${credits ?? 0}/40 credits left`}
                  className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 transition-all"
                >
                  {credits !== null ? credits : "T"}
                </button>
              </div>
            )}

            {session?.user && (
              <div className={`flex ${!isSidebarOpen ? 'justify-center' : 'px-2'}`}>
                <ProfileMenuSidebar isSidebarOpen={isSidebarOpen} />
              </div>
            )}

          </div>
        </div>
      </aside>

      <PricingPopUp isOpen={showPricing} onClose={() => setShowPricing(false)} />
    </>
  );
}