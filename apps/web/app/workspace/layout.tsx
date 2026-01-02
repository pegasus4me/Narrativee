"use client"
import { useEffect, useState } from "react";
import { SideBar } from "../components/commons/sideBar"
import { WelcomeModal } from "../components/workspaceComponents/WelcomeModal";
import { authClient } from "@/lib/auth-client";
import WorkspaceHeader from "../components/workspaceComponents/Header";

export default function LayoutDashboard({ children }: { children: React.ReactNode }) {
    const { data: session } = authClient.useSession();
    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
        // Check if user has been onboarded
        const onboarded = localStorage.getItem('narrativee_onboarded');
        if (!onboarded && session?.user?.id) {
            setShowWelcome(true);
        }
    }, [session]);

    const handleWelcomeComplete = () => {
        setShowWelcome(false);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <WelcomeModal open={showWelcome} onComplete={handleWelcomeComplete} />
            <WorkspaceHeader />
            <div className="flex pt-16"> {/* pt-16 to offset fixed header */}
                <SideBar />
                <main className="flex-1 overflow-y-auto h-[calc(100vh-64px)]">
                    {children}
                </main>
            </div>
        </div>
    );
}