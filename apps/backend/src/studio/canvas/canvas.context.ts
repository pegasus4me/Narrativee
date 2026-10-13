import type { CanvasSnapshot } from "./canvas.schema";

export function studioCanvasContext(snapshot: CanvasSnapshot | null) {
  const objects = snapshot?.canvas.objects;
  if (!Array.isArray(objects)) return [];
  return objects.slice(-60).map((object: Record<string, unknown>) => ({
    type: object.type,
    data:
      object.data && typeof object.data === "object"
        ? Object.fromEntries(
            Object.entries(object.data).filter(([key]) =>
              ["assetId", "kind", "name", "directionId", "role"].includes(key),
            ),
          )
        : null,
    text: object.text,
    fontFamily: object.fontFamily,
    fontSize: object.fontSize,
    fontWeight: object.fontWeight,
    fill: object.fill,
    left: object.left,
    top: object.top,
    width: object.width,
    height: object.height,
    scaleX: object.scaleX,
    scaleY: object.scaleY,
    angle: object.angle,
    cropX: object.cropX,
    cropY: object.cropY,
    clipPath:
      object.clipPath && typeof object.clipPath === "object"
        ? Object.fromEntries(
            Object.entries(object.clipPath).filter(([key]) =>
              ["left", "top", "width", "height", "absolutePositioned"].includes(
                key,
              ),
            ),
          )
        : null,
  }));
}

export function studioUploadIds(
  snapshot: CanvasSnapshot | null,
  selectedIds?: string[],
) {
  const objects = snapshot?.canvas.objects;
  if (!Array.isArray(objects)) return [];
  return [
    ...new Map(
      objects.flatMap((object: Record<string, unknown>) => {
        const data = object.data as Record<string, unknown> | undefined;
        if (
          String(object.type).toLowerCase() !== "image" ||
          data?.kind !== "upload" ||
          typeof data.assetId !== "string"
        )
          return [];
        return [
          [
            data.assetId,
            {
              id: data.assetId,
              name:
                typeof data.name === "string"
                  ? data.name.slice(0, 255)
                  : "Studio upload",
            },
          ] as const,
        ];
      }),
    ).values(),
  ]
    .filter(({ id }) => !selectedIds || selectedIds.includes(id))
    .slice(-6);
}
