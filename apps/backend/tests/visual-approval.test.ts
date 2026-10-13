import assert from "node:assert/strict";
import test from "node:test";
import {
  approvalCanvasHash,
  isApprovalCanvasCurrent,
} from "../src/studio/visual-approval";
import type { CanvasSnapshot } from "../src/studio/canvas/canvas.schema";

const snapshot: CanvasSnapshot = {
  version: 1,
  canvas: {
    version: "6.0",
    background: "transparent",
    objects: [
      { type: "Textbox", text: "Approved headline", left: 10, fill: "#FFFFFF" },
      { type: "Image", data: { assetId: "original", kind: "upload" } },
    ],
  },
  viewport: [1, 0, 0, 1, 0, 0],
  favorites: [],
};

test("zoom, pan, favorites and identical autosaves preserve canvas approval", () => {
  const approved = {
    canvasRevision: 7,
    canvasHash: approvalCanvasHash(snapshot),
  };
  const viewed = structuredClone(snapshot);
  viewed.viewport = [2, 0, 0, 2, 200, -300];
  viewed.favorites = ["campaign-frame"];
  viewed.canvas.version = "6.1";
  assert.ok(
    isApprovalCanvasCurrent(approved, { revision: 12, snapshot: viewed }),
  );
  const reorderedKeys = JSON.parse(
    JSON.stringify(viewed, (_key, value) =>
      value && typeof value === "object" && !Array.isArray(value)
        ? Object.fromEntries(Object.entries(value).reverse())
        : value,
    ),
  );
  assert.equal(approvalCanvasHash(reorderedKeys), approved.canvasHash);
  assert.equal(
    approvalCanvasHash(null),
    approvalCanvasHash({
      version: 1,
      canvas: { version: "6.0", objects: [] },
      viewport: viewed.viewport,
      favorites: [],
    }),
  );
});

test("artwork and reference edits still invalidate approval", () => {
  const approved = {
    canvasRevision: 7,
    canvasHash: approvalCanvasHash(snapshot),
  };
  const changes: Array<(value: CanvasSnapshot) => void> = [
    (value) => {
      (value.canvas.objects as Array<Record<string, unknown>>)[0]!.text =
        "Changed headline";
    },
    (value) => {
      (value.canvas.objects as Array<Record<string, unknown>>)[0]!.left = 20;
    },
    (value) => {
      (value.canvas.objects as Array<Record<string, unknown>>)[0]!.fill =
        "#000000";
    },
    (value) => {
      (value.canvas.objects as Array<Record<string, unknown>>)[1]!.data = {
        assetId: "replacement",
        kind: "upload",
      };
    },
    (value) => {
      (value.canvas.objects as unknown[]).reverse();
    },
    (value) => {
      (value.canvas.objects as unknown[]).pop();
    },
    (value) => {
      (value.canvas.objects as unknown[]).push({ type: "Rect" });
    },
    (value) => {
      value.canvas.background = "#000000";
    },
  ];
  for (const change of changes) {
    const edited = structuredClone(snapshot);
    change(edited);
    assert.equal(
      isApprovalCanvasCurrent(approved, { revision: 8, snapshot: edited }),
      false,
    );
  }
});

test("legacy proposals retain the strict revision check", () => {
  const approved = { canvasRevision: 7 };
  assert.ok(isApprovalCanvasCurrent(approved, { revision: 7, snapshot }));
  assert.equal(
    isApprovalCanvasCurrent(approved, { revision: 8, snapshot }),
    false,
  );
});
