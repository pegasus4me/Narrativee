"use client";

import { useStudioCanvas } from "./useStudioCanvas";
//import { CanvasControls } from "./CanvasControls";
import { useEffect, useState } from "react";
import { LayoutGrid, MousePointer2 } from "lucide-react";
import {
  StudioWorkingBorder,
  STUDIO_WORKING_EVENT,
} from "../StudioWorkingBorder";

export function StudioCanvas({ projectId }: { projectId: string }) {
  const editor = useStudioCanvas(projectId);
  const [working, setWorking] = useState(false);
  const [view, setView] = useState<"canvas" | "grid">("canvas");
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
      <div className="absolute left-4 top-4 z-20 inline-flex rounded-lg border border-border bg-background/95 p-1 text-xs shadow-sm">
        <button
          type="button"
          aria-pressed={view === "canvas"}
          onClick={() => setView("canvas")}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 ${view === "canvas" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <MousePointer2 size={14} aria-hidden="true" />
          Canvas
        </button>
        <button
          type="button"
          aria-pressed={view === "grid"}
          disabled={editor.saveStatus === "Loading canvas…"}
          onClick={() => {
            setView("grid");
            void editor.loadPreviews();
          }}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 disabled:opacity-50 ${view === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <LayoutGrid size={14} aria-hidden="true" />
          Grid
        </button>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          ref={editor.surfaceRef}
          aria-hidden={view === "grid"}
          className={`h-full min-h-0 min-w-0 overflow-hidden bg-background ${view === "grid" ? "invisible" : ""}`}
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
          view === "canvas" &&
          !working &&
          !editor.canvasError &&
          editor.saveStatus !== "Loading canvas…" && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-y-auto px-6 pt-16 pb-44 lg:px-8 lg:pb-48">
              <div className="max-w-md text-center">
                <h1 className="text-2xl font-medium tracking-tight text-foreground">
                  What do you want to create?
                </h1>
                <p className="mt-3 hidden text-sm leading-6 text-zinc-500 lg:block">
                  Choose a product below, describe the scene, and generate your
                  image. Select a result to request changes.
                </p>
              </div>
            </div>
          )}
        {view === "grid" && (
          <div className="absolute inset-0 z-10 overflow-y-auto bg-background px-4 pb-40 pt-16 md:px-8">
            {editor.loadingPreviews ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Preparing your creative board…
              </p>
            ) : editor.previews.length ? (
              <div className="columns-1 gap-5 sm:columns-2 xl:columns-3">
                {editor.previews.map((preview) => (
                  <button
                    type="button"
                    key={preview.directionId}
                    onClick={() => {
                      setView("canvas");
                      requestAnimationFrame(() =>
                        requestAnimationFrame(() =>
                          editor.focusDirection(preview.directionId),
                        ),
                      );
                    }}
                    className="mb-5 block w-full break-inside-avoid overflow-hidden rounded-xl border border-border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <img
                      src={preview.src}
                      alt=""
                      className="block h-auto w-full bg-muted object-contain"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Your creative board will appear here when you add a creative.
              </p>
            )}
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
