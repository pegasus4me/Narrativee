"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStudioDrafts } from "../billing/useStudioDrafts";
import { STUDIO_WORKING_EVENT } from "./StudioWorkingBorder";
import { flushStudioCanvas } from "@/lib/studio-brief";
import type { CampaignOutput } from "@/lib/studio-outputs";
import {
  createStudioProject,
  getStudioProject,
  streamStudioCreatorMessage,
  streamStudioApproval,
  dispatchStudioCanvasEvent,
  type AgentActivity,
  type StudioMessage,
  type StudioProject,
  type CreatorCanvasEvent,
  type CampaignGeneration,
} from "@/lib/api/studio";

function appendExchange(
  current: StudioMessage[],
  result: {
    userMessage: StudioMessage;
    assistantMessage: StudioMessage;
    collaborationMessages?: StudioMessage[];
    approvalMessage?: StudioMessage;
  },
) {
  const added = [
    result.userMessage,
    ...(result.collaborationMessages ?? []),
    result.assistantMessage,
  ];
  return [
    ...current.map((message) =>
      result.approvalMessage?.id === message.id
        ? result.approvalMessage
        : message,
    ),
    ...added,
  ];
}

export function useStudioConversation(projectId: string) {
  const router = useRouter();
  const [project, setProject] = useState<StudioProject | null>(null);
  const [messages, setMessages] = useState<StudioMessage[]>([]);
  const [drafts, setDrafts] = useStudioDrafts(projectId);
  const [collapsed, setCollapsed] = useState(false);
  const [promptTarget, setPromptTarget] = useState<HTMLElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [liveTeamMessages, setLiveTeamMessages] = useState<
    Array<{ agent: AgentActivity["agent"]; content: string }>
  >([]);
  const [replyingAgent, setReplyingAgent] = useState<
    AgentActivity["agent"] | null
  >(null);
  const [activity, setActivity] = useState<AgentActivity[]>([]);
  const [stage, setStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadRevision, setLoadRevision] = useState(0);
  const [creating, setCreating] = useState(false);
  const running = useRef(false);
  const end = useRef<HTMLDivElement>(null);
  const setDraft = (team: string) =>
    setDrafts((current) => ({ ...current, team }));

  useEffect(() => {
    setCollapsed(window.matchMedia("(max-width: 1023px)").matches);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getStudioProject(projectId, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setProject(result.project);
          setMessages(result.messages);
        }
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not open the project",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [projectId, loadRevision]);
  useEffect(() => {
    const mount = (raw: Event) => {
      const detail = (
        raw as CustomEvent<{ projectId: string; target: HTMLElement }>
      ).detail;
      if (detail?.projectId === projectId) setPromptTarget(detail.target);
    };
    setPromptTarget(document.getElementById(`studio-prompt-${projectId}`));
    window.addEventListener("narrativee:studio-prompt-mount", mount);
    return () =>
      window.removeEventListener("narrativee:studio-prompt-mount", mount);
  }, [projectId]);
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(STUDIO_WORKING_EVENT, {
        detail: { projectId, working: Boolean(pending) },
      }),
    );
    return () => {
      window.dispatchEvent(
        new CustomEvent(STUDIO_WORKING_EVENT, {
          detail: { projectId, working: false },
        }),
      );
    };
  }, [projectId, pending]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, streamingText, liveTeamMessages]);

  const onCanvasEvent = (event: CreatorCanvasEvent) => {
    if (event.type === "team_message") {
      setLiveTeamMessages((current) => [
        ...current,
        { agent: event.agent, content: event.content },
      ]);
      return;
    }
    if (event.type === "agent_activity") {
      setActivity((current) => [
        ...current.filter((item) => item.agent !== event.agent),
        event,
      ]);
      return;
    }
    if (event.type === "stage") setStage(event.text);
    return dispatchStudioCanvasEvent(projectId, event);
  };
  async function run(
    content: string,
    work: () => ReturnType<typeof streamStudioCreatorMessage>,
  ) {
    if (running.current || uploading || !project) return;
    running.current = true;
    setPending(content);
    setStreamingText("");
    setLiveTeamMessages([]);
    setActivity([]);
    setStage(null);
    setError(null);
    let failed = false;
    try {
      const result = await work();
      setMessages((current) => appendExchange(current, result));
    } catch (cause) {
      failed = true;
      setDraft(content);
      setError(
        cause instanceof TypeError
          ? "The request was interrupted. Your draft is kept. Check the latest saved reply before retrying."
          : cause instanceof Error
            ? cause.message
            : "The creation could not finish",
      );
      const saved = await getStudioProject(projectId).catch(() => null);
      if (saved) setMessages(saved.messages);
    } finally {
      running.current = false;
      setPending(null);
      setStreamingText("");
      setLiveTeamMessages([]);
      setStage(null);
      if (failed)
        setActivity((current) =>
          current.map((item) =>
            item.status === "working"
              ? { ...item, status: "error", text: "This step stopped" }
              : item,
          ),
        );
    }
  }
  async function submit(
    content: string,
    outputs: CampaignOutput[],
    generation: CampaignGeneration,
  ) {
    const text = content.trim();
    if (!text || running.current || uploading) return;
    await run(text, async () => {
      await flushStudioCanvas(projectId);
      setDraft("");
      return streamStudioCreatorMessage(
        projectId,
        text,
        (delta) => setStreamingText((current) => current + delta),
        onCanvasEvent,
        "team",
        setReplyingAgent,
        outputs,
        generation,
      );
    });
  }
  async function decideApproval(
    message: StudioMessage,
    action: "approve" | "reject" | "refresh",
    feedback: string,
  ) {
    if (
      message.approval?.status !== "pending" &&
      !(action === "refresh" && message.approval?.status === "failed")
    )
      return;
    await run(
      feedback ||
        (action === "approve"
          ? "Generate this saved proposal"
          : action === "refresh"
            ? "Refresh the saved proposal"
            : "Decline the saved proposal"),
      () =>
        streamStudioApproval(
          projectId,
          message.id,
          action,
          feedback,
          (delta) => setStreamingText((current) => current + delta),
          onCanvasEvent,
          setReplyingAgent,
        ),
    );
  }
  async function newProject() {
    if (!project || running.current || creating || uploading) return;
    setCreating(true);
    try {
      const next = await createStudioProject(project.brandId);
      router.push(`/workspace/studio/${next.id}`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not create a project",
      );
    } finally {
      setCreating(false);
    }
  }

  return {
    project,
    messages,
    drafts,
    collapsed,
    setCollapsed,
    promptTarget,
    uploading,
    setUploading,
    pending,
    streamingText,
    liveTeamMessages,
    replyingAgent,
    activity,
    stage,
    error,
    loading,
    setLoadRevision,
    creating,
    end,
    setDraft,
    submit,
    decideApproval,
    newProject,
  };
}
