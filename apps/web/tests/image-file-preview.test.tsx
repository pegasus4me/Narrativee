import assert from "node:assert/strict";
import test from "node:test";
import React, { act, useState } from "react";
import { getEnv } from "fabric/node";
import { ProductPhotoPicker } from "../app/workspace/brand-brain/ProductPhotoPicker";

test("uploaded and pasted photos preview immediately and release URLs when removed", async (t) => {
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
  const created: string[] = [];
  const revoked: string[] = [];
  t.mock.method(URL, "createObjectURL", () => {
    // Fabric's test DOM loads data images but cannot resolve browser blob URLs.
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d")!;
    context.fillStyle = `rgb(${created.length}, 0, 0)`;
    context.fillRect(0, 0, 1, 1);
    const url = canvas.toDataURL();
    created.push(url);
    return url;
  });
  t.mock.method(URL, "revokeObjectURL", (url: string) => revoked.push(url));
  const { createRoot } = await import("react-dom/client");
  function Harness() {
    const [files, setFiles] = useState<File[]>([]);
    return (
      <ProductPhotoPicker files={files} onChange={setFiles} disabled={false} />
    );
  }
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<Harness />));
    const input = container.querySelector("input")!;
    const uploaded = new File(["photo"], "upload.png", { type: "image/png" });
    Object.defineProperty(input, "files", {
      configurable: true,
      value: [uploaded],
    });
    await act(async () => {
      input.dispatchEvent(new window.Event("change", { bubbles: true }));
    });
    assert.equal(
      container
        .querySelector('img[alt="Preview of upload.png"]')
        ?.getAttribute("src"),
      created[0],
    );
    const pasted = new File(["photo"], "pasted.png", { type: "image/png" });
    const paste = new window.Event("paste", {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(paste, "clipboardData", {
      value: { files: [pasted] },
    });
    await act(async () => {
      container
        .querySelector('[aria-label="Product photos"]')!
        .dispatchEvent(paste);
    });
    assert.equal(container.querySelectorAll("img").length, 2);
    assert.equal(
      container
        .querySelector('img[alt="Preview of pasted.png"]')
        ?.getAttribute("src"),
      created[1],
    );
    await act(async () => {
      (
        container.querySelector(
          '[aria-label="Remove pending photo pasted.png"]',
        ) as HTMLButtonElement
      ).click();
    });
    assert.equal(container.querySelectorAll("img").length, 1);
    assert.ok(revoked.includes(created[1]!));
  } finally {
    await act(async () => root.unmount());
    assert.deepEqual([...revoked].sort(), [...created].sort());
    container.remove();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
