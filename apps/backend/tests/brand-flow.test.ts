import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import express from "express";
import cookieParser from "cookie-parser";
import { Pool } from "pg";

test(
  "brand persistence, guest claim, isolation, idempotency and legacy migration",
  { skip: !process.env.TEST_DATABASE_URL },
  async () => {
    const url = process.env.TEST_DATABASE_URL;
    assert.ok(
      url && /^\/brand_flow_test(?:_[a-z0-9_]+)?$/.test(new URL(url).pathname),
      "Use an empty isolated brand_flow_test database",
    );
    process.env.LOCAL_DATABASE_URL = url;
    process.env.BETTER_AUTH_SECRET =
      "isolated-brand-flow-test-secret-0000000000";
    process.env.BETTER_AUTH_URL = "http://localhost:3002";
    process.env.FIRECRAWL_API_KEY = "test-no-network";
    process.env.OPENAI_API_KEY = "test-no-network";
    process.env.NODE_ENV = "test";
    const imageDirectory = await mkdtemp(
      join(tmpdir(), "narrativee-brand-remove-"),
    );
    process.env.BRAND_BRAIN_LOCAL_DIR = imageDirectory;
    for (const key of [
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET",
    ])
      delete process.env[key];
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
    ]) {
      await pool.query(await readFile(`drizzle/${file}`, "utf8"));
    }

    const { auth } = await import("../src/auth/auth");
    const { toNodeHandler } = await import("better-auth/node");
    const { AnalysisService } = await import(
      "../src/analysis/analysis.service"
    );
    const { brandRouter } = await import("../src/brands/brand.routes");
    const { analysisRouter } = await import("../src/analysis/analysis.routes");
    const { uploadAsset, readAsset } = await import(
      "../src/brand-brain/storage"
    );
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
    async function call(
      path: string,
      body?: object,
      cookie = "",
      method = body ? "POST" : "GET",
    ) {
      return fetch(`${base}${path}`, {
        method,
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
        (await call(`/brands/${scratchBrand.id}`, undefined, otherCookie))
          .status,
        404,
      );
      assert.equal((await call(`/brands/${scratchBrand.id}`)).status, 404);
      const login = await call("/auth/sign-in/email", {
        email: "owner@example.test",
        password: "TestPassword123!",
      });
      assert.equal(login.status, 200);
      assert.equal(
        (await (await call("/brands", undefined, cookieOf(login))).json())[0]
          .id,
        scratchBrand.id,
      );

      const website = {
        url: "https://www.example.com/CaseSensitive",
        key: randomUUID(),
      };
      assert.equal(
        (await call("/brands", website)).status,
        401,
        "Website scans require an authenticated trial",
      );
      const [ownedFirst, ownedSecond] = await Promise.all([
        call("/brands", website, ownerCookie),
        call("/brands", website, ownerCookie),
      ]);
      assert.deepEqual(
        [ownedFirst.status, ownedSecond.status].sort(),
        [200, 201],
      );
      const ownedWebsite = await ownedFirst.json();
      assert.equal(ownedWebsite.id, (await ownedSecond.json()).id);
      assert.equal(ownedWebsite.url, website.url);
      assert.equal(runs, 1);
      const input = { name: "Legacy guest brand", key: randomUUID() };
      const [first, second] = await Promise.all([
        call("/brands", input),
        call("/brands", input),
      ]);
      assert.deepEqual([first.status, second.status].sort(), [200, 201]);
      const guest = await first.json();
      assert.equal(guest.id, (await second.json()).id);
      assert.equal(guest.url, null);
      // Existing guest brands may have research saved before authenticated trial entry.
      await pool.query("UPDATE brand SET url=$1 WHERE id=$2", [
        website.url,
        guest.id,
      ]);
      guest.analysisId = (
        await pool.query(
          "INSERT INTO site_analysis (brand_id,url) VALUES ($1,$2) RETURNING id",
          [guest.id, website.url],
        )
      ).rows[0].id;
      assert.equal(runs, 1);
      const guestCookie = cookieOf(first);
      assert.match(first.headers.get("set-cookie")!, /HttpOnly/i);
      assert.equal((await call(`/brands/${guest.id}`)).status, 404);
      assert.equal(
        (await call(`/site-analyses/${guest.analysisId}`)).status,
        404,
      );
      assert.equal(
        (
          await call(
            `/site-analyses/${guest.analysisId}`,
            undefined,
            guestCookie,
          )
        ).status,
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
        (
          await call(
            `/site-analyses/${guest.analysisId}`,
            undefined,
            ownerCookie,
          )
        ).status,
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
        savedBrands.find(
          (record: { id: string }) => record.id === scratchBrand.id,
        )?.analysisId,
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
        (await call(`/brands/from-analysis/${legacyId}`, {}, otherCookie))
          .status,
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

      const projectId = randomUUID();
      const removedAnalysisId = randomUUID();
      const objectKey = `${scratchBrand.id}/${randomUUID()}.png`;
      await uploadAsset(objectKey, Buffer.from("fixture"), "image/png");
      await pool.query(
        "INSERT INTO site_analysis (id,brand_id,user_id,url) VALUES ($1,$2,$3,'https://removed.example')",
        [removedAnalysisId, scratchBrand.id, owner.id],
      );
      await pool.query(
        "INSERT INTO discovery_message (analysis_id,role,content) VALUES ($1,'user','Remove this history')",
        [removedAnalysisId],
      );
      await pool.query(
        "INSERT INTO studio_project (id,brand_id,user_id) VALUES ($1,$2,$3)",
        [projectId, scratchBrand.id, owner.id],
      );
      await pool.query(
        "INSERT INTO studio_message (project_id,role,content) VALUES ($1,'user','Remove this project')",
        [projectId],
      );
      await pool.query(
        "INSERT INTO brand_brain_item (brand_id,kind,category,content) VALUES ($1,'rule','identity','Old brand')",
        [scratchBrand.id],
      );
      await pool.query(
        "INSERT INTO brand_brain_asset (brand_id,kind,category,object_key,filename,mime_type,bytes,width,height,archived_at) VALUES ($1,'rule','identity',$2,'old.png','image/png',7,1,1,now())",
        [scratchBrand.id, objectKey],
      );
      const removePath = `/brands/${scratchBrand.id}`;
      assert.equal(
        (await call(removePath, undefined, "", "DELETE")).status,
        401,
      );
      assert.equal(
        (await call(removePath, undefined, otherCookie, "DELETE")).status,
        404,
      );
      assert.equal(
        (await call("/brands/not-an-id", undefined, ownerCookie, "DELETE"))
          .status,
        400,
      );
      const blockedOrigin = await fetch(`${base}${removePath}`, {
        method: "DELETE",
        headers: { Cookie: ownerCookie, Origin: "https://evil.example" },
      });
      assert.equal(blockedOrigin.status, 403);
      assert.deepEqual(await readAsset(objectKey), Buffer.from("fixture"));
      const removed = await call(removePath, undefined, ownerCookie, "DELETE");
      assert.equal(removed.status, 200, await removed.clone().text());
      assert.deepEqual(await removed.json(), {
        projectIds: [projectId],
        analysisIds: [removedAnalysisId],
        warning: null,
      });
      assert.equal(
        (await call(removePath, undefined, ownerCookie)).status,
        404,
      );
      assert.equal(
        (await call(removePath, undefined, ownerCookie, "DELETE")).status,
        404,
      );
      await assert.rejects(readAsset(objectKey), { code: "ENOENT" });
      for (const [table, column, id] of [
        ["site_analysis", "id", removedAnalysisId],
        ["discovery_message", "analysis_id", removedAnalysisId],
        ["studio_project", "id", projectId],
        ["studio_message", "project_id", projectId],
        ["brand_brain_item", "brand_id", scratchBrand.id],
        ["brand_brain_asset", "brand_id", scratchBrand.id],
      ]) {
        assert.equal(
          (
            await pool.query(
              `SELECT count(*)::int AS count FROM ${table} WHERE ${column}=$1`,
              [id],
            )
          ).rows[0].count,
          0,
          `${table} must be removed`,
        );
      }
      assert.equal(
        (await call(`/brands/${guest.id}`, undefined, ownerCookie)).status,
        200,
        "Other brands must remain intact",
      );
    } finally {
      AnalysisService.prototype.run = originalRun;
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      await pool.end();
      await rm(imageDirectory, { recursive: true, force: true });
    }
  },
);
