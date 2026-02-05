import { SideBar } from "../components/commons/sideBar"


export default function LayoutDashboard({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50">
            
                
                <div className="flex">
                    <SideBar />
                    <main className="flex-1 overflow-y-auto h-[calc(100vh-64px)]">
                        {children}
                    </main>
                </div>
            
        </div>
    );
}