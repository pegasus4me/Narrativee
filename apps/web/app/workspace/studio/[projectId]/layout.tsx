import StudioPromptSidebar from "@/app/components/studio/StudioPromptSidebar";
import StudioHeader from "@/app/components/studio/StudioHeader";

export default async function ProjectLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}>) {
  const { projectId } = await params;
  return (
    <div className="relative flex h-full w-full flex-col md:flex-row">
      <StudioPromptSidebar projectId={projectId} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <StudioHeader />
        <main
          aria-label="Canevas Studio"
          className="min-h-0 min-w-0 flex-1 overflow-hidden bg-[#111111]"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
