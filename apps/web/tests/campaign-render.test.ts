import assert from "node:assert/strict";
import test from "node:test";
import * as fabric from "fabric";
import { getEnv } from "fabric/node";
import type { CampaignDocument } from "../lib/api/studio-canvas";
import {
  appendCampaign,
  exportCampaignFrame,
  releaseGeneratedImages,
} from "../app/components/studio/canvas/campaignScene";
import { loadCanvasFont } from "../app/components/studio/canvas/canvasFonts";
import { appendUploadedImage } from "../app/components/studio/canvas/canvasUpload";
import { allBoardsBounds } from "../app/components/studio/canvas/logoScene";
import { createCanvasPersistence } from "../app/components/studio/canvas/canvasPersistence";

// Reuse Fabric's installed Node renderer rather than adding a testing framework.
const environment = getEnv();
fabric.setEnv(environment);
Object.defineProperty(globalThis, "document", {
  configurable: true,
  value: environment.document,
});
Object.defineProperty(environment.document, "fonts", {
  value: { load: async () => [{}] },
});

function documentFixture(width: number, height: number): CampaignDocument {
  return {
    version: 1,
    frames: [
      {
        id: `frame-${width}-${height}`,
        formatId: "fixture",
        width,
        height,
        name: "Renderer fixture",
        concept: "Separate editable layers with a preserved image",
        background: "#FFFFFF",
        layers: [
          {
            id: "graphic",
            type: "rect",
            x: 20,
            y: 20,
            width: 100,
            height: 100,
            fill: "#034638",
            radius: 0,
          },
          {
            id: "headline",
            type: "text",
            x: 20,
            y: 150,
            width: width - 40,
            height: 120,
            text: "A fresh start.",
            fontFamily: "Arial",
            fontWeight: 400,
            fontSize: 24,
            lineHeight: 1.1,
            align: "left",
            fill: "#18181B",
          },
          {
            id: "photo",
            type: "image",
            x: 160,
            y: 20,
            width: 100,
            height: 100,
            assetId: "fixture-image",
            fit: "contain",
          },
          {
            id: "circle",
            type: "ellipse",
            x: 280,
            y: 20,
            width: 80,
            height: 80,
            fill: "#034638",
            radius: 0,
          },
          {
            id: "vector",
            type: "path",
            x: 20,
            y: 300,
            width: 100,
            height: 80,
            d: "M 0 0 L 100 0 L 50 80 Z",
            fill: "#034638",
          },
          {
            id: "cropped-photo",
            type: "image",
            x: 160,
            y: 300,
            width: 100,
            height: 100,
            assetId: "fixture-image",
            fit: "cover",
          },
        ],
      },
    ],
  };
}

test("composer and exporter preserve existing work, editable layers, colors and recorded frame sizes", async (t) => {
  // Network font loading is separate; these geometry fixtures use system Arial.
  t.mock.method(
    environment.document.head,
    "appendChild",
    (link: HTMLLinkElement) => {
      queueMicrotask(() => link.onload?.(new environment.window.Event("load")));
      return link;
    },
  );
  const imageCanvas = new fabric.StaticCanvas(undefined, {
    width: 100,
    height: 50,
    backgroundColor: "#E31A82",
  });
  const imageUrl = imageCanvas.toDataURL({ format: "png", multiplier: 1 });
  const canvas = new fabric.Canvas(undefined, { width: 800, height: 600 });
  const previous = new fabric.Rect({
    left: 10,
    top: 10,
    width: 50,
    height: 50,
    fill: "#000000",
  });
  canvas.add(previous);
  try {
    for (const [width, height] of [
      [1080, 1080],
      [400, 700],
      [1080, 1920],
      [1200, 628],
      [1000, 1500],
    ]) {
      const result = await appendCampaign(
        canvas,
        documentFixture(width!, height!),
        async () => imageUrl,
      );
      assert.ok(canvas.getObjects().includes(previous));
      assert.equal(result.objects.length, 7);
      assert.ok(result.objects[2] instanceof fabric.Textbox);
      assert.ok(result.objects[3] instanceof fabric.FabricImage);
      const png = await exportCampaignFrame(canvas);
      const bytes = Buffer.from(png.url.split(",")[1]!, "base64");
      assert.equal(bytes.readUInt32BE(16), width);
      assert.equal(bytes.readUInt32BE(20), height);
      const exported = await fabric.FabricImage.fromURL(png.url);
      exported.set({ originX: "left", originY: "top" });
      const check = new fabric.StaticCanvas(undefined, { width, height });
      check.add(exported);
      check.renderAll();
      assert.deepEqual(
        [...check.getContext().getImageData(30, 30, 1, 1).data],
        [3, 70, 56, 255],
      );
      assert.deepEqual(
        [...check.getContext().getImageData(170, 60, 1, 1).data],
        [227, 26, 130, 255],
      );
      assert.deepEqual(
        [...check.getContext().getImageData(170, 25, 1, 1).data],
        [255, 255, 255, 255],
      );
      assert.deepEqual(
        [...check.getContext().getImageData(170, 310, 1, 1).data],
        [227, 26, 130, 255],
      );
      await check.dispose();
    }
    const count = canvas.getObjects().length;
    const set: CampaignDocument = {
      version: 1,
      frames: [
        documentFixture(1080, 1350).frames[0]!,
        documentFixture(1200, 628).frames[0]!,
        documentFixture(900, 1600).frames[0]!,
      ],
    };
    const batch = await appendCampaign(canvas, set, async () => imageUrl);
    assert.equal(batch.objects.length, 21);
    assert.ok(canvas.getObjects().includes(previous));
    for (const frame of set.frames) {
      const board = batch.objects.find(
        (object) =>
          object.get("data")?.directionId === frame.id &&
          object.get("data")?.role === "artboard",
      )!;
      canvas.setActiveObject(board);
      const png = await exportCampaignFrame(canvas);
      const bytes = Buffer.from(png.url.split(",")[1]!, "base64");
      assert.equal(bytes.readUInt32BE(16), frame.width);
      assert.equal(bytes.readUInt32BE(20), frame.height);
    }
    const overflowing = documentFixture(400, 700);
    overflowing.frames[0]!.layers[1]!.height = 1;
    await assert.rejects(
      appendCampaign(canvas, overflowing, async () => imageUrl),
      /could not fit.*readable size/,
    );
    assert.equal(
      canvas.getObjects().length,
      count + batch.objects.length,
      "Failed rendering must not alter existing work",
    );
  } finally {
    await canvas.dispose();
    await imageCanvas.dispose();
  }
});

test("campaign text automatically fits the real font and stays editable through save/reopen and PNG export", async (t) => {
  t.mock.method(
    environment.document.head,
    "appendChild",
    (link: HTMLLinkElement) => {
      queueMicrotask(() => link.onload?.(new environment.window.Event("load")));
      return link;
    },
  );
  const canvas = new fabric.Canvas(undefined, { width: 800, height: 600 });
  const reopened = new fabric.Canvas(undefined, { width: 800, height: 600 });
  try {
    for (const [text, width, height, fontSize] of [
      ["SODA, WITH MORE TO LOVE.", 700, 80, 128],
      ["NARRATIVEE", 200, 120, 96],
      ["SODA,\nWITH MORE TO LOVE.", 700, 70, 64],
      ["A fresh start.", 700, 120, 24],
    ] as const) {
      const document = documentFixture(1080, 1080);
      const layer = document.frames[0]!.layers[1]!;
      assert.equal(layer.type, "text");
      if (layer.type !== "text") throw new Error("Expected text layer");
      Object.assign(layer, { text, width, height, fontSize });
      document.frames[0]!.layers = [layer];
      const original = structuredClone(document);
      const initial = new fabric.Textbox(text, {
        width,
        fontSize,
        fontFamily: "Arial",
        lineHeight: layer.lineHeight,
      });
      if (fontSize !== 24)
        assert.ok(
          initial.height > height || initial.width > width,
          "Fixture reproduces overflow before fitting",
        );
      const result = await appendCampaign(canvas, document, async () => {
        throw new Error("Text fitting needs no image call");
      });
      const fitted = result.objects[1]!;
      assert.ok(fitted instanceof fabric.Textbox);
      assert.equal(fitted.text, text);
      assert.equal(fitted.fontFamily, layer.fontFamily);
      assert.equal(fitted.fill, layer.fill);
      assert.equal(fitted.lineHeight, layer.lineHeight);
      assert.equal(fitted.scaleX, 1);
      assert.equal(fitted.scaleY, 1);
      assert.ok(fitted.width <= width && fitted.height <= height);
      if (fontSize !== 24)
        assert.ok(fitted.fontSize >= 24 && fitted.fontSize < fontSize);
      else
        assert.equal(
          fitted.fontSize,
          fontSize,
          "Already valid text is unchanged",
        );
      assert.deepEqual(
        document,
        original,
        "Render fitting does not rewrite generated copy or the input document",
      );
      await reopened.loadFromJSON(canvas.toJSON());
      const restored = reopened.getObjects().at(-1)!;
      assert.ok(restored instanceof fabric.Textbox);
      assert.equal(restored.text, text);
      assert.equal(restored.fontSize, fitted.fontSize);
      assert.ok(restored.width <= width && restored.height <= height);
      const png = await exportCampaignFrame(canvas);
      const bytes = Buffer.from(png.url.split(",")[1]!, "base64");
      assert.equal(bytes.readUInt32BE(16), 1080);
      assert.equal(bytes.readUInt32BE(20), 1080);
    }
  } finally {
    await canvas.dispose();
    await reopened.dispose();
  }
});

test("unavailable fonts fail explicitly and can be retried without a stale cache", async (t) => {
  let fail = true;
  t.mock.method(
    environment.document.head,
    "appendChild",
    (link: HTMLLinkElement) => {
      queueMicrotask(() => {
        const event = new environment.window.Event("load");
        if (fail) link.onerror?.(event);
        else link.onload?.(event);
      });
      return link;
    },
  );
  await assert.rejects(
    loadCanvasFont("Unavailable fixture font"),
    /could not be loaded/,
  );
  fail = false;
  await loadCanvasFont("Unavailable fixture font");
});

test("uploaded images append as editable project references, survive reopening and preserve prior work", async () => {
  const canvas = new fabric.Canvas(undefined, { width: 800, height: 600 });
  const reopened = new fabric.Canvas(undefined, { width: 800, height: 600 });
  const source = new fabric.StaticCanvas(undefined, {
    width: 1000,
    height: 500,
    backgroundColor: "#034638",
  });
  const previous = new fabric.Rect({ width: 100, height: 100 });
  canvas.add(previous);
  try {
    const bounds = await appendUploadedImage(
      canvas,
      { id: "project-image", name: "product.png", width: 1000, height: 500 },
      async (id) => {
        assert.equal(id, "project-image");
        return source.toDataURL({ format: "png", multiplier: 1 });
      },
    );
    const image = canvas.getActiveObject()!;
    assert.ok(image instanceof fabric.FabricImage);
    assert.ok(canvas.getObjects().includes(previous));
    assert.equal(bounds.width, 600);
    assert.equal(bounds.height, 300);
    assert.equal(image.get("data").assetId, "project-image");
    assert.equal(image.get("data").kind, "upload");
    assert.ok(
      allBoardsBounds(canvas),
      "Fit all includes uploaded images even before a campaign exists",
    );
    image.set({ left: 220, scaleX: 0.4, scaleY: 0.4 });
    await reopened.loadFromJSON(canvas.toObject(["data"]));
    const restored = reopened.getObjects().at(-1)!;
    assert.ok(restored instanceof fabric.FabricImage);
    assert.equal(restored.left, 220);
    assert.equal(restored.scaleX, 0.4);
    assert.equal(restored.get("data").name, "product.png");
    const count = canvas.getObjects().length;
    await assert.rejects(
      appendUploadedImage(
        canvas,
        { id: "missing", name: "missing.png", width: 100, height: 100 },
        async () => {
          throw new Error("Private image unavailable");
        },
      ),
      /Private image unavailable/,
    );
    assert.equal(canvas.getObjects().length, count);
  } finally {
    await canvas.dispose();
    await reopened.dispose();
    await source.dispose();
  }
});

test("a complete generated creative moves beyond its original frame and preserves export size after reopening", async () => {
  const canvas = new fabric.Canvas(undefined, { width: 800, height: 600 });
  const reopened = new fabric.Canvas(undefined, { width: 800, height: 600 });
  const source = new fabric.StaticCanvas(undefined, {
    width: 240,
    height: 300,
    backgroundColor: "#123456",
  });
  const url = source.toDataURL({ format: "png", multiplier: 1 });
  const document: CampaignDocument = {
    version: 1,
    frames: [
      {
        id: "generated-creative",
        formatId: "portrait_1080",
        width: 240,
        height: 300,
        name: "Complete creative",
        concept: "The entire design is generated as an image",
        background: "#FFFFFF",
        layers: [
          {
            id: "creative-image",
            type: "image",
            assetId: "generated-image",
            fit: "contain",
            x: 0,
            y: 0,
            width: 240,
            height: 300,
          },
        ],
      },
    ],
  };
  try {
    const previous = new fabric.Rect({
      left: 5,
      top: 5,
      width: 20,
      height: 20,
    });
    canvas.add(previous);
    await appendCampaign(canvas, document, async (id) => {
      assert.equal(id, "generated-image");
      return url;
    });
    const layers = canvas
      .getObjects()
      .filter((object) => object.get("data")?.kind === "campaign");
    assert.equal(layers.length, 1);
    assert.ok(layers[0] instanceof fabric.FabricImage);
    assert.equal(layers[0]!.get("data").assetId, "generated-image");
    assert.equal(layers[0]!.get("data").role, "artboard");
    assert.equal(canvas.getActiveObject(), layers[0]);
    assert.equal(layers[0]!.clipPath, undefined);
    assert.equal(layers[0]!.lockMovementX, false);
    assert.equal(layers[0]!.lockMovementY, false);
    layers[0]!.set({ left: 600, top: 350, scaleX: 0.5, scaleY: 0.5 });
    layers[0]!.setCoords();
    canvas.renderAll();
    assert.deepEqual(
      [...canvas.getContext().getImageData(550, 300, 1, 1).data],
      [18, 52, 86, 255],
      "The creative remains visible outside its original frame",
    );
    assert.ok(allBoardsBounds(canvas)!.x >= 490);
    assert.ok(canvas.getObjects().includes(previous));
    const exported = await exportCampaignFrame(canvas);
    const outputImage = await fabric.FabricImage.fromURL(exported.url);
    assert.equal(outputImage.width, 240);
    assert.equal(outputImage.height, 300);
    await reopened.loadFromJSON(canvas.toObject(["data"]));
    const restored = reopened
      .getObjects()
      .filter((object) => object.get("data")?.kind === "campaign");
    assert.equal(restored.length, 1);
    assert.ok(restored[0] instanceof fabric.FabricImage);
    assert.equal(restored[0]!.get("data").assetId, "generated-image");
    assert.equal(restored[0]!.left, 600);
    assert.equal(restored[0]!.scaleX, 0.5);
    assert.equal(restored[0]!.clipPath, undefined);
    reopened.setActiveObject(restored[0]!);
    const reopenedExport = await exportCampaignFrame(reopened);
    const check = new fabric.StaticCanvas(undefined, {
      width: 240,
      height: 300,
    });
    try {
      const exportedImage = await fabric.FabricImage.fromURL(
        reopenedExport.url,
      );
      assert.equal(exportedImage.width, 240);
      assert.equal(exportedImage.height, 300);
      exportedImage.set({ originX: "left", originY: "top", left: 0, top: 0 });
      check.add(exportedImage);
      check.renderAll();
      assert.deepEqual(
        [...check.getContext().getImageData(120, 150, 1, 1).data],
        [18, 52, 86, 255],
      );
    } finally {
      await check.dispose();
    }
  } finally {
    await canvas.dispose();
    await reopened.dispose();
    await source.dispose();
  }
});

test("saved generated images lose their fixed frame without changing layered campaigns", async (t) => {
  const canvas = new fabric.Canvas(undefined, { width: 800, height: 600 });
  const source = new fabric.StaticCanvas(undefined, {
    width: 240,
    height: 300,
  });
  try {
    const frame = new fabric.Rect({
      left: 100,
      top: 100,
      width: 240,
      height: 300,
    });
    const data = {
      kind: "campaign",
      directionId: "saved-creative",
      runId: "saved-creative",
      name: "Saved creative",
      row: 0,
    };
    frame.set("data", { ...data, role: "artboard" });
    const image = await fabric.FabricImage.fromURL(
      source.toDataURL({ format: "png", multiplier: 1 }),
    );
    image.set({ left: 600, top: 350, scaleX: 0.5, scaleY: 0.5 });
    image.set("data", {
      ...data,
      role: "layer",
      layerId: "creative-image",
      assetId: "saved-image",
    });
    image.clipPath = new fabric.Rect({
      left: 100,
      top: 100,
      width: 240,
      height: 300,
      absolutePositioned: true,
    });
    const layeredFrame = new fabric.Rect({ width: 100, height: 100 });
    layeredFrame.set("data", {
      ...data,
      directionId: "layered",
      role: "artboard",
    });
    canvas.add(frame, image, layeredFrame);
    const snapshot = {
      version: 1,
      canvas: canvas.toObject(["data"]),
      viewport: [1, 0, 0, 1, 0, 0],
      favorites: ["saved-creative"],
    };
    t.mock.method(globalThis, "fetch", async (url: unknown) =>
      String(url).includes("/assets/")
        ? new Response(new Blob(["fixture"], { type: "image/png" }))
        : Response.json({ revision: 1, snapshot }),
    );
    t.mock.method(URL, "createObjectURL", () =>
      source.toDataURL({ format: "png", multiplier: 1 }),
    );
    const persistence = createCanvasPersistence(
      canvas,
      "project",
      () => snapshot.favorites,
      () => undefined,
    );
    const result = await persistence.restore();
    assert.equal(result.imported, true, "Migrated images must be saved again");
    assert.deepEqual(result.favorites, ["saved-creative"]);
    const released = canvas.getObjects();
    assert.equal(released.length, 2);
    const restored = released[0]!;
    assert.ok(restored instanceof fabric.FabricImage);
    assert.equal(restored.clipPath, undefined);
    assert.equal(restored.left, 600);
    assert.equal(restored.scaleX, 0.5);
    assert.equal(restored.get("data").exportWidth, 240);
    assert.equal(restored.get("data").exportHeight, 300);
    assert.equal(released[1]!.get("data").directionId, "layered");
    assert.deepEqual(releaseGeneratedImages(released), released);
    persistence.dispose();
  } finally {
    await canvas.dispose();
    await source.dispose();
  }
});
