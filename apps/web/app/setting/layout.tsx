import { SideBar } from "../components/commons/sideBar";

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <section className="h-screen flex flex-row overflow-hidden bg-white">
                <SideBar />
                <main className="flex-1 h-full relative overflow-y-auto bg-gray-50">
                    {children}
                </main>
            </section>
        </>
    );
}
