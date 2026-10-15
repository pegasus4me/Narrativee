import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import BrandScanProgress from "../app/components/workspace/BrandScanProgress";

test("brand scans show the reported percentage and the actual active stage", () => {
  const markup = renderToStaticMarkup(
    <BrandScanProgress analysis={{ status: "synthesizing", progress: 55 }} />,
  );
  assert.match(markup, /55%/);
  assert.match(markup, /aria-valuenow="55"/);
  assert.match(markup, /width:55%/);
  assert.match(
    markup,
    /aria-current="step"[^>]*>.*?Build your brand diagnosis/,
  );
  assert.equal((markup.match(/>Completed</g) ?? []).length, 2);
  assert.equal((markup.match(/>In progress</g) ?? []).length, 1);
  assert.equal((markup.match(/>Pending</g) ?? []).length, 1);
});

test("starting a scan never invents progress or completed steps", () => {
  const markup = renderToStaticMarkup(<BrandScanProgress analysis={null} />);
  assert.match(markup, /aria-valuenow="0"/);
  assert.match(markup, /width:0%/);
  assert.equal((markup.match(/>Completed</g) ?? []).length, 0);
  assert.match(markup, /aria-current="step"[^>]*>.*?Prepare the brand scan/);
});

test("brand readiness completes the initial checklist before optional competitor comparison", () => {
  const markup = renderToStaticMarkup(
    <BrandScanProgress
      analysis={{ status: "awaiting_competitor_confirmation", progress: 100 }}
    />,
  );
  assert.match(markup, /Scan complete/);
  assert.equal((markup.match(/>Completed</g) ?? []).length, 4);
  assert.doesNotMatch(markup, /aria-current/);
});

test("competitor comparison tracks its own stages and reported progress", () => {
  const markup = renderToStaticMarkup(
    <BrandScanProgress
      analysis={{ status: "comparing_competitors", progress: 65 }}
    />,
  );
  assert.match(markup, /aria-valuenow="65"/);
  assert.match(
    markup,
    /aria-current="step"[^>]*>.*?Compare positioning and visuals/,
  );
  assert.equal((markup.match(/>Completed</g) ?? []).length, 1);
  assert.equal((markup.match(/>In progress</g) ?? []).length, 1);
});
