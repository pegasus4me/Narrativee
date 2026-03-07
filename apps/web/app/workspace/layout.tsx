import { SideBar } from "../components/commons/sideBar"
import AutoScheduler from "../components/workspace/AutoScheduler";
import AuthGuard from "../components/commons/AuthGuard";


export default function LayoutDashboard({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#161718]">


            <div className="flex">
                <SideBar />
                <main className="flex-1 overflow-y-auto h-[calc(100vh-64px)] ml-20">
                    <AuthGuard>
                        {children}
                    </AuthGuard>
                </main>
            </div>
            <AutoScheduler />
        </div>
    );
}