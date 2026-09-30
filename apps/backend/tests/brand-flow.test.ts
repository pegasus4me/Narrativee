import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import express from "express";
import cookieParser from "cookie-parser";
import { Pool } from "pg";

test("brand persistence, guest claim, isolation, idempotency and legacy migration", async () => {
  const url = process.env.TEST_DATABASE_URL;
  assert.ok(
    url && new URL(url).pathname === "/brand_flow_test",
    "Use an empty isolated brand_flow_test database",
  );
  process.env.LOCAL_DATABASE_URL = url;
  process.env.BETTER_AUTH_SECRET = "isolated-brand-flow-test-secret-0000000000";
  process.env.BETTER_AUTH_URL = "http://localhost:3002";
  process.env.FIRECRAWL_API_KEY = "test-no-network";
  process.env.OPENAI_API_KEY = "test-no-network";
  const pool = new Pool({ connectionString: url });
  const tables = await pool.query(
    "SELECT to_regclass('public.brand') AS existing",
  );
  assert.equal(tables.rows[0].existing, null, "Test database must be empty");
  for (const file of [
    "0000_windy_toxin.sql",
    "0004_site_analysis.sql",
    "0005_competitor_analysis.sql",
    "0006_brands.sql",
    "0006_brands.sql",
  ]) {
    await pool.query(await readFile(`drizzle/${file}`, "utf8"));
  }

  const { auth } = await import("../src/auth/auth");
  const { toNodeHandler } = await import("better-auth/node");
  const { AnalysisService } = await import("../src/analysis/analysis.service");
  const { brandRouter } = await import("../src/brands/brand.routes");
  const { analysisRouter } = await import("../src/analysis/analysis.routes");
  const originalRun = AnalysisService.prototype.run;
  let runs = 0;
  AnalysisService.prototype.run = async () => {
    runs += 1;
  };
  const app = express();
  app.use(cookieParser());
  app.all("/api/auth/*splat", toNodeHandler(auth));
  app.use(express.json());
  app.use("/api/brands", brandRouter);
  app.use("/api/site-analyses", analysisRouter);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api`;
  async function call(path: string, body?: object, cookie = "") {
    return fetch(`${base}${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3010",
        Cookie: cookie,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }
  const cookieOf = (response: Response) =>
    response.headers
      .getSetCookie()
      .map((item) => item.split(";")[0])
      .join("; ");

  try {
    const signup = await call("/auth/sign-up/email", {
      name: "Brand Owner",
      email: "owner@example.test",
      password: "TestPassword123!",
    });
    assert.equal(signup.status, 200, await signup.clone().text());
    const ownerCookie = cookieOf(signup);
    const owner = (await signup.json()).user;
    const otherSignup = await call("/auth/sign-up/email", {
      name: "Other Owner",
      email: "other@example.test",
      password: "TestPassword123!",
    });
    assert.equal(otherSignup.status, 200);
    const otherCookie = cookieOf(otherSignup);

    const scratch = await call(
      "/brands",
      { name: "No website", key: randomUUID() },
      ownerCookie,
    );
    assert.equal(scratch.status, 201);
    const scratchBrand = await scratch.json();
    assert.equal(scratchBrand.url, null);
    assert.equal(scratchBrand.analysisId, null);
    assert.equal(runs, 0);
    assert.equal(
      (await call(`/brands/${scratchBrand.id}`, undefined, otherCookie)).status,
      404,
    );
    assert.equal((await call(`/brands/${scratchBrand.id}`)).status, 404);
    const login = await call("/auth/sign-in/email", {
      email: "owner@example.test",
      password: "TestPassword123!",
    });
    assert.equal(login.status, 200);
    assert.equal(
      (await (await call("/brands", undefined, cookieOf(login))).json())[0].id,
      scratchBrand.id,
    );

    const input = {
      url: "https://www.example.com/CaseSensitive",
      key: randomUUID(),
    };
    const [first, second] = await Promise.all([
      call("/brands", input),
      call("/brands", input),
    ]);
    assert.deepEqual([first.status, second.status].sort(), [200, 201]);
    const guest = await first.json();
    assert.equal(guest.id, (await second.json()).id);
    assert.equal(guest.url, input.url);
    assert.equal(runs, 1);
    const guestCookie = cookieOf(first);
    assert.match(first.headers.get("set-cookie")!, /HttpOnly/i);
    assert.equal((await call(`/brands/${guest.id}`)).status, 404);
    assert.equal(
      (await call(`/site-analyses/${guest.analysisId}`)).status,
      404,
    );
    assert.equal(
      (await call(`/site-analyses/${guest.analysisId}`, undefined, guestCookie))
        .status,
      200,
    );
    assert.equal(
      (
        await call(
          `/site-analyses/${guest.analysisId}/competitors`,
          { urls: ["https://example.org"] },
          otherCookie,
        )
      ).status,
      404,
    );
    assert.equal(
      (await call(`/brands/${guest.id}/claim`, {}, ownerCookie)).status,
      404,
    );
    const claim = await call(
      `/brands/${guest.id}/claim`,
      {},
      `${ownerCookie}; ${guestCookie}`,
    );
    assert.equal(claim.status, 200);
    assert.equal((await claim.json()).provisional, false);
    assert.equal(
      (await call(`/brands/${guest.id}/claim`, {}, ownerCookie)).status,
      200,
    );
    assert.equal(
      (
        await call(
          `/brands/${guest.id}/claim`,
          {},
          `${otherCookie}; ${guestCookie}`,
        )
      ).status,
      404,
    );
    assert.equal(
      (await call(`/brands/${guest.id}`, undefined, guestCookie)).status,
      404,
    );
    assert.equal(
      (await call(`/site-analyses/${guest.analysisId}`, undefined, ownerCookie))
        .status,
      200,
    );
    const savedBrands = await (
      await call("/brands", undefined, ownerCookie)
    ).json();
    assert.equal(
      savedBrands.find((record: { id: string }) => record.id === guest.id)
        ?.analysisId,
      guest.analysisId,
      "The brand list must include its latest analysis for Discovery",
    );
    assert.equal(
      savedBrands.find((record: { id: string }) => record.id === scratchBrand.id)
        ?.analysisId,
      null,
    );
    assert.equal(runs, 1, "Claim must not restart a scan");
    const secrets = await pool.query(
      "SELECT guest_token_hash FROM brand WHERE id=$1",
      [guest.id],
    );
    assert.equal(secrets.rows[0].guest_token_hash, null);

    const legacyId = randomUUID();
    const anonymousId = randomUUID();
    await pool.query(
      "INSERT INTO site_analysis (id,user_id,url) VALUES ($1,$2,'https://legacy.example.com'),($3,NULL,'https://anonymous.example.com')",
      [legacyId, owner.id, anonymousId],
    );
    assert.equal(
      (await call(`/brands/from-analysis/${legacyId}`, {}, otherCookie)).status,
      403,
    );
    const [converted, repeated] = await Promise.all([
      call(`/brands/from-analysis/${legacyId}`, {}, ownerCookie),
      call(`/brands/from-analysis/${legacyId}`, {}, ownerCookie),
    ]);
    assert.equal(converted.status, 200);
    assert.equal((await converted.json()).id, (await repeated.json()).id);
    assert.equal(
      (await call(`/brands/from-analysis/${anonymousId}`, {}, ownerCookie))
        .status,
      403,
    );
    assert.equal(
      (await call(`/site-analyses/${anonymousId}`)).status,
      200,
      "Old anonymous read links remain valid",
    );
    assert.equal(
      (await call("/brands", { name: " ", key: randomUUID() }, ownerCookie))
        .status,
      400,
    );
    assert.equal(
      (
        await call(
          "/brands",
          { url: "http://localhost", key: randomUUID() },
          ownerCookie,
        )
      ).status,
      400,
    );
    assert.equal(
      (await call("/brands/not-an-id", undefined, ownerCookie)).status,
      400,
    );
    assert.equal(
      (await (await call("/brands", undefined, otherCookie)).json()).length,
      0,
    );
    const rls = await pool.query(
      "SELECT relrowsecurity FROM pg_class WHERE relname IN ('brand','site_analysis')",
    );
    assert.ok(rls.rows.every((item) => item.relrowsecurity));
  } finally {
    AnalysisService.prototype.run = originalRun;
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await pool.end();
  }
});
