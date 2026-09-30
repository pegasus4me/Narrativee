import { z } from "zod";

const evidenceIds = z
  .array(z.string().regex(/^[A-Z]\d+$/))
  .min(1)
  .max(4);

export const directionSchema = z.object({
  name: z.string().trim().min(3).max(30),
  thesis: z.string().trim().min(12).max(120),
  rationale: z.object({
    text: z
      .string()
      .trim()
      .min(20)
      .max(220)
      .regex(/[.!?]$/),
    evidenceIds,
  }),
  differentiation: z.object({
    text: z
      .string()
      .trim()
      .min(20)
      .max(220)
      .regex(/[.!?]$/),
    evidenceIds,
  }),
  palette: z.object({
    background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    foreground: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }),
  typography: z.object({
    display: z.enum(["Avenir Next", "Georgia", "Helvetica Neue"]),
    body: z.enum(["Avenir Next", "Helvetica Neue", "Menlo"]),
    reason: z.string().trim().min(12).max(160),
  }),
  imageBrief: z.string().trim().min(40).max(900),
  headline: z.string().trim().min(8).max(54),
  applicationLabel: z
    .string()
    .trim()
    .min(3)
    .max(24)
    .regex(/^[A-Za-z0-9 /&-]+$/),
  applicationCopy: z.string().trim().min(12).max(75),
});

export type BrandDirection = z.infer<typeof directionSchema>;

export const imageSelectionSchema = z.object({
  selectedIndex: z.number().int().min(0).max(1),
  reason: z.string().trim().min(12).max(300),
});

export const boardCritiqueSchema = z.object({
  brandFit: z.number().int().min(1).max(5),
  distinctiveness: z.number().int().min(1).max(5),
  legibility: z.number().int().min(1).max(5),
  strengths: z.array(z.string().trim().min(5)).max(3),
  issues: z.array(z.string().trim().min(5)).max(3),
  verdict: z.string().trim().min(12).max(800),
});

export type BoardCritique = z.infer<typeof boardCritiqueSchema>;
