import {
  Canvas,
  Ellipse,
  FabricImage,
  FabricObject,
  Path,
  Rect,
  StaticCanvas,
  Textbox,
} from "fabric";
import type { CampaignDocument, CampaignLayer } from "@/lib/api/studio-canvas";
import { readObjectData } from "./logoScene";
import { loadCanvasFont } from "./canvasFonts";
import { fitCampaignText } from "./canvasText";

export async function appendCampaign(
  canvas: Canvas,
  document: CampaignDocument,
  imageUrl: (id: string) => Promise<string>,
) {
  const staged: FabricObject[] = [];
  const existingBounds = canvas
    .getObjects()
    .map((object) => object.getBoundingRect());
  let top = Math.max(
    100,
    ...existingBounds.map((bounds) => bounds.top + bounds.height + 140),
  );
  for (const frame of document.frames) {
    const left = 100;
    const metadata = {
      runId: frame.id,
      directionId: frame.id,
      role: "artboard",
      name: frame.name,
      row: 0,
      kind: "campaign",
      formatId: frame.formatId,
      version: frame.version ?? 1,
      revisionOf: frame.revisionOf,
    };
    const artboard = new Rect({
      originX: "left",
      originY: "top",
      left,
      top,
      width: frame.width,
      height: frame.height,
      strokeWidth: 0,
      fill: frame.background,
      lockMovementX: true,
      lockMovementY: true,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
      hasControls: false,
    });
    artboard.set("data", metadata);
    staged.push(artboard);
    for (const layer of frame.layers) {
      const object = await createLayer(layer, imageUrl);
      const centered = layer.type === "image" && layer.fit === "contain";
      object.set({
        left: left + layer.x + (centered ? layer.width / 2 : 0),
        top: top + layer.y + (centered ? layer.height / 2 : 0),
      });
      object.set("data", {
        ...metadata,
        role: "layer",
        layerId: layer.id,
        ...(layer.type === "image" ? { assetId: layer.assetId } : {}),
      });
      object.clipPath = new Rect({
        originX: "left",
        originY: "top",
        left,
        top,
        width: frame.width,
        height: frame.height,
        strokeWidth: 0,
        absolutePositioned: true,
      });
      staged.push(object);
    }
    top += frame.height + 140;
  }
  // Commit only after every font/image/layout succeeds; older canvas work is untouched.
  const objects = releaseGeneratedImages(staged);
  const firstFrame = objects.find(
    (object) => readObjectData(object)?.role === "artboard",
  );
  canvas.add(...objects);
  if (firstFrame) canvas.setActiveObject(firstFrame);
  canvas.requestRenderAll();
  return { objects, frame: firstFrame };
}

// Complete PNG creatives are their own artboards; a fixed clip would hide them when dragged.
export function releaseGeneratedImages(objects: FabricObject[]) {
  const removed = new Set<FabricObject>();
  for (const frame of objects) {
    const metadata = frame.get("data");
    if (
      !(frame instanceof Rect) ||
      metadata?.kind !== "campaign" ||
      metadata.role !== "artboard"
    )
      continue;
    const layers = objects.filter(
      (object) =>
        object.get("data")?.directionId === metadata.directionId &&
        object.get("data")?.role === "layer",
    );
    const image = layers[0];
    if (
      layers.length !== 1 ||
      !(image instanceof FabricImage) ||
      image.get("data")?.layerId !== "creative-image"
    )
      continue;
    image.set({ clipPath: undefined });
    image.set("data", {
      ...image.get("data"),
      role: "artboard",
      exportWidth: frame.width,
      exportHeight: frame.height,
      exportBackground: frame.fill,
    });
    image.setCoords();
    removed.add(frame);
  }
  return objects.filter((object) => !removed.has(object));
}

async function createLayer(
  layer: CampaignLayer,
  imageUrl: (id: string) => Promise<string>,
): Promise<FabricObject> {
  const common = {
    originX: "left" as const,
    originY: "top" as const,
    left: layer.x,
    top: layer.y,
    width: layer.width,
    height: layer.height,
    strokeWidth: 0,
  };
  if (layer.type === "text") {
    await loadCanvasFont(layer.fontFamily, layer.fontWeight);
    const object = new Textbox(layer.text, {
      ...common,
      fontFamily: layer.fontFamily,
      fontWeight: layer.fontWeight,
      fontSize: layer.fontSize,
      lineHeight: layer.lineHeight,
      textAlign: layer.align,
      fill: layer.fill,
      splitByGrapheme: false,
    });
    fitCampaignText(object, layer);
    return object;
  }
  if (layer.type === "rect")
    return new Rect({
      ...common,
      fill: layer.fill,
      rx: layer.radius,
      ry: layer.radius,
    });
  if (layer.type === "ellipse")
    return new Ellipse({
      ...common,
      rx: layer.width / 2,
      ry: layer.height / 2,
      fill: layer.fill,
    });
  if (layer.type === "path") {
    const object = new Path(layer.d, {
      originX: "left",
      originY: "top",
      fill: layer.fill,
      strokeWidth: 0,
    });
    if (!object.width || !object.height)
      throw new Error("Campaign path has no visible geometry");
    object.set({
      scaleX: layer.width / object.width,
      scaleY: layer.height / object.height,
    });
    return object;
  }
  if (layer.type !== "image") throw new Error("Unsupported campaign layer");
  const image = await FabricImage.fromURL(await imageUrl(layer.assetId));
  if (layer.fit === "contain") {
    const scale = Math.min(
      layer.width / image.width,
      layer.height / image.height,
    );
    image.scale(scale);
    // Keep contain images centered inside their intended box.
    image.set({ originX: "center", originY: "center" });
  } else {
    const scale = Math.max(
      layer.width / image.width,
      layer.height / image.height,
    );
    image.set({
      originX: "left",
      originY: "top",
      cropX: (image.width - layer.width / scale) / 2,
      cropY: (image.height - layer.height / scale) / 2,
      width: layer.width / scale,
      height: layer.height / scale,
      scaleX: scale,
      scaleY: scale,
    });
  }
  return image;
}

export function selectedCampaignFrame(canvas: Canvas) {
  const id = readObjectData(
    canvas.getActiveObject() ?? { get: () => null },
  )?.directionId;
  return canvas.getObjects().find((object) => {
    const data = readObjectData(object);
    return (
      data?.directionId === id &&
      data?.role === "artboard" &&
      object.get("data")?.kind === "campaign"
    );
  });
}

export async function exportCampaignFrame(canvas: Canvas) {
  const frame = selectedCampaignFrame(canvas);
  if (!frame)
    throw new Error(
      "Select a campaign creative or one of its layers to export.",
    );
  const data = readObjectData(frame)!;
  const preview = await renderCanvasDirection(canvas, data.directionId);
  return {
    url: preview.src,
    filename: `${preview.name.replace(/[^a-z0-9]+/gi, "-")}.png`,
  };
}

export async function renderCanvasDirection(
  canvas: Canvas,
  directionId: string,
  multiplier = 1,
) {
  const frame = canvas.getObjects().find((object) => {
    const data = readObjectData(object);
    return data?.directionId === directionId && data.role === "artboard";
  });
  if (!frame) throw new Error("Creative is no longer on the canvas.");

  const data = readObjectData(frame)!;
  const metadata = frame.get("data");
  const width = Math.round(metadata.exportWidth ?? frame.width);
  const height = Math.round(metadata.exportHeight ?? frame.height);
  const output = new StaticCanvas(undefined, {
    width,
    height,
    backgroundColor: String(metadata.exportBackground ?? frame.fill),
  });
  try {
    const objects = canvas
      .getObjects()
      .filter(
        (object) => readObjectData(object)?.directionId === directionId,
      );
    for (const object of objects) {
      const clone = await object.clone(["data"]);
      if (frame instanceof FabricImage) {
        clone.set({
          originX: "left",
          originY: "top",
          left: 0,
          top: 0,
          scaleX: width / frame.width,
          scaleY: height / frame.height,
          angle: 0,
          skewX: 0,
          skewY: 0,
        });
      } else {
        clone.set({
          left: object.left - frame.left,
          top: object.top - frame.top,
          selectable: false,
          evented: false,
        });
        if (clone.clipPath?.absolutePositioned)
          clone.clipPath.set({
            left: clone.clipPath.left - frame.left,
            top: clone.clipPath.top - frame.top,
          });
      }
      clone.setCoords();
      output.add(clone);
    }
    return {
      directionId,
      name: data.name,
      width,
      height,
      src: output.toDataURL({ format: "png", multiplier }),
    };
  } finally {
    await output.dispose();
  }
}
