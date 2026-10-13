import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import express from "express";
import cookieParser from "cookie-parser";
import { Pool } from "pg";
import { trialStatus } from "../src/usage/trial";

test("trial expires with unused credits at the exact expiry boundary", () => {
  const trialEndsAt = new Date("2026-10-13T12:00:00Z");
  const account = { trialEndsAt, trialCreditsRemaining: 80 };
  assert.equal(
    trialStatus(account, new Date("2026-10-13T11:59:59.999Z")),
    "active",
  );
  assert.equal(trialStatus(account, trialEndsAt), "expired");
  assert.equal(
    trialStatus(
      { ...account, trialCreditsRemaining: 0 },
      new Date("2026-10-10"),
    ),
    "exhausted",
  );
  assert.equal(
    trialStatus({ trialEndsAt: null, trialCreditsRemaining: 0 }),
    "no_trial",
  );
});

test(
  "new accounts receive 80 credits once and expired trials cannot start AI work",
  {
    skip: !process.env.TEST_DATABASE_URL,
  },
  async () => {
    const url = process.env.TEST_DATABASE_URL!;
    assert.match(
      new URL(url).pathname,
      /^\/trial_flow_test_[a-z0-9_]+$/,
      "Use an empty disposable trial_flow_test_* database",
    );
    process.env.LOCAL_DATABASE_URL = url;
    process.env.BETTER_AUTH_SECRET =
      "isolated-trial-flow-test-secret-000000000";
    process.env.BETTER_AUTH_URL = "http://localhost:3002";
    process.env.NODE_ENV = "test";
    process.env.OPENAI_API_KEY = "test-no-network";
    const pool = new Pool({ connectionString: url });
    assert.equal(
      (await pool.query("SELECT to_regclass('public.\"user\"') AS existing"))
        .rows[0].existing,
      null,
    );
    await pool.query(await readFile("drizzle/0000_windy_toxin.sql", "utf8"));
    await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified") VALUES ('legacy', 'Legacy', 'legacy@example.test', false)`,
    );
    for (const file of [
      "0004_site_analysis.sql",
      "0005_competitor_analysis.sql",
      "0006_brands.sql",
      "0007_discovery_messages.sql",
      "0008_studio_projects.sql",
      "0010_brand_brain.sql",
      "0011_brand_brain_discovery.sql",
      "0012_studio_canvas.sql",
      "0014_studio_message_agent.sql",
      "0015_studio_agent_threads.sql",
      "0016_studio_agent_settings.sql",
      "0017_studio_media_models.sql",
      "0018_studio_approvals.sql",
      "0019_trial_credits.sql",
      "0020_studio_project_title.sql",
      "0021_billing.sql",
      "0023_brand_products.sql",
    ])
      await pool.query(await readFile(`drizzle/${file}`, "utf8"));
    const legacy = (
      await pool.query(
        `SELECT trial_credits_remaining, trial_ends_at FROM "user" WHERE id = 'legacy'`,
      )
    ).rows[0];
    assert.equal(legacy.trial_credits_remaining, 0);
    assert.equal(legacy.trial_ends_at, null);

    const { auth } = await import("../src/auth/auth");
    const { toNodeHandler } = await import("better-auth/node");
    const { usageRouter } = await import("../src/usage/usage.routes");
    const { brandRouter } = await import("../src/brands/brand.routes");
    const { brandBrainRouter } = await import(
      "../src/brand-brain/brand-brain.routes"
    );
    const { analysisRouter } = await import("../src/analysis/analysis.routes");
    const { createStudioRouter } = await import("../src/studio/studio.routes");
    const app = express();
    app.use(cookieParser());
    app.all("/api/auth/*splat", toNodeHandler(auth));
    app.use(express.json());
    app.use("/api/usage", usageRouter);
    app.use("/api/brands", brandBrainRouter);
    app.use("/api/brands", brandRouter);
    app.use("/api/site-analyses", analysisRouter);
    app.use("/api/studio/projects", createStudioRouter());
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}/api`;
    const cookieOf = (response: Response) =>
      response.headers
        .getSetCookie()
        .map((item) => item.split(";")[0])
        .join("; ");
    async function call(path: string, cookie = "", body?: object) {
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
    try {
      assert.equal((await call("/usage")).status, 401);
      const beforeSignup = Date.now();
      const signup = await call("/auth/sign-up/email", "", {
        name: "Trial User",
        email: "trial@example.test",
        password: "TestPassword123!",
        trialCreditsRemaining: 99999,
        trialEndsAt: "2099-01-01T00:00:00Z",
      });
      assert.equal(signup.status, 200, await signup.clone().text());
      const cookie = cookieOf(signup);
      const userId = (await signup.json()).user.id;
      const usageResponse = await call("/usage", cookie);
      assert.equal(usageResponse.status, 200);
      assert.equal(usageResponse.headers.get("cache-control"), "no-store");
      const usage = await usageResponse.json();
      assert.equal(usage.trialCreditsRemaining, 80);
      assert.equal(usage.trialStatus, "active");
      const trialDuration =
        new Date(usage.trialEndsAt).getTime() - beforeSignup;
      assert.ok(
        trialDuration >= 168 * 60 * 60 * 1000 &&
          trialDuration < 168 * 60 * 60 * 1000 + 10000,
      );
      const scratch = await call("/brands", cookie, {
        name: "Trial Brand",
        key: randomUUID(),
      });
      assert.equal(scratch.status, 201);
      const brandId = (await scratch.json()).id;
      const project = await call("/studio/projects", cookie, { brandId });
      assert.equal(project.status, 201);
      const projectId = (await project.json()).id;

      await pool.query(
        `UPDATE credit_bucket SET spent=680000 WHERE id='trial:'||$1`,
        [userId],
      );
      await pool.query(
        await readFile("drizzle/0019_trial_credits.sql", "utf8"),
      );
      const login = await call("/auth/sign-in/email", "", {
        email: "trial@example.test",
        password: "TestPassword123!",
      });
      assert.equal(login.status, 200);
      const afterLogin = await (await call("/usage", cookieOf(login))).json();
      assert.equal(afterLogin.trialCreditsRemaining, 12);
      assert.equal(afterLogin.trialEndsAt, usage.trialEndsAt);
      const second = await call("/auth/sign-up/email", "", {
        name: "Other",
        email: "other@example.test",
        password: "TestPassword123!",
      });
      assert.equal(second.status, 200);
      assert.equal(
        (await (await call("/usage", cookieOf(second))).json())
          .trialCreditsRemaining,
        80,
      );
      const override = await call("/auth/update-user", cookie, {
        trialCreditsRemaining: 99999,
        trialEndsAt: "2099-01-01T00:00:00Z",
        name: "Trial User",
      });
      assert.ok(override.status === 200 || override.status === 400);
      assert.equal(
        (await (await call("/usage", cookie)).json()).trialCreditsRemaining,
        12,
      );
      await assert.rejects(
        pool.query(
          `UPDATE "user" SET trial_credits_remaining = -1 WHERE id = $1`,
          [userId],
        ),
        /check constraint/,
      );

      const guardedPaths = [
        ["/brands", { url: "https://example.com", key: randomUUID() }],
        ["/site-analyses", { url: "https://example.com" }],
        [
          `/site-analyses/${randomUUID()}/competitors`,
          { urls: ["https://example.com"] },
        ],
        [`/site-analyses/${randomUUID()}/messages`, { content: "Hello" }],
        [`/studio/projects/${projectId}/research`, {}],
        [`/studio/projects/${projectId}/messages`, { content: "Hello" }],
        [`/studio/projects/${projectId}/messages/stream`, { content: "Hello" }],
        [
          `/studio/projects/${projectId}/creator/stream`,
          { content: "Make an image" },
        ],
        [
          `/studio/projects/${projectId}/approvals/${randomUUID()}/stream`,
          { action: "approve" },
        ],
      ] as const;
      for (const [path, body] of guardedPaths)
        assert.equal(
          (await call(path, "", body)).status,
          401,
          `anonymous: ${path}`,
        );
      for (const status of ["exhausted", "expired"] as const) {
        await pool.query(
          status === "exhausted"
            ? `UPDATE credit_bucket SET spent=800000 WHERE id='trial:'||$1`
            : `UPDATE credit_bucket SET spent=680000,starts_at=now()-interval '168 hours',expires_at=now()-interval '1 second' WHERE id='trial:'||$1`,
          [userId],
        );
        for (const [path, body] of guardedPaths) {
          const blocked = await call(path, cookie, body);
          assert.equal(blocked.status, 402, `${status}: ${path}`);
          assert.equal(
            (await blocked.json()).code,
            status === "expired" ? "TRIAL_EXPIRED" : "TRIAL_CREDITS_EXHAUSTED",
          );
        }
        assert.equal(
          (await (await call("/usage", cookie)).json()).trialStatus,
          status,
        );
        assert.equal(
          (await call(`/studio/projects/${projectId}`, cookie)).status,
          200,
        );
      }
      const preferences = await call(`/brands/${brandId}/brain/items`, cookie, {
        kind: "rule",
        category: "identity",
        content:
          "Onboarding preferences:\nLooking for: Ads\nSocial presence: Instagram",
      });
      assert.equal(preferences.status, 201);
      const preferenceId = (await preferences.json()).id;
      const content =
        "Onboarding preferences:\nLooking for: Campaigns\nSocial presence: Instagram, LinkedIn";
      async function updatePreferences(sessionCookie: string) {
        return fetch(`${base}/brands/${brandId}/brain/items/${preferenceId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: sessionCookie,
          },
          body: JSON.stringify({ content }),
        });
      }
      assert.equal((await updatePreferences(cookieOf(second))).status, 404);
      const updated = await updatePreferences(cookie);
      assert.equal(updated.status, 200);
      assert.equal((await updated.json()).content, content);
      const brain = await (
        await call(`/brands/${brandId}/brain`, cookie)
      ).json();
      assert.equal(
        brain.items.filter((item: { id: string }) => item.id === preferenceId)
          .length,
        1,
      );
      assert.equal(
        brain.items.find((item: { id: string }) => item.id === preferenceId)
          .content,
        content,
      );
      await pool.query(
        `INSERT INTO "user" (id, name, email, "emailVerified") VALUES ('provider-user', 'Provider', 'provider@example.test', true)`,
      );
      assert.equal(
        (
          await pool.query(
            `SELECT trial_credits_remaining FROM "user" WHERE id = 'provider-user'`,
          )
        ).rows[0].trial_credits_remaining,
        80,
      );
      const decline = await call(
        `/studio/projects/${projectId}/approvals/${randomUUID()}/stream`,
        cookie,
        { action: "reject" },
      );
      assert.notEqual(decline.status, 402);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      await pool.end();
    }
  },
);
