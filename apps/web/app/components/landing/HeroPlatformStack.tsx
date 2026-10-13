"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  socialPlatformBackgrounds,
  socialPlatformLogos,
} from "@/lib/social-platform-logos";
import styles from "./hero-platform-stack.module.css";

const platforms = ["facebook", "instagram", "tiktok"];
const stages = [1, 2, 3, 5, 6, 7, 7, 7];

export default function HeroPlatformStack() {
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const visible = reducedMotion ? 7 : stages[step]!;
  const transition = { duration: reducedMotion ? 0 : 0.3 };

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(
      () => setStep((current) => (current + 1) % stages.length),
      1100,
    );
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  return (
    <span className={styles.stack} aria-hidden="true">
      <AnimatePresence initial={false}>
        {platforms.slice(0, visible).map((platform, index) => (
          <motion.span
            key={platform}
            className={styles.circle}
            style={{ left: `${index * 0.5}em`, zIndex: index + 1 }}
            initial={{ opacity: 0, scale: 0.6, x: 12 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={transition}
          >
            <span
              className={styles.icon}
              style={{
                background: socialPlatformBackgrounds[platform],
                mask: `url(${socialPlatformLogos[platform]}) center / contain no-repeat`,
              }}
            />
          </motion.span>
        ))}
        {visible > platforms.length && (
          <motion.span
            key="count"
            className={`${styles.circle} ${styles.counter}`}
            style={{ left: "1.5em", zIndex: 4 }}
            initial={{ opacity: 0, scale: 0.6, x: 12 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={transition}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={visible}
                className={styles.count}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={transition}
              >
                +{visible - platforms.length}
              </motion.span>
            </AnimatePresence>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
