"use client";

import { usePathname } from "next/navigation";
import AuthGuard from "../components/commons/AuthGuard"
import { SideBar } from "../components/commons/sideBar"

export default function WorkspaceLayout({children}: {children: React.ReactNode}) {
    const pathname = usePathname();
    const isPublicRoute = pathname === "/workspace" || pathname === "/workspace/create" || pathname === "/workspace/channels";

    if (isPublicRoute) {
        return (
            <div className="flex h-screen w-full bg-zinc-50 overflow-hidden">
                <SideBar />
                <main className="flex-1 min-w-0 bg-white rounded-l-2xl border-l border-y border-zinc-200 my-2 mr-2 overflow-y-auto text-zinc-900 antialiased">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <AuthGuard>
            <div className="flex h-screen w-full bg-zinc-50 overflow-hidden">
                <SideBar />
                <main className="flex-1 min-w-0 bg-white rounded-l-2xl border-l border-y border-zinc-200 my-2 mr-2 overflow-y-auto text-zinc-900 antialiased">
                    {children}
                </main>
            </div>
        </AuthGuard>
    )
}
