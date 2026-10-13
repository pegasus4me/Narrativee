import assert from "node:assert/strict";
import test from "node:test";
import {
  assessIdentityPlanWithJev,
  classifyCreatorIntentWithJev,
  JevRequestError,
} from "../src/studio/identity.judgment";

test("classifier transport failures and invalid decisions surface a useful typed error without retrying", async (t) => {
  const key = process.env.TYPESAFE_API_KEY;
  process.env.TYPESAFE_API_KEY = "test-key";
  try {
    for (const response of [
      async () => {
        throw new DOMException("timeout", "TimeoutError");
      },
      async () => new Response("Unavailable", { status: 503 }),
      async () => new Response("not JSON"),
      async () =>
        Response.json({
          answers: { intent: { type: "choice", choice: "unknown" } },
        }),
    ]) {
      let calls = 0;
      t.mock.method(globalThis, "fetch", async () => {
        calls++;
        return response();
      });
      await assert.rejects(
        classifyCreatorIntentWithJev("Create a fictional stationery ad"),
        (error: Error) =>
          error instanceof JevRequestError &&
          !error.message.includes("not JSON") &&
          /classifier/.test(error.message),
      );
      assert.equal(calls, 1);
      t.mock.restoreAll();
    }
  } finally {
    if (key === undefined) delete process.env.TYPESAFE_API_KEY;
    else process.env.TYPESAFE_API_KEY = key;
  }
});

test("Jev routes Creator requests using a typed choice", async () => {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.TYPESAFE_API_KEY;
  process.env.TYPESAFE_API_KEY = "test-key";
  globalThis.fetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body));
    assert.equal(body.model, "jev-latest");
    assert.equal(body.questions.intent.type, "choice");
    return new Response(
      JSON.stringify({
        answers: {
          intent: {
            type: "choice",
            choice: "logo_exploration",
            confidence: 0.91,
          },
        },
      }),
      { status: 200 },
    );
  };

  try {
    assert.equal(
      await classifyCreatorIntentWithJev("Explore three logos"),
      "logo_exploration",
    );
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.TYPESAFE_API_KEY;
    else process.env.TYPESAFE_API_KEY = previousKey;
  }
});

test("Jev identifies weak identity-plan dimensions", async () => {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.TYPESAFE_API_KEY;
  process.env.TYPESAFE_API_KEY = "test-key";
  globalThis.fetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body));
    assert.equal(Object.keys(body.questions).length, 3);
    return new Response(
      JSON.stringify({
        answers: {
          grounding: { type: "score", score: 2.8, confidence: 0.9 },
          distinction: { type: "score", score: 1.2, confidence: 0.8 },
          specificity: { type: "score", score: 2.4, confidence: 0.8 },
        },
      }),
      { status: 200 },
    );
  };

  try {
    const issues = await assessIdentityPlanWithJev(
      {
        analysisId: "test",
        url: "https://example.com",
        brandName: "Example",
        diagnosis: "A software company with a distinct workflow.",
        competitorSummary: JSON.stringify({ competitors: [] }),
        evidence: [
          { id: "B1", statement: "Workflow", sourceUrl: "https://example.com" },
        ],
      },
      {
        directions: ["One", "Two", "Three"].map((name) => ({
          name,
          strategicAngle: "A focused way to express the workflow.",
          markIdea: "A precise construction of layered lines.",
        })),
      },
    );
    assert.deepEqual(issues, ["distinction"]);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.TYPESAFE_API_KEY;
    else process.env.TYPESAFE_API_KEY = previousKey;
  }
});
