import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import StudioModelSelect from "../app/components/studio/StudioModelSelect";

test("Seedance selection shows its own name and connection status without an OpenAI logo", () => {
  const markup = renderToStaticMarkup(
    <StudioModelSelect
      label="Video model"
      value={null}
      models={["seedance"]}
      defaultModel="seedance"
      modelDetails={{
        seedance: {
          label: "Seedance",
          provider: "ByteDance",
          kind: "video",
          connected: false,
        },
      }}
      disabled={false}
      onChange={() => {}}
    />,
  );
  assert.match(markup, /Default · .*Seedance/);
  assert.match(markup, /Not connected/);
  assert.match(markup, /ByteDance/);
  assert.doesNotMatch(markup, /openai\.svg|sora/i);
});
