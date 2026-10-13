"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowLeft, PanelLeftClose, SquarePen, Settings2 } from "lucide-react";
import StudioImageSettings from "./StudioImageSettings";
import StudioChatSwitcher from "./StudioChatSwitcher";
import StudioAgentConversation from "./StudioAgentConversation";
import StudioAgentActivity from "./StudioAgentActivity";
import { StudioCanvasPrompt } from "./StudioCanvasPrompt";
import { useStudioConversation } from "./useStudioConversation";

export default function StudioPromptSidebar({
  projectId,
  className = "",
}: {
  projectId: string;
  className?: string;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const {
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
  } = useStudioConversation(projectId);
  return (
    <>
      {settingsOpen && (
        <StudioImageSettings
          projectId={projectId}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {collapsed && (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label="Open project conversation"
          className="absolute left-3 top-16 z-30 rounded-lg border border-border bg-background p-2"
        >
          <PanelLeftClose size={16} className="rotate-180" />
        </button>
      )}
      <aside
        aria-label="Project conversation"
        className={`flex shrink-0 flex-col border-r border-dashed border-neutral-200 bg-background ${collapsed ? "hidden" : "h-[42%] w-full lg:h-full lg:w-[350px]"} ${className}`}
      >
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-dashed border-neutral-200 px-3">
          <Link
            href="/workspace/studio"
            aria-label="Back to projects"
            className="rounded p-1.5 hover:bg-muted"
          >
            <ArrowLeft size={16} />
          </Link>
          {project && (
            <StudioChatSwitcher
              brandId={project.brandId}
              projectId={projectId}
              kind={project.kind}
            />
          )}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            disabled={!project || Boolean(pending)}
            aria-label="Image settings"
            className="rounded p-1.5 hover:bg-muted disabled:opacity-40"
          >
            <Settings2 size={16} />
          </button>
          <button
            type="button"
            onClick={() => void newProject()}
            disabled={!project || Boolean(pending) || creating || uploading}
            aria-label="New creative project"
            className="ml-auto rounded p-1.5 hover:bg-muted disabled:opacity-40"
          >
            <SquarePen size={16} />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label="Collapse conversation"
            className="rounded p-1.5 hover:bg-muted"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>
        <StudioAgentActivity activity={activity} />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
          {loading ? (
            <p className="text-xs text-muted-foreground">Opening project…</p>
          ) : (
            <StudioAgentConversation
              messages={messages}
              liveTeamMessages={liveTeamMessages}
              pending={pending}
              streamingText={streamingText}
              replyingAgent={replyingAgent}
              creatorStage={stage}
              approvalBusy={Boolean(pending) || uploading}
              onApprovalDecision={(...args) => void decideApproval(...args)}
            />
          )}
          {error && (
            <p role="alert" className="mt-3 text-xs text-destructive">
              {error}{" "}
              {!project && (
                <button
                  type="button"
                  onClick={() => setLoadRevision((value) => value + 1)}
                  className="underline"
                >
                  Retry
                </button>
              )}
            </p>
          )}
          <div ref={end} />
        </div>
      </aside>
      {promptTarget &&
        project &&
        createPortal(
          <StudioCanvasPrompt
            key={projectId}
            projectId={projectId}
            brandId={project.brandId}
            draft={drafts.team}
            onDraftChange={setDraft}
            onSubmit={submit}
            disabled={loading || uploading || Boolean(pending)}
            pending={Boolean(pending)}
            error={error}
            onUploadChange={setUploading}
          />,
          promptTarget,
        )}
    </>
  );
}
