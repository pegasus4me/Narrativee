"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import BrandNavigation from "../workspace/BrandNavigation";
import { useBrands } from "../workspace/BrandProvider";
import { createStudioProject } from "@/lib/api/studio";
import StudioSplashTransition from "../studio/StudioSplashTransition";
import {
  ChevronDown as IconChevronDownSmall,
  X as IconCrossSmall,
  SquarePen as IconEditBig,
  Home as IconHome,
  Search as IconMagnifyingGlass,
  PanelLeftClose as IconSidebarLeftArrow,
  Sun,
  Moon,
  UserPlus as IconUserAdd,
  Brain,
  Blocks,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import GlideMenu from "@/components/primitives/GlideMenu";
import { useThemeStore } from "../../stores/themeStore";
import darkLogo from "public/logo-dark.png";
import whiteLogo from "public/logo-white.png";

/* ─────────────────────────────────────────────────────────
 * SIDEBAR NAV
 * Shared by the design-system preview and the harness shell:
 * compact workspace switcher, primary navigation, searchable
 * chat history, and a collapse that preserves icon alignment.
 * ───────────────────────────────────────────────────────── */

type NavItem = {
  key: string;
  label: string;
  icon: ReactNode;
  count?: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: "studio", label: "Studio", icon: <IconHome size={18} /> },
  { key: "brand-brain", label: "Brand brain", icon: <Brain size={18} /> },
  { key: "integrations", label: "Integrations", icon: <Blocks size={18} /> },
];

export type SidebarRecent = {
  id: string;
  label: string;
  prompt?: string;
};

type SidebarNavProps = {
  activeTitle?: string | null;
  className?: string;
  fill?: boolean;
  onPick?: (id: string, label: string, prompt?: string) => void;
  /** controlled primary-nav selection (e.g. "home" | "invite") */
  activeNav?: string;
  onNavigate?: (key: string) => void;
  /** footer call-to-action — defaults to the demo "Upgrade" button */
  footerLabel?: string;
  footerIcon?: ReactNode;
  onFooterClick?: () => void;
  recents?: SidebarRecent[];
  variant?: string;
};

const SIDEBAR_MOTION = {
  expandedWidth: 224,
  collapsedWidth: 52,
  duration: 280,
  copyDuration: 180,
  copyOffset: 8,
  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
};

/* ─────────────────────────────────────────────────────────
 * CHAT SEARCH STORYBOARD
 *
 *   0ms   search is triggered; Chats label begins fading
 *   0ms   field grows right → left from the search control
 * 180ms   field fills the row; cursor is focused and ready
 * ───────────────────────────────────────────────────────── */
const CHAT_SEARCH_MOTION = {
  duration: 180,
  closedWidth: 28,
  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
};

const STUDIO_SPLASH_DURATION_MS = 2_900;

function GlideGroup({ children }: { children: ReactNode }) {
  return (
    <GlideMenu
      rowSelector="[data-row]"
      highlightClassName="sidebar-glide-highlight rounded-[7px] bg-hover-2"
      className="group/glide flex flex-col gap-px"
    >
      {children}
    </GlideMenu>
  );
}

function RailButton({
  icon,
  label,
  active = false,
  count,
  onClick,
  disabled = false,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  count?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      data-row
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`sidebar-row relative z-10 mx-2 flex h-8 items-center rounded-[8px] px-2 text-left
        transition-[width,background-color,color,transform] duration-150 active:scale-[0.98] disabled:cursor-wait disabled:opacity-50
        ${active ? "bg-hover-2 group-hover/glide:bg-transparent" : ""}`}
    >
      <span
        className={`flex size-5 shrink-0 items-center justify-center ${active ? "text-ink" : "text-ink-2"}`}
      >
        {icon}
      </span>
      <span
        className={`sidebar-copy ml-1.5 min-w-0 flex-1 truncate text-[14px] font-medium ${active ? "text-ink" : "text-ink-2"}`}
      >
        {label}
      </span>
      {count && (
        <span className="sidebar-copy mr-2 shrink-0 text-[12px] font-medium tabular-nums text-ink-3">
          {count}
        </span>
      )}
    </button>
  );
}

export default function SidebarNav({
  activeTitle,
  className = "",
  fill = false,
  onPick,
  activeNav,
  onNavigate,
  footerLabel = "Upgrade",
  footerIcon,
  onFooterClick,
  recents,
}: SidebarNavProps) {
  const router = useRouter();
  const { active: activeBrand } = useBrands();
  const pathname = usePathname();
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted
    ? typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : theme === "dark"
    : true;

  const [collapsed, setCollapsed] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [internalNav, setInternalNav] = useState(
    pathname.startsWith("/workspace/studio") ? "studio" : "chats",
  );
  useEffect(() => {
    setInternalNav(
      pathname.startsWith("/workspace/studio") ? "studio" : "chats",
    );
  }, [pathname]);
  const currentNav = activeNav ?? internalNav;
  const selectNav = (key: string) => {
    setInternalNav(key);
    onNavigate?.(key);
    if (key === "studio") router.push("/workspace/studio");
  };

  async function newProject() {
    if (creatingProject) return;
    if (!activeBrand?.id) {
      setCreationError("Sélectionne une marque avant de créer un projet.");
      return;
    }
    setCreatingProject(true);
    setCreationError(null);
    try {
      const splashDuration = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches
        ? 250
        : STUDIO_SPLASH_DURATION_MS;
      const [project] = await Promise.all([
        createStudioProject(activeBrand.id),
        new Promise((resolve) => setTimeout(resolve, splashDuration)),
      ]);
      setInternalNav("studio");
      router.push(`/workspace/studio/${project.id}`);
    } catch (error) {
      setCreationError(
        error instanceof Error
          ? error.message
          : "Impossible de créer le projet.",
      );
      setCreatingProject(false);
    }
  }
  const [demoActiveTitle, setDemoActiveTitle] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedTitle =
    activeTitle === undefined ? demoActiveTitle : activeTitle;
  const visibleRecents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recents;
    return recents?.filter((item) => item.label.toLowerCase().includes(q));
  }, [recents, query]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const collapse = () => {
    setCollapsed(true);
    setSearchOpen(false);
    setQuery("");
  };

  return (
    <aside
      data-sidebar-collapsed={collapsed}
      aria-label="Workspace navigation"
      className={`relative flex shrink-0 overflow-hidden transition-[width] ${fill ? "h-full" : "h-[600px]"} ${className}`}
      style={
        {
          width: collapsed
            ? SIDEBAR_MOTION.collapsedWidth
            : SIDEBAR_MOTION.expandedWidth,
          transitionDuration: `${SIDEBAR_MOTION.duration}ms`,
          transitionTimingFunction: SIDEBAR_MOTION.easing,
          "--sidebar-copy-duration": `${SIDEBAR_MOTION.copyDuration}ms`,
          "--sidebar-copy-offset": `${SIDEBAR_MOTION.copyOffset}px`,
          "--sidebar-easing": SIDEBAR_MOTION.easing,
        } as CSSProperties
      }
    >
      <div className="flex min-h-0 w-[224px] shrink-0 flex-col h-full py-3">
        <div className="relative mb-2.5 flex h-8 shrink-0 items-center justify-between px-3">
          <Link
            href="/"
            className="sidebar-copy flex min-w-0 items-center"
            aria-label="Narrativee home"
          >
            <Image
              src={darkLogo}
              alt="Narrativee"
              width={125}
              height={25}
              className="h-[22px] w-auto object-contain dark:hidden"
              priority
            />
            <Image
              src={whiteLogo}
              alt="Narrativee"
              width={125}
              height={25}
              className="hidden h-[22px] w-auto object-contain dark:block"
              priority
            />
          </Link>

          <button
            type="button"
            aria-label="Collapse sidebar"
            aria-hidden={collapsed}
            tabIndex={collapsed ? -1 : 0}
            onClick={collapse}
            className="sidebar-collapse-control flex size-7 items-center justify-center rounded-[8px] text-ink-3 transition-[opacity,background-color,color] duration-150 hover:bg-hover-2 hover:text-ink"
          >
            <IconSidebarLeftArrow size={17} />
          </button>
          <button
            type="button"
            aria-label="Expand sidebar"
            aria-hidden={!collapsed}
            tabIndex={collapsed ? 0 : -1}
            onClick={() => setCollapsed(false)}
            className="sidebar-expand-control absolute left-[10px] top-0 flex size-8 items-center justify-center rounded-[8px] text-ink-3 transition-[opacity,background-color,color] duration-150 hover:bg-hover-2 hover:text-ink"
          >
            <IconSidebarLeftArrow size={17} className="rotate-180" />
          </button>
        </div>

        <BrandNavigation collapsed={collapsed} />

        <GlideGroup>
          <RailButton
            icon={<IconEditBig size={18} />}
            label={creatingProject ? "Creating…" : "New Project"}
            onClick={newProject}
            disabled={creatingProject}
          />
          {NAV_ITEMS.map((item) => (
            <RailButton
              key={item.key}
              icon={item.icon}
              label={item.label}
              count={item.count}
              active={currentNav === item.key}
              onClick={() => selectNav(item.key)}
            />
          ))}
        </GlideGroup>
        {creationError && (
          <p role="alert" className="sidebar-copy mx-4 mt-2 text-xs leading-4 text-red-600 dark:text-red-400">
            {creationError}
          </p>
        )}
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
          <div className="sidebar-copy relative mx-2 mb-1 h-8">
            <div
              aria-hidden={searchOpen}
              className={`absolute inset-0 flex items-center gap-1.5 px-2 text-[12.5px] font-medium text-ink-3 transition-[opacity,transform] ${searchOpen ? "pointer-events-none -translate-x-1 opacity-0" : "translate-x-0 opacity-100"}`}
              style={{
                transitionDuration: `${CHAT_SEARCH_MOTION.duration}ms`,
                transitionTimingFunction: CHAT_SEARCH_MOTION.easing,
              }}
            >
              <IconChevronDownSmall size={16} />
              <span>recent work</span>
            </div>

            <button
              type="button"
              aria-label="Search chats"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen(true)}
              className={`absolute right-0 top-0 z-10 flex size-8 items-center justify-center rounded-[8px] text-ink-3 transition-[opacity,background-color,color,transform] hover:bg-hover-2 hover:text-ink active:scale-[0.96] ${searchOpen ? "pointer-events-none opacity-0" : "opacity-100"}`}
              style={{ transitionDuration: `${CHAT_SEARCH_MOTION.duration}ms` }}
            >
              <IconMagnifyingGlass size={16} />
            </button>

            <div
              className={`absolute right-0 top-0 z-20 flex h-8 items-center overflow-hidden rounded-[8px] bg-field text-ink-3 shadow-hairline transition-[width,opacity] focus-within:text-ink-2 ${searchOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
              style={{
                width: searchOpen ? "100%" : CHAT_SEARCH_MOTION.closedWidth,
                transitionDuration: `${CHAT_SEARCH_MOTION.duration}ms`,
                transitionTimingFunction: CHAT_SEARCH_MOTION.easing,
              }}
            >
              <span className="ml-2 flex shrink-0 items-center justify-center">
                <IconMagnifyingGlass size={15} />
              </span>
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setSearchOpen(false);
                    setQuery("");
                  }
                }}
                placeholder="Search chats"
                aria-label="Search chat history"
                className="ml-1.5 min-w-0 flex-1 bg-transparent text-[13px] font-medium text-ink outline-none placeholder:text-ink-3"
              />
              <button
                type="button"
                aria-label="Close chat search"
                onClick={() => {
                  setSearchOpen(false);
                  setQuery("");
                }}
                className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-ink-3 transition-[background-color,color,transform] duration-150 hover:bg-hover-2 hover:text-ink active:scale-[0.96]"
              >
                <IconCrossSmall size={16} />
              </button>
            </div>
          </div>

          <GlideGroup>
            {visibleRecents?.map((item) => {
              const isActive = item.label === selectedTitle;
              return (
                <button
                  key={item.id}
                  data-row
                  type="button"
                  title={item.label}
                  onClick={() => {
                    setInternalNav("chats");
                    if (activeTitle === undefined)
                      setDemoActiveTitle(item.label);
                    onPick?.(item.id, item.label, item.prompt);
                  }}
                  className={`sidebar-row relative z-10 mx-2 flex h-8 items-center rounded-[8px] px-2 text-left transition-[width,background-color,color,transform] duration-150 active:scale-[0.98] ${
                    isActive
                      ? "bg-hover-2 group-hover/glide:bg-transparent"
                      : ""
                  }`}
                >
                  <span
                    className={`sidebar-copy min-w-0 flex-1 truncate text-[14px] font-medium ${isActive ? "text-ink" : "text-ink-2"}`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
            {query && visibleRecents?.length === 0 && (
              <div className="sidebar-copy mx-2 px-2 py-2 text-[12.5px] text-ink-3">
                No chats found
              </div>
            )}
          </GlideGroup>
        </div>

        <div className="mt-auto flex flex-col gap-1.5 pt-2.5">
          {/* Invite users */}
          <GlideGroup>
            <RailButton
              icon={<IconUserAdd size={18} />}
              label="Invite users"
              count="3/10"
              active={currentNav === "invite"}
              onClick={() => selectNav("invite")}
            />
          </GlideGroup>

          <div className="mx-2 flex flex-col gap-1.5">
            {/* Theme Toggle Switch */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleTheme();
              }}
              aria-label="Toggle dark/light mode"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="sidebar-row relative z-10 flex h-8 w-full items-center justify-between rounded-[8px] px-2 text-left transition-[background-color,color,transform] duration-150 hover:bg-hover-2 active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="flex size-5 shrink-0 items-center justify-center text-ink-2">
                  {isDark ? <Moon size={16} /> : <Sun size={16} />}
                </span>
                <span className="sidebar-copy ml-1.5 text-[13.5px] font-medium text-ink-2 truncate">
                  {isDark ? "Dark mode" : "Light mode"}
                </span>
              </div>

              {/* Switch pill */}
              <div
                role="switch"
                aria-checked={isDark}
                className={`sidebar-copy relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
                  isDark ? "bg-secondary" : "bg-neutral-300"
                }`}
              >
                <span
                  className={`inline-block size-3.5 transform rounded-full transition-transform duration-200 shadow-sm ${
                    isDark
                      ? "translate-x-[18px] bg-black"
                      : "translate-x-[2px] bg-white"
                  }`}
                />
              </div>
            </button>

            {/* Footer CTA Button */}
            <div className="sidebar-copy w-full">
              <button
                type="button"
                onClick={onFooterClick}
                className="flex h-8 w-full items-center justify-center gap-1.5 rounded-control bg-hover-2 text-[12.5px] font-medium text-ink bg-secondary transition-[background-color,transform] duration-150 hover:bg-line-strong active:scale-[0.98] dark:text-black"
              >
                {footerIcon}
                {footerLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
      <StudioSplashTransition isVisible={creatingProject} />
    </aside>
  );
}
