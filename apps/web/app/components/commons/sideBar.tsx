"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSideBarStore } from "../../state/SideBar.store";
import { authClient } from "../../../lib/auth-client";
import { usePathname, useRouter } from "next/navigation";
import logo from "../../../public/logo.png"
import Image from "next/image";
import { Home, Lightbulb, CalendarDays, Link2, Instagram, Rss, ChevronLeft, ChevronRight, Brain, Sparkles, Plus, MessageCircle } from "lucide-react";

import { LINKEDIN_LOGO, X_LOGO, THREADS_LOGO, FACEBOOK_LOGO } from "@/app/constants";
import ProfileMenuSidebar from "./profileMenuSidebar";
import PrimaryButton from "./PrimaryButton";
import PricingPopUp from "../workspace/pricingPopUp";
import { useChannels } from "@/app/hooks/api/useChannels";
import { useSources } from "@/app/hooks/api/useSources";
import { useCredits } from "@/app/hooks/api/useCredits";

const PLATFORM_META: Record<string, { label: string; icon: React.ReactNode }> = {
  linkedin: {
    label: "LinkedIn",
    icon: <img src={LINKEDIN_LOGO} alt="LinkedIn" className="w-5 h-5 object-contain" />,
  },
  x: {
    label: "X (Twitter)",
    icon: <img src={X_LOGO} alt="X (Twitter)" className="w-5 h-5 object-contain invert" />,
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



/** Renders workspace navigation and authenticated connection summaries. */
export function SideBar({ selectedTemplateId }: SideBarProps) {
  const path = usePathname()
  const router = useRouter()
  const isSidebarOpen = useSideBarStore((state) => state.opened);
  const toggleSidebar = useSideBarStore((state) => state.toggleSidebar);
  const { data: session } = authClient.useSession();

  const isLoggedIn = !!session?.user;
  const setCredits = useSideBarStore((state) => state.setCredits);
  const setPlan = useSideBarStore((state) => state.setPlan);
  const credits = useSideBarStore((state) => state.credits);
  const plan = useSideBarStore((state) => state.plan);

  const [showPricing, setShowPricing] = useState(false);

  const { data: channelsData } = useChannels(isLoggedIn);
  const { data: sourcesData } = useSources(isLoggedIn);
  const { data: creditsData } = useCredits(isLoggedIn);

  const channels = channelsData ?? [];
  const sources = sourcesData ?? [];

  useEffect(() => {
    if (creditsData !== undefined) {
      setCredits(creditsData);
    }
  }, [creditsData, setCredits]);

  return (
    <>


      <aside
        className={`
          h-screen   
          ${isSidebarOpen ? "w-60" : "w-16"}
          overflow-hidden 
          border-r border-zinc-800
        `}
      >
        {/* 1. h-full: Makes the container take full height 
           2. flex-col: Stacks children vertically
        */}
        <div className="p-3 h-full overflow-y-auto flex flex-col text-zinc-300 bg-[#09090b]">

          <div className="flex items-center justify-between w-full mb-2 px-2">
            {isSidebarOpen ? (
              <>
                <Image src={logo} alt="Logo" width={140} height={100} className="object-contain" />
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="p-1.5 rounded-lg hover:bg-zinc-800/60 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 w-full">
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="p-1.5 rounded-lg hover:bg-zinc-800/60 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-md text-lg">
                  N
                </div>
              </div>
            )}
          </div>

          {/* Create New Button */}
          <div className={`flex justify-center ${isSidebarOpen ? 'px-2 my-4' : 'my-3'}`}>
            {isSidebarOpen ? (
              <Link
                href="/workspace/create/new"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 text-xs font-semibold tracking-wide transition-all duration-200 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Create New</span>
              </Link>
            ) : (
              <Link
                href="/workspace/create/new"
                title="Create New"
                className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all duration-200 shadow-md shadow-indigo-600/10 active:scale-[0.95]"
              >
                <Plus className="w-4 h-4 shrink-0" />
              </Link>
            )}
          </div>

          <div className="border-gray-700 space-y-1 mt-4 font-urbanist">

            <Link href="/workspace" className={`w-full  text-left text-[16px]  py-1 px-4 flex  items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <Home className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="text-md font-medium">Home</span>}
            </Link>
            <Link href="/workspace/create" className={`w-full text-left text-[16px] py-1 px-4 flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <Lightbulb className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="text-md font-medium">Create</span>}
            </Link>


            {/* — Tools — */}
            <Link href="/workspace/calendar" className={`w-full text-left text-[16px] py-1 px-4 flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <CalendarDays className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="text-md font-medium">Calendar</span>}
            </Link>
            <Link href="/workspace/channels" className={`w-full text-left text-[16px] py-1 px-4 flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <Link2 className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="text-md font-medium">Channels</span>}
            </Link>
            <Link href="/workspace/memory" className={`w-full text-left text-[16px] py-1 px-4 flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <Brain className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="text-md font-medium">Memory</span>}
            </Link>
            <Link href="/workspace/hooks" className={`w-full text-left text-[16px] py-1 px-4 flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <Sparkles className="w-5 h-5 shrink-0 text-indigo-400" />
              {isSidebarOpen && <span className="text-md font-medium">Hooks Library</span>}
            </Link>

            {/* — Connected Channels — */}
            <div className="pt-4 mt-4 border-t border-zinc-800/60">
              {isSidebarOpen ? (
                <div className="flex items-center justify-between px-4 mb-2">
                  <small className=" font-light text-zinc-500">Channels</small>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
                </div>
              ) : (
                <div className="h-px bg-zinc-800/60 my-2 mx-4" />
              )}
              <div className="space-y-1.5">
                {channels.length > 0 ? (
                  channels.map((channel) => {
                    const meta = PLATFORM_META[channel.platform];
                    if (!meta) return null;
                    return (
                      <div
                        key={channel.id}
                        className={`group/item flex items-center gap-3 py-1.5 transition-all duration-200 cursor-pointer ${!isSidebarOpen
                          ? 'justify-center px-0'
                          : 'px-4 hover:bg-zinc-800/40 rounded-xl mx-2 text-zinc-300 hover:text-white'
                          }`}
                      >
                        <div className="relative shrink-0 flex items-center justify-center">
                          {channel.avatarUrl ? (
                            <img src={channel.avatarUrl} alt={channel.accountName} className="w-6 h-6 rounded-full object-cover border border-zinc-800" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                              {(channel.accountName || meta.label).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-zinc-950 rounded-full flex items-center justify-center shadow-md p-0.5 border border-zinc-800">
                            {meta.icon}
                          </div>
                        </div>
                        {isSidebarOpen && (
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold truncate leading-none">{channel.accountName || meta.label}</span>
                            <span className="text-[9px] text-zinc-500 mt-0.5 capitalize leading-none">{channel.platform}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  isSidebarOpen && (
                    <div className="px-4 text-[11px] text-zinc-600 font-medium">
                      No channels connected
                    </div>
                  )
                )}
              </div>
            </div>

            {/* — Connected Newsletters — */}
            <div className="pt-2 mt-2">
              {isSidebarOpen ? (
                <div className="flex items-center justify-between px-4 mb-2">
                  <small className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Newsletters</small>
                </div>
              ) : null}
              <div className="space-y-1.5">
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
                      <div
                        key={source.id}
                        className={`group/item flex items-center gap-3 py-1.5 transition-all duration-200 cursor-pointer ${!isSidebarOpen
                          ? 'justify-center px-0'
                          : 'px-4 hover:bg-zinc-800/40 rounded-xl mx-2 text-zinc-300 hover:text-white'
                          }`}
                      >
                        <div className="relative shrink-0 flex items-center justify-center w-6 h-6">
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt="Substack Avatar"
                              className="w-6 h-6 rounded-full object-cover border border-zinc-800"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = document.getElementById(`sidebar-fallback-${source.id}`);
                                if (fallback) fallback.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div
                            id={`sidebar-fallback-${source.id}`}
                            className={`w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[9px] font-bold text-orange-500 ${imgUrl ? 'hidden' : ''
                              }`}
                          >
                            {getInitials(source.url)}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-zinc-950 rounded-full flex items-center justify-center shadow-md p-0.5 border border-zinc-800">
                            <img src="https://cdn.worldvectorlogo.com/logos/substack-1.svg" alt="Substack" className="w-2.5 h-2.5 object-contain" />
                          </div>
                        </div>
                        {isSidebarOpen && (
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold truncate leading-none">
                              {source.url.replace('https://', '').replace('/feed', '').split('.')[0]}
                            </span>
                            <span className="text-[9px] text-zinc-500 mt-0.5 truncate leading-none">
                              {source.url.replace('https://', '').replace('/feed', '')}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  isSidebarOpen && (
                    <div className="px-4 text-[11px] text-zinc-600 font-medium">
                      No newsletters connected
                    </div>
                  )
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
              <div className="mx-2 p-3 bg-[#0c0c0e] border border-zinc-800/80 rounded-xl space-y-2.5 font-urbanist">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Free Trial
                  </span>
                  <span className="text-[11px] font-medium text-zinc-400">
                    {credits !== null ? `${credits}/40 credits` : "40 credits"}
                  </span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
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
                  pricing
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
            <Link href="/workspace/hooks" className={`w-full text-left text-[16px] py-1 px-4 flex items-center gap-2 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
              <MessageCircle className="w-5 h-5 shrink-0 " />
              {isSidebarOpen && <span className="text-md font-medium">Support</span>}
            </Link>

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
