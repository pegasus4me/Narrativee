"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import AuthGuard from "../components/commons/AuthGuard";
import { SideBar } from "../components/commons/sideBar";
import ProfileMenuHeader from "../components/commons/ProfileMenuHeader";

function Breadcrumbs() {
  const pathname = usePathname();
  if (!pathname) return null;

  // Split path into segments
  const segments = pathname.split("/").filter(Boolean);

  const breadcrumbItems = [
    {
      label: "home",
      href: "/workspace",
    },
  ];

  let currentPath = "/workspace";

  // Build the breadcrumbs path starting from index 1 (ignoring 'workspace' which is already mapped to 'home')
  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    let label = segment;

    if (segment === "create") {
      label = "create";
      currentPath = "/workspace/create";
    } else if (segment === "new") {
      label = "new pack";
      currentPath = "/workspace/create/new";
    } else if (segment === "calendar") {
      label = "calendar";
      currentPath = "/workspace/calendar";
    } else if (segment === "channels") {
      label = "channels";
      currentPath = "/workspace/channels";
    } else if (segment === "memory") {
      label = "memory";
      currentPath = "/workspace/memory";
    } else if (segment === "hooks") {
      label = "hooks";
      currentPath = "/workspace/hooks";
    } else if (segment === "post-queue") {
      label = "posts";
      currentPath = "/workspace/post-queue";
    } else {
      // Dynamic UUID/slug segments
      label = "pack details";
      currentPath = `${currentPath}/${segment}`;
    }

    breadcrumbItems.push({
      label,
      href: currentPath,
    });
  }

  return (
    <nav className="flex items-center gap-2 text-lg text-white/60 font-light select-none">
      {breadcrumbItems.map((item, idx) => {
        const isLast = idx === breadcrumbItems.length - 1;
        return (
          <div key={item.href} className="flex items-center gap-2">
            {idx > 0 && <span className="text-zinc-800 text-xs">/</span>}
            {isLast ? (
              <span className="text-white font-base">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-zinc-300 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

/** Authenticated shell for every workspace route. */
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="theme-landing flex h-screen w-full bg-[#09090b] overflow-hidden text-zinc-100 font-sans">
        <SideBar />
        <main className="flex-1 min-w-0 overflow-y-auto antialiased">
          {/* Premium Sticky Top Header Bar */}
          <header className="sticky top-0 z-30 w-full border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md">
            <div className="mx-auto w-[90%] px-6 py-4 flex items-center justify-between">
              <Breadcrumbs />
              <ProfileMenuHeader />
            </div>
          </header>
          
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
