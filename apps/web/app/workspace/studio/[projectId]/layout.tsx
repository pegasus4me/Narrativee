import StudioPromptSidebar from "@/app/components/studio/StudioPromptSidebar";
import StudioWorkspace from "@/app/components/studio/StudioWorkspace";

export default async function ProjectLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}>) {
  const { projectId } = await params;
  return (
    <div className="relative flex h-full w-full flex-col-reverse lg:flex-row overflow-hidden">
      <StudioPromptSidebar key={projectId} projectId={projectId} />
      <StudioWorkspace projectId={projectId}>{children}</StudioWorkspace>
    </div>
  );
}
