import { z } from "zod";
import { contrastRatio } from "../brand-board/render";

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const identityPlanSchema = z.object({
  directions: z
    .array(
      z.object({
        name: z.string().trim().min(3).max(32),
        strategicAngle: z.string().trim().min(15).max(180),
        markIdea: z.string().trim().min(15).max(180),
      }),
    )
    .length(3),
});

export const logoFontFamilies = [
  "Instrument Sans",
  "Manrope",
  "Belleza",
  "Stack Sans Notch",
] as const;

export const logoSceneSchema = z.object({
  background: color,
  foreground: color,
  accent: color,
  fontFamily: z.enum(logoFontFamilies),
  fontWeight: z.number().int().min(400).max(700),
  letterSpacing: z.number().min(-3).max(12),
  paths: z
    .array(
      z.object({
        d: z.string().trim().min(10).max(1200),
        fill: z.enum(["foreground", "accent", "none"]),
        stroke: z.enum(["foreground", "accent", "none"]),
        strokeWidth: z.number().min(0).max(20),
      }),
    )
    .min(1)
    .max(8),
});

export type { IdentityPlan } from "./identity.types";
export type LogoScene = z.infer<typeof logoSceneSchema>;

export function validateLogoScene(scene: LogoScene): void {
  if (contrastRatio(scene.background, scene.foreground) < 4.5) {
    throw new Error("Logo wordmark does not contrast with its background");
  }
  for (const shape of scene.paths) {
    if (!/^[MmLlHhVvCcQqZz0-9\s,.-]+$/.test(shape.d)) {
      throw new Error("Logo path contains an unsupported SVG command");
    }
    const coordinates = shape.d.match(/-?\d+(?:\.\d+)?/g) ?? [];
    if (
      coordinates.length > 120 ||
      coordinates.some((value) => Math.abs(Number(value)) > 240)
    ) {
      throw new Error("Logo path exceeds the supported 240-unit artboard");
    }
    if (shape.fill === "none" && shape.stroke === "none") {
      throw new Error("Logo path must have a visible fill or stroke");
    }
  }
}
