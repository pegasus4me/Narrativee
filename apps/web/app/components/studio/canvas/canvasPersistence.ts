import type { Canvas } from "fabric";
import {
  fetchProjectImage,
  getCanvasSnapshot,
  saveCanvasSnapshot,
  type CanvasSnapshot,
} from "@/lib/api/studio-canvas";
import { StudioApiError } from "@/lib/api/studio";
import { loadCanvasFont } from "./canvasFonts";
import { releaseGeneratedImages } from "./campaignScene";

export function createCanvasPersistence(
  canvas: Canvas,
  projectId: string,
  getFavorites: () => string[],
  onStatus: (status: string, error?: string) => void,
) {
  const storageKey = `studio-canvas:${projectId}`;
  const imageLoads = new Map<string, Promise<string>>();
  const imageUrls = new Set<string>();
  let revision = 0;
  let ready = false;
  let disposed = false;
  let dirty = false;
  let pendingSnapshot: CanvasSnapshot | null = null;
  let conflicted = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let saving: Promise<void> | null = null;

  function imageUrl(id: string): Promise<string> {
    const existing = imageLoads.get(id);
    if (existing) return existing;
    const pending = fetchProjectImage(projectId, id)
      .then((blob) => {
        if (disposed) throw new Error("Canvas was closed");
        const url = URL.createObjectURL(blob);
        imageUrls.add(url);
        return url;
      })
      .catch((error: unknown) => {
        imageLoads.delete(id);
        throw error;
      });
    imageLoads.set(id, pending);
    return pending;
  }
  const snapshot = (): CanvasSnapshot => {
    const serialized = canvas.toObject(["data"]) as Record<string, unknown>;
    for (const object of serialized.objects as Array<Record<string, unknown>>) {
      if (String(object.type).toLowerCase() === "image") delete object.src;
    }
    return {
      version: 1,
      canvas: serialized,
      viewport: [...canvas.viewportTransform],
      favorites: getFavorites(),
    };
  };
  function remember(value: CanvasSnapshot) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      /* Keep editing if browser storage is unavailable. */
    }
  }
  async function flush() {
    clearTimeout(timer);
    if (!ready || disposed) throw new Error("Canvas is not ready to save");
    if (conflicted)
      throw new Error(
        "Canvas changed in another tab. Your edits are still on this canvas; reopen the project to resolve the conflict.",
      );
    dirty = true;
    pendingSnapshot = snapshot();
    remember(pendingSnapshot);
    if (saving) return saving;
    saving = (async () => {
      // Drain captured changes even if React unmounts during an in-flight save.
      while (dirty) {
        dirty = false;
        const value = pendingSnapshot!;
        if (!disposed) onStatus("Saving…");
        const result = await saveCanvasSnapshot(projectId, revision, value);
        revision = result.revision;
      }
      if (!disposed) onStatus("Saved");
    })()
      .catch((error: unknown) => {
        dirty = true;
        if (error instanceof StudioApiError && error.status === 409)
          conflicted = true;
        if (!disposed)
          onStatus(
            "Not saved",
            error instanceof Error ? error.message : "Could not save canvas",
          );
        throw error;
      })
      .finally(() => {
        saving = null;
      });
    return saving;
  }
  function schedule() {
    if (!ready || disposed) return;
    dirty = true;
    pendingSnapshot = snapshot();
    remember(pendingSnapshot);
    onStatus("Unsaved changes");
    clearTimeout(timer);
    timer = setTimeout(() => void flush().catch(() => undefined), 600);
  }
  async function restore() {
    onStatus("Loading canvas…");
    const saved = await getCanvasSnapshot(projectId);
    revision = saved.revision;
    let value = saved.snapshot;
    let imported = false;
    if (!value) {
      let local: string | null = null;
      try {
        local = localStorage.getItem(storageKey);
      } catch {
        /* Server saving works without browser storage. */
      }
      if (local) {
        const parsed = JSON.parse(local) as Partial<CanvasSnapshot>;
        value = {
          version: 1,
          canvas: parsed.canvas ?? (parsed as Record<string, unknown>),
          viewport: parsed.viewport ?? [1, 0, 0, 1, 0, 0],
          favorites: parsed.favorites ?? [],
        };
        imported = true;
      }
    }
    if (value) {
      const data = structuredClone(value.canvas);
      (data as Record<string, unknown>).background = "transparent";
      const objects = data.objects as Array<Record<string, unknown>>;
      await Promise.all(
        objects.map(async (object) => {
          if (String(object.type).toLowerCase() === "image") {
            const metadata = object.data as { assetId: string };
            object.src = await imageUrl(metadata.assetId);
          }
          if (typeof object.fontFamily === "string")
            await loadCanvasFont(
              object.fontFamily,
              typeof object.fontWeight === "number" ||
                typeof object.fontWeight === "string"
                ? object.fontWeight
                : 400,
            );
        }),
      );
      if (disposed) throw new Error("Canvas was closed");
      await canvas.loadFromJSON(data);
      const restoredObjects = canvas.getObjects();
      const released = releaseGeneratedImages(restoredObjects);
      if (released.length !== restoredObjects.length) {
        canvas.remove(
          ...restoredObjects.filter((object) => !released.includes(object)),
        );
        imported = true;
      }
      canvas.backgroundColor = "transparent";
      canvas.setViewportTransform(
        value.viewport as [number, number, number, number, number, number],
      );
    }
    ready = true;
    onStatus(
      imported ? "Updating canvas…" : saved.snapshot ? "Saved" : "Ready",
    );
    return { favorites: value?.favorites ?? [], imported };
  }
  function dispose() {
    if (dirty && ready && !conflicted) void flush().catch(() => undefined);
    disposed = true;
    clearTimeout(timer);
    for (const url of imageUrls) URL.revokeObjectURL(url);
  }
  return { restore, schedule, flush, imageUrl, dispose };
}
