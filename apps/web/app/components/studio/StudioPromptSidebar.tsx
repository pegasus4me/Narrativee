"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  PanelLeftClose as IconSidebarLeftArrow,
  SquarePen,
} from "lucide-react";
import {
  MessageBubble,
  MessageBubbleContent,
} from "@/components/agents/message-bubble";
import { PromptInput } from "@/components/agents/prompt-input";
import { StreamingResponse } from "@/components/agents/streaming-response";
import { Loader } from "@/components/motion/loader";
import StudioResearchPanel from "./StudioResearchPanel";
import StudioChatSwitcher from "./StudioChatSwitcher";
import StudioMessageMarkdown from "./StudioMessageMarkdown";
import icon from "public/icon.png";
import {
  createStudioProject,
  getStudioProject,
  listStudioProjects,
  openStudioProject,
  streamStudioMessage,
  StudioApiError,
  type StudioMessage,
  type StudioProject,
} from "@/lib/api/studio";

const SIDEBAR_MOTION = {
  expandedWidth: 440,
  widescreenWidth: 880,
  collapsedWidth: 52,
  duration: 280,
  copyDuration: 180,
  copyOffset: 8,
  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
};

const CREATIVE_DIRECTIONS_REQUEST = `Using this project's brand diagnosis and competitor analysis, develop three distinct creative directions for the brand. Make each direction strategically grounded and visually specific, then recommend which one is strongest and why.`;
const runningResearchStatuses = new Set([
  "queued",
  "scraping",
  "synthesizing",
  "discovering_competitors",
  "scanning_competitors",
  "comparing_competitors",
]);

export default function StudioPromptSidebar({
  projectId,
  className = "",
}: {
  projectId: string;
  className?: string;
}) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [project, setProject] = useState<StudioProject | null>(null);
  const [messages, setMessages] = useState<StudioMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [generatingDirections, setGeneratingDirections] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [creatingChat, setCreatingChat] = useState(false);
  const [switchingMode, setSwitchingMode] = useState(false);
  const [widescreen, setWidescreen] = useState(false);
  const [revision, setRevision] = useState(0);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const loadedProjectId = useRef<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("studio-prompt-sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
    const savedWidescreen = localStorage.getItem(
      "studio-prompt-sidebar-widescreen",
    );
    if (savedWidescreen === "true") setWidescreen(true);
  }, []);

  const toggleCollapsed = (next: boolean) => {
    setCollapsed(next);
    localStorage.setItem("studio-prompt-sidebar-collapsed", String(next));
  };

  const toggleWidescreen = (next?: boolean) => {
    setWidescreen((current) => {
      const value = next ?? !current;
      if (value && collapsed) {
        setCollapsed(false);
        localStorage.setItem("studio-prompt-sidebar-collapsed", "false");
      }
      localStorage.setItem("studio-prompt-sidebar-widescreen", String(value));
      return value;
    });
  };

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "b" &&
        !event.shiftKey &&
        !event.altKey
      ) {
        event.preventDefault();
        setCollapsed((current) => {
          const next = !current;
          localStorage.setItem("studio-prompt-sidebar-collapsed", String(next));
          return next;
        });
      } else if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        (event.key.toLowerCase() === "f" || event.key.toLowerCase() === "w") &&
        !event.altKey
      ) {
        event.preventDefault();
        toggleWidescreen();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [collapsed]);

  useEffect(() => {
    const controller = new AbortController();
    let refreshTimer: number | undefined;
    const isNewProject = loadedProjectId.current !== projectId;
    if (isNewProject) {
      setLoading(true);
      setProject(null);
      setMessages([]);
      setStreamingText("");
      setCreatingChat(false);
      setSwitchingMode(false);
      setChatError(null);
    }
    setLoadError(null);
    getStudioProject(projectId, controller.signal)
      .then(({ project: nextProject, messages: nextMessages }) => {
        loadedProjectId.current = projectId;
        setProject(nextProject);
        setMessages((current) =>
          isNewProject || nextMessages.length >= current.length
            ? nextMessages
            : current,
        );
        if (
          nextProject.analysis &&
          runningResearchStatuses.has(nextProject.analysis.status)
        ) {
          refreshTimer = window.setTimeout(
            () => setRevision((value) => value + 1),
            1800,
          );
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof StudioApiError && error.status === 404
            ? "Project not found or unavailable."
            : error instanceof Error
              ? error.message
              : "Unable to load the project.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
      if (refreshTimer) window.clearTimeout(refreshTimer);
    };
  }, [projectId, revision]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ block: "end" });
  }, [messages.length, pending, streamingText, loading]);

  async function submit(content: string, isDirectionRequest = false) {
    if (!project?.analysis?.diagnosis || pending) return;
    const text = content.trim();
    if (!text) return;
    setPending(text);
    setStreamingText("");
    setGeneratingDirections(isDirectionRequest);
    setDraft("");
    setSendError(null);
    try {
      const result = await streamStudioMessage(projectId, text, (delta) => {
        setStreamingText((current) => current + delta);
      });
      setMessages((current) => [
        ...current,
        result.userMessage,
        result.assistantMessage,
      ]);
    } catch (error) {
      setDraft(text);
      setSendError(
        error instanceof Error
          ? error.message
          : "The message could not be sent.",
      );
    } finally {
      setPending(null);
      setStreamingText("");
      setGeneratingDirections(false);
    }
  }

  async function newChat() {
    if (!project || creatingChat) return;
    setCreatingChat(true);
    setChatError(null);
    try {
      const created = await createStudioProject(project.brandId);
      router.push(`/workspace/studio/${created.id}`);
    } catch (cause) {
      setChatError(
        cause instanceof Error ? cause.message : "Could not create chat",
      );
      setCreatingChat(false);
    }
  }

  async function switchMode(mode: string) {
    if (
      !project ||
      (mode !== "discovery" && mode !== "creation") ||
      mode === project.kind ||
      switchingMode ||
      pending
    ) {
      return;
    }

    setSwitchingMode(true);
    setChatError(null);
    try {
      if (mode === "discovery") {
        const discovery = await openStudioProject(project.brandId);
        router.push(`/workspace/studio/${discovery.id}`);
        return;
      }

      if (mode === "creation") {
        const chats = await listStudioProjects(project.brandId);
        const creator = chats.find((chat) => chat.kind === "creation");
        const target = creator ?? (await createStudioProject(project.brandId));
        router.push(`/workspace/studio/${target.id}`);
      }
    } catch (cause) {
      setChatError(
        cause instanceof Error ? cause.message : "Could not switch mode",
      );
      setSwitchingMode(false);
    }
  }

  const activeExpandedWidth = widescreen
    ? `min(${SIDEBAR_MOTION.widescreenWidth}px, calc(100vw - 120px))`
    : `${SIDEBAR_MOTION.expandedWidth}px`;

  return (
    <aside
      data-sidebar-collapsed={collapsed}
      data-sidebar-widescreen={widescreen}
      aria-label="Creative conversation"
      className={`relative flex shrink-0 overflow-hidden transition-[width] dark:border-white/[0.08] md:border-r bg-background text-foreground h-full ${className}`}
      style={
        {
          width: collapsed
            ? `${SIDEBAR_MOTION.collapsedWidth}px`
            : activeExpandedWidth,
          transitionDuration: `${SIDEBAR_MOTION.duration}ms`,
          transitionTimingFunction: SIDEBAR_MOTION.easing,
          "--sidebar-copy-duration": `${SIDEBAR_MOTION.copyDuration}ms`,
          "--sidebar-copy-offset": `${SIDEBAR_MOTION.copyOffset}px`,
          "--sidebar-easing": SIDEBAR_MOTION.easing,
        } as CSSProperties
      }
    >
      <div
        className="flex h-full shrink-0 flex-col"
        style={{
          width: collapsed ? activeExpandedWidth : "100%",
        }}
      >
        {/* Top header bar */}
        <div
          className={`relative z-20 flex h-10 shrink-0 items-center justify-between ${
            project?.kind
              ? "discovery" === project.kind
                ? "bg-gradient-to-r from-purple-400/5 via-violet-600/5 to-purple-700/5"
                : "bg-black"
              : "bg-background"
          } dark:border-white/[0.08] px-3 `}
        >
          <div className="sidebar-copy flex items-center gap-2 min-w-0">
            <Link
              href="/workspace/studio"
              className="flex size-7 shrink-0 items-center justify-center rounded-[6px] text-muted-foreground transition-colors hover:bg-hover-2 hover:text-foreground"
              title="Back to Studio"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="flex shrink-0 items-center justify-center">
              <Image
                width={16}
                height={16}
                src={icon}
                alt="Studio Logo"
                className="size-4 shrink-0 object-contain"
                priority
              />
            </div>
            {project && !loadError && (
              <StudioChatSwitcher
                brandId={project.brandId}
                projectId={projectId}
                kind={project.kind}
              />
            )}
          </div>

          <div className="sidebar-copy flex items-center gap-1">
            <button
              type="button"
              aria-label="New creation chat"
              title="New chat"
              onClick={() => void newChat()}
              disabled={!project || creatingChat}
              className="flex size-7 items-center justify-center rounded-[6px] text-ink-3 transition-colors hover:bg-hover-2 hover:text-ink disabled:opacity-50"
            >
              <SquarePen size={17} />
            </button>
            <button
              type="button"
              aria-label={widescreen ? "Standard width" : "Widescreen focus"}
              title={
                widescreen
                  ? "Standard width (⌘⇧F)"
                  : "Widescreen focus (⌘⇧F)"
              }
              onClick={() => toggleWidescreen()}
              className={`flex size-7 items-center justify-center rounded-[6px] transition-colors ${
                widescreen
                  ? "bg-hover-2 text-ink"
                  : "text-ink-3 hover:bg-hover-2 hover:text-ink"
              }`}
            >
              {widescreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              type="button"
              aria-label="Collapse sidebar"
              aria-hidden={collapsed}
              tabIndex={collapsed ? -1 : 0}
              onClick={() => toggleCollapsed(true)}
              className="sidebar-collapse-control flex size-7 items-center justify-center rounded-[6px] text-ink-3 transition-[opacity,background-color,color] duration-150 hover:bg-hover-2 hover:text-ink"
              title="Collapse (⌘B)"
            >
              <IconSidebarLeftArrow size={17} />
            </button>
          </div>

          <button
            type="button"
            aria-label="Expand sidebar"
            aria-hidden={!collapsed}
            tabIndex={collapsed ? 0 : -1}
            onClick={() => toggleCollapsed(false)}
            className="sidebar-expand-control absolute left-[12px] top-1.5 flex size-7 items-center justify-center rounded-[6px] text-ink-3 transition-[opacity,background-color,color] duration-150 hover:bg-hover-2 hover:text-ink"
            title="Expand (⌘B)"
          >
            <IconSidebarLeftArrow size={17} className="rotate-180" />
          </button>
        </div>

        {/* Messages scroll area */}
        <div className="sidebar-copy min-h-0 flex-1 overflow-y-auto px-4 py-5">
          <div className="mx-auto flex w-full max-w-3xl flex-col">
            {loading && (
              <p className="text-sm text-muted-foreground">Loading project…</p>
            )}
            {loadError && (
              <div role="alert" className="space-y-3 text-sm">
                <p className="text-destructive">{loadError}</p>
                <button
                  type="button"
                  onClick={() => setRevision((value) => value + 1)}
                  className="font-medium underline underline-offset-2"
                >
                  Try again
                </button>
              </div>
            )}
            {chatError && (
              <p role="alert" className="mb-3 text-xs text-destructive">
                {chatError}
              </p>
            )}
            {project && !loadError && (
              <>
                {project.kind === "discovery" && (
                  <StudioResearchPanel
                    project={project}
                    busy={Boolean(pending)}
                    onUpdated={() => setRevision((value) => value + 1)}
                    onExplore={() =>
                      void submit(CREATIVE_DIRECTIONS_REQUEST, true)
                    }
                  />
                )}
              </>
            )}
            <div className="flex flex-col gap-4">
              {useMemo(
                () =>
                  messages.map((message) =>
                    message.role === "assistant" ? (
                      <StreamingResponse
                        key={message.id}
                        status="complete"
                        showActions={false}
                        announce={false}
                        className="px-1"
                      >
                        <StudioMessageMarkdown content={message.content} />
                      </StreamingResponse>
                    ) : (
                      <MessageBubble key={message.id} align="end" variant="solid">
                        <MessageBubbleContent className="break-words bg-gray-700 text-white [&>span:first-child]:bg-[#111111]">
                          <span className="whitespace-pre-wrap">
                            {message.content}
                          </span>
                        </MessageBubbleContent>
                      </MessageBubble>
                    ),
                  ),
                [messages],
              )}
              {pending && (
                <>
                  <MessageBubble align="end" variant="solid" animateIn>
                    <MessageBubbleContent className="whitespace-pre-wrap break-words bg-gray-700 text-white [&>span:first-child]:bg-[#111111]">
                      {pending}
                    </MessageBubbleContent>
                  </MessageBubble>
                  <StreamingResponse
                    status="streaming"
                    showActions={false}
                    announce={Boolean(streamingText)}
                    className="px-1"
                  >
                    {streamingText ? (
                      <StudioMessageMarkdown content={streamingText} />
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-white  ">
                        <Loader variant="dither" size={18} label="Thinking" />
                        <span>
                          {generatingDirections
                            ? "Developing three creative directions…"
                            : "Thinking…"}
                        </span>
                      </div>
                    )}
                  </StreamingResponse>
                </>
              )}
              <div ref={messagesEnd} />
            </div>
          </div>
        </div>

        {/* Prompt input footer */}
        {project && !loadError && (
          <div className="sidebar-copy shrink-0 p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
            <div className="mx-auto w-full max-w-3xl">
              {sendError && (
                <p role="alert" className="mb-2 text-xs text-destructive">
                  {sendError} Your text has been preserved. Try sending it again.
                </p>
              )}
              <PromptInput
                value={draft}
                onValueChange={setDraft}
                onSubmit={(content) => submit(content)}
                models={[
                  { value: "discovery", label: "Discovery" },
                  { value: "creation", label: "Creator" },
                ]}
                model={project.kind}
                onModelChange={(mode) => void switchMode(mode)}
                disabled={
                  !project.analysis?.diagnosis ||
                  switchingMode ||
                  Boolean(pending)
                }
                submitDisabled={Boolean(pending)}
                placeholder={
                  project.analysis?.diagnosis
                    ? "Describe your idea or ask a question…"
                    : "Your designer will be ready after the brand scan…"
                }
                aria-label="Creative prompt"
                className="rounded-xl"
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
