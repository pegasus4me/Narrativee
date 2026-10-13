import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";
import { Pool } from "pg";

test(
  "the shipped migration command initializes an empty database and preserves records on replay",
  { skip: !process.env.TEST_DATABASE_URL },
  async () => {
    const url = process.env.TEST_DATABASE_URL!;
    assert.match(
      new URL(url).pathname,
      /^\/deployment_schema_test_[a-z0-9_]+$/,
    );
    const pool = new Pool({ connectionString: url });
    async function migrate() {
      await promisify(execFile)(process.execPath, ["dist/migrate-brands.js"], {
        env: { ...process.env, LOCAL_DATABASE_URL: url, NODE_ENV: "test" },
        timeout: 30000,
      });
    }
    try {
      await migrate();
      await pool.query(
        `INSERT INTO "user" (id, name, email, "emailVerified") VALUES ('deployment-test', 'Test', 'release@example.test', false)`,
      );
      const brand = (
        await pool.query(
          "INSERT INTO brand (name, user_id) VALUES ('Release test', 'deployment-test') RETURNING id",
        )
      ).rows[0];
      await pool.query(
        "INSERT INTO brand_product (brand_id, name, description) VALUES ($1, 'Test product', 'Saved before replay')",
        [brand.id],
      );
      await migrate();
      assert.equal(
        (
          await pool.query(
            "SELECT description FROM brand_product WHERE brand_id = $1",
            [brand.id],
          )
        ).rows[0].description,
        "Saved before replay",
      );
      assert.equal(
        (
          await pool.query(
            "SELECT relrowsecurity FROM pg_class WHERE oid = 'brand_product'::regclass",
          )
        ).rows[0].relrowsecurity,
        true,
      );
      assert.equal(
        (
          await pool.query(
            "SELECT relrowsecurity FROM pg_class WHERE oid = 'brand_brain_asset'::regclass",
          )
        ).rows[0].relrowsecurity,
        true,
      );
      await pool.query("SELECT product_id FROM brand_brain_asset LIMIT 0");
      await pool.query(
        "SELECT approval_data, approval_status FROM studio_message LIMIT 0",
      );
    } finally {
      await pool.end();
    }
  },
);
