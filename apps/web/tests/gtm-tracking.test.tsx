import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useGTMTracking } from "../app/hooks/useGTMTracking";

test("login and signup tracking preserve event data and tolerate unavailable GTM", () => {
  let tracking!: ReturnType<typeof useGTMTracking>;
  function Probe() {
    tracking = useGTMTracking();
    return null;
  }
  renderToStaticMarkup(<Probe />);

  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const dataLayer: Record<string, unknown>[] = [];
  try {
    Reflect.deleteProperty(globalThis, "window");
    assert.doesNotThrow(() => tracking.trackSignUp());
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {},
    });
    assert.doesNotThrow(() => tracking.trackEvent({ eventName: "login" }));
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { dataLayer },
    });
    tracking.trackEvent({
      eventName: "login",
      eventData: { method: "email", value: 1 },
    });
    tracking.trackSignUp();
    tracking.trackSignUp("google");
    assert.deepEqual(dataLayer, [
      { event: "login", method: "email", value: 1 },
      { event: "sign_up", method: "email" },
      { event: "sign_up", method: "google" },
    ]);
  } finally {
    if (previousWindow)
      Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
