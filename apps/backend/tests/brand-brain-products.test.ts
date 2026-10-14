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
  "products and private photos persist, stay within their brand, and archive together",
  {
    skip: !process.env.TEST_DATABASE_URL,
  },
  async () => {
    const url = process.env.TEST_DATABASE_URL!;
    assert.match(new URL(url).pathname, /^\/brand_products_test_[a-z0-9_]+$/);
    process.env.LOCAL_DATABASE_URL = url;
    process.env.BRAND_BRAIN_LOCAL_DIR = await mkdtemp(
      join(tmpdir(), "narrativee-products-test-"),
    );
    process.env.NODE_ENV = "test";
    process.env.BETTER_AUTH_SECRET =
      "isolated-product-test-secret-000000000000000";
    process.env.BETTER_AUTH_URL = "http://localhost:3002";
    for (const key of [
      "SUPABASE_STORAGE_ENDPOINT",
      "SUPABASE_STORAGE_REGION",
      "SUPABASE_STORAGE_ACCESS_KEY_ID",
      "SUPABASE_STORAGE_SECRET_ACCESS_KEY",
      "SUPABASE_STORAGE_BUCKET",
    ])
      delete process.env[key];
    const pool = new Pool({ connectionString: url });
    for (const file of [
      "0000_windy_toxin.sql",
      "0004_site_analysis.sql",
      "0005_competitor_analysis.sql",
      "0006_brands.sql",
      "0007_discovery_messages.sql",
      "0008_studio_projects.sql",
      "0010_brand_brain.sql",
      "0011_brand_brain_discovery.sql",
      "0019_trial_credits.sql",
      "0020_studio_project_title.sql",
      "0021_billing.sql",
      "0023_brand_products.sql",
      "0024_trial_allowance.sql",
    ]) {
      await pool.query(await readFile(`drizzle/${file}`, "utf8"));
    }
    // The deployment runner replays additive migrations; this one must be safe twice.
    await pool.query(await readFile("drizzle/0023_brand_products.sql", "utf8"));
    const { auth, pool: authPool } = await import("../src/auth/auth");
    const { toNodeHandler } = await import("better-auth/node");
    const { brandBrainRouter } = await import(
      "../src/brand-brain/brand-brain.routes"
    );
    const { loadBrandBrainContext } = await import(
      "../src/brand-brain/context"
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
      async function signup(email: string) {
        const response = await call(
          "/auth/sign-up/email",
          "",
          { name: "Product owner", email, password: "TestPassword123!" },
          "POST",
        );
        assert.equal(response.status, 200);
        return {
          id: (await response.json()).user.id,
          cookie: response.headers
            .getSetCookie()
            .map((value) => value.split(";")[0])
            .join("; "),
        };
      }
      const owner = await signup("products-owner@example.test");
      const stranger = await signup("products-stranger@example.test");
      const brandId = randomUUID();
      const otherBrandId = randomUUID();
      for (const id of [brandId, otherBrandId])
        await pool.query(
          "INSERT INTO brand (id, name, url, user_id) VALUES ($1, 'Acme', 'https://acme.example/', $2)",
          [id, owner.id],
        );
      const endpoint = `/brands/${brandId}/brain`;
      const fields = {
        name: " Orange chocolate ",
        description: " Dark chocolate with orange, 100 g. ",
      };
      assert.equal(
        (await call(`${endpoint}/products`, "", fields, "POST")).status,
        401,
      );
      assert.equal(
        (await call(`${endpoint}/products`, stranger.cookie, fields, "POST"))
          .status,
        404,
      );
      assert.equal(
        (
          await call(
            `${endpoint}/products`,
            owner.cookie,
            { ...fields, name: " " },
            "POST",
          )
        ).status,
        400,
      );
      assert.equal(
        (
          await call(
            `${endpoint}/products`,
            owner.cookie,
            { ...fields, description: "x".repeat(4001) },
            "POST",
          )
        ).status,
        400,
      );
      const forbidden = await fetch(`${base}${endpoint}/products`, {
        method: "POST",
        headers: {
          Cookie: owner.cookie,
          Origin: "https://untrusted.example",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fields),
      });
      assert.equal(forbidden.status, 403);
      const created = await call(
        `${endpoint}/products`,
        owner.cookie,
        fields,
        "POST",
      );
      assert.equal(created.status, 201);
      const product = await created.json();
      assert.equal(product.name, fields.name.trim());
      assert.equal(product.description, fields.description.trim());
      const image = await sharp({
        create: { width: 32, height: 24, channels: 4, background: "#123456" },
      })
        .png()
        .toBuffer();
      const upload = (target = endpoint, bytes = image) =>
        fetch(
          `${base}${target}/assets?kind=rule&category=imagery&productId=${product.id}`,
          {
            method: "POST",
            headers: {
              Cookie: owner.cookie,
              Origin: "http://localhost:3010",
              "Content-Type": "image/png",
              "X-Filename": "product.png",
            },
            body: new Uint8Array(bytes),
          },
        );
      assert.equal((await upload(`/brands/${otherBrandId}/brain`)).status, 404);
      assert.equal(
        (await upload(endpoint, Buffer.from("not an image"))).status,
        400,
      );
      const photos = [];
      for (let index = 0; index < 2; index++) {
        const response = await upload();
        assert.equal(response.status, 201);
        photos.push(await response.json());
      }
      const stored = await (await call(endpoint, owner.cookie)).json();
      assert.equal(stored.products.length, 1);
      assert.equal(stored.assets.length, 2);
      assert.ok(
        stored.assets.every(
          (asset: { productId: string }) => asset.productId === product.id,
        ),
      );
      assert.equal(
        (await call(`${endpoint}/assets/${photos[0].id}`)).status,
        401,
      );
      assert.equal(
        (await call(`${endpoint}/assets/${photos[0].id}`, stranger.cookie))
          .status,
        404,
      );
      assert.equal(
        (await call(`${endpoint}/assets/${photos[0].id}`, owner.cookie)).status,
        200,
      );
      await assert.rejects(
        pool.query("UPDATE brand_brain_asset SET brand_id = $1 WHERE id = $2", [
          otherBrandId,
          photos[0].id,
        ]),
        (error: { code?: string }) => error.code === "23503",
      );
      assert.equal(
        (
          await call(
            `/brands/${otherBrandId}/brain/products/${product.id}`,
            owner.cookie,
            fields,
            "PATCH",
          )
        ).status,
        404,
      );
      assert.equal(
        (
          await call(
            `${endpoint}/products/${product.id}`,
            owner.cookie,
            {
              name: "Orange chocolate",
              description: "Updated product details",
            },
            "PATCH",
          )
        ).status,
        200,
      );
      const context = await loadBrandBrainContext(brandId);
      assert.equal(
        context.products?.[0]?.description,
        "Updated product details",
      );
      assert.deepEqual(
        context.products?.[0]?.photoIds.sort(),
        photos.map((photo) => photo.id).sort(),
      );
      assert.equal(
        context.approvedRules.length,
        0,
        "Product facts are not global brand rules",
      );
      assert.equal(
        (
          await call(
            `${endpoint}/assets/${photos[0].id}`,
            owner.cookie,
            undefined,
            "DELETE",
          )
        ).status,
        204,
      );
      assert.equal(
        (await loadBrandBrainContext(brandId)).products?.[0]?.photoIds.length,
        1,
      );
      assert.equal(
        (
          await call(
            `${endpoint}/products/${product.id}`,
            stranger.cookie,
            undefined,
            "DELETE",
          )
        ).status,
        404,
      );
      assert.equal(
        (
          await call(
            `${endpoint}/products/${product.id}`,
            owner.cookie,
            undefined,
            "DELETE",
          )
        ).status,
        204,
      );
      const archived = await (await call(endpoint, owner.cookie)).json();
      assert.deepEqual(archived.products, []);
      assert.deepEqual(archived.assets, []);
      assert.equal(
        (await call(`${endpoint}/assets/${photos[1].id}`, owner.cookie)).status,
        404,
      );
      assert.equal((await upload()).status, 404);
      assert.deepEqual((await loadBrandBrainContext(brandId)).products, []);
      assert.equal(
        (
          await call(
            `${endpoint}/products/${product.id}`,
            owner.cookie,
            fields,
            "PATCH",
          )
        ).status,
        404,
      );
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      await authPool.end();
      await pool.end();
      await rm(process.env.BRAND_BRAIN_LOCAL_DIR!, {
        recursive: true,
        force: true,
      });
    }
  },
);
