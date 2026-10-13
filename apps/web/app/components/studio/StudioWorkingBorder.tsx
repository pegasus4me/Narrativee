"use client";

import { motion, useReducedMotion } from "motion/react";
import React from "react";

export function StudioWorkingBorder({ active }: { active: boolean }) {
  const reducedMotion = useReducedMotion();
  if (!active) return null;
  return (
    <motion.div
      aria-hidden="true"
      data-studio-working-border="true"
      className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] border border-tertiary/60"
      style={{
        boxShadow:
          "inset 0 0 16px color-mix(in srgb, var(--tertiary) 14%, transparent)",
      }}
      initial={false}
      animate={{ opacity: reducedMotion ? 0.7 : [0.35, 0.85, 0.35] }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
      }
    />
  );
}

export const STUDIO_WORKING_EVENT = "narrativee:studio-working";
