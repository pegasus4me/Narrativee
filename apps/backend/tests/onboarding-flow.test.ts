import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import express from "express";
import cookieParser from "cookie-parser";
import { Pool } from "pg";

test(
  "onboarding profile persists drafts, completion, and account isolation",
  { skip: !process.env.TEST_DATABASE_URL },
  async () => {
    const url = process.env.TEST_DATABASE_URL!;
    assert.match(
      new URL(url).pathname,
      /^\/onboarding_flow_test(?:_[a-z0-9_]+)?$/,
      "Use an empty disposable onboarding_flow_test database",
    );
    process.env.LOCAL_DATABASE_URL = url;
    process.env.BETTER_AUTH_SECRET =
      "isolated-onboarding-flow-test-secret-000000000";
    process.env.BETTER_AUTH_URL = "http://localhost:3002";
    process.env.NODE_ENV = "test";

    const pool = new Pool({ connectionString: url });
    assert.equal(
      (await pool.query(`SELECT to_regclass('public."user"') AS existing`))
        .rows[0].existing,
      null,
      "Test database must be empty",
    );
    for (const name of [
      "0000_windy_toxin.sql",
      "0019_trial_credits.sql",
      "0021_billing.sql",
      "0024_trial_allowance.sql",
      "0025_onboarding_profile.sql",
    ])
      await pool.query(await readFile(`drizzle/${name}`, "utf8"));

    const { auth } = await import("../src/auth/auth");
    const { toNodeHandler } = await import("better-auth/node");
    const { onboardingRouter } = await import(
      "../src/onboarding/onboarding.routes"
    );
    const app = express();
    app.use(cookieParser());
    app.all("/api/auth/*splat", toNodeHandler(auth));
    app.use(express.json());
    app.use("/api/onboarding", onboardingRouter);
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}/api`;
    const call = (path: string, init: RequestInit = {}) =>
      fetch(`${base}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3010",
          ...init.headers,
        },
      });
    const cookieOf = (response: Response) =>
      response.headers
        .getSetCookie()
        .map((item) => item.split(";")[0])
        .join("; ");

    try {
      const firstSignup = await call("/auth/sign-up/email", {
        method: "POST",
        body: JSON.stringify({
          name: "Agency Owner",
          email: `agency-${randomUUID()}@example.test`,
          password: "TestPassword123!",
        }),
      });
      assert.equal(firstSignup.status, 200, await firstSignup.clone().text());
      const firstCookie = cookieOf(firstSignup);
      const secondSignup = await call("/auth/sign-up/email", {
        method: "POST",
        body: JSON.stringify({
          name: "Another Owner",
          email: `owner-${randomUUID()}@example.test`,
          password: "TestPassword123!",
        }),
      });
      assert.equal(secondSignup.status, 200);
      const secondCookie = cookieOf(secondSignup);

      const missing = await call("/onboarding/profile", {
        headers: { Cookie: firstCookie },
      });
      assert.deepEqual(await missing.json(), { profile: null });

      const draft = await call("/onboarding/profile", {
        method: "PUT",
        headers: { Cookie: firstCookie },
        body: JSON.stringify({
          workspaceType: "agency",
          workspaceName: "North Studio",
          agencySize: "6-10",
        }),
      });
      assert.equal(draft.status, 200);
      assert.equal((await draft.json()).profile.completedAt, null);

      const invalid = await call("/onboarding/profile", {
        method: "PUT",
        headers: { Cookie: firstCookie },
        body: JSON.stringify({
          workspaceType: "small_business",
          workspaceName: "North Studio",
          agencySize: "6-10",
        }),
      });
      assert.equal(invalid.status, 400);

      const completed = await call("/onboarding/profile", {
        method: "PUT",
        headers: { Cookie: firstCookie },
        body: JSON.stringify({
          workspaceType: "agency",
          workspaceName: "North Studio",
          agencySize: "6-10",
          complete: true,
        }),
      });
      const completedAt = (await completed.json()).profile.completedAt;
      assert.ok(completedAt);

      const updatedDraft = await call("/onboarding/profile", {
        method: "PUT",
        headers: { Cookie: firstCookie },
        body: JSON.stringify({
          workspaceType: "agency",
          workspaceName: "North Studio Updated",
          agencySize: "11-25",
        }),
      });
      assert.equal(
        (await updatedDraft.json()).profile.completedAt,
        completedAt,
      );

      const other = await call("/onboarding/profile", {
        headers: { Cookie: secondCookie },
      });
      assert.deepEqual(await other.json(), { profile: null });
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      await pool.end();
      const { pool: authPool } = await import("../src/auth/auth");
      await authPool.end();
    }
  },
);
