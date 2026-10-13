import { createHash } from "node:crypto";
import type { CanvasSnapshot } from "./canvas/canvas.schema";
import type { VisualApproval } from "./visual-approval.types";
export type { VisualApproval, ApprovalStatus } from "./visual-approval.types";

export function approvalContextHash(context: unknown) {
  return createHash("sha256").update(JSON.stringify(context)).digest("hex");
}

export function approvalCanvasHash(snapshot: CanvasSnapshot | null) {
  // Fabric's version and the viewport/favorites are not changes to the artwork.
  const {
    version: _version,
    background = "transparent",
    objects = [],
    ...canvas
  } = snapshot?.canvas ?? {};
  const content = JSON.stringify(
    { ...canvas, background, objects },
    (_key, value) =>
      value && typeof value === "object" && !Array.isArray(value)
        ? Object.fromEntries(
            Object.entries(value).sort(([left], [right]) =>
              left.localeCompare(right),
            ),
          )
        : value,
  );
  return createHash("sha256").update(content).digest("hex");
}

export function isApprovalCanvasCurrent(
  approved: Pick<VisualApproval, "canvasRevision" | "canvasHash">,
  canvas: { revision: number; snapshot: CanvasSnapshot | null },
) {
  // Older saved proposals have no content fingerprint; keep their strict check.
  return approved.canvasHash
    ? approved.canvasHash === approvalCanvasHash(canvas.snapshot)
    : approved.canvasRevision === canvas.revision;
}

export class ApprovalError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Only a preflight mismatch, before imagery or canvas changes, can refresh a proposal.
export class StaleVisualApprovalError extends Error {}
