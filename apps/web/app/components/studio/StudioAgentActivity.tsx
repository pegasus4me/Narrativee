"use client";

import { Check, CircleAlert, LoaderCircle } from "lucide-react";
import type { AgentActivity } from "@/lib/api/studio";
import { AgentAvatar, studioAgents } from "./StudioAgentPanel";

export default function StudioAgentActivity({
  activity,
}: {
  activity: AgentActivity[];
}) {
  if (!activity.length) return null;
  const latest =
    [...activity].reverse().find(({ status }) => status === "working") ??
    activity.at(-1);
  return (
    <details className="shrink-0 border-b border-dashed border-neutral-200 px-4 py-3">
      <summary className="cursor-pointer text-xs text-muted-foreground">
        {latest?.text}
      </summary>
      <div className="mt-3 space-y-2">
        {activity.map((item) => {
          const agent = studioAgents.find(({ id }) => id === item.agent);
          return (
            <div key={item.agent} className="flex items-center gap-2 text-xs">
              <AgentAvatar color={agent?.color ?? "#efaacb"} size={20} />
              <span className="font-medium">{agent?.name}</span>
              <span className="min-w-0 flex-1 text-muted-foreground">
                {item.text}
              </span>
              {item.status === "working" ? (
                <LoaderCircle
                  size={12}
                  className="animate-spin motion-reduce:animate-none"
                />
              ) : item.status === "complete" ? (
                <Check size={12} />
              ) : (
                <CircleAlert size={12} />
              )}
            </div>
          );
        })}
      </div>
    </details>
  );
}
