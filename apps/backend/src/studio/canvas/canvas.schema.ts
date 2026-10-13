import { z } from "zod";

const record = z.record(z.string(), z.unknown());
export const canvasSnapshotSchema = z.object({
  version: z.literal(1),
  canvas: record,
  viewport: z.array(z.number().finite().min(-1e7).max(1e7)).length(6),
  favorites: z.array(z.string().max(160)).max(1000),
});
export const canvasWriteSchema = z.object({
  revision: z.number().int().min(0),
  snapshot: canvasSnapshotSchema,
});
export type CanvasSnapshot = z.infer<typeof canvasSnapshotSchema>;

// Only our Fabric primitives are accepted. No external sources or executable SVG.
export function validateCanvasSnapshot(snapshot: CanvasSnapshot): string[] {
  if (JSON.stringify(snapshot).length > 1_900_000)
    throw new Error("Canvas is too large to save");
  const objects = snapshot.canvas.objects;
  if (
    snapshot.canvas.backgroundImage ||
    snapshot.canvas.overlayImage ||
    snapshot.canvas.clipPath ||
    (snapshot.canvas.overlay !== undefined &&
      typeof snapshot.canvas.overlay !== "string") ||
    (snapshot.canvas.background !== undefined &&
      typeof snapshot.canvas.background !== "string")
  )
    throw new Error("Canvas background must be a solid color");
  if (snapshot.viewport[0]! <= 0 || snapshot.viewport[3]! <= 0)
    throw new Error("Invalid canvas zoom");
  if (!Array.isArray(objects) || objects.length > 1000)
    throw new Error("Invalid canvas objects");
  const assetIds: string[] = [];
  function check(value: unknown, depth = 0): void {
    if (
      depth > 8 ||
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
    )
      throw new Error("Invalid canvas object");
    const object = value as Record<string, unknown>;
    if (
      typeof object.type !== "string" ||
      !["rect", "ellipse", "path", "itext", "textbox", "image"].includes(
        object.type.toLowerCase(),
      )
    )
      throw new Error("Unsupported canvas object");
    if (
      object.src ||
      object.objects ||
      object.shadow ||
      object.resizeFilter ||
      (Array.isArray(object.filters) && object.filters.length) ||
      (object.fill !== undefined &&
        object.fill !== null &&
        typeof object.fill !== "string") ||
      (object.stroke !== undefined &&
        object.stroke !== null &&
        typeof object.stroke !== "string")
    )
      throw new Error(
        "Canvas contains unsupported effects or external image sources",
      );
    for (const key of [
      "left",
      "top",
      "width",
      "height",
      "scaleX",
      "scaleY",
      "angle",
      "fontSize",
    ])
      if (
        object[key] !== undefined &&
        (typeof object[key] !== "number" ||
          !Number.isFinite(object[key]) ||
          Math.abs(object[key] as number) > 1e7)
      )
        throw new Error("Invalid canvas geometry");
    if (object.type.toLowerCase() === "image") {
      const data = record.parse(object.data);
      assetIds.push(z.string().uuid().parse(data.assetId));
    }
    if (object.clipPath) {
      const clip = object.clipPath as Record<string, unknown>;
      if (String(clip.type).toLowerCase() !== "rect")
        throw new Error("Only rectangular frame clipping is supported");
      check(clip, depth + 1);
    }
  }
  objects.forEach((object) => check(object));
  return [...new Set(assetIds)];
}
