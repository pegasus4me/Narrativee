"use client";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import type { StudioAgentSelection } from "@/lib/api/studio";
const empty = { team: "", research: "", brand: "", creator: "" };
export function useStudioDrafts(projectId: string) {
  const { data: session } = authClient.useSession();
  const key = session
    ? `narrativee:drafts:${session.user.id}:${projectId}`
    : null;
  const [drafts, setDrafts] = useState<Record<StudioAgentSelection, string>>({
    ...empty,
  });
  const [readyKey, setReadyKey] = useState<string | null>(null);
  useEffect(() => {
    if (!key) return;
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) ?? "{}");
      setDrafts(
        Object.fromEntries(
          Object.keys(empty).map((agent) => [
            agent,
            typeof saved[agent] === "string" ? saved[agent] : "",
          ]),
        ) as Record<StudioAgentSelection, string>,
      );
    } catch {
      setDrafts({ ...empty });
    }
    setReadyKey(key);
  }, [key]);
  useEffect(() => {
    if (key && readyKey === key)
      try {
        sessionStorage.setItem(key, JSON.stringify(drafts));
      } catch {
        /* The brief stays usable when browser storage is disabled. */
      }
  }, [key, readyKey, drafts]);
  return [drafts, setDrafts] as const;
}
