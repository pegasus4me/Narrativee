import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import StudioHeader from "../app/components/studio/StudioHeader";

test("StudioHeader renders a logout option", () => {
  const markup = renderToStaticMarkup(
    <StudioHeader
      brandBrainOpen={false}
      canOpenBrandBrain={true}
      onToggleBrandBrain={() => {}}
    />,
  );

  assert.match(markup, /aria-label="Log out"/);
  assert.match(markup, /title="Log out"/);
  assert.match(markup, /Log out/);
});
