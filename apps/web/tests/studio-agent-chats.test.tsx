import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import StudioAgentActivity from "../app/components/studio/StudioAgentActivity";
import StudioAgentConversation from "../app/components/studio/StudioAgentConversation";
import type { StudioMessage } from "../lib/api/studio";

const messages: StudioMessage[] = [
  "team",
  "research",
  "brand",
  "creator",
].flatMap((thread, index) => [
  {
    id: `${index}-user`,
    role: "user" as const,
    thread: thread as StudioMessage["thread"],
    content: `${thread} question`,
    createdAt: "2026-10-06",
  },
  {
    id: `${index}-reply`,
    role: "assistant" as const,
    thread: thread as StudioMessage["thread"],
    agent: "creator" as const,
    content: `${thread} reply`,
    createdAt: "2026-10-06",
  },
]);

test("one project conversation retains all saved specialist conversations without agent tabs", () => {
  const markup = renderToStaticMarkup(
    <StudioAgentConversation
      messages={messages}
      pending={null}
      streamingText=""
      replyingAgent={null}
      creatorStage={null}
    />,
  );
  assert.match(markup, /aria-label="Project conversation"/);
  for (const thread of ["team", "research", "brand", "creator"]) {
    assert.ok(markup.includes(`${thread} question`));
    assert.ok(markup.includes(`${thread} reply`));
  }
  assert.doesNotMatch(markup, /role="tab|aria-labelledby="studio-agent/);
});

test("agents expose actual activity as details rather than conversation destinations", () => {
  const markup = renderToStaticMarkup(
    <StudioAgentActivity
      activity={[
        {
          type: "agent_activity",
          agent: "creator",
          status: "working",
          text: "Preparing the requested scene",
        },
      ]}
    />,
  );
  assert.match(markup, /<details/);
  assert.match(markup, /Preparing the requested scene/);
  assert.match(markup, /Pixel/);
  assert.doesNotMatch(markup, /role="tab|Settings for/);
});

test("the unified empty state starts with the product, and live handoffs stay in expandable details", () => {
  const empty = renderToStaticMarkup(
    <StudioAgentConversation
      messages={[]}
      pending={null}
      streamingText=""
      replyingAgent={null}
      creatorStage={null}
    />,
  );
  assert.match(empty, /Choose your product/);
  assert.doesNotMatch(empty, /Ask Scout|Developing three/);
  const pending = renderToStaticMarkup(
    <StudioAgentConversation
      messages={[]}
      pending="White sheets, morning light"
      streamingText=""
      replyingAgent="creator"
      creatorStage="Generating the image"
      liveTeamMessages={[
        { agent: "brand", content: "Product identity checked" },
      ]}
    />,
  );
  assert.match(pending, /<summary[^>]*>Creation details/);
  assert.match(pending, /Product identity checked/);
  assert.match(pending, /Generating the image/);
});
