import assert from "node:assert/strict";
import test from "node:test";
import React, { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getEnv } from "fabric/node";
import { BrandBrainImages } from "../app/workspace/brand-brain/BrandBrainImages";
import type { BrandBrainController } from "../app/workspace/brand-brain/useBrandBrain";

const emptyBrain = {
  data: { items: [], assets: [] },
  busy: false,
} as unknown as BrandBrainController;

test("inspiration shows only images in a masonry grid with one add button", () => {
  const empty = renderToStaticMarkup(
    <BrandBrainImages
      brain={emptyBrain}
      brandId="brand"
      purpose="inspiration"
    />,
  );
  assert.equal((empty.match(/<button/g) ?? []).length, 1);
  assert.match(empty, /Add reference/);
  assert.doesNotMatch(empty, /<form|<select|<textarea|Add image/);
  const brain = {
    ...emptyBrain,
    data: {
      items: [
        { id: "note", kind: "inspiration", content: "Explore warm colors" },
        { id: "rule", kind: "rule", content: "Brand rule" },
      ],
      assets: [
        {
          id: "image",
          kind: "inspiration",
          category: "imagery",
          filename: "reference.png",
          caption: "I like the editorial layout",
          width: 600,
          height: 900,
        },
      ],
    },
  } as unknown as BrandBrainController;
  const saved = renderToStaticMarkup(
    <BrandBrainImages brain={brain} brandId="brand" purpose="inspiration" />,
  );
  assert.match(saved, /columns-2.*columns-3/);
  assert.match(saved, /break-inside-avoid/);
  assert.match(saved, /aspect-ratio:600 \/ 900/);
  assert.doesNotMatch(
    saved,
    /Explore warm colors|I like the editorial layout|Brand rule|<p(?:\s|>)|<form|<select/,
  );
});

test("the add flow saves descriptions and images together, validates files, and keeps failed drafts", async (t) => {
  const document = getEnv().document;
  const window = document.defaultView!;
  const globals = {
    window,
    document,
    HTMLElement: window.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  const previous = new Map(
    Object.keys(globals).map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  for (const [key, value] of Object.entries(globals))
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value,
    });
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  t.mock.method(URL, "createObjectURL", () => canvas.toDataURL());
  t.mock.method(URL, "revokeObjectURL", () => {});
  const calls: unknown[][] = [];
  let succeeds = true;
  const brain = {
    ...emptyBrain,
    addItem: async (...args: unknown[]) => {
      calls.push(args);
      return succeeds;
    },
    addImage: async (...args: unknown[]) => {
      calls.push(args);
      return succeeds;
    },
  } as BrandBrainController;
  const { createRoot } = await import("react-dom/client");
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  async function describe(value: string) {
    const textarea = container.querySelector("textarea")!;
    Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    )!.set!.call(textarea, value);
    await act(async () =>
      textarea.dispatchEvent(new window.Event("input", { bubbles: true })),
    );
  }
  async function submit() {
    await act(async () =>
      container
        .querySelector("form")!
        .dispatchEvent(
          new window.Event("submit", { bubbles: true, cancelable: true }),
        ),
    );
  }
  async function choose(file: File) {
    const input = container.querySelector('input[type="file"]')!;
    Object.defineProperty(input, "files", {
      configurable: true,
      value: [file],
    });
    await act(async () =>
      input.dispatchEvent(new window.Event("change", { bubbles: true })),
    );
  }
  try {
    await act(async () =>
      root.render(
        <BrandBrainImages
          brain={brain}
          brandId="brand"
          purpose="inspiration"
        />,
      ),
    );
    await act(async () =>
      (container.querySelector("button") as HTMLButtonElement).click(),
    );
    assert.ok(container.querySelector("textarea"));
    assert.equal(container.querySelector("select"), null);
    await describe("   ");
    await submit();
    assert.equal(calls.length, 0);
    await describe("  Warm color palette  ");
    await submit();
    assert.equal(calls.length, 0);
    assert.ok(container.querySelector("form"));
    await describe("Keep the generous spacing");
    await choose(new File(["bad"], "bad.gif", { type: "image/gif" }));
    await submit();
    assert.equal(calls.length, 0);
    assert.match(
      container.querySelector('[role="alert"]')!.textContent!,
      /PNG, JPEG, or WebP/,
    );
    const image = new File(["photo"], "reference.png", { type: "image/png" });
    await choose(image);
    succeeds = false;
    await submit();
    assert.equal(
      container.querySelector("textarea")!.value,
      "Keep the generous spacing",
    );
    assert.deepEqual(calls[0], [
      image,
      "inspiration",
      "imagery",
      "Keep the generous spacing",
    ]);
    succeeds = true;
    await submit();
    assert.equal(container.querySelector("form"), null);
  } finally {
    await act(async () => root.unmount());
    container.remove();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
