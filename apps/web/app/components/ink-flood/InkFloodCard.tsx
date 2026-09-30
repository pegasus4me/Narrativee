"use client";

import { useEffect, useRef } from "react";
import { InkFlood } from "./engine";
import { DEFAULT_SCENE } from "./presets";
import type { Scene } from "./scene";
import { onTransitionChange } from "../../lib/view-transition";

export function InkFloodCard({
  bare = false,
  viewTransitionName,
  scene = DEFAULT_SCENE,
}: {
  bare?: boolean;
  viewTransitionName?: string;
  scene?: Scene;
} = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<InkFlood | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let engine: InkFlood | null = null;
    let onScreen = false;
    let hidden = false;
    let inTransition = false;

    const sync = () => {
      if (!engine || reduced) return;
      if (onScreen && !hidden && !inTransition) engine.start();
      else engine.stop();
    };

    const raf = requestAnimationFrame(() => {
      if (!canvasRef.current) return;
      engine = new InkFlood(canvas, scene);
      engineRef.current = engine;
      if (!engine.ok) return;
      if (reduced) engine.renderStill();
      else sync();
    });

    const io = new IntersectionObserver(
      (es) => {
        onScreen = es[0]?.isIntersecting ?? false;
        sync();
      },
      { threshold: 0.2 },
    );
    io.observe(canvas);

    const onVis = () => {
      hidden = document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVis);
    const offTransition = onTransitionChange((active) => {
      inTransition = active;
      sync();
    });

    let rt = 0;
    const onResize = () => {
      window.clearTimeout(rt);
      rt = window.setTimeout(() => engine?.resize(), 120);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      offTransition();
      window.removeEventListener("resize", onResize);
      window.clearTimeout(rt);
      engineRef.current = null;
      engine?.destroy();
    };
  }, []);

  const mountedScene = useRef(scene);
  useEffect(() => {
    if (mountedScene.current === scene) return;
    mountedScene.current = scene;
    engineRef.current?.setScene(scene);
  }, [scene]);

  return (
    <div
      data-canvas-card
      role="img"
      aria-label="A grey dot writes a thick black scribble across a white field, the scribble swells until its ink floods the whole card, and the drawing starts again in the opposite colours — each pass painting the background the next one is drawn on."
      style={{
        ...(viewTransitionName ? { viewTransitionName } : null),
        backgroundColor: scene.palette.fields[0],
      }}
      className={
        bare
          ? "relative h-full w-full select-none overflow-hidden"
          : "relative mx-auto aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)]"
      }
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
