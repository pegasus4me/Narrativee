"use client";

import { useStudioCanvas } from "./useStudioCanvas";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  StudioWorkingBorder,
  STUDIO_WORKING_EVENT,
} from "../StudioWorkingBorder";

export function StudioCanvas({ projectId }: { projectId: string }) {
  const editor = useStudioCanvas(projectId);
  const searchParams = useSearchParams();
  const focusedRef = useRef<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const focusId = searchParams.get("focus");
    if (!focusId || !editor.hasContent || focusedRef.current === focusId)
      return;
    focusedRef.current = focusId;
    const timer = setTimeout(() => {
      editor.focusDirection(focusId);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchParams, editor.hasContent]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("narrativee:studio-prompt-mount", {
        detail: {
          projectId,
          target: document.getElementById(`studio-prompt-${projectId}`),
        },
      }),
    );
    const update = (raw: Event) => {
      const { detail } = raw as CustomEvent<{
        projectId: string;
        working: boolean;
      }>;
      if (detail?.projectId === projectId) setWorking(detail.working);
    };
    window.addEventListener(STUDIO_WORKING_EVENT, update);
    return () => window.removeEventListener(STUDIO_WORKING_EVENT, update);
  }, [projectId]);

  return (
    <section
      aria-label="Studio creative workspace"
      className="relative flex h-full min-h-0 flex-col bg-background"
    >
      <div
        id={`studio-materials-${projectId}`}
        className="pointer-events-none absolute inset-x-0 top-0 z-[1000] px-4"
      />
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          ref={editor.surfaceRef}
          className="h-full min-h-0 min-w-0 overflow-hidden bg-background"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--studio-dot-color, rgba(24, 24, 27, 0.12)) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            backgroundPosition: "0px 0px",
          }}
        >
          <canvas
            ref={editor.elementRef}
            aria-label="Editable brand design canvas"
          />
        </div>
        {!editor.hasContent &&
          !working &&
          !editor.canvasError &&
          editor.saveStatus !== "Loading canvas…" && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-y-auto px-6 pt-16 pb-44 lg:px-8 lg:pb-48">
              <div className="max-w-md text-center">
                <h1 className="text-2xl font-medium tracking-tight text-foreground">
                  What do you want to create?
                </h1>
                <p className="mt-3 hidden text-sm leading-6 text-zinc-500 lg:block">
                  Choose a product above, describe the scene, and generate your
                  image. Select a result to request changes.
                </p>
              </div>
            </div>
          )}
        <StudioWorkingBorder active={working} />
      </div>
      <div
        id={`studio-prompt-${projectId}`}
        className="pointer-events-none absolute inset-x-0 bottom-[max(56px,env(safe-area-inset-bottom))] z-[1000] px-4"
      />
    </section>
  );
}
