"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { InkFlood } from "../ink-flood/engine";
import { VAULT_SCENE } from "../ink-flood/presets";
import type { Scene } from "../ink-flood/scene";

export interface StudioSplashTransitionProps {
  isVisible: boolean;
  scene?: Scene;
  className?: string;
}

export default function StudioSplashTransition({
  isVisible,
  scene,
  className = "",
}: StudioSplashTransitionProps) {
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<InkFlood | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeScene = useMemo<Scene>(() => {
    const base = scene ?? VAULT_SCENE;

    // The splash transition starts on a crisp light field (#fafafa),
    // where the pen writes a thick black scribble (#0a0a0a).
    // The black ink then swells and zooms, flooding the entire frame into deep black (#0a0a0a),
    // which seamlessly reveals the dark studio workspace.
    const fields: readonly [string, string] = scene?.palette?.fields ?? [
      "#fafafa",
      "#0a0a0a",
    ];
    const dot = scene?.palette?.dot ?? "#8c8c8c";

    return {
      ...base,
      palette: {
        fields,
        dot,
        accent: scene?.palette?.accent,
      },
      word: undefined,
    };
  }, [scene]);

  useEffect(() => {
    if (!isVisible || !mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let engine: InkFlood | null = new InkFlood(canvas, activeScene);
    engineRef.current = engine;

    let hidden = document.hidden;
    const sync = () => {
      if (!engine || reduced) return;
      if (!hidden) engine.start();
      else engine.stop();
    };

    if (reduced) {
      engine.renderStill();
    } else {
      sync();
    }

    const onVis = () => {
      hidden = document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVis);

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => engine?.resize(), 100);
    };
    window.addEventListener("resize", onResize);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(resizeTimer);
      engine?.destroy();
      engine = null;
      engineRef.current = null;
    };
  }, [isVisible, mounted, activeScene]);

  // Update scene dynamically if it changes while mounted
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setScene(activeScene);
    }
  }, [activeScene]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="studio-splash-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className={`fixed inset-0 z-[9999] flex items-center justify-center select-none overflow-hidden ${className}`}
          style={{ backgroundColor: activeScene.palette.fields[0] }}
          role="status"
          aria-label="Loading studio"
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full"
          />
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.82 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 1.8,
              duration: 0.65,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative z-10 h-[clamp(38px,7vw,72px)] w-[min(62vw,380px)] bg-white mix-blend-difference"
            style={{
              WebkitMaskImage: "url(/logo-dark.png)",
              maskImage: "url(/logo-dark.png)",
              WebkitMaskPosition: "center",
              maskPosition: "center",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskSize: "contain",
              maskSize: "contain",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
