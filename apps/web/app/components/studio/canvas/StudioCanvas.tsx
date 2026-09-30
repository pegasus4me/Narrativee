"use client";

import { useStudioCanvas } from "./useStudioCanvas";
import { StudioBoardExperiment } from "../StudioBoardExperiment";

export function StudioCanvas({ projectId }: { projectId: string }) {
  const editor = useStudioCanvas(projectId);

  return (
    <section
      aria-label="Studio canvas"
      className="relative h-full min-h-0 bg-[#111111]"
    >
      <div
        ref={editor.surfaceRef}
        className="h-full min-h-0 min-w-0 overflow-hidden bg-[#111111]"
      >
        <canvas
          ref={editor.elementRef}
          aria-label="Editable brand design canvas"
        />
      </div>
      <StudioBoardExperiment projectId={projectId} />
    </section>
  );
}
