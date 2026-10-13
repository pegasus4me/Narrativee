import assert from "node:assert/strict";
import { setTimeout } from "node:timers/promises";
import { pathToFileURL } from "node:url";

export async function checkDeployment(
  target,
  baseUrl,
  revision,
  request = fetch,
) {
  assert.ok(
    ["backend", "frontend"].includes(target),
    "Choose backend or frontend",
  );
  const get = (path, headers = {}) =>
    request(new URL(path, baseUrl), {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
  const health = await get(target === "backend" ? "/health" : "/api/health");
  assert.equal(health.status, 200, "The deployed service is not ready");
  const state = await health.json();
  assert.equal(state.status, "ok", "The deployed service is unavailable");
  if (revision)
    assert.equal(
      state.revision,
      revision,
      "The expected release is not serving yet",
    );
  if (target === "backend") {
    const session = await get("/api/auth/get-session");
    assert.equal(session.status, 200, "Auth session endpoint failed");
    assert.equal(
      await session.json(),
      null,
      "Unauthenticated requests must not receive a session",
    );
    const brands = await get("/api/brands", {
      Origin: "https://narrativee.com",
    });
    assert.equal(brands.status, 401, "Brand data must require authentication");
    assert.match(
      brands.headers.get("content-type") ?? "",
      /application\/json/,
      "The API must return JSON instead of a proxy error page",
    );
    assert.equal(
      brands.headers.get("access-control-allow-origin"),
      "https://narrativee.com",
      "Production CORS is not configured",
    );
  } else {
    for (const path of ["/", "/auth/signin", "/workspace/studio"]) {
      const page = await get(path);
      assert.equal(page.status, 200, `Page unavailable: ${path}`);
      assert.match(
        page.headers.get("content-type") ?? "",
        /text\/html/,
        `Invalid page response: ${path}`,
      );
      assert.match(
        await page.text(),
        /Narrativee/i,
        `Wrong application served at ${path}`,
      );
    }
  }
}

async function main() {
  const target = process.argv[2];
  assert.ok(
    ["backend", "frontend"].includes(target),
    "Choose backend or frontend",
  );
  const url = process.env.SMOKE_BASE_URL;
  assert.ok(url, "Set SMOKE_BASE_URL");
  const deadline = Date.now() + 120000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      await checkDeployment(target, url, process.env.EXPECTED_REVISION);
      console.log(`${target}: release is ready; smoke checks passed`);
      return;
    } catch (error) {
      lastError = error;
      await setTimeout(5000);
    }
  }
  throw lastError;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
