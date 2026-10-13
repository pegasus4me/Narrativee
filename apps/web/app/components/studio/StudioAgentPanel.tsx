"use client";

import React from "react";
import { Check, ChevronRight, CircleAlert, LoaderCircle } from "lucide-react";
import type { AgentActivity, StudioProject } from "@/lib/api/studio";

export const STUDIO_VIEW_EVENT = "narrativee:studio-view";
export type StudioView = "canvas" | "research" | "brain";
export function showStudioView(projectId: string, view: StudioView) {
  window.dispatchEvent(
    new CustomEvent(STUDIO_VIEW_EVENT, { detail: { projectId, view } }),
  );
}

export const studioAgents = [
  {
    id: "research",
    name: "Scout",
    role: "Research",
    color: "#9acfb9",
    avatar: "/agents/mascot-mint.svg",
    description:
      "Finds positioning and creative angles in competitor evidence.",
    view: "research",
  },
  {
    id: "brand",
    name: "Sage",
    role: "Brand & direction",
    color: "#b5b0e4",
    avatar: "/agents/mascot-lavender.svg",
    description:
      "Guides the brief and reviews brand fit, claims, and creative specificity.",
    view: "brain",
  },
  {
    id: "creator",
    name: "Pixel",
    role: "Creator",
    color: "#efaacb",
    avatar: "/agents/mascot-pink.svg",
    description:
      "Builds editable creatives and refines them from Sage's feedback.",
    view: "canvas",
  },
] as const;

const scanning = new Set([
  "queued",
  "scraping",
  "synthesizing",
  "discovering_competitors",
  "scanning_competitors",
  "comparing_competitors",
]);

export default function StudioAgentPanel({
  project,
  activity,
}: {
  project?: StudioProject | null;
  activity: AgentActivity[];
}) {
  return (
    <section
      aria-label="Your creative agents"
      className="shrink-0 border-b border-dashed border-neutral-200 px-4 pb-3 pt-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[11px] font-medium text-zinc-500">
          Your creative team
        </h2>
        <span className="text-[11px] text-zinc-500">3 agents</span>
      </div>
      <div className="space-y-1">
        {studioAgents.map((agent) => {
          const latest = activity.find((item) => item.agent === agent.id);
          const isScanning =
            agent.id === "research" &&
            project?.analysis &&
            scanning.has(project.analysis.status);
          const needsYou =
            agent.id === "research" &&
            project?.analysis?.status === "awaiting_competitor_confirmation";
          const status = isScanning
            ? "working"
            : needsYou
              ? "needs you"
              : (latest?.status ?? (project ? "ready" : "setup"));
          const text = isScanning
            ? "Scanning brand and competitor context"
            : needsYou
              ? "Choose competitors to compare"
              : (latest?.text ?? agent.description);
          return (
            <details
              key={agent.id}
              className="group rounded-lg open:bg-muted/50"
            >
              <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-muted [&::-webkit-details-marker]:hidden">
                <AgentAvatar color={agent.color} />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium text-foreground">
                    {agent.name}{" "}
                    <span className="ml-1 font-normal text-zinc-500">
                      {agent.role}
                    </span>
                  </span>
                </span>
                <span
                  className={`flex items-center gap-1.5 text-[11px] ${status === "error" ? "text-destructive" : status === "working" || status === "needs you" ? "text-amber-700" : "text-zinc-500"}`}
                >
                  {status === "working" ? (
                    <LoaderCircle
                      size={10}
                      className="motion-safe:animate-spin"
                    />
                  ) : status === "complete" ? (
                    <Check size={11} className="text-emerald-700" />
                  ) : status === "error" ? (
                    <CircleAlert size={11} />
                  ) : (
                    <span className="size-1 rounded-full bg-current" />
                  )}
                  {status === "complete"
                    ? "Done"
                    : status === "working"
                      ? "Working"
                      : status === "ready"
                        ? "Ready"
                        : status === "error"
                          ? "Stopped"
                          : status === "setup"
                            ? "Set up"
                            : "Needs you"}
                </span>
              </summary>
              <div className="pb-2 pl-[42px] pr-2">
                <p className="text-xs leading-5 text-muted-foreground">
                  {text}
                </p>
                <button
                  type="button"
                  disabled={!project}
                  className="mt-2 flex items-center gap-1 text-xs text-foreground disabled:opacity-40"
                  onClick={() =>
                    project && showStudioView(project.id, agent.view)
                  }
                >
                  Open {agent.view === "brain" ? "Brand Brain" : agent.view}
                  <ChevronRight size={11} />
                </button>
              </div>
            </details>
          );
        })}
      </div>
      {activity.some((item) => item.status === "working") && (
        <p role="status" className="mt-2 truncate px-2 text-xs text-zinc-500">
          {activity.at(-1)?.text}
        </p>
      )}
    </section>
  );
}

export function AgentAvatar({
  color,
  size = 24,
}: {
  color: string;
  size?: number;
}) {
  const avatar = studioAgents.find((agent) => agent.color === color)?.avatar;
  return (
    <img
      src={avatar ?? "/agents/mascot-pink.svg"}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className="inline-block shrink-0 object-contain"
    />
  );
}
