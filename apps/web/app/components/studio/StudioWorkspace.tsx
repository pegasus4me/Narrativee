"use client";

import { useEffect, useState, type ReactNode } from "react";
import { getStudioProject, type StudioProject } from "@/lib/api/studio";
import BrandBrainPanel from "@/app/workspace/brand-brain/BrandBrainPanel";
import StudioResearchPanel from "./StudioResearchPanel";
import StudioHeader from "./StudioHeader";
import StudioProjectName from "./StudioProjectName";
import { STUDIO_VIEW_EVENT, type StudioView } from "./StudioAgentPanel";

export default function StudioWorkspace({
  projectId,
  children,
}: {
  projectId?: string;
  children: ReactNode;
}) {
  const [project, setProject] = useState<StudioProject | null>(null);
  const [view, setView] = useState<StudioView>("canvas");
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!projectId) return;
    const controller = new AbortController();
    getStudioProject(projectId, controller.signal)
      .then(({ project }) => {
        if (controller.signal.aborted) return;
        setProject(project);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error ? cause.message : "Could not load workspace",
          );
      });
    const timer = window.setTimeout(
      () => setRevision((value) => value + 1),
      5000,
    );
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [projectId, revision]);
  useEffect(() => {
    const show = (raw: Event) => {
      const detail = (
        raw as CustomEvent<{ projectId: string; view: StudioView }>
      ).detail;
      if (detail?.projectId === projectId) setView(detail.view);
    };
    window.addEventListener(STUDIO_VIEW_EVENT, show);
    return () => window.removeEventListener(STUDIO_VIEW_EVENT, show);
  }, [projectId]);
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
      <header className="flex h-12 shrink-0 items-center gap-3 px-4">
        <span className="text-sm font-medium tracking-tight text-neutral-300">
          Narrativee
        </span>
        <span className="text-neutral-300">/</span>
        <span className="min-w-0 truncate text-sm text-neutral-300">
          {project?.brandName ?? "Studio"}
        </span>
        <span className="text-neutral-300">/</span>
        {project ? (
          <StudioProjectName
            key={project.id}
            projectId={project.id}
            title={project.title ?? "Untitled"}
            onRenamed={(title) => {
              setProject((current) =>
                current ? { ...current, title } : current,
              );
              setRevision((value) => value + 1);
            }}
            onError={setError}
          />
        ) : (
          <span className="text-md">Untitled</span>
        )}
        <StudioHeader
          brandBrainOpen={view === "brain"}
          canOpenBrandBrain={Boolean(project)}
          onToggleBrandBrain={() =>
            setView((current) => (current === "brain" ? "canvas" : "brain"))
          }
        />
      </header>
      {error && (
        <p role="alert" className="px-4 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
      <main aria-label="Creative workspace" className="relative min-h-0 flex-1">
        <div className={view === "canvas" ? "h-full" : "hidden"}>
          {children}
        </div>
        {view === "brain" && project && (
          <div className="h-full overflow-y-auto">
            <BrandBrainPanel key={project.brandId} brandId={project.brandId} />
          </div>
        )}
        {view === "research" && project && (
          <div className="h-full overflow-y-auto p-6 md:p-10">
            <div className="mx-auto max-w-2xl">
              <h1 className="mb-2 text-xl font-medium text-foreground">
                Research with Scout
              </h1>
              <p className="mb-6 text-sm leading-6 text-zinc-500">
                Understand your brand and competitor positioning. Website
                evidence guides creative ideas; it does not establish ad
                conversion performance.
              </p>
              <StudioResearchPanel
                project={project}
                busy={false}
                exploreLabel="Create from this research"
                onUpdated={() => setRevision((value) => value + 1)}
                onExplore={() => {
                  setView("canvas");
                  window.dispatchEvent(
                    new CustomEvent("narrativee:studio-brief", {
                      detail: {
                        projectId: project.id,
                        content:
                          "Create a social post that highlights a differentiation opportunity from the competitor analysis. Use only verified brand facts.",
                      },
                    }),
                  );
                }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
