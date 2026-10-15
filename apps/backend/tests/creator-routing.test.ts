import assert from "node:assert/strict";
import test from "node:test";
import { usageContext } from "../src/usage/operations";
import { runCreatorRequest } from "../src/studio/creator.service";
import { defaultCampaignOutput } from "../src/studio/campaign/campaign.output";
import type { CampaignGeneration } from "../src/studio/campaign/campaign.types";

type Dependencies = NonNullable<Parameters<typeof runCreatorRequest>[8]>;
const message = {
  id: "message",
  sequence: 1,
  projectId: "project",
  role: "assistant",
  agent: "brand" as const,
  thread: "team" as const,
  content: "Let's discuss your brand.",
  approvedBy: null,
  approvedAt: null,
  createdAt: new Date(),
  approval: null,
};
const exchange = {
  userMessage: { ...message, role: "user", agent: null },
  assistantMessage: message,
  collaborationMessages: [],
};
const history = [
  {
    role: "user",
    agent: null,
    thread: "team" as const,
    content: "Create an ad",
  },
  {
    role: "assistant",
    agent: "creator" as const,
    thread: "team" as const,
    content: "The ad is ready.",
  },
];

function request(
  content: string,
  generation: CampaignGeneration,
  dependencies: Dependencies,
) {
  return usageContext.run(
    { userId: "user", key: "routing-test", operationId: "test-operation" },
    () =>
      runCreatorRequest(
        "project",
        "brand",
        "user",
        content,
        () => {},
        "team",
        [defaultCampaignOutput],
        generation,
        dependencies,
      ),
  );
}

test("composer metadata never turns conversation into image generation, including mentions and selected images", async () => {
  for (const content of [
    "Hello",
    "@Sage what do you think of our positioning?",
    "@Pixel explain why you chose this layout",
    "Don't generate anything, let's discuss the campaign",
  ]) {
    for (const generation of [
      { referenceIds: [] },
      {
        productId: "product",
        referenceIds: ["photo", "style"],
        styleReferenceIds: ["style"],
      },
      { referenceIds: [], editAssetId: "selected-image" },
    ]) {
      const calls: string[] = [];
      const result = await request(content, generation, {
        readStudioTeamContext: async () => history,
        classifyCreatorIntentWithJev: async (latest, previous, selected) => {
          calls.push("classify");
          assert.equal(latest, content);
          assert.deepEqual(previous, history);
          assert.equal(selected, "editAssetId" in generation);
          return "conversation";
        },
        runCampaignRequest: async () => {
          assert.fail("Discussion must never call the image pipeline");
        },
        saveStudioExchange: async () => {
          assert.fail("The conversation path saves its own exchange");
        },
        runCollaborativeConversation: async (
          _project,
          _user,
          latest,
          _emit,
          agent,
          prepareVisual,
          _generate,
          outputs,
          selection,
        ) => {
          calls.push("conversation");
          assert.equal(latest, content);
          assert.equal(agent, "team");
          assert.deepEqual(
            selection,
            generation,
            "Discussion receives the exact composer selection",
          );
          assert.deepEqual(outputs, [defaultCampaignOutput]);
          assert.equal(
            typeof prepareVisual,
            "function",
            "Pixel's proposal tool stays available while discussing selected materials",
          );
          return exchange;
        },
      });
      assert.equal(result, exchange);
      assert.deepEqual(calls, ["classify", "conversation"]);
    }
  }
});

test("explicit creation and retouch requests retain their exact product, reference, image and output selections", async () => {
  for (const editing of [false, true]) {
    const generation = {
      productId: "product",
      referenceIds: ["photo", "inspiration"],
      styleReferenceIds: ["inspiration"],
      ...(editing ? { editAssetId: "selected-image" } : {}),
    };
    const content = editing
      ? "Reduce the reflections, keep the rest"
      : "Create a product image in morning light";
    const calls: string[] = [];
    const result = await request(content, generation, {
      readStudioTeamContext: async () => history,
      classifyCreatorIntentWithJev: async (_content, _history, selected) => {
        calls.push("classify");
        assert.equal(selected, editing);
        return "campaign_creation";
      },
      runCollaborativeConversation: async () => {
        assert.fail("Explicit creation should use the selected creative brief");
      },
      runCampaignRequest: async (
        project,
        brand,
        user,
        latest,
        _emit,
        _thread,
        _approved,
        outputs,
        supplied,
      ) => {
        calls.push("create");
        assert.deepEqual(
          [project, brand, user, latest],
          ["project", "brand", "user", content],
        );
        assert.deepEqual(outputs, [defaultCampaignOutput]);
        assert.deepEqual(supplied, generation);
        return { agent: "creator", content: "Creative delivered" };
      },
      saveStudioExchange: async (_project, latest, reply) => {
        calls.push("save");
        assert.equal(latest, content);
        assert.equal(reply, "Creative delivered");
        return exchange;
      },
    });
    assert.equal(result, exchange);
    assert.deepEqual(calls, ["classify", "create", "save"]);
  }
});

test("an unavailable classifier cannot fall through to image generation", async () => {
  let visuals = 0;
  const fail = async () =>
    assert.fail("No work should run without an intent decision");
  const dependencies: Dependencies = {
    readStudioTeamContext: async () => history,
    classifyCreatorIntentWithJev: async () => {
      throw new Error("Classifier unavailable");
    },
    runCampaignRequest: async () => {
      visuals++;
      return { agent: "creator", content: "Unexpected" };
    },
    runCollaborativeConversation: fail,
    saveStudioExchange: fail,
  };
  await assert.rejects(
    request("What do you think?", { referenceIds: [] }, dependencies),
    /Classifier unavailable/,
  );
  assert.equal(visuals, 0);
});

test("choosing a direction saves Pixel's approval card with the selected materials", async () => {
  const generation = { referenceIds: ["style"], styleReferenceIds: ["style"] };
  const approval = {
    kind: "campaign_creation" as const,
    brief: "Held for the Night",
    plan: {
      renderMode: "image" as const,
      clarifyingQuestion: null,
      creatives: [],
    },
    contextHash: "hash",
    canvasRevision: 1,
    generation,
  };
  await request("let's go for that", generation, {
    readStudioTeamContext: async () => history,
    classifyCreatorIntentWithJev: async () => "campaign_creation",
    runCollaborativeConversation: async () =>
      assert.fail("Move the chosen direction to Pixel"),
    runCampaignRequest: async (
      _project,
      _brand,
      _user,
      latest,
      _emit,
      _thread,
      approved,
      _outputs,
      selection,
    ) => {
      assert.equal(latest, "let's go for that");
      assert.equal(approved, undefined);
      assert.deepEqual(selection, generation);
      return {
        agent: "creator",
        content: "Review this prompt before creating.",
        approval,
      };
    },
    saveStudioExchange: async (
      _project,
      _latest,
      _reply,
      agent,
      _thread,
      _contributions,
      savedApproval,
    ) => {
      assert.equal(agent, "creator");
      assert.deepEqual(savedApproval, approval);
      return exchange;
    },
  });
});

test("Sage can hand selected materials to Pixel when a conversational turn requests a proposal", async () => {
  const generation = { referenceIds: ["style"], styleReferenceIds: ["style"] };
  let classifications = 0;
  let prepared = false;
  await request("Let's go with Held for the Night", generation, {
    readStudioTeamContext: async () => history,
    classifyCreatorIntentWithJev: async () =>
      classifications++ === 0 ? "conversation" : "campaign_creation",
    runCollaborativeConversation: async (
      _project,
      _user,
      _content,
      _emit,
      _agent,
      prepareVisual,
    ) => {
      assert.ok(prepareVisual);
      await prepareVisual({
        kind: "campaign_creation",
        brief: "Held for the Night with the selected product and reference",
      });
      return exchange;
    },
    runCampaignRequest: async (
      _project,
      _brand,
      _user,
      brief,
      _emit,
      _thread,
      approved,
      _outputs,
      selection,
    ) => {
      assert.match(brief, /Held for the Night/);
      assert.equal(approved, undefined);
      assert.deepEqual(selection, generation);
      prepared = true;
      return { agent: "creator", content: "Prompt ready for approval" };
    },
    saveStudioExchange: async () =>
      assert.fail("Conversation saves its own exchange"),
  });
  assert.equal(prepared, true);
});
