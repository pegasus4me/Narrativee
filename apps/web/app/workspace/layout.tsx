"use client";

import AuthGuard from "../components/commons/AuthGuard"
import { SideBar } from "../components/commons/sideBar"

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard>
            <div className="flex h-screen w-full bg-[#09090b] overflow-hidden text-zinc-100">
                <SideBar />
                <main className="flex-1 min-w-0 overflow-y-auto antialiased">
                    <div className="w-full">
                        {children}
                    </div>
                </main>
            </div>
        </AuthGuard>
    )
}
