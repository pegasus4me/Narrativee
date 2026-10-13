import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import express from "express";
import cookieParser from "cookie-parser";
import { Pool } from "pg";
import sharp from "sharp";

test(
  "Discovery populates Brand Brain and authenticated sync preserves human decisions",
  {
    skip: !process.env.TEST_DATABASE_URL,
  },
  async () => {
    const url = process.env.TEST_DATABASE_URL!;
    assert.match(
      new URL(url).pathname,
      /^\/brand_brain_sync_test_[a-z0-9_]+$/,
      "Use an isolated, empty brand_brain_sync_test_* database",
    );
    process.env.LOCAL_DATABASE_URL = url;
    process.env.BRAND_BRAIN_LOCAL_DIR = await mkdtemp(
      join(tmpdir(), "narrativee-discovery-test-"),
    );
    process.env.NODE_ENV = "test";
    for (const key of [
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET",
    ])
      delete process.env[key];
    process.env.BETTER_AUTH_SECRET =
      "isolated-brand-brain-test-secret-0000000000";
    process.env.BETTER_AUTH_URL = "http://localhost:3002";
    process.env.OPENAI_API_KEY = "test-no-network";
    const pool = new Pool({ connectionString: url });
    assert.equal(
      (await pool.query("SELECT to_regclass('public.brand') AS existing"))
        .rows[0].existing,
      null,
    );
    for (const file of [
      "0000_windy_toxin.sql",
      "0004_site_analysis.sql",
      "0005_competitor_analysis.sql",
      "0006_brands.sql",
      "0007_discovery_messages.sql",
      "0010_brand_brain.sql",
      "0011_brand_brain_discovery.sql",
      "0019_trial_credits.sql",
      "0020_studio_project_title.sql",
      "0021_billing.sql",
      "0023_brand_products.sql",
    ]) {
      await pool.query(await readFile(`drizzle/${file}`, "utf8"));
    }
    const { auth } = await import("../src/auth/auth");
    const { toNodeHandler } = await import("better-auth/node");
    const { brandBrainRouter } = await import(
      "../src/brand-brain/brand-brain.routes"
    );
    const { syncWebsiteBrain } = await import(
      "../src/brand-brain/website-sync"
    );
    const { loadBrandBrainContext } = await import(
      "../src/brand-brain/context"
    );
    const { AnalysisService } = await import(
      "../src/analysis/analysis.service"
    );
    const { FirecrawlClient } = await import(
      "../src/analysis/firecrawl.client"
    );
    const { OpenAIBrandSynthesizer } = await import(
      "../src/analysis/openai-brand-synthesizer"
    );
    const app = express();
    app.use(cookieParser());
    app.all("/api/auth/*splat", toNodeHandler(auth));
    app.use(express.json());
    app.use("/api/brands", brandBrainRouter);
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}/api`;
    const call = (path: string, cookie = "", body?: object, method = "GET") =>
      fetch(`${base}${path}`, {
        method,
        headers: {
          Cookie: cookie,
          Origin: "http://localhost:3010",
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    try {
      const signup = await call(
        "/auth/sign-up/email",
        "",
        {
          name: "Kit Owner",
          email: "kit-owner@example.test",
          password: "TestPassword123!",
        },
        "POST",
      );
      assert.equal(signup.status, 200);
      const owner = await signup.json();
      const cookie = signup.headers
        .getSetCookie()
        .map((value) => value.split(";")[0])
        .join("; ");
      const brandId = randomUUID();
      await pool.query(
        "INSERT INTO brand (id, name, url, user_id) VALUES ($1, $2, $3, $4)",
        [brandId, "Acme", "https://acme.example/", owner.user.id],
      );
      const image = await sharp({
        create: { width: 24, height: 16, channels: 4, background: "#123456" },
      })
        .png()
        .toBuffer();
      const document = {
        branding: {
          logo: `data:image/png;base64,${image.toString("base64")}`,
          colors: { primary: "#123456", accent: "#ABCDEF" },
          typography: { fontFamilies: { primary: "Inter" } },
          images: { ogImage: "http://127.0.0.1/not-allowed.png" },
        },
      };
      const diagnosis = {
        companyName: "Acme",
        summary: "Widgets for teams",
        observations: [],
        inferences: [],
        contradictions: [],
        openQuestions: [],
      };
      const firecrawl = new FirecrawlClient("test");
      firecrawl.scrapeHomepage = async () => document;
      firecrawl.searchWeb = async () => [
        { url: "https://competitor.example/", title: "A competitor" },
      ];
      const synthesizer = new OpenAIBrandSynthesizer("test");
      synthesizer.synthesize = async () => diagnosis;
      synthesizer.planCompetitorResearch = async () => ({
        searches: [
          { angle: "direct", query: "direct widget alternatives" },
          { angle: "workflow", query: "widget workflow tools" },
          { angle: "substitute", query: "widget substitute tools" },
        ],
      });
      synthesizer.discoverCompetitors = async () => [];
      const service = new AnalysisService(firecrawl, synthesizer);
      const analysisId = await service.create(
        "https://acme.example/",
        owner.user.id,
      );
      await pool.query("UPDATE site_analysis SET brand_id = $1 WHERE id = $2", [
        brandId,
        analysisId,
      ]);
      await service.run(analysisId, "https://acme.example/");
      // Joins the automatic import started by Discovery; no real API is called.
      await syncWebsiteBrain(brandId);
      const endpoint = `/brands/${brandId}/brain`;
      assert.equal(
        (await call(`${endpoint}/sync`, "", undefined, "POST")).status,
        401,
      );
      assert.equal(
        (
          await call(
            `/brands/${randomUUID()}/brain/sync`,
            cookie,
            undefined,
            "POST",
          )
        ).status,
        404,
      );
      const initial = await (await call(endpoint, cookie)).json();
      assert.equal(initial.items.length, 3);
      assert.equal(initial.assets.length, 1);
      assert.equal(initial.assets[0].source, "discovery");
      assert.equal(initial.assets[0].sourceUrl, "https://acme.example/");
      assert.equal(
        (
          await call(
            `${endpoint}/assets/${initial.assets[0].id}/approve`,
            cookie,
            undefined,
            "POST",
          )
        ).status,
        204,
      );
      assert.equal(
        (await loadBrandBrainContext(brandId)).assets[0].source,
        "user",
      );
      assert.equal(
        (await call(`${endpoint}/assets/${initial.assets[0].id}`, cookie))
          .status,
        200,
      );
      assert.equal(
        (await loadBrandBrainContext(brandId)).approvedRules.length,
        0,
      );
      assert.equal(
        (await loadBrandBrainContext(brandId)).websiteObservations.length,
        3,
      );
      const again = await call(`${endpoint}/sync`, cookie, undefined, "POST");
      const repeated = await again.json();
      assert.equal(repeated.imported, 0);
      assert.equal(
        repeated.warnings.length,
        1,
        "Image failure must not block the rest of the kit",
      );
      const primary = initial.items.find((item: { content: string }) =>
        item.content.startsWith("Primary:"),
      );
      assert.equal(
        (
          await call(
            `${endpoint}/items/${primary.id}/approve`,
            cookie,
            undefined,
            "POST",
          )
        ).status,
        200,
      );
      assert.equal(
        (await loadBrandBrainContext(brandId)).approvedRules.length,
        1,
      );
      const accent = initial.items.find((item: { content: string }) =>
        item.content.startsWith("Accent:"),
      );
      await call(`${endpoint}/items/${accent.id}`, cookie, undefined, "DELETE");
      await call(
        `${endpoint}/assets/${initial.assets[0].id}`,
        cookie,
        undefined,
        "DELETE",
      );
      await call(
        `${endpoint}/items`,
        cookie,
        { kind: "rule", category: "color", content: "Accent: #654321" },
        "POST",
      );
      const changed = {
        ...document,
        branding: {
          ...document.branding,
          colors: {
            primary: "#000000",
            accent: "#000000",
            secondary: "#111111",
          },
        },
      };
      await pool.query(
        "UPDATE site_analysis SET raw_document = $1 WHERE id = $2",
        [changed, analysisId],
      );
      await call(`${endpoint}/sync`, cookie, undefined, "POST");
      const final = await (await call(endpoint, cookie)).json();
      assert.equal(final.assets.length, 0, "Archived logo must not return");
      assert.ok(
        final.items.some(
          (item: { content: string }) => item.content === "Primary: #123456",
        ),
        "Approved color must not change",
      );
      assert.ok(
        final.items.some(
          (item: { content: string }) => item.content === "Accent: #654321",
        ),
      );
      assert.ok(
        final.items.every(
          (item: { content: string }) => !item.content.includes("#000000"),
        ),
      );
      assert.ok(
        final.items.some(
          (item: { content: string }) => item.content === "Secondary: #111111",
        ),
        "Other missing roles can still be filled",
      );
      const backfillId = randomUUID();
      await pool.query(
        "INSERT INTO brand (id, name, url, user_id) VALUES ($1, $2, $3, $4)",
        [backfillId, "Older brand", "https://acme.example/", owner.user.id],
      );
      await pool.query(
        "INSERT INTO site_analysis (brand_id, url, raw_document, diagnosis) VALUES ($1, $2, $3, $4)",
        [backfillId, "https://acme.example/", document, diagnosis],
      );
      const backfill = await loadBrandBrainContext(backfillId);
      assert.equal(
        backfill.websiteObservations.length,
        3,
        "Designer reads backfilled context without visiting the kit",
      );
      assert.equal(
        backfill.assets.length,
        0,
        "Reply context must not wait for image downloads",
      );
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      await pool.end();
      await rm(process.env.BRAND_BRAIN_LOCAL_DIR!, {
        recursive: true,
        force: true,
      });
    }
  },
);
