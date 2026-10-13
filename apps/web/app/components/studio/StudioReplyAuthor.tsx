import React from "react";
import type { AgentActivity } from "@/lib/api/studio";
import { AgentAvatar, studioAgents } from "./StudioAgentPanel";

export default function StudioReplyAuthor({
  agent,
}: {
  agent?: AgentActivity["agent"] | null;
}) {
  const author = studioAgents.find((item) => item.id === agent);
  if (!author) return null;

  return (
    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground">
      <AgentAvatar color={author.color} />
      <span>{author.name}</span>
      <span className="font-normal text-muted-foreground">{author.role}</span>
    </div>
  );
}
