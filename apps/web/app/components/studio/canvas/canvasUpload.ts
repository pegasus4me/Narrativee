import { Canvas, FabricImage } from "fabric";

export async function appendUploadedImage(
  canvas: Canvas,
  image: { id: string; name: string; width: number; height: number },
  imageUrl: (id: string) => Promise<string>,
) {
  const object = await FabricImage.fromURL(await imageUrl(image.id));
  const top = Math.max(
    100,
    ...canvas.getObjects().map((item) => {
      const bounds = item.getBoundingRect();
      return bounds.top + bounds.height + 100;
    }),
  );
  object.set({ originX: "left", originY: "top", left: 100, top });
  object.scale(Math.min(1, 600 / object.width, 600 / object.height));
  object.set("data", {
    assetId: image.id,
    kind: "upload",
    runId: image.id,
    directionId: image.id,
    role: "layer",
    name: image.name.slice(0, 255),
    row: 0,
  });
  canvas.add(object);
  canvas.setActiveObject(object);
  object.setCoords();
  canvas.requestRenderAll();
  return object.getBoundingRect();
}
