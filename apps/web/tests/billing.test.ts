import assert from "node:assert/strict";
import test from "node:test";
import {
  billingFetch,
  notifyBilling,
  UPGRADE_REQUIRED,
  USAGE_CHANGED,
} from "../lib/api/billing";

test("billing requests surface the exact blocked reason without consuming the response", async () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const target = new EventTarget();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: target,
  });
  const reasons: string[] = [];
  let refreshes = 0;
  target.addEventListener(UPGRADE_REQUIRED, (event) =>
    reasons.push((event as CustomEvent<string>).detail),
  );
  target.addEventListener(USAGE_CHANGED, () => refreshes++);
  try {
    globalThis.fetch = async (_input, init) => {
      assert.equal(
        new Headers(init?.headers).get("Idempotency-Key"),
        "retry-key",
      );
      return Response.json(
        { code: "TRIAL_EXPIRED", error: "Trial ended" },
        { status: 402 },
      );
    };
    const response = await billingFetch("http://localhost/api/studio", {
      method: "POST",
      headers: { "Idempotency-Key": "retry-key" },
    });
    const body = (await response.json()) as { error: string };
    assert.equal(body.error, "Trial ended");
    assert.deepEqual(reasons, ["TRIAL_EXPIRED"]);
    assert.ok(refreshes > 0);
    notifyBilling("MODEL_UNPRICED");
    assert.equal(reasons.length, 1);
    notifyBilling("PAID_CREDITS_EXHAUSTED");
    assert.deepEqual(reasons, ["TRIAL_EXPIRED", "PAID_CREDITS_EXHAUSTED"]);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalWindow)
      Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
