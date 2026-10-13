import assert from "node:assert/strict";
import test from "node:test";
import { checkDeployment } from "./smoke-deployment.mjs";

test("backend smoke checks reject stale releases, broken auth, and public brand data", async () => {
  function backend({
    revision = "release",
    session = null,
    brandStatus = 401,
  } = {}) {
    return async (url) => {
      if (url.pathname === "/health")
        return Response.json({ status: "ok", revision });
      if (url.pathname === "/api/auth/get-session")
        return Response.json(session);
      return Response.json(
        {},
        {
          status: brandStatus,
          headers: { "access-control-allow-origin": "https://narrativee.com" },
        },
      );
    };
  }
  await checkDeployment(
    "backend",
    "https://example.test",
    "release",
    backend(),
  );
  await assert.rejects(
    checkDeployment(
      "backend",
      "https://example.test",
      "release",
      backend({ revision: "old" }),
    ),
    /expected release/,
  );
  await assert.rejects(
    checkDeployment(
      "backend",
      "https://example.test",
      "release",
      backend({ session: { user: {} } }),
    ),
    /must not receive a session/,
  );
  await assert.rejects(
    checkDeployment(
      "backend",
      "https://example.test",
      "release",
      backend({ brandStatus: 200 }),
    ),
    /require authentication/,
  );
});

test("frontend smoke checks verify the release and real application pages", async () => {
  const paths = [];
  const request = async (url) => {
    paths.push(url.pathname);
    return url.pathname === "/api/health"
      ? Response.json({ status: "ok", revision: "release" })
      : new Response("<!doctype html><title>Narrativee</title>", {
          headers: { "content-type": "text/html" },
        });
  };
  await checkDeployment("frontend", "https://example.test", "release", request);
  assert.deepEqual(paths, [
    "/api/health",
    "/",
    "/auth/signin",
    "/workspace/studio",
  ]);
  await assert.rejects(
    checkDeployment(
      "frontend",
      "https://example.test",
      "release",
      async () => new Response("Failed", { status: 503 }),
    ),
    /not ready/,
  );
});
