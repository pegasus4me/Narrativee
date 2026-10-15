"use client";

import {
  UsageProvider,
  CreditStatus,
} from "../components/billing/UsageProvider";
import { OPEN_UPGRADE } from "@/lib/api/billing";
import AuthGuard from "../components/commons/AuthGuard";
import SidebarNav from "../components/commons/sideBar";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { BrandProvider } from "../components/workspace/BrandProvider";
import BrandScanDialog from "../components/workspace/BrandScanDialog";

export default function WorkspaceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactNode {
  const pathname = usePathname();
  const isStudioProject = pathname.startsWith("/workspace/studio/");
  const isOnboarding = pathname === "/workspace/onboarding";

  return (
    <Suspense fallback={null}>
      <BrandProvider>
        <BrandScanDialog />
        <AuthGuard>
          <UsageProvider>
            {isStudioProject || isOnboarding ? (
              <main className="h-screen w-full overflow-y-auto bg-background">
                {children}
              </main>
            ) : (
              <div className="flex h-screen w-full overflow-hidden bg-zinc-50 text-foreground transition-colors duration-200 dark:bg-[#0a0a0a]">
                <div className="flex flex-col">
                  <SidebarNav
                    fill
                    className="bg-zinc-50 dark:bg-[#0a0a0a]"
                    onFooterClick={() =>
                      window.dispatchEvent(new Event(OPEN_UPGRADE))
                    }
                  />
                  <div className="p-3">
                    <CreditStatus />
                  </div>
                </div>
                <main className="my-2 mr-2 min-w-0 flex-1 overflow-y-auto rounded-xl border border-zinc-200 bg-white dark:border-white/[0.08] dark:bg-[#111111]">
                  {children}
                </main>
              </div>
            )}
          </UsageProvider>
        </AuthGuard>
      </BrandProvider>
    </Suspense>
  );
}
