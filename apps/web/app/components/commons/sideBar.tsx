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
import PrimaryButton from "./PrimaryButton";
import PricingPopUp from "../workspace/pricingPopUp";
import SupportPopUp from "./SupportPopUp";
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
  const plan = useSideBarStore((state) => state.plan);

  const [showPricing, setShowPricing] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  const { data: channelsData } = useChannels(isLoggedIn);
  const { data: sourcesData } = useSources(isLoggedIn);
  const { data: creditsData } = useCredits(isLoggedIn);

  const credits = creditsData ?? null;

  const channels = channelsData ?? [];
  const sources = sourcesData ?? [];

  const isActive = (href: string) => {
    if (href === "/workspace") {
      return path === "/workspace";
    }
    return path?.startsWith(href);
  };

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
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center font-bold text-black shadow-md text-lg">
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
                className="w-full flex items-center justify-center gap-2 rounded-full hover:bg-[#e99ab1]/90 text-white py-2.5 text-sm font-base transition-all duration-200 shadow-md shadow-[#e99ab1]/10 hover:shadow-[#e99ab1]/20 bg-[#e99ab1]"
              >
                <span>Create New</span>
              </Link>
            ) : (
              <Link
                href="/workspace/create/new"
                title="Create New"
                className="w-8 h-8 rounded-xl bg-[#e99ab1] hover:bg-[#e99ab1]/90 text-white flex items-center justify-center transition-all duration-200 shadow-md shadow-[#e99ab1]/10 active:scale-[0.95]"
              >
                <Plus className="w-4 h-4 shrink-0 stroke-[3]" />
              </Link>
            )}
          </div>

          <div className="border-gray-700 mt-4 space-y-1.5 font-sans">

            <Link
              href="/workspace"
              className={`group flex items-center gap-3 py-2 px-3.5 mx-1 rounded-xl transition-all duration-300 ${isActive("/workspace")
                ? "bg-[#e99ab1]/10 text-white font-semibold "
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
                } ${!isSidebarOpen ? 'justify-center px-0' : ''}`}
            >
              <Home className={`w-5 h-5 shrink-0 transition-colors duration-300 ${isActive("/workspace") ? "text-[#e99ab1]" : "text-zinc-400 group-hover:text-white"
                }`} />
              {isSidebarOpen && <span className="text-sm font-medium">Home</span>}
            </Link>

            <Link
              href="/workspace/create"
              className={`group flex items-center gap-3 py-2 px-3.5 mx-1 rounded-xl transition-all duration-300 ${isActive("/workspace/create")
                ? "bg-[#e99ab1]/10 text-white font-semibold "
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
                } ${!isSidebarOpen ? 'justify-center px-0' : ''}`}
            >
              <Lightbulb className={`w-5 h-5 shrink-0 transition-colors duration-300 ${isActive("/workspace/create") ? "text-[#e99ab1]" : "text-zinc-400 group-hover:text-white"
                }`} />
              {isSidebarOpen && <span className="text-sm font-medium">Create</span>}
            </Link>


            {/* — Tools — */}
            <Link
              href="/workspace/calendar"
              className={`group flex items-center gap-3 py-2 px-3.5 mx-1 rounded-xl transition-all duration-300 ${isActive("/workspace/calendar")
                ? "bg-[#e99ab1]/10 text-white font-semibold "
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
                } ${!isSidebarOpen ? 'justify-center px-0' : ''}`}
            >
              <CalendarDays className={`w-5 h-5 shrink-0 transition-colors duration-300 ${isActive("/workspace/calendar") ? "text-[#e99ab1]" : "text-zinc-400 group-hover:text-white"
                }`} />
              {isSidebarOpen && <span className="text-sm font-medium">Calendar</span>}
            </Link>

            <Link
              href="/workspace/channels"
              className={`group flex items-center gap-3 py-2 px-3.5 mx-1 rounded-xl transition-all duration-300 ${isActive("/workspace/channels")
                ? "bg-[#e99ab1]/10 text-white font-semibold "
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
                } ${!isSidebarOpen ? 'justify-center px-0' : ''}`}
            >
              <Link2 className={`w-5 h-5 shrink-0 transition-colors duration-300 ${isActive("/workspace/channels") ? "text-[#e99ab1]" : "text-zinc-400 group-hover:text-white"
                }`} />
              {isSidebarOpen && <span className="text-sm font-medium">Channels</span>}
            </Link>

            <Link
              href="/workspace/memory"
              className={`group flex items-center gap-3 py-2 px-3.5 mx-1 rounded-xl transition-all duration-300 ${isActive("/workspace/memory")
                ? "bg-[#e99ab1]/10 text-white font-semibold "
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
                } ${!isSidebarOpen ? 'justify-center px-0' : ''}`}
            >
              <Brain className={`w-5 h-5 shrink-0 transition-colors duration-300 ${isActive("/workspace/memory") ? "text-[#e99ab1]" : "text-zinc-400 group-hover:text-white"
                }`} />
              {isSidebarOpen && <span className="text-sm font-medium">Memory</span>}
            </Link>

            <Link
              href="/workspace/hooks"
              className={`group flex items-center gap-3 py-2 px-3.5 mx-1 rounded-xl transition-all duration-300 ${isActive("/workspace/hooks")
                ? "bg-[#e99ab1]/10 text-white font-semibold "
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
                } ${!isSidebarOpen ? 'justify-center px-0' : ''}`}
            >
              <Sparkles className={`w-5 h-5 shrink-0 transition-colors duration-300 ${isActive("/workspace/hooks") ? "text-[#e99ab1]" : "text-white opacity-70 group-hover:opacity-100"
                }`} />
              {isSidebarOpen && <span className="text-sm font-medium">Hooks Library</span>}
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
              <div className="mx-2 p-3 space-y-2.5 font-urbanist">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#e99ab1] px-2 py-0.5 rounded-full">
                    Free Trial
                  </span>
                  <span className="text-[11px] font-medium text-zinc-400">
                    {credits !== null ? `${credits}/40 credits` : "40 credits"}
                  </span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#e99ab1] h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, ((credits ?? 40) / 40) * 100))}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPricing(true)}
                  className="block w-full text-center text-sm font-light text-white bg-[#e99ab1] hover:bg-[#e99ab1]/90 py-2 rounded-full transition-colors shadow-xs"
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
                  className="w-8 h-8 rounded-full bg-[#e99ab1]/10 border border-[#e99ab1]/20 hover:bg-[#e99ab1]/20 flex items-center justify-center text-[10px] font-bold text-[#e99ab1] transition-all"
                >
                  {credits !== null ? credits : "T"}
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowSupport(true)}
              className={`w-full text-left text-[16px] py-1 px-4 flex items-center gap-2 transition-colors hover:text-white cursor-pointer ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}
            >
              <MessageCircle className="w-5 h-5 shrink-0 " />
              {isSidebarOpen && <span className="text-md font-medium">Support</span>}
            </button>

          </div>
        </div>
      </aside>

      <PricingPopUp isOpen={showPricing} onClose={() => setShowPricing(false)} />
      <SupportPopUp isOpen={showSupport} onClose={() => setShowSupport(false)} />
    </>
  );
}
