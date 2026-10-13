import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { StudioWorkingBorder } from "../app/components/studio/StudioWorkingBorder";
import StudioReplyAuthor from "../app/components/studio/StudioReplyAuthor";
import StudioApprovalCard from "../app/components/studio/StudioApprovalCard";
import type { CampaignOutput } from "../lib/studio-outputs";
import { uploadProjectImage } from "../lib/api/studio-canvas";
import {
  streamStudioCreatorMessage,
  streamStudioMessage,
  streamStudioApproval,
  type StudioAgentSelection,
} from "../lib/api/studio";

test("creator streams carry multiple output selections without changing the brief", async (t) => {
  const outputs: CampaignOutput[] = [
    {
      platform: "instagram",
      formatId: "vertical_1080",
      width: 1080,
      height: 1920,
    },
    {
      platform: "linkedin",
      formatId: "landscape_1200",
      width: 1200,
      height: 628,
    },
  ];
  t.mock.method(
    globalThis,
    "fetch",
    async (_url: unknown, init?: RequestInit) => {
      assert.equal(init?.credentials, "include");
      assert.deepEqual(JSON.parse(String(init?.body)), {
        content: "@Sage brief @Scout and @Pixel",
        agent: "team",
        outputs,
      });
      return new Response(
        JSON.stringify({
          type: "done",
          userMessage: { role: "user" },
          assistantMessage: { role: "assistant" },
        }),
      );
    },
  );
  await streamStudioCreatorMessage(
    "project",
    "@Sage brief @Scout and @Pixel",
    () => {},
    () => {},
    "team",
    undefined,
    outputs,
  );
});

test("human approval controls only appear for pending proposals", () => {
  const message = {
    id: "proposal",
    role: "assistant" as const,
    content: "Proposed direction",
    createdAt: "2026-10-06",
    approval: {
      kind: "campaign_creation" as const,
      status: "pending" as const,
      brief: "Launch the real product",
    },
  };
  const waiting = renderToStaticMarkup(
    <StudioApprovalCard message={message} busy={false} onDecision={() => {}} />,
  );
  assert.match(waiting, /Your approval is needed/);
  assert.match(waiting, /Approve &amp; create/);
  assert.match(waiting, /Request changes/);
  assert.match(waiting, /Decline/);
  const busy = renderToStaticMarkup(
    <StudioApprovalCard message={message} busy onDecision={() => {}} />,
  );
  assert.equal((busy.match(/disabled=""/g) ?? []).length, 3);
  for (const status of ["completed", "rejected", "executing"] as const) {
    const decided = renderToStaticMarkup(
      <StudioApprovalCard
        message={{ ...message, approval: { ...message.approval, status } }}
        busy={false}
        onDecision={() => {}}
      />,
    );
    assert.doesNotMatch(
      decided,
      /Approve &amp; create|Request changes|<button/,
    );
  }
  const failed = renderToStaticMarkup(
    <StudioApprovalCard
      message={{
        ...message,
        approval: { ...message.approval, status: "failed" },
      }}
      busy={false}
      error="This image model has no verified billing configuration."
      onDecision={() => {}}
    />,
  );
  assert.match(failed, /Refresh proposal/);
  assert.match(failed, /role="alert"/);
  assert.match(failed, /image model has no verified billing configuration/);
  assert.doesNotMatch(failed, /Try sending it again/);
  assert.doesNotMatch(failed, /Approve &amp; create|Request changes/);
});

test("approval streams send an explicit decision for the saved proposal and retain its new status", async (t) => {
  for (const action of ["approve", "reject", "refresh"] as const) {
    const feedback = action === "reject" ? "Make the hierarchy calmer" : "";
    t.mock.method(
      globalThis,
      "fetch",
      async (url: unknown, init?: RequestInit) => {
        assert.match(
          String(url),
          /projects\/project\/approvals\/proposal\/stream$/,
        );
        assert.equal(init?.credentials, "include");
        assert.deepEqual(JSON.parse(String(init?.body)), { action, feedback });
        return new Response(
          JSON.stringify({
            type: "done",
            userMessage: { role: "user" },
            assistantMessage: { role: "assistant", agent: "creator" },
            approvalMessage: {
              id: "proposal",
              approval: {
                status: action === "approve" ? "completed" : "rejected",
              },
            },
          }),
        );
      },
    );
    const result = await streamStudioApproval(
      "project",
      "proposal",
      action,
      feedback,
      () => {},
      () => {},
      () => {},
    );
    assert.equal(result.approvalMessage?.id, "proposal");
    assert.equal(
      result.approvalMessage?.approval?.status,
      action === "approve" ? "completed" : "rejected",
    );
    t.mock.restoreAll();
  }
});

test("Studio replies identify their author with the matching avatar, name and role", () => {
  for (const [agent, name, role, avatar] of [
    ["research", "Scout", "Research", "/agents/mascot-mint.svg"],
    ["brand", "Sage", "Brand &amp; direction", "/agents/mascot-lavender.svg"],
    ["creator", "Pixel", "Creator", "/agents/mascot-pink.svg"],
  ] as const) {
    const markup = renderToStaticMarkup(<StudioReplyAuthor agent={agent} />);
    assert.ok(markup.includes(name));
    assert.ok(markup.includes(role));
    assert.ok(markup.includes(avatar));
    assert.doesNotMatch(markup, /Creative team/);
    assert.equal((markup.match(/<img /g) ?? []).length, 1);
  }
  const legacy = renderToStaticMarkup(<StudioReplyAuthor />);
  assert.equal(legacy, "");
});

test("discovery streams identify the reply author before showing text and retain it on completion", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(
        [
          { type: "reply_agent", agent: "research" },
          { type: "delta", text: "A research reply" },
          {
            type: "done",
            userMessage: { role: "user" },
            assistantMessage: { role: "assistant", agent: "research" },
          },
        ]
          .map((event) => JSON.stringify(event))
          .join("\n"),
      ),
  );
  const updates: string[] = [];
  const result = await streamStudioMessage(
    "project",
    "Research this",
    (text) => updates.push(text),
    "research",
    (agent) => updates.push(agent),
  );
  assert.deepEqual(updates, ["research", "A research reply"]);
  assert.equal(result.assistantMessage.agent, "research");
});

test("completed replies retain the streamed author when the final message omits attribution", async (t) => {
  for (const endpoint of ["messages", "creator"] as const) {
    for (const finalAgent of [undefined, null, "research"] as const) {
      t.mock.method(
        globalThis,
        "fetch",
        async () =>
          new Response(
            [
              { type: "reply_agent", agent: "creator" },
              { type: "delta", text: "Your creative is ready" },
              {
                type: "done",
                userMessage: { id: "user", role: "user" },
                assistantMessage: {
                  id: "reply",
                  role: "assistant",
                  content: "Your creative is ready",
                  agent: finalAgent,
                },
              },
            ]
              .map((event) => JSON.stringify(event))
              .join("\n"),
          ),
      );
      const result =
        endpoint === "messages"
          ? await streamStudioMessage("project", "Create this", () => {})
          : await streamStudioCreatorMessage(
              "project",
              "Create this",
              () => {},
              () => {},
            );
      assert.equal(result.assistantMessage.agent, finalAgent ?? "creator");
      const completedAuthor = renderToStaticMarkup(
        <StudioReplyAuthor agent={result.assistantMessage.agent} />,
      );
      assert.match(
        completedAuthor,
        finalAgent === "research" ? /Scout/ : /Pixel/,
      );
      t.mock.restoreAll();
    }
  }
});

test("working highlight uses the tertiary token, ignores pointer input and disappears when idle", () => {
  assert.equal(
    renderToStaticMarkup(<StudioWorkingBorder active={false} />),
    "",
  );
  const active = renderToStaticMarkup(<StudioWorkingBorder active />);
  assert.match(active, /border-tertiary/);
  assert.match(active, /var\(--tertiary\)/);
  assert.match(active, /pointer-events-none/);
  assert.match(active, /aria-hidden="true"/);
});

test("collaboration streams preserve specialist contributions and report activity in both modes", async (t) => {
  const contributions = [
    {
      id: "research",
      role: "assistant",
      agent: "research",
      thread: "brand",
      content: "Scout findings",
    },
    {
      id: "creator",
      role: "assistant",
      agent: "creator",
      thread: "brand",
      content: "Pixel direction",
    },
  ];
  for (const mode of ["messages", "creator"]) {
    t.mock.method(
      globalThis,
      "fetch",
      async () =>
        new Response(
          [
            { type: "reply_agent", agent: "brand" },
            {
              type: "agent_activity",
              agent: "research",
              status: "working",
              text: "Sage asked Scout",
            },
            { type: "delta", text: "Chosen direction" },
            {
              type: "done",
              userMessage: { id: "user", role: "user", thread: "brand" },
              assistantMessage: {
                id: "final",
                role: "assistant",
                agent: "brand",
                thread: "brand",
              },
              collaborationMessages: contributions,
            },
          ]
            .map((event) => JSON.stringify(event))
            .join("\n"),
        ),
    );
    const activity: string[] = [];
    const result =
      mode === "messages"
        ? await streamStudioMessage(
            "project",
            "Choose a direction",
            () => {},
            "brand",
            () => {},
            (event) => activity.push(event.agent),
          )
        : await streamStudioCreatorMessage(
            "project",
            "Choose a direction",
            () => {},
            (event) => {
              if (event.type === "agent_activity") activity.push(event.agent);
            },
            "brand",
          );
    assert.deepEqual(activity, ["research"]);
    assert.deepEqual(result.collaborationMessages, contributions);
    assert.equal(result.assistantMessage.agent, "brand");
    t.mock.restoreAll();
  }
});

test("Studio upload sends image bytes with authentication and validates size/type before sending", async (t) => {
  let requests = 0;
  t.mock.method(
    globalThis,
    "fetch",
    async (url: unknown, init?: RequestInit) => {
      requests++;
      assert.match(String(url), /studio\/projects\/project\/assets$/);
      assert.equal(init?.credentials, "include");
      assert.equal(init?.method, "POST");
      assert.equal(
        (init?.headers as Record<string, string>)["Content-Type"],
        "image/png",
      );
      assert.ok(init?.body instanceof File);
      return Response.json(
        { id: "image", width: 16, height: 16 },
        { status: 201 },
      );
    },
  );
  assert.deepEqual(
    await uploadProjectImage(
      "project",
      new File(["fixture"], "product.png", { type: "image/png" }),
    ),
    { id: "image", width: 16, height: 16 },
  );
  await assert.rejects(
    uploadProjectImage(
      "project",
      new File(["fixture"], "document.pdf", { type: "application/pdf" }),
    ),
    /PNG, JPEG or WebP/,
  );
  await assert.rejects(
    uploadProjectImage(
      "project",
      new File([new Uint8Array(8 * 1024 * 1024 + 1)], "huge.png", {
        type: "image/png",
      }),
    ),
    /8 MB/,
  );
  assert.equal(requests, 1);
});

test("Studio upload surfaces storage failures instead of claiming the image was added", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json(
      { error: "Image storage is not configured" },
      { status: 503 },
    ),
  );
  await assert.rejects(
    uploadProjectImage(
      "project",
      new File(["fixture"], "product.png", { type: "image/png" }),
    ),
    /storage is not configured/,
  );
});

test("Studio sends the selected agent without changing the brief and retains streamed activity", async (t) => {
  const choices: StudioAgentSelection[] = [
    "team",
    "research",
    "brand",
    "creator",
  ];
  for (const agent of choices) {
    t.mock.method(
      globalThis,
      "fetch",
      async (_url: unknown, init?: RequestInit) => {
        assert.deepEqual(JSON.parse(String(init?.body)), {
          content: "Review this creative",
          agent,
        });
        const events = [
          { type: "reply_agent", agent: agent === "team" ? "brand" : agent },
          {
            type: "agent_activity",
            agent: agent === "team" ? "brand" : agent,
            status: "working",
            text: "Reading context",
          },
          { type: "delta", text: "A focused reply" },
          {
            type: "done",
            userMessage: {
              id: "user",
              role: "user",
              content: "Review this creative",
            },
            assistantMessage: {
              id: "assistant",
              role: "assistant",
              agent: agent === "team" ? "brand" : agent,
              content: "A focused reply",
            },
          },
        ];
        return new Response(
          events.map((event) => JSON.stringify(event)).join("\n"),
        );
      },
    );
    const deltas: string[] = [];
    const activity: string[] = [];
    const authors: string[] = [];
    const result = await streamStudioCreatorMessage(
      "project",
      "Review this creative",
      (text) => deltas.push(text),
      (event) => {
        if (event.type === "agent_activity") activity.push(event.agent);
      },
      agent,
      (author) => authors.push(author),
    );
    assert.deepEqual(deltas, ["A focused reply"]);
    assert.deepEqual(activity, [agent === "team" ? "brand" : agent]);
    assert.deepEqual(authors, [agent === "team" ? "brand" : agent]);
    assert.equal(result.assistantMessage.agent, authors[0]);
    assert.equal(result.assistantMessage.content, "A focused reply");
    t.mock.restoreAll();
  }
});

test("chat and creator streams route agent discussion to Team and resolve Sage critique normally", async (t) => {
  for (const endpoint of ["messages", "creator", "approval"] as const) {
    const events = [
      { type: "conversation_thread", thread: "team" },
      {
        type: "team_message",
        agent: "creator",
        content: "Sage, review this headline.",
      },
      {
        type: "team_message",
        agent: "brand",
        content: "Pixel, make the use case explicit.",
      },
      { type: "reply_agent", agent: "brand" },
      { type: "delta", text: "Let's discuss this direction here." },
      {
        type: "done",
        userMessage: { role: "user", thread: "team" },
        assistantMessage: {
          role: "assistant",
          thread: "team",
          agent: "brand",
          content: "Let's discuss this direction here.",
        },
      },
    ];
    t.mock.method(
      globalThis,
      "fetch",
      async () =>
        new Response(events.map((event) => JSON.stringify(event)).join("\n")),
    );
    const updates: object[] = [];
    const onEvent = (event: object) => {
      updates.push(event);
    };
    const onDelta = (text: string) => updates.push({ type: "delta", text });
    const onAgent = (agent: string) =>
      updates.push({ type: "reply_agent", agent });
    const result =
      endpoint === "messages"
        ? await streamStudioMessage(
            "project",
            "Create",
            onDelta,
            "brand",
            onAgent,
            undefined,
            onEvent,
          )
        : endpoint === "creator"
          ? await streamStudioCreatorMessage(
              "project",
              "Create",
              onDelta,
              onEvent,
              "creator",
              onAgent,
            )
          : await streamStudioApproval(
              "project",
              "proposal",
              "approve",
              "",
              onDelta,
              onEvent,
              onAgent,
            );
    assert.deepEqual(updates, events.slice(0, -1));
    assert.equal(result.assistantMessage.thread, "team");
    assert.equal(result.assistantMessage.agent, "brand");
    assert.equal(result.assistantMessage.approval, undefined);
    t.mock.restoreAll();
  }
});
