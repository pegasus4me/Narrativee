"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, IText, Point } from "fabric";
import { STUDIO_CANVAS_EVENT, type StudioCanvasEvent } from "@/lib/api/studio";
import { appendUploadedImage } from "./canvasUpload";
import {
  STUDIO_SELECTION_EVENT,
  STUDIO_SAVE_EVENT,
  type StudioImageSelection,
} from "@/lib/studio-brief";
import { createCanvasPersistence } from "./canvasPersistence";
import {
  appendCampaign,
  exportCampaignFrame,
  renderCanvasDirection,
  selectedCampaignFrame,
} from "./campaignScene";
import {
  allBoardsBounds,
  applyLogoEvent,
  directionBounds,
  readObjectData,
  type DirectionContexts,
} from "./logoScene";

const CANVAS_BACKGROUND = "transparent";
const MIN_ZOOM = 0.16;
const MAX_ZOOM = 4;

interface SelectionInfo {
  type: "text" | "shape";
  fill: string;
  text: string;
  fontSize: number;
  directionId: string | null;
  directionName: string | null;
  canExport: boolean;
}

export interface DirectionPreview {
  directionId: string;
  name: string;
  width: number;
  height: number;
  src: string;
}

function fitRect(
  canvas: Canvas,
  bounds: { x: number; y: number; width: number; height: number },
) {
  const zoom = Math.min(
    MAX_ZOOM,
    Math.max(
      MIN_ZOOM,
      Math.min(
        canvas.getWidth() / bounds.width,
        canvas.getHeight() / bounds.height,
      ),
    ),
  );
  canvas.setViewportTransform([
    zoom,
    0,
    0,
    zoom,
    (canvas.getWidth() - bounds.width * zoom) / 2 - bounds.x * zoom,
    (canvas.getHeight() - bounds.height * zoom) / 2 - bounds.y * zoom,
  ]);
  canvas.requestRenderAll();
  return zoom;
}

export function useStudioCanvas(projectId: string) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const saveRef = useRef<() => void>(() => undefined);
  const favoritesRef = useRef<string[]>([]);
  const retrySaveRef = useRef<() => Promise<void>>(async () => undefined);
  const syncGridRef = useRef<() => void>(() => undefined);
  const [zoom, setZoom] = useState(1);
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState("Loading canvas…");
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [previews, setPreviews] = useState<DirectionPreview[]>([]);
  const [loadingPreviews, setLoadingPreviews] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    const surface = surfaceRef.current;
    if (!element || !surface) return;

    const canvas = new Canvas(element, {
      width: 1,
      height: 1,
      backgroundColor: CANVAS_BACKGROUND,
      preserveObjectStacking: true,
    });
    canvasRef.current = canvas;
    const contexts: DirectionContexts = new Map();
    let closed = false;
    let spacePressed = false;
    let panning = false;
    let lastPointer = { x: 0, y: 0 };

    const syncGrid = () => {
      if (!surface || !canvas) return;
      const vpt = canvas.viewportTransform;
      const currentZoom = canvas.getZoom();
      const scaledGap = 24 * currentZoom;
      const opacity = Math.min(1, Math.max(0, (scaledGap - 6) / 8));
      surface.style.backgroundSize = `${scaledGap}px ${scaledGap}px`;
      surface.style.backgroundPosition = `${vpt[4] - scaledGap / 2}px ${vpt[5] - scaledGap / 2}px`;
      surface.style.setProperty(
        "--studio-dot-color",
        `rgba(24, 24, 27, ${0.12 * opacity})`,
      );
    };
    syncGridRef.current = syncGrid;
    syncGrid();

    const persistence = createCanvasPersistence(
      canvas,
      projectId,
      () => favoritesRef.current,
      (status, error) => {
        if (closed) return;
        setSaveStatus(status);
        setCanvasError(error ?? null);
      },
    );
    const scheduleSave = persistence.schedule;
    saveRef.current = scheduleSave;
    retrySaveRef.current = persistence.flush;
    const restored = persistence
      .restore()
      .then(async ({ favorites: savedFavorites, imported }) => {
        if (closed) return;
        favoritesRef.current = savedFavorites;
        setFavorites(savedFavorites);
        if (imported) await persistence.flush();
        setZoom(canvas.getZoom());
        setHasContent(canvas.getObjects().length > 0);
        canvas.requestRenderAll();
        syncGrid();
      });
    void restored.catch((error: unknown) => {
      if (!closed) {
        setSaveStatus("Unavailable");
        setCanvasError(
          error instanceof Error ? error.message : "Could not restore canvas",
        );
      }
    });

    const syncSelection = () => {
      const active = canvas.getActiveObject();
      const data = active?.get("data") as Record<string, unknown> | undefined;
      const selectedImage: StudioImageSelection | null =
        active &&
        typeof data?.assetId === "string" &&
        (data.kind === "upload" ||
          (data.kind === "campaign" &&
            data.role === "artboard" &&
            data.layerId === "creative-image"))
          ? {
              assetId: data.assetId,
              name: String(data.name ?? "Creative"),
              kind: data.kind as "upload" | "campaign",
              width: Number(data.exportWidth ?? active.width),
              height: Number(data.exportHeight ?? active.height),
              version: Number(data.version ?? 1),
            }
          : null;
      window.dispatchEvent(
        new CustomEvent(STUDIO_SELECTION_EVENT, {
          detail: { projectId, selection: selectedImage },
        }),
      );
      if (!active) {
        setSelection(null);
        return;
      }
      const textObject = active instanceof IText ? active : null;
      const objectData = readObjectData(active);
      setSelection({
        type: textObject ? "text" : "shape",
        fill: typeof active.fill === "string" ? active.fill : "#18252A",
        text: textObject?.text ?? "",
        fontSize: textObject?.fontSize ?? 0,
        directionId: objectData?.directionId ?? null,
        directionName: objectData?.name ?? null,
        canExport: Boolean(selectedCampaignFrame(canvas)),
      });
    };

    const saveBeforeGeneration = (raw: Event) => {
      const detail = (
        raw as CustomEvent<{
          projectId: string;
          respondWith: (saving: Promise<void>) => void;
        }>
      ).detail;
      if (detail?.projectId === projectId)
        detail.respondWith(restored.then(() => persistence.flush()));
    };
    window.addEventListener(STUDIO_SAVE_EVENT, saveBeforeGeneration);

    const resizeObserver = new ResizeObserver(() => {
      canvas.setDimensions({
        width: Math.max(1, Math.floor(surface.clientWidth)),
        height: Math.max(1, Math.floor(surface.clientHeight)),
      });
      syncGrid();
    });
    resizeObserver.observe(surface);

    const onCanvasEvent = (raw: Event) => {
      const detail = (
        raw as CustomEvent<{
          projectId: string;
          event: StudioCanvasEvent;
          respondWith?: (result: Promise<void>) => void;
        }>
      ).detail;
      if (!detail || detail.projectId !== projectId) return;
      if (
        detail.event.type === "stage" ||
        detail.event.type === "agent_activity" ||
        detail.event.type === "conversation_thread" ||
        detail.event.type === "team_message"
      )
        return;
      if (
        detail.event.type === "campaign_scene" ||
        detail.event.type === "image_upload"
      ) {
        const event = detail.event;
        const result = (async () => {
          await restored;
          if (closed) throw new Error("Canvas was closed before rendering");
          const appended =
            event.type === "campaign_scene"
              ? await appendCampaign(
                  canvas,
                  event.document,
                  persistence.imageUrl,
                )
              : {
                  frame: null,
                  bounds: await appendUploadedImage(
                    canvas,
                    event.image,
                    persistence.imageUrl,
                  ),
                };
          if (closed) throw new Error("Canvas was closed before saving");
          const bounds =
            appended.frame?.getBoundingRect() ??
            ("bounds" in appended ? appended.bounds : null);
          if (bounds) {
            setZoom(
              fitRect(canvas, {
                x: bounds.left - 50,
                y: bounds.top - 50,
                width: bounds.width + 100,
                height: bounds.height + 100,
              }),
            );
          }
          syncSelection();
          syncGrid();
          await persistence.flush();
        })();
        detail.respondWith?.(result);
        void result.catch((error: unknown) => {
          if (!closed)
            setCanvasError(
              error instanceof Error
                ? error.message
                : "Could not render creative",
            );
        });
        return;
      }
      const outcome = applyLogoEvent(canvas, detail.event, contexts);
      if (outcome.focus) {
        setZoom(
          fitRect(
            canvas,
            directionBounds(outcome.focus.index, outcome.focus.row),
          ),
        );
      }
      if (outcome.fitAll) {
        const bounds = allBoardsBounds(canvas);
        if (bounds) setZoom(fitRect(canvas, bounds));
      }
      syncGrid();
      scheduleSave();
    };
    window.addEventListener(STUDIO_CANVAS_EVENT, onCanvasEvent);

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.code === "Space" &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement) &&
        !(
          canvas.getActiveObject() instanceof IText &&
          (canvas.getActiveObject() as IText).isEditing
        )
      ) {
        spacePressed = true;
      }
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement)
      ) {
        const active = canvas.getActiveObject();
        if (active && !(active instanceof IText && active.isEditing)) {
          canvas.remove(active);
          canvas.discardActiveObject();
          setSelection(null);
          scheduleSave();
        }
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") spacePressed = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    canvas.on("mouse:wheel", ({ e }) => {
      const wheel = e as WheelEvent;
      wheel.preventDefault();
      wheel.stopPropagation();
      const next = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, canvas.getZoom() * Math.pow(0.999, wheel.deltaY)),
      );
      canvas.zoomToPoint(new Point(wheel.offsetX, wheel.offsetY), next);
      setZoom(next);
      syncGrid();
      scheduleSave();
    });
    canvas.on("mouse:down", ({ e }) => {
      const mouse = e as MouseEvent;
      if (!spacePressed && mouse.button !== 1) return;
      panning = true;
      canvas.selection = false;
      lastPointer = { x: mouse.clientX, y: mouse.clientY };
    });
    canvas.on("mouse:move", ({ e }) => {
      if (!panning) return;
      const mouse = e as MouseEvent;
      canvas.relativePan(
        new Point(mouse.clientX - lastPointer.x, mouse.clientY - lastPointer.y),
      );
      lastPointer = { x: mouse.clientX, y: mouse.clientY };
      syncGrid();
      scheduleSave();
    });
    canvas.on("mouse:up", () => {
      panning = false;
      canvas.selection = true;
    });
    canvas.on("selection:created", syncSelection);
    canvas.on("selection:updated", syncSelection);
    canvas.on("selection:cleared", syncSelection);
    canvas.on("object:added", scheduleSave);
    canvas.on("object:removed", scheduleSave);
    const updateContent = () => setHasContent(canvas.getObjects().length > 0);
    canvas.on("object:added", updateContent);
    canvas.on("object:removed", updateContent);
    canvas.on("object:modified", () => {
      syncSelection();
      scheduleSave();
    });
    canvas.on("text:changed", () => {
      syncSelection();
      scheduleSave();
    });
    canvas.on("after:render", syncGrid);

    return () => {
      syncGridRef.current = () => undefined;
      persistence.dispose();
      closed = true;
      resizeObserver.disconnect();
      window.removeEventListener(STUDIO_CANVAS_EVENT, onCanvasEvent);
      window.removeEventListener(STUDIO_SAVE_EVENT, saveBeforeGeneration);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvasRef.current = null;
      saveRef.current = () => undefined;
      retrySaveRef.current = async () => undefined;
      void canvas.dispose();
    };
  }, [projectId]);

  function zoomBy(factor: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const next = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, canvas.getZoom() * factor),
    );
    canvas.zoomToPoint(
      new Point(canvas.getWidth() / 2, canvas.getHeight() / 2),
      next,
    );
    setZoom(next);
    syncGridRef.current();
    saveRef.current();
  }

  function fitAll() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bounds = allBoardsBounds(canvas);
    if (!bounds) return;
    setZoom(fitRect(canvas, bounds));
    syncGridRef.current();
    saveRef.current();
  }

  async function loadPreviews() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setLoadingPreviews(true);
    try {
      const directions = new Map<string, string>();
      for (const object of canvas.getObjects()) {
        const data = readObjectData(object);
        if (data?.role === "artboard") directions.set(data.directionId, data.name);
      }
      const next = await Promise.all(
        [...directions.keys()].map((id) =>
          renderCanvasDirection(canvas, id, 0.35),
        ),
      );
      setPreviews(next);
      setCanvasError(null);
    } catch (error) {
      setCanvasError(
        error instanceof Error ? error.message : "Could not load creative grid",
      );
    } finally {
      setLoadingPreviews(false);
    }
  }

  function focusDirection(directionId: string) {
    const canvas = canvasRef.current;
    const frame = canvas?.getObjects().find((object) => {
      const data = readObjectData(object);
      return data?.directionId === directionId && data.role === "artboard";
    });
    if (!canvas || !frame) return;
    canvas.setActiveObject(frame);
    const bounds = frame.getBoundingRect();
    setZoom(
      fitRect(canvas, {
        x: bounds.left,
        y: bounds.top,
        width: bounds.width,
        height: bounds.height,
      }),
    );
    syncGridRef.current();
  }

  function updateSelectedColor(color: string) {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active) return;
    active.set("fill", color);
    canvas.requestRenderAll();
    setSelection((current) => (current ? { ...current, fill: color } : null));
    saveRef.current();
  }

  function updateSelectedText(text: string) {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!(active instanceof IText) || !canvas) return;
    active.set("text", text);
    active.setCoords();
    canvas.requestRenderAll();
    setSelection((current) => (current ? { ...current, text } : null));
    saveRef.current();
  }

  function updateSelectedFontSize(fontSize: number) {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!(active instanceof IText) || !canvas) return;
    if (!Number.isFinite(fontSize)) return;
    const nextFontSize = Math.min(200, Math.max(12, fontSize));
    active.set("fontSize", nextFontSize);
    active.setCoords();
    canvas.requestRenderAll();
    setSelection((current) =>
      current ? { ...current, fontSize: nextFontSize } : null,
    );
    saveRef.current();
  }

  function toggleFavorite() {
    const id = selection?.directionId;
    if (!id) return;
    const next = favoritesRef.current.includes(id)
      ? favoritesRef.current.filter((item) => item !== id)
      : [...favoritesRef.current, id];
    favoritesRef.current = next;
    setFavorites(next);
    saveRef.current();
  }

  async function exportSelected() {
    const canvas = canvasRef.current;
    if (!canvas || exporting) return;
    setExporting(true);
    try {
      const result = await exportCampaignFrame(canvas);
      const link = document.createElement("a");
      link.href = result.url;
      link.download = result.filename;
      link.click();
    } catch (error) {
      setCanvasError(
        error instanceof Error ? error.message : "Could not export PNG",
      );
    } finally {
      setExporting(false);
    }
  }

  return {
    surfaceRef,
    elementRef,
    zoom,
    selection,
    saveStatus,
    canvasError,
    exporting,
    hasContent,
    previews,
    loadingPreviews,
    loadPreviews,
    focusDirection,
    exportSelected,
    retrySave: () => void retrySaveRef.current().catch(() => undefined),
    isFavorite: Boolean(
      selection?.directionId && favorites.includes(selection.directionId),
    ),
    zoomBy,
    fitAll,
    updateSelectedColor,
    updateSelectedText,
    updateSelectedFontSize,
    toggleFavorite,
  };
}
