import assert from "node:assert/strict";
import test from "node:test";
import { APIConnectionError, APIConnectionTimeoutError } from "openai";
import { analysisFailureMessage } from "../src/analysis/analysis.errors";
import { OpenAIBrandSynthesizer } from "../src/analysis/openai-brand-synthesizer";
import { asAccessError } from "../src/billing/catalog";
import { usageContext } from "../src/usage/operations";

test("analysis reports token-count provider failures through the real SDK parser", async (t) => {
  const synthesizer = new OpenAIBrandSynthesizer(
    "test-no-network",
    "gpt-6-luna",
  );
  for (const [status, code, expected] of [
    [401, "invalid_api_key", /rejected access/],
    [404, "model_not_found", /model is unavailable/],
    [429, "insufficient_quota", /no available credits/],
    [429, "rate_limit", /rate-limiting/],
    [400, "invalid_image", /rejected the analysis request/],
    [503, "unavailable", /temporarily unavailable/],
  ] as const) {
    const request = t.mock.method(globalThis, "fetch", async (input) => {
      assert.equal(
        String(input),
        "https://api.openai.com/v1/responses/input_tokens",
      );
      return Response.json(
        { error: { code, message: "private provider payload" } },
        { status },
      );
    });
    await assert.rejects(
      usageContext.run(
        { userId: "test", key: "research", operationId: "test" },
        () =>
          synthesizer.synthesize("https://fictional.example", {
            markdown: "Fictional brand",
          }),
      ),
      (error) => {
        assert.match(analysisFailureMessage(error), expected);
        assert.doesNotMatch(
          analysisFailureMessage(error),
          /private provider payload|Connection error\./,
        );
        return true;
      },
    );
    assert.equal(request.mock.callCount(), 1);
    request.mock.restore();
  }
});

test("oversized and malformed token counts stay actionable and never reach generation", async (t) => {
  const synthesizer = new OpenAIBrandSynthesizer(
    "test-no-network",
    "gpt-6-luna",
  );
  for (const [count, code, expected] of [
    [32_001, "INPUT_TOO_LARGE", /Select fewer competitors/],
    [-1, "PROVIDER_USAGE_UNAVAILABLE", /invalid token count/],
    [undefined, "PROVIDER_USAGE_UNAVAILABLE", /invalid token count/],
  ] as const) {
    const request = t.mock.method(globalThis, "fetch", async (input) => {
      assert.equal(
        String(input),
        "https://api.openai.com/v1/responses/input_tokens",
      );
      return Response.json({ input_tokens: count });
    });
    await assert.rejects(
      usageContext.run(
        { userId: "test", key: "research", operationId: "test" },
        () =>
          synthesizer.synthesize("https://fictional.example", {
            markdown: "Fictional brand",
          }),
      ),
      (error) => {
        assert.equal(asAccessError(error)?.code, code);
        assert.match(analysisFailureMessage(error), expected);
        return true;
      },
    );
    assert.equal(request.mock.callCount(), 1);
    request.mock.restore();
  }
});

test("real connection and timeout failures use research-specific feedback", () => {
  assert.match(
    analysisFailureMessage(
      new APIConnectionError({ cause: new TypeError("fetch failed") }),
    ),
    /could not connect to its AI provider/,
  );
  assert.match(
    analysisFailureMessage(new APIConnectionTimeoutError()),
    /timed out/,
  );
  assert.doesNotMatch(
    analysisFailureMessage(new APIConnectionTimeoutError()),
    /canvas/,
  );
});

test("comparison bounds homepage excerpts and retains every competitor's visual evidence", async (t) => {
  const synthesizer = new OpenAIBrandSynthesizer(
    "test-no-network",
    "gpt-6-luna",
  );
  for (const selectionSize of [1, 2, 5]) {
    const competitors = Array.from({ length: selectionSize }, (_, index) => ({
      url: `https://competitor-${index}.example`,
      document: {
        markdown: "Fictional product benefits. ".repeat(4000),
        screenshot: `https://screenshots.example/${index}.png`,
        branding: { colors: { primary: "#123456" } },
      },
    }));
    const request = t.mock.method(globalThis, "fetch", async (input, init) => {
      assert.equal(
        String(input),
        "https://api.openai.com/v1/responses/input_tokens",
      );
      const body = JSON.parse(String(init?.body));
      const content = body.input[1].content;
      const evidence = JSON.parse(content[0].text).competitors;
      assert.deepEqual(
        evidence.map((item: { url: string }) => item.url),
        competitors.map((item) => item.url),
      );
      assert.ok(
        evidence.every(
          (item: { markdown: string }) =>
            item.markdown.startsWith("Fictional product benefits.") &&
            item.markdown.length <= 20_000,
        ),
      );
      assert.ok(
        evidence.reduce(
          (total: number, item: { markdown: string }) =>
            total + item.markdown.length,
          0,
        ) <= 60_000,
      );
      assert.deepEqual(
        evidence.map((item: { branding: unknown }) => item.branding),
        competitors.map((item) => item.document.branding),
      );
      assert.deepEqual(
        content
          .filter((item: { type: string }) => item.type === "input_image")
          .map((item: { image_url: string }) => item.image_url),
        competitors.map((item) => item.document.screenshot),
      );
      // Stop before reservations or generation, after inspecting the real comparison payload.
      return Response.json({ input_tokens: 32_001 });
    });
    await assert.rejects(
      usageContext.run(
        { userId: "test", key: "comparison", operationId: "test" },
        () =>
          synthesizer.compareCompetitors(
            "https://fictional.example",
            {
              companyName: "Fictional",
              summary: "A fictional brand",
              observations: [],
              inferences: [],
              contradictions: [],
              openQuestions: [],
            },
            competitors,
          ),
      ),
      (error) => asAccessError(error)?.code === "INPUT_TOO_LARGE",
    );
    assert.equal(request.mock.callCount(), 1);
    request.mock.restore();
  }
});
