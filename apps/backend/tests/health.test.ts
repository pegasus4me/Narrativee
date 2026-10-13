import assert from "node:assert/strict";
import test from "node:test";
import type { Request, Response } from "express";
import { db } from "../src/auth/auth";
import { health } from "../src/health";

test("release health requires the current schema and production image storage", async (t) => {
  t.mock.method(console, "error", () => {});
  const keys = [
    "NODE_ENV",
    "APP_REVISION",
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET",
  ];
  const previous = new Map(keys.map((key) => [key, process.env[key]]));
  t.after(() => {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  let status = 200;
  let body: unknown;
  const response = {
    set: () => response,
    status: (code: number) => {
      status = code;
      return response;
    },
    json: (value: unknown) => {
      body = value;
      return response;
    },
  };
  const query = t.mock.method(db, "execute", async () => ({ rows: [] }));
  process.env.NODE_ENV = "production";
  process.env.APP_REVISION = "checked-release";
  for (const key of keys.slice(2)) process.env[key] = "configured";
  await health({} as Request, response as unknown as Response);
  assert.equal(status, 200);
  assert.deepEqual(body, { status: "ok", revision: "checked-release" });
  delete process.env.R2_BUCKET;
  await health({} as Request, response as unknown as Response);
  assert.equal(status, 503);
  assert.deepEqual(body, {
    status: "unavailable",
    revision: "checked-release",
  });
  process.env.R2_BUCKET = "configured";
  query.mock.mockImplementation(async () => {
    throw new Error("Missing database column with internal details");
  });
  await health({} as Request, response as unknown as Response);
  assert.equal(status, 503);
  assert.deepEqual(body, {
    status: "unavailable",
    revision: "checked-release",
  });
});
