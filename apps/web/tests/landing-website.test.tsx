import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  authDestination,
  authLink,
  websiteSetupPath,
} from "../lib/auth-destination";
import BrandForm from "../app/components/workspace/BrandForm";

test("landing websites survive signup, signin and OAuth return destinations without retyping", () => {
  const destination = websiteSetupPath(
    "  company.com/products?campaign=one&source=two#details  ",
  );
  const params = new URL(destination, "https://narrativee.com").searchParams;
  assert.equal(
    params.get("website"),
    "https://company.com/products?campaign=one&source=two",
  );
  assert.equal(params.get("setup"), "true");
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  try {
    for (const page of ["signup", "signin"] as const) {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: {
          location: {
            origin: "https://narrativee.com",
            search: new URL(
              authLink(page, destination),
              "https://narrativee.com",
            ).search,
          },
        },
      });
      assert.equal(authDestination(), destination);
      assert.equal(
        `${window.location.origin}${authDestination()}`,
        `https://narrativee.com${destination}`,
      );
    }
  } finally {
    if (previousWindow)
      Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
  const markup = renderToStaticMarkup(
    <BrandForm initialWebsite={params.get("website")!} onCreated={() => {}} />,
  );
  assert.match(
    markup,
    /value="https:\/\/company.com\/products\?campaign=one&amp;source=two"/,
  );
  assert.ok(
    websiteSetupPath("http://company.com").includes("http%3A%2F%2Fcompany.com"),
  );
  for (const value of [
    "",
    "not a website",
    "ftp://company.com",
    "https://user:password@company.com",
    "javascript:alert(1)",
  ]) {
    assert.throws(() => websiteSetupPath(value), /Enter a valid website/);
  }
});
