"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, LoaderCircle, RefreshCw } from "lucide-react";
import {
  generateStudioBoard,
  getStudioBoard,
  getStudioBoardFile,
  getStudioBoardHistory,
  type StudioBoardRun,
  type StudioBoardStatus,
} from "@/lib/api/studio";

type View = "board" | "canvas";
type BoardFile = "board.png" | "direction.json" | "critique.json";

export function StudioBoardExperiment({ projectId }: { projectId: string }) {
  const [view, setView] = useState<View>("board");
  const [status, setStatus] = useState<StudioBoardStatus>({ status: "idle" });
  const [history, setHistory] = useState<StudioBoardRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [boardUrl, setBoardUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const readyRunId = status.status === "ready" ? status.runId : null;
  const selectedRun =
    history.find((run) => run.runId === selectedRunId) ??
    (status.status === "ready" ? status : (history[0] ?? null));
  const displayedRunId = selectedRun?.runId ?? null;

  useEffect(() => {
    const controller = new AbortController();
    getStudioBoard(projectId, controller.signal)
      .then(setStatus)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error ? cause.message : "Board unavailable",
          );
        }
      });
    getStudioBoardHistory(projectId, controller.signal)
      .then(setHistory)
      .catch(() => {
        // The status request reports a useful error if the project is unavailable.
      });
    return () => controller.abort();
  }, [projectId]);

  useEffect(() => {
    if (!readyRunId) return;
    setSelectedRunId(readyRunId);
    void getStudioBoardHistory(projectId)
      .then(setHistory)
      .catch(() => {
        // The new result remains visible even if history cannot refresh.
      });
  }, [projectId, readyRunId]);

  useEffect(() => {
    if (status.status !== "running") return;
    const timer = window.setInterval(() => {
      void getStudioBoard(projectId)
        .then(setStatus)
        .catch((cause: unknown) => {
          setError(
            cause instanceof Error ? cause.message : "Board unavailable",
          );
        });
    }, 2500);
    return () => window.clearInterval(timer);
  }, [projectId, status.status]);

  useEffect(() => {
    if (!displayedRunId) return;
    const controller = new AbortController();
    let objectUrl: string | null = null;
    setBoardUrl(null);
    getStudioBoardFile(
      projectId,
      "board.png",
      displayedRunId,
      controller.signal,
    )
      .then((blob) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setBoardUrl(objectUrl);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error ? cause.message : "Board unavailable",
          );
        }
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [projectId, displayedRunId]);

  async function generate() {
    setError(null);
    try {
      setStatus(await generateStudioBoard(projectId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Generation failed");
    }
  }

  async function download(name: BoardFile) {
    try {
      const file = await getStudioBoardFile(
        projectId,
        name,
        displayedRunId ?? undefined,
      );
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Download failed");
    }
  }

  return (
    <div
      className={`absolute inset-0 flex flex-col text-white ${
        view === "canvas" ? "pointer-events-none" : "bg-[#111111]"
      }`}
    >
      <div className="pointer-events-auto flex h-12 shrink-0 items-center justify-between border-b border-white/10 bg-[#111111] px-4">
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setView("board")}
            className={view === "board" ? "text-white" : "text-white/45"}
          >
            Brand board
          </button>
          <span className="text-white/20">/</span>
          <button
            type="button"
            onClick={() => setView("canvas")}
            className={view === "canvas" ? "text-white" : "text-white/45"}
          >
            Canvas
          </button>
          <span className="ml-3 rounded border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/45">
            Experiment
          </span>
        </div>
        {view === "board" && status.status !== "running" && (
          <button
            type="button"
            onClick={() => void generate()}
            className="flex items-center gap-2 rounded-md border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10"
          >
            <RefreshCw size={13} />
            {status.status === "ready" ? "Generate another" : "Generate board"}
          </button>
        )}
      </div>

      {view === "canvas" ? (
        <div className="pointer-events-none flex-1" />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {error && (
            <p role="alert" className="mb-4 text-sm text-red-300">
              {error}
            </p>
          )}
          {status.status === "idle" && !selectedRun && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <h2 className="text-xl">Generate a brand exploration board</h2>
              <p className="max-w-md text-sm text-white/50">
                Uses this brand’s completed discovery and competitor research.
                The result is an experimental PNG, not yet editable Fabric
                layers.
              </p>
            </div>
          )}
          {status.status === "running" && !selectedRun && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-sm text-white/65">
              <LoaderCircle className="animate-spin" size={24} />
              <p>{status.stage}…</p>
            </div>
          )}
          {status.status === "failed" && !selectedRun && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <p className="text-sm text-red-300">{status.error}</p>
              <p className="text-xs text-white/45">
                Your discovery and canvas remain unchanged.
              </p>
            </div>
          )}
          {selectedRun && (
            <div className="mx-auto max-w-[1440px] space-y-5">
              {status.status === "running" && (
                <p className="flex items-center gap-2 text-xs text-white/55">
                  <LoaderCircle className="animate-spin" size={14} />
                  {status.stage}… Previous board remains available.
                </p>
              )}
              {status.status === "failed" && (
                <p className="text-xs text-red-300">{status.error}</p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/40">
                    Brand exploration
                  </p>
                  <h2 className="mt-1 text-lg">{selectedRun.concept}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {history.length > 1 && (
                    <select
                      aria-label="Select board run"
                      value={selectedRun.runId}
                      onChange={(event) => setSelectedRunId(event.target.value)}
                      className="rounded-md border border-white/20 bg-[#1b1b1b] px-2.5 py-1.5 text-xs text-white"
                    >
                      {history.map((run, index) => (
                        <option key={run.runId} value={run.runId}>
                          {`Run ${history.length - index} · ${run.concept}`}
                        </option>
                      ))}
                    </select>
                  )}
                  {(
                    ["board.png", "direction.json", "critique.json"] as const
                  ).map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => void download(name)}
                      className="flex items-center gap-1.5 rounded-md border border-white/20 px-2.5 py-1.5 text-xs hover:bg-white/10"
                    >
                      <Download size={12} /> {name}
                    </button>
                  ))}
                </div>
              </div>
              {boardUrl ? (
                <Image
                  src={boardUrl}
                  alt={`${selectedRun.concept} brand exploration board`}
                  width={1920}
                  height={1080}
                  unoptimized
                  className="h-auto w-full rounded-lg border border-white/10"
                />
              ) : (
                <div className="aspect-video animate-pulse rounded-lg bg-white/5" />
              )}
              <div className="grid gap-5 rounded-lg border border-white/10 p-5 text-sm md:grid-cols-[1fr_2fr]">
                <div>
                  <h3 className="font-medium">Automated critique</h3>
                  <p className="mt-2 text-white/55">
                    Brand fit {selectedRun.critique.brandFit}/5 ·
                    Distinctiveness {selectedRun.critique.distinctiveness}/5 ·
                    Legibility {selectedRun.critique.legibility}/5
                  </p>
                </div>
                <div className="space-y-3 text-white/70">
                  <p>{selectedRun.critique.verdict}</p>
                  {selectedRun.critique.issues.map((issue) => (
                    <p key={issue}>• {issue}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
