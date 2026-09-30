import { StudioCanvas } from "@/app/components/studio/canvas/StudioCanvas";

export default async function StudioPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <StudioCanvas key={projectId} projectId={projectId} />;
}
