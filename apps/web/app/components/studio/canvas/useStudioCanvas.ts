"use client";

import { useEffect, useRef } from "react";
import { Canvas, IText } from "fabric";

const CANVAS_BACKGROUND = "#111111";

export function useStudioCanvas(projectId: string) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<HTMLCanvasElement>(null);

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
    const resizeObserver = new ResizeObserver(() => {
      const width = Math.max(1, Math.floor(surface.clientWidth));
      const height = Math.max(1, Math.floor(surface.clientHeight));
      canvas.setDimensions({ width, height });
    });
    resizeObserver.observe(surface);
    const storageKey = `studio-canvas:${projectId}`;
    let saveTimer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;

    const scheduleSave = () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        if (disposed) return;
        try {
          localStorage.setItem(storageKey, JSON.stringify(canvas.toJSON()));
        } catch {
          // The canvas remains usable when browser storage is unavailable.
        }
      }, 350);
    };

    const restore = async () => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) await canvas.loadFromJSON(saved);
        if (canvas.backgroundColor === "#ffffff") {
          for (const object of canvas.getObjects()) {
            if (object instanceof IText && object.fill === "#171717") {
              object.set("fill", "#f5f5f5");
            }
          }
        }
        canvas.backgroundColor = CANVAS_BACKGROUND;
      } catch {
        // A missing or invalid local draft should not block the canvas.
      }
      if (disposed) return;
      canvas.renderAll();
      canvas.on("object:added", scheduleSave);
      canvas.on("object:removed", scheduleSave);
      canvas.on("object:modified", scheduleSave);
      canvas.on("text:changed", scheduleSave);
    };
    void restore();

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      clearTimeout(saveTimer);
      if (saveTimer) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(canvas.toJSON()));
        } catch {
          // Browser storage may be unavailable when leaving the page.
        }
      }
      void canvas.dispose();
    };
  }, [projectId]);

  return { surfaceRef, elementRef };
}
