"use client";

import AuthGuard from "../components/commons/AuthGuard";
import SidebarNav from "../components/commons/Sidebar";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { BrandProvider } from "../components/workspace/BrandProvider";

export default function WorkspaceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactNode {
  const pathname = usePathname();
  const isStudioProject = pathname.startsWith("/workspace/studio/");

  return (
    <Suspense fallback={null}>
      <BrandProvider>
        <AuthGuard>
          {isStudioProject ? (
            <main className="h-screen w-full overflow-hidden bg-[#0a0a0a]">
              {children}
            </main>
          ) : (
            <div className="flex h-screen w-full overflow-hidden bg-zinc-50 text-foreground transition-colors duration-200 dark:bg-[#0a0a0a]">
              <SidebarNav
                fill
                className="bg-zinc-50 dark:bg-[#0a0a0a]"
              />
              <main className="my-2 mr-2 min-w-0 flex-1 overflow-y-auto rounded-xl border border-zinc-200 bg-white dark:border-white/[0.08] dark:bg-[#111111]">
                {children}
              </main>
            </div>
          )}
        </AuthGuard>
      </BrandProvider>
    </Suspense>
  );
}
