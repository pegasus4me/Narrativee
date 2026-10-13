import assert from "node:assert/strict";
import test from "node:test";
import { mentionedAgents } from "../src/studio/agent-mentions";

test("agent mentions resolve canonical names once in user order", () => {
  assert.deepEqual(
    mentionedAgents("@PIXEL use @Scout findings; @sage review. @Scout"),
    ["creator", "research", "brand"],
  );
  assert.deepEqual(mentionedAgents("Hello (@Sage), ask @Pixel!"), [
    "brand",
    "creator",
  ]);
  assert.deepEqual(
    mentionedAgents(
      "@Scouter @sage-old @unknown contact@Pixel.com https://example/@Scout @Sage.example",
    ),
    [],
  );
  assert.deepEqual(
    mentionedAgents("Example `@Pixel` or ```\n@Scout\n``` but involve @Sage"),
    ["brand"],
  );
});
