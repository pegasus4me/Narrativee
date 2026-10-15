import assert from "node:assert/strict";
import test from "node:test";
import type {
  ResponseInputItem,
  ResponseOutputItem,
} from "openai/resources/responses/responses";
import {
  collaborateWithAgents,
  type AgentRespond,
} from "../src/studio/agent-collaboration";
import { defaultAgentSettings } from "../src/studio/agent-settings.service";
import type {
  AgentActivityEvent,
  TeamChatEvent,
} from "../src/studio/agent-team";

function call(name: string, arguments_: object): ResponseOutputItem {
  return {
    type: "function_call",
    name,
    call_id: `call_${Math.random()}`,
    arguments: JSON.stringify(arguments_),
  };
}
const text = (content: string) => ({ output: [], text: content });

test("selected image inputs reach Sage, mentioned teammates and delegated agents once per turn", async () => {
  const attachments: ResponseInputItem[] = [
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: 'Selected reference: {"id":"style","role":"style"}',
        },
        {
          type: "input_image",
          image_url: "data:image/png;base64,c3R5bGU=",
          detail: "auto",
        },
      ],
    },
  ];
  const agents: string[] = [];
  let sageCalls = 0;
  await collaborateWithAgents({
    agent: "brand",
    system: "Only the selected reference is active",
    turns: [
      {
        role: "user",
        content: "@Scout and @Sage, can this reference work with my product?",
      },
    ],
    attachments,
    settings: async () => defaultAgentSettings,
    emit: () => {},
    respond: async (request) => {
      agents.push(request.agent);
      const images = request.input.filter(
        (item) => "content" in item && Array.isArray(item.content),
      );
      assert.deepEqual(images, attachments);
      if (request.agent === "brand" && sageCalls++ === 0)
        return {
          text: "",
          output: [
            call("delegate_agent", {
              agent: "creator",
              task: "Compare the reference perspective with the selected product",
            }),
          ],
        };
      return text("The selected reference can guide the product composition.");
    },
  });
  assert.deepEqual(agents, ["research", "brand", "creator", "brand"]);
});

test("explicit mentions consult each tagged teammate before the main reply without relying on a model tool call", async () => {
  const calls: string[] = [];
  const result = await collaborateWithAgents({
    agent: "brand",
    system: "Brand context",
    turns: [
      {
        role: "user",
        content:
          "@Scout verify the claim and @Pixel propose a hierarchy. @Scout",
      },
    ],
    settings: async () => defaultAgentSettings,
    emit: () => {},
    respond: async (request) => {
      calls.push(request.agent);
      if (request.agent === "research")
        return text("The claim is supported by the saved product evidence");
      assert.match(request.system, /claim is supported/);
      if (request.agent === "creator")
        return text("Use the verified claim as the primary headline");
      assert.match(request.system, /primary headline/);
      return text("Here is the combined direction from Scout and Pixel");
    },
  });
  assert.deepEqual(calls, ["research", "creator", "brand"]);
  assert.deepEqual(
    result.contributions.map((reply) => reply.agent),
    ["research", "creator"],
  );
  assert.match(result.content, /Scout and Pixel/);
});

test("failed mentioned agents are reported honestly and older mentions are not invoked again", async () => {
  const calls: string[] = [];
  const result = await collaborateWithAgents({
    agent: "creator",
    system: "Context",
    turns: [
      { role: "user", content: "@Sage previous discussion" },
      { role: "assistant", content: "Prior answer" },
      { role: "user", content: "@Scout verify this" },
    ],
    settings: async () => defaultAgentSettings,
    emit: () => {},
    respond: async (request) => {
      calls.push(request.agent);
      if (request.agent === "research") throw new Error("Provider unavailable");
      assert.match(
        request.system,
        /Scout could not reply.*Provider unavailable/,
      );
      return text("Scout was unavailable; I can explain the current layout");
    },
  });
  assert.deepEqual(calls, ["research", "creator"]);
  assert.deepEqual(result.contributions, []);
});

test("Sage consumes teammate findings and prepares a proposal for human approval", async () => {
  const activity: AgentActivityEvent[] = [];
  const teamEvents: TeamChatEvent[] = [];
  let sageTurns = 0;
  let visuals = 0;
  const respond: AgentRespond = async (request) => {
    assert.match(request.system, /approvedRules/);
    assert.equal(request.model, `configured-${request.agent}`);
    assert.match(
      request.system,
      new RegExp(`Only ${request.agent} preferences`),
    );
    for (const other of ["research", "brand", "creator"])
      if (other !== request.agent)
        assert.ok(!request.system.includes(`Only ${other} preferences`));
    if (request.agent === "research") {
      assert.match(JSON.stringify(request.input), /Original user brief/);
      return text(
        "Evidence supports an approachable launch; no competitor scan is available.",
      );
    }
    if (request.agent === "creator") {
      assert.match(JSON.stringify(request.input), /approachable launch/);
      return text(
        "Use a product-led composition and the approved deep blue palette.",
      );
    }
    sageTurns++;
    if (sageTurns === 1)
      return {
        text: "",
        output: [
          {
            type: "reasoning",
            id: "reasoning_1",
            summary: [],
            encrypted_content: "preserved-reasoning",
          },
          call("delegate_agent", {
            agent: "research",
            task: "Find a grounded angle for this launch",
          }),
        ],
      };
    assert.ok(request.input.some((item) => item.type === "reasoning"));
    if (sageTurns === 2) {
      assert.match(JSON.stringify(request.input), /approachable launch/);
      return {
        text: "",
        output: [
          call("delegate_agent", {
            agent: "creator",
            task: "Develop an approachable launch using Scout's evidence",
          }),
        ],
      };
    }
    if (sageTurns === 3) {
      assert.match(JSON.stringify(request.input), /approved deep blue palette/);
      return {
        text: "",
        output: [
          call("propose_visual", {
            kind: "campaign_creation",
            brief:
              "An approachable launch with a product-led composition and approved deep blue palette",
          }),
        ],
      };
    }
    assert.match(JSON.stringify(request.input), /Direction proposed/);
    assert.match(JSON.stringify(request.input), /pending/);
    assert.ok(
      !JSON.stringify(request.input).includes("server-only-context-hash"),
    );
    assert.ok(!request.tools.some((tool) => tool.name === "propose_visual"));
    return text(
      "Review the proposed direction using Scout's evidence before Pixel creates it.",
    );
  };
  const result = await collaborateWithAgents({
    agent: "brand",
    system: '{"approvedRules":["deep blue"]}',
    turns: [
      {
        role: "user",
        content: "Research the angle and create a launch visual",
      },
    ],
    settings: async (agent) => ({
      ...defaultAgentSettings,
      model: `configured-${agent}`,
      instructions: `Only ${agent} preferences`,
    }),
    emit: (event) => {
      if (event.type === "agent_activity") activity.push(event);
      if (event.type === "conversation_thread" || event.type === "team_message")
        teamEvents.push(event);
    },
    respond,
    prepareVisual: async (task) => {
      visuals++;
      assert.match(task.brief, /approved deep blue/);
      return {
        agent: "creator",
        content: "Direction proposed. Waiting for your approval.",
        approval: {
          kind: "campaign_creation",
          brief: task.brief,
          contextHash: "server-only-context-hash",
          canvasRevision: 0,
          plan: { clarifyingQuestion: null, document: null, imageBrief: null },
        },
      };
    },
  });
  assert.deepEqual(
    teamEvents
      .filter((event) => event.type === "team_message")
      .map(({ agent, content }) => ({ agent, content })),
    result.contributions.map(({ agent, content }) => ({ agent, content })),
  );
  assert.equal(teamEvents[0]?.type, "conversation_thread");
  assert.match(
    result.contributions[0]!.content,
    /Scout, Find a grounded angle/,
  );
  assert.ok(!JSON.stringify(teamEvents).includes("preserved-reasoning"));
  assert.equal(visuals, 1);
  assert.equal(sageTurns, 4);
  assert.deepEqual(
    result.contributions.map((item) => item.agent),
    ["brand", "research", "brand", "creator", "brand", "creator"],
  );
  assert.match(result.content, /before Pixel creates/);
  assert.equal(
    result.contributions.at(-1)?.approval?.contextHash,
    "server-only-context-hash",
  );
  assert.ok(
    activity.some(
      (item) =>
        item.agent === "research" && item.text.includes("Sage asked Scout"),
    ),
  );
});

test("specialists consult each other within a bounded delegation depth", async () => {
  let calls = 0;
  const result = await collaborateWithAgents({
    agent: "brand",
    system: "Shared brand context",
    turns: [{ role: "user", content: "Explore a direction" }],
    settings: async () => defaultAgentSettings,
    emit: () => {},
    respond: async (request) => {
      calls++;
      if (
        !request.tools.some((item) => item.name === "delegate_agent") ||
        request.input.some((item) => item.type === "function_call_output")
      )
        return text(`${request.agent} incorporated the findings`);
      return {
        text: "",
        output: [
          call("delegate_agent", {
            agent: request.agent === "brand" ? "research" : "creator",
            task: "Provide specific guidance for this direction",
          }),
        ],
      };
    },
  });
  assert.equal(calls, 5);
  assert.deepEqual(
    result.contributions.map((item) => item.agent),
    ["brand", "research", "creator", "research"],
  );
});

test("unavailable tools and failed specialists produce honest error results", async () => {
  let rounds = 0;
  const result = await collaborateWithAgents({
    agent: "brand",
    system: "Brand context",
    turns: [{ role: "user", content: "Discuss options" }],
    settings: async () => defaultAgentSettings,
    emit: () => {},
    respond: async (request) => {
      if (request.agent === "research") throw new Error("Research unavailable");
      rounds++;
      if (rounds === 1)
        return {
          text: "",
          output: [
            call("propose_visual", {
              kind: "campaign_creation",
              brief: "Make an ad",
            }),
            call("delegate_agent", {
              agent: "research",
              task: "Verify the evidence",
            }),
          ],
        };
      assert.match(JSON.stringify(request.input), /tool is unavailable/);
      assert.match(JSON.stringify(request.input), /Research unavailable/);
      return text("Scout could not finish. No creative was generated.");
    },
  });
  assert.deepEqual(
    result.contributions.map((item) => item.agent),
    ["brand"],
  );
  assert.match(result.content, /No creative was generated/);
});

test("repeated delegation stops after six tasks and finishes with collected findings", async () => {
  let consultations = 0;
  const result = await collaborateWithAgents({
    agent: "brand",
    system: "Brand context",
    turns: [{ role: "user", content: "Investigate" }],
    settings: async () => defaultAgentSettings,
    emit: () => {},
    respond: async (request) => {
      if (request.agent === "research") {
        consultations++;
        return text("Bounded research report");
      }
      if (!request.tools.length)
        return text("Here are the findings collected so far");
      return {
        text: "",
        output: [
          call("delegate_agent", {
            agent: "research",
            task: "Review another angle",
          }),
        ],
      };
    },
  });
  assert.equal(consultations, 6);
  assert.equal(result.contributions.length, 12);
});
