import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BrandProducts } from "../app/workspace/brand-brain/BrandProducts";
import { BrandBrainImages } from "../app/workspace/brand-brain/BrandBrainImages";
import type { BrandBrainController } from "../app/workspace/brand-brain/useBrandBrain";
import {
  createBrandProduct,
  updateBrandProduct,
  uploadBrainAsset,
  archiveBrandProduct,
} from "../lib/api/brand-brain";

test("product requests preserve product metadata and photo associations", async (t) => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  t.mock.method(
    globalThis,
    "fetch",
    async (url: unknown, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      return init?.method === "DELETE"
        ? new Response(null, { status: 204 })
        : Response.json({ id: "product", name: "Orange chocolate" });
    },
  );
  const fields = {
    name: "Orange chocolate",
    description: "100 g, dark chocolate with orange",
  };
  await createBrandProduct("brand", fields);
  await updateBrandProduct("brand", "product", fields);
  const photo = new File(["photo bytes"], "packaging.png", {
    type: "image/png",
  });
  await uploadBrainAsset(
    "brand",
    photo,
    "rule",
    "imagery",
    "Front packaging",
    "product",
  );
  await archiveBrandProduct("brand", "product");
  assert.match(calls[0]!.url, /brands\/brand\/brain\/products$/);
  assert.equal(calls[0]!.init?.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0]!.init?.body)), fields);
  assert.equal(calls[1]!.init?.method, "PATCH");
  const upload = calls[2]!;
  assert.equal(new URL(upload.url).searchParams.get("productId"), "product");
  assert.equal(upload.init?.body, photo);
  assert.equal(
    new Headers(upload.init?.headers).get("Content-Type"),
    "image/png",
  );
  assert.equal(calls[3]!.init?.method, "DELETE");
  assert.ok(calls.every(({ init }) => init?.credentials === "include"));
});

test("the library shows saved products while kit images exclude product photos", () => {
  const brain = {
    data: {
      products: [
        {
          id: "product",
          name: "Orange chocolate",
          description: "Dark chocolate with orange",
        },
      ],
      items: [],
      assets: [
        {
          id: "photo",
          productId: "product",
          kind: "rule",
          category: "imagery",
          caption: "Front packaging",
          filename: "packaging.png",
        },
      ],
    },
    busy: false,
  } as unknown as BrandBrainController;
  const library = renderToStaticMarkup(
    <BrandProducts brain={brain} brandId="brand" />,
  );
  assert.match(library, /Orange chocolate/);
  assert.match(library, /Dark chocolate with orange/);
  assert.match(library, /Edit \/ add photos/);
  assert.match(library, /Remove packaging.png from Orange chocolate/);
  const kit = renderToStaticMarkup(
    <BrandBrainImages brain={brain} brandId="brand" purpose="brand" />,
  );
  assert.doesNotMatch(kit, /Front packaging|packaging.png/);
});

test("onboarding can open directly into the first product form", () => {
  const brain = {
    data: { products: [], assets: [], items: [] },
    busy: false,
  } as unknown as BrandBrainController;
  const markup = renderToStaticMarkup(
    <BrandProducts brain={brain} brandId="brand" startAdd />,
  );
  assert.match(markup, /Product name/);
  assert.match(markup, /Description/);
  assert.match(markup, /multiple=""/);
  assert.match(markup, /Drop or paste product photos/);
  assert.match(markup, /Save product/);
});
