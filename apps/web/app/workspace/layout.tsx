import { SideBar } from "../components/sideBar"; 

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // 1. Changed 'flex-col' to 'flex-row' (or just 'flex') to align items horizontally
    // 2. Added 'overflow-hidden' to prevent body scrollbars if content overflows
    <section className="h-screen flex flex-row overflow-hidden bg-white">
      <SideBar/>
      
      {/* 3. Added a main wrapper for the page content:
         - flex-1: Takes up all available width remaining after Sidebar
         - h-full: Ensures it matches the screen height
         - relative: Useful context for absolute positioning inside pages
      */}
      <main className="flex-1 h-full relative">
        {children}
      </main>
    </section>
  )
}