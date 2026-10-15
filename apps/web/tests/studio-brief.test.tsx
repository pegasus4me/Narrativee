import assert from "node:assert/strict";
import test from "node:test";
import React, { act, useState } from "react";
import { getEnv } from "fabric/node";
test("the single brief sends selected products and retouches without an agent selector", async (t) => {
  const environment = getEnv();
  const window = environment.document.defaultView!;
  const globals = {
    window,
    document: environment.document,
    HTMLElement: window.HTMLElement,
    Element: window.Element,
    SVGElement: window.SVGElement,
    Node: window.Node,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    IS_REACT_ACT_ENVIRONMENT: true,
    requestAnimationFrame: (callback: FrameRequestCallback) =>
      setTimeout(() => callback(performance.now()), 0),
    cancelAnimationFrame: clearTimeout,
    ResizeObserver: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
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
  window.matchMedia = () => ({
    matches: false,
    media: "",
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  });
  const imageFixture = environment.document.createElement("canvas");
  imageFixture.width = imageFixture.height = 1;
  const imageUrl = imageFixture.toDataURL();
  const srcSetter = Object.getOwnPropertyDescriptor(
    window.HTMLImageElement.prototype,
    "src",
  )!.set!;
  t.mock.setter(
    window.HTMLImageElement.prototype,
    "src",
    function (this: HTMLImageElement) {
      srcSetter.call(this, imageUrl);
    },
  );
  const setAttribute = window.Element.prototype.setAttribute;
  t.mock.method(
    window.Element.prototype,
    "setAttribute",
    function (this: Element, name: string, value: string) {
      return setAttribute.call(
        this,
        name,
        name === "src" && this.tagName === "IMG" ? imageUrl : value,
      );
    },
  );
  const productId = "00000000-0000-4000-8000-000000000001";
  const photoId = "00000000-0000-4000-8000-000000000002";
  t.mock.method(globalThis, "fetch", async (input: unknown) =>
    Response.json(
      String(input).includes("generation-cost")
        ? { maxCredits: 50 }
        : {
            items: [],
            products: [
              { id: productId, name: "Soie", description: "A perfume" },
            ],
            assets: [
              {
                id: photoId,
                productId,
                caption: "Bottle",
                filename: "bottle.png",
              },
            ],
          },
    ),
  );
  const { createRoot } = await import("react-dom/client");
  const { StudioCanvasPrompt } = await import(
    "../app/components/studio/StudioCanvasPrompt"
  );
  const { STUDIO_SELECTION_EVENT } = await import("../lib/studio-brief");
  const submitted: {
    content: string;
    generation: import("../lib/api/studio").CampaignGeneration;
  }[] = [];
  function Harness() {
    const [draft, setDraft] = useState(
      "On white sheets, morning light, no text",
    );
    return (
      <StudioCanvasPrompt
        projectId="project"
        brandId="brand"
        draft={draft}
        onDraftChange={setDraft}
        onSubmit={async (content, _outputs, generation) => {
          submitted.push({ content, generation });
        }}
        disabled={false}
        pending={false}
        error={null}
        onUploadChange={() => {}}
      />
    );
  }
  const container = environment.document.createElement("div");
  const materialsTarget = environment.document.createElement("div");
  materialsTarget.id = "studio-materials-project";
  environment.document.body.appendChild(materialsTarget);
  environment.document.body.appendChild(container);
  const root = createRoot(container);
  const send = () =>
    act(async () => {
      container
        .querySelector("form")!
        .dispatchEvent(
          new window.Event("submit", { bubbles: true, cancelable: true }),
        );
    });
  try {
    await act(async () => root.render(<Harness />));
    assert.equal(
      container
        .querySelector('[aria-label="Generate"]')
        ?.hasAttribute("disabled"),
      false,
    );
    assert.equal(container.querySelector('[aria-label="Choose model"]'), null);
    assert.equal(container.querySelector('[role="tablist"]'), null);
    assert.equal(container.querySelector('[role="toolbar"]'), null);
    assert.ok(
      materialsTarget.querySelector('[aria-label="Creative materials"]'),
    );
    assert.ok(materialsTarget.querySelector('[aria-label="Product photo"]'));
    assert.ok(materialsTarget.querySelector('[aria-label="Inspiration"]'));
    assert.match(materialsTarget.textContent!, /Ad references/);
    const select = materialsTarget.querySelector(
      'select[aria-label="Product from Brand Brain"]',
    ) as unknown as HTMLSelectElement;
    await act(async () => {
      select.value = productId;
      select.dispatchEvent(new window.Event("change", { bubbles: true }));
    });
    assert.match(materialsTarget.textContent!, /Bottle/);
    await send();
    assert.deepEqual(submitted[0]?.generation, {
      productId,
      referenceIds: [photoId],
      styleReferenceIds: [],
      editAssetId: undefined,
    });
    await act(async () =>
      window.dispatchEvent(
        new window.CustomEvent(STUDIO_SELECTION_EVENT, {
          detail: {
            projectId: "project",
            selection: {
              kind: "campaign",
              assetId: "existing-image",
              name: "Soie editorial",
              version: 1,
              width: 1080,
              height: 1080,
            },
          },
        }),
      ),
    );
    assert.match(container.textContent!, /Retouching: Soie editorial/);
    assert.ok(container.querySelector('[aria-label="Apply changes"]'));
    await send();
    assert.equal(submitted[1]?.generation.editAssetId, "existing-image");
    await act(async () =>
      (
        container.querySelector(
          '[aria-label="Create a new image instead of retouching"]',
        ) as HTMLButtonElement
      ).click(),
    );
    await send();
    assert.equal(submitted[2]?.generation.editAssetId, undefined);
    await act(async () =>
      (
        materialsTarget.querySelector(
          '[aria-label="Remove Bottle from brief"]',
        ) as HTMLButtonElement
      ).click(),
    );
    await send();
    assert.equal(
      submitted.length,
      3,
      "A chosen product without a photo cannot generate",
    );
  } finally {
    await act(async () => root.unmount());
    container.remove();
    materialsTarget.remove();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
