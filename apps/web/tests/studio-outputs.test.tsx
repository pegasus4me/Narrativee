import assert from "node:assert/strict";
import test from "node:test";
import React, { act } from "react";
import { getEnv } from "fabric/node";
import type { CampaignOutput } from "../lib/studio-outputs";
import { socialPlatformLogos } from "../lib/social-platform-logos";

test("the Outputs popup retains platform and size selections, validates custom pixels, and locks selections while working", async (t) => {
  const environment = getEnv();
  const window = environment.document.defaultView!;
  const globals = {
    window,
    document: environment.document,
    HTMLElement: window.HTMLElement,
    Element: window.Element,
    SVGElement: window.SVGElement,
    Node: window.Node,
    NodeFilter: window.NodeFilter,
    HTMLInputElement: window.HTMLInputElement,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    // JSDOM has no layout; nested popovers otherwise loop during focus recovery.
    MutationObserver: class {
      observe() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
    getComputedStyle: window.getComputedStyle.bind(window),
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
  t.mock.method(globalThis, "fetch", async (input: unknown) =>
    Response.json(
      String(input).includes("generation-cost")
        ? { maxCredits: 50 }
        : { items: [], assets: [], products: [] },
    ),
  );
  const { createRoot } = await import("react-dom/client");
  const { StudioCanvasPrompt } = await import(
    "../app/components/studio/StudioCanvasPrompt"
  );
  const submitted: { content: string; outputs?: CampaignOutput[] }[] = [];
  const previousLogos = { ...socialPlatformLogos };
  const iconFixture = environment.document.createElement("canvas");
  iconFixture.width = iconFixture.height = 1;
  for (const platform of Object.keys(socialPlatformLogos)) {
    socialPlatformLogos[platform] = iconFixture.toDataURL();
  }
  const container = environment.document.createElement("div");
  environment.document.body.appendChild(container);
  const root = createRoot(container);
  const render = (pending = false) =>
    act(async () =>
      root.render(
        <StudioCanvasPrompt
          projectId="project"
          brandId="brand"
          draft="@Sage create an ad with @Scout and @Pixel"
          onDraftChange={() => {}}
          onSubmit={async (content, outputs) => {
            submitted.push({ content, outputs: structuredClone(outputs) });
          }}
          disabled={false}
          pending={pending}
          error={null}
          onUploadChange={() => {}}
        />,
      ),
    );
  const group = () =>
    environment.document.querySelector('[aria-label="Campaign outputs"]')!;
  const outputTrigger = () =>
    [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("Outputs ·"),
    )!;
  const click = (element: Element) =>
    act(async () => (element as HTMLElement).click());
  const add = () =>
    [...group().querySelectorAll("button")].find((button) =>
      button.textContent?.includes("Add output"),
    )!;
  const select = async (field: number, label: string) => {
    await click(group().querySelectorAll('[aria-haspopup="listbox"]')[field]!);
    const option = [...group().querySelectorAll('[role="option"]')].find(
      (element) => element.textContent?.includes(label),
    );
    assert.ok(option, label);
    await click(option);
  };
  const input = async (dimension: "width" | "height", value: string) =>
    act(async () => {
      const element = group().querySelector(
        `[aria-label="Output ${dimension} in pixels"]`,
      )!;
      Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )!.set!.call(element, value);
      element.dispatchEvent(new window.Event("input", { bubbles: true }));
    });
  const send = () =>
    act(async () => {
      container
        .querySelector("form")!
        .dispatchEvent(
          new window.Event("submit", { bubbles: true, cancelable: true }),
        );
    });
  try {
    await render();
    assert.ok(container.querySelector("form")!.contains(outputTrigger()));
    assert.equal(outputTrigger().getAttribute("aria-expanded"), "false");
    assert.equal(group(), null);
    await click(outputTrigger());
    assert.equal(outputTrigger().getAttribute("aria-expanded"), "true");
    const popup = environment.document.querySelector('[role="dialog"]')!;
    assert.equal(popup.getAttribute("aria-modal"), "true");
    assert.ok(popup.contains(group()));
    assert.ok(!container.querySelector("form")!.contains(popup));
    assert.match(popup.textContent!, /Choose the platforms and sizes/);
    await select(0, "Instagram");
    await select(1, "Portrait");
    await click(add());
    await select(0, "LinkedIn");
    await select(1, "Landscape");
    await click(add());
    await select(0, "Pinterest");
    await select(1, "Custom size");
    await input("width", "900");
    await input("height", "1600");
    assert.match(group().textContent!, /Outputs · 3/);
    await act(async () => {
      environment.document.activeElement!.dispatchEvent(
        new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });
    assert.equal(outputTrigger().getAttribute("aria-expanded"), "false");
    assert.equal(environment.document.activeElement, outputTrigger());
    await click(outputTrigger());
    assert.match(group().textContent!, /Outputs · 3/);
    assert.equal(
      (
        group().querySelector(
          '[aria-label="Output width in pixels"]',
        ) as HTMLInputElement
      ).value,
      "900",
    );
    await send();
    assert.deepEqual(submitted[0], {
      content: "@Sage create an ad with @Scout and @Pixel",
      outputs: [
        {
          platform: "instagram",
          formatId: "portrait_1080",
          width: 1080,
          height: 1350,
        },
        {
          platform: "linkedin",
          formatId: "landscape_1200",
          width: 1200,
          height: 628,
        },
        { platform: "pinterest", formatId: "custom", width: 900, height: 1600 },
      ],
    });
    await input("width", "");
    assert.match(
      container.querySelector('[role="alert"]')!.textContent!,
      /64 and 4096/,
    );
    await send();
    assert.equal(submitted.length, 1, "Invalid custom pixels never submit");
    await input("width", "900");
    await click(
      [...group().querySelectorAll("button")].find((button) =>
        button.textContent?.includes("LinkedIn · 1200"),
      )!,
    );
    await select(0, "Instagram");
    await select(1, "Portrait");
    assert.match(
      container.querySelector('[role="alert"]')!.textContent!,
      /only once/,
    );
    await send();
    assert.equal(
      submitted.length,
      1,
      "Duplicate platform/size pairs never submit",
    );
    await click(group().querySelector('[aria-label="Remove output 2"]')!);
    assert.match(group().textContent!, /Outputs · 2/);
    assert.equal(container.querySelector('[role="alert"]'), null);
    while (!add().disabled) await click(add());
    assert.match(group().textContent!, /Outputs · 12/);
    await render(true);
    assert.ok(outputTrigger().disabled);
    assert.ok(
      [...group().querySelectorAll("button,input")].every(
        (element) => (element as HTMLButtonElement).disabled,
      ),
    );
  } finally {
    await act(async () => {
      root.unmount();
      // Radix restores focus on the next tick; retain the DOM event classes until then.
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    Object.assign(socialPlatformLogos, previousLogos);
    container.remove();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
