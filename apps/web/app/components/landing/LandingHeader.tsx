"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactElement, useState, useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { Github, Star, ChevronDown, Sparkles, BookOpen, Share2, LogOut } from "lucide-react";

const FREE_TOOLS = [
  {
    name: "Subject Line Tester",
    description: "Grade your subject line open rates and generate polished variants.",
    href: "/tools/subject-line-tester",
    icon: Sparkles,
  },
  {
    name: "Readability Analyzer",
    description: "Calculate reading time and highlight complex sentences.",
    href: "/tools/readability-analyzer",
    icon: BookOpen,
  },
  {
    name: "Social Hook Generator",
    description: "Turn your newsletter into high-converting Twitter and LinkedIn posts.",
    href: "/tools/social-hook-generator",
    icon: Share2,
  },
];

function getDisplayName(name?: string | null, email?: string | null): string {
  if (name && name.trim().length > 0) {
    return name.trim();
  }

  if (email && email.trim().length > 0) {
    return email.split("@")[0] ?? "Account";
  }

  return "Account";
}

/** Top navigation for the public landing page. */
export function LandingHeader(): ReactElement {
  const session = authClient.useSession();
  const user = session.data?.user;
  const displayName = user ? getDisplayName(user.name, user.email) : null;
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-8 relative z-50">
      <Link href="/" className="flex items-center gap-3">
        <Image src="/logo.png" alt="Narrativee" width={150} height={23} className="h-6 w-auto" priority />
      </Link>

      <nav className="hidden items-center gap-7 text-sm text-zinc-400 lg:flex">
        <a href={isHome ? "#workflow" : "/#workflow"} className="transition-colors hover:text-white">Workflow</a>
        <a href={isHome ? "#moat" : "/#moat"} className="transition-colors hover:text-white">Moat</a>
        <a href={isHome ? "#channels" : "/#channels"} className="transition-colors hover:text-white">Channels</a>
        
        {/* Interactive Free Tools Dropdown */}
        <div
          ref={dropdownRef}
          className="relative"
          onMouseEnter={() => setIsDropdownOpen(true)}
          onMouseLeave={() => setIsDropdownOpen(false)}
        >
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1 transition-colors hover:text-white focus:outline-none cursor-pointer py-1"
          >
            <span>Free Tools</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180 text-white" : ""}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute left-1/2 top-full z-50 pt-2 w-80 -translate-x-1/2 transition-all duration-200">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/95 p-2 shadow-2xl backdrop-blur-md">
                <div className="flex flex-col gap-1">
                  {FREE_TOOLS.map((tool) => {
                    const ToolIcon = tool.icon;
                    return (
                      <Link
                        key={tool.name}
                        href={tool.href}
                        onClick={() => setIsDropdownOpen(false)}
                        className="group/item flex items-start gap-3.5 rounded-lg p-2.5 transition-colors hover:bg-white/5"
                      >
                        <div className="mt-0.5 rounded-md border border-zinc-850 bg-zinc-900/50 p-1.5 transition-colors group-hover/item:border-zinc-700 group-hover/item:bg-zinc-800">
                          <ToolIcon size={16} className="text-zinc-400 group-hover/item:text-white" />
                        </div>
                        <div className="text-left">
                          <h4 className="text-xs font-semibold text-zinc-200 transition-colors group-hover/item:text-white">
                            {tool.name}
                          </h4>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500 transition-colors group-hover/item:text-zinc-400">
                            {tool.description}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <Link href="/pricing" className="transition-colors hover:text-white">Pricing</Link>
        <a href="https://github.com/pegasus4me/Narrativee" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs border border-zinc-800 bg-zinc-900 w-fit">
          <Github className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          <span>star on github</span>
        </a>
      </nav>

      <div className="flex items-center gap-3">
        {session.isPending ? (
          <div className="hidden h-4 w-24 animate-pulse rounded-full bg-white/10 sm:block" />
        ) : displayName ? (
          <>
            <span className="hidden max-w-36 truncate text-sm font-medium text-zinc-300 sm:block">
              {displayName}
            </span>
            <Link
              href="/workspace"
              className="rounded-full border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
            >
              Dashboard
            </Link>
            <button
              onClick={handleSignOut}
              className="hidden text-sm font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer sm:block"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link href="/auth/signin" className="hidden text-sm font-medium text-zinc-300 transition-colors hover:text-white sm:block">
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-full border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
            >
              Get started
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
