import { SideBar } from "../components/sideBar";
import AnnouncemebtBar from "../components/announcementBar";

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <AnnouncemebtBar />
            <section className="h-screen flex flex-row overflow-hidden bg-white">
                <SideBar />
                <main className="flex-1 h-full relative overflow-y-auto bg-gray-50">
                    {children}
                </main>
            </section>
        </>
    );
}
