import { SideBar } from "../components/commons/sideBar";
import AuthGuard from "../components/commons/AuthGuard";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#161718]">
            <div className="flex">
                <SideBar />
                <main className="flex-1 overflow-y-auto h-screen ml-20">
                    <AuthGuard>
                        {children}
                    </AuthGuard>
                </main>
            </div>
        </div>
    );
}
