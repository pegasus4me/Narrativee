import assert from "node:assert/strict";
import test from "node:test";
import {
  APIError,
  APIConnectionError,
  APIConnectionTimeoutError,
} from "openai";
import { agentFailureMessage } from "../src/studio/agent-errors";
import { AccessError, billingError } from "../src/billing/catalog";
import { assertImageModelConnected } from "../src/studio/media-models";

test("unconnected media models retain actionable settings feedback", () => {
  for (const model of ["nano-banana", "seedream"]) {
    try {
      assertImageModelConnected(model);
      assert.fail("Unconnected model should fail");
    } catch (error) {
      const campaign = Object.assign(new Error("Campaign failed"), {
        cause: error,
      });
      assert.match(agentFailureMessage(campaign), /not connected yet/);
      assert.match(agentFailureMessage(campaign), /Image settings/);
    }
  }
});

test("internal billing failures wrapped by the SDK retain their real cause", () => {
  const access = new AccessError(
    "MODEL_UNPRICED",
    "This image model has no verified billing configuration.",
    503,
  );
  const sdk = new APIConnectionError({ cause: access });
  const campaign = Object.assign(new Error(sdk.message), { cause: sdk });
  assert.equal(agentFailureMessage(campaign), access.message);
  assert.deepEqual(billingError(campaign), {
    code: access.code,
    error: access.message,
  });
  const connection = Object.assign(new Error("Connection error."), {
    cause: new APIConnectionError({ cause: new TypeError("fetch failed") }),
  });
  assert.match(agentFailureMessage(connection), /could not reach/);
});

test("agent failures identify provider causes without exposing provider payloads or internal errors", () => {
  for (const [status, code, expected] of [
    [401, "invalid_api_key", /rejected access/],
    [404, "model_not_found", /model is unavailable/],
    [429, "insufficient_quota", /no available credits/],
    [429, "rate_limit", /rate-limiting/],
    [400, "context_length_exceeded", /conversation exceeds/],
    [400, "unsupported_parameter", /model rejected/],
    [503, "unavailable", /temporarily unavailable/],
  ] as const) {
    const error = new APIError(
      status,
      { code },
      "private-payload",
      new Headers(),
    );
    assert.match(agentFailureMessage(error), expected);
    assert.doesNotMatch(agentFailureMessage(error), /private-payload/);
  }
  assert.match(
    agentFailureMessage(new APIConnectionTimeoutError()),
    /timed out/,
  );
  assert.match(
    agentFailureMessage(new APIConnectionError({ message: "private-payload" })),
    /could not reach/,
  );
  assert.doesNotMatch(
    agentFailureMessage(new Error("private SQL query or secret")),
    /private SQL|secret/,
  );
});
