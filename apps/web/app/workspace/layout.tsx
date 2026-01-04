import { SideBar } from "../components/commons/sideBar"
import WorkspaceHeader from "../components/workspaceComponents/Header";
import { OnboardingWrapper } from "../components/workspaceComponents/OnboardingWrapper";

export default function LayoutDashboard({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <OnboardingWrapper>
                <WorkspaceHeader />
                <div className="flex pt-16">
                    <SideBar />
                    <main className="flex-1 overflow-y-auto h-[calc(100vh-64px)]">
                        {children}
                    </main>
                </div>
            </OnboardingWrapper>
        </div>
    );
}