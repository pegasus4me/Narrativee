import assert from "node:assert/strict";
import test from "node:test";
import type { Canvas } from "fabric";
import { createCanvasPersistence } from "../app/components/studio/canvas/canvasPersistence";
import { streamStudioCreatorMessage } from "../lib/api/studio";

function fixture() {
  let label = "First edit";
  const canvas = {
    viewportTransform: [1, 0, 0, 1, 0, 0],
    toObject: () => ({ objects: [{ type: "Textbox", text: label }] }),
  } as unknown as Canvas;
  const statuses: string[] = [];
  const persistence = createCanvasPersistence(
    canvas,
    "project",
    () => [],
    (status) => statuses.push(status),
  );
  return {
    persistence,
    statuses,
    edit: (value: string) => {
      label = value;
    },
  };
}

test("autosave drains the latest captured edit when the canvas closes during a save", async (t) => {
  const writes: Array<{
    revision: number;
    snapshot: { canvas: { objects: Array<{ text: string }> } };
  }> = [];
  let releaseFirst!: () => void;
  const firstWrite = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });
  t.mock.method(
    globalThis,
    "fetch",
    async (_url: unknown, init?: RequestInit) => {
      if (init?.method !== "PUT")
        return Response.json({ revision: 0, snapshot: null });
      const body = JSON.parse(String(init.body));
      writes.push(body);
      if (writes.length === 1) await firstWrite;
      return Response.json({ revision: writes.length });
    },
  );
  const { persistence, edit } = fixture();
  await persistence.restore();
  const saving = persistence.flush();
  edit("Last edit before closing");
  persistence.schedule();
  persistence.dispose();
  releaseFirst();
  await saving;
  assert.equal(writes.length, 2);
  assert.equal(writes[1]!.revision, 1);
  assert.equal(
    writes[1]!.snapshot.canvas.objects[0]!.text,
    "Last edit before closing",
  );
});

test("a stale revision stops retries without overwriting the current canvas", async (t) => {
  let writes = 0;
  t.mock.method(
    globalThis,
    "fetch",
    async (_url: unknown, init?: RequestInit) => {
      if (init?.method !== "PUT")
        return Response.json({ revision: 3, snapshot: null });
      writes++;
      return Response.json(
        { error: "Canvas changed in another tab" },
        { status: 409 },
      );
    },
  );
  const { persistence, statuses } = fixture();
  await persistence.restore();
  await assert.rejects(persistence.flush(), /changed in another tab/);
  await assert.rejects(persistence.flush(), /changed in another tab/);
  persistence.dispose();
  assert.equal(writes, 1);
  assert.equal(statuses.at(-1), "Not saved");
});

test("private image requests share one fetch and only asset IDs are saved", async (t) => {
  let imageReads = 0;
  let saved: unknown;
  t.mock.method(
    globalThis,
    "fetch",
    async (url: unknown, init?: RequestInit) => {
      if (String(url).includes("/assets/")) {
        imageReads++;
        return new Response(new Blob(["fixture"], { type: "image/png" }));
      }
      if (init?.method === "PUT") {
        saved = JSON.parse(String(init.body));
        return Response.json({ revision: 1 });
      }
      return Response.json({ revision: 0, snapshot: null });
    },
  );
  const canvas = {
    viewportTransform: [1, 0, 0, 1, 0, 0],
    toObject: () => ({
      objects: [
        { type: "Image", src: "blob:temporary", data: { assetId: "image" } },
      ],
    }),
  } as unknown as Canvas;
  const persistence = createCanvasPersistence(
    canvas,
    "project",
    () => ["frame"],
    () => undefined,
  );
  await persistence.restore();
  const urls = await Promise.all([
    persistence.imageUrl("image"),
    persistence.imageUrl("image"),
  ]);
  assert.equal(imageReads, 1);
  assert.equal(urls[0], urls[1]);
  await persistence.flush();
  assert.ok(!JSON.stringify(saved).includes("blob:"));
  assert.ok(JSON.stringify(saved).includes('"assetId":"image"'));
  persistence.dispose();
});

test("Creator does not complete until campaign rendering and the initial save finish", async (t) => {
  const events = [
    { type: "campaign_scene", document: { version: 1, frames: [] } },
    {
      type: "done",
      userMessage: { id: "user" },
      assistantMessage: { id: "assistant" },
    },
  ];
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(events.map((event) => JSON.stringify(event)).join("\n")),
  );
  let ready!: () => void;
  const renderedAndSaved = new Promise<void>((resolve) => {
    ready = resolve;
  });
  let completed = false;
  const result = streamStudioCreatorMessage(
    "project",
    "brief",
    () => undefined,
    () => renderedAndSaved,
  ).then(() => {
    completed = true;
  });
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(completed, false);
  ready();
  await result;
  assert.equal(completed, true);
});
