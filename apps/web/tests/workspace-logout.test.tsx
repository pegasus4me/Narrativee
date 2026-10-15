import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as Dialog from "@radix-ui/react-dialog";
import StudioHeader from "../app/components/studio/StudioHeader";

test("StudioHeader renders a logout option", () => {
  const markup = renderToStaticMarkup(
    <Dialog.Root>
      <StudioHeader canOpenBrandBrain={true} />
    </Dialog.Root>,
  );

  assert.match(markup, /aria-label="Log out"/);
  assert.match(markup, /title="Log out"/);
  assert.match(markup, /Log out/);
});
