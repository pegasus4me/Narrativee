import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  readAsset,
  removeAsset,
  StorageUnavailableError,
  uploadAsset,
} from "../src/brand-brain/storage";

test("development image storage persists privately and rejects paths outside its directory", async () => {
  const variables = [
    "NODE_ENV",
    "BRAND_BRAIN_LOCAL_DIR",
    "SUPABASE_STORAGE_ENDPOINT",
    "SUPABASE_STORAGE_REGION",
    "SUPABASE_STORAGE_ACCESS_KEY_ID",
    "SUPABASE_STORAGE_SECRET_ACCESS_KEY",
    "SUPABASE_STORAGE_BUCKET",
  ];
  const previous = variables.map((name) => [name, process.env[name]] as const);
  const directory = await mkdtemp(join(tmpdir(), "narrativee-storage-test-"));
  for (const name of variables) delete process.env[name];
  process.env.NODE_ENV = "development";
  process.env.BRAND_BRAIN_LOCAL_DIR = directory;
  const key = `${randomUUID()}/${randomUUID()}.png`;
  const bytes = Buffer.from("test-image-bytes");

  try {
    await uploadAsset(key, bytes, "image/png");
    assert.deepEqual(Buffer.from(await readAsset(key)), bytes);
    assert.equal((await stat(join(directory, key))).mode & 0o777, 0o600);
    await assert.rejects(
      uploadAsset("../outside.png", bytes, "image/png"),
      /Invalid image storage key/,
    );
    await assert.rejects(
      readAsset("../outside.png"),
      /Invalid image storage key/,
    );
    await assert.rejects(uploadAsset(key, bytes, "image/png"), /EEXIST/);
    await removeAsset(key);
    await assert.rejects(readAsset(key), /ENOENT/);

    process.env.NODE_ENV = "production";
    await assert.rejects(
      uploadAsset(key, bytes, "image/png"),
      StorageUnavailableError,
    );
  } finally {
    for (const [name, value] of previous) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    await rm(directory, { recursive: true, force: true });
  }
});

test("Supabase storage sends private bucket operations through its S3 endpoint", async (t) => {
  const { createServer } = await import("node:http");
  const { once } = await import("node:events");
  const keys = [
    "NODE_ENV",
    "SUPABASE_STORAGE_ENDPOINT",
    "SUPABASE_STORAGE_REGION",
    "SUPABASE_STORAGE_ACCESS_KEY_ID",
    "SUPABASE_STORAGE_SECRET_ACCESS_KEY",
    "SUPABASE_STORAGE_BUCKET",
  ];
  const previous = new Map(keys.map((key) => [key, process.env[key]]));
  const bytes = Buffer.from("private-image-fixture");
  const received: {
    method: string;
    path: string;
    body: Buffer;
    contentType?: string;
  }[] = [];
  const server = createServer(async (request, response) => {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    received.push({
      method: request.method ?? "",
      path: new URL(request.url!, "http://localhost").pathname,
      body: Buffer.concat(chunks),
      contentType: request.headers["content-type"],
    });
    assert.match(request.headers.authorization ?? "", /AWS4-HMAC-SHA256/);
    if (request.method === "GET") {
      response.setHeader("Content-Type", "image/png");
      response.end(bytes);
    } else {
      response.statusCode = request.method === "DELETE" ? 204 : 200;
      response.end();
    }
  });
  t.after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  process.env.NODE_ENV = "test";
  process.env.SUPABASE_STORAGE_ENDPOINT = `http://127.0.0.1:${address.port}/storage/v1/s3`;
  process.env.SUPABASE_STORAGE_REGION = "eu-west-1";
  process.env.SUPABASE_STORAGE_ACCESS_KEY_ID = "test-access-key";
  process.env.SUPABASE_STORAGE_SECRET_ACCESS_KEY = "test-secret-key";
  process.env.SUPABASE_STORAGE_BUCKET = "narrativee-images";
  const key = "brand/project/private-image.png";
  await uploadAsset(key, bytes, "image/png");
  assert.deepEqual(Buffer.from(await readAsset(key)), bytes);
  await removeAsset(key);
  assert.deepEqual(
    received.map(({ method }) => method),
    ["PUT", "GET", "DELETE"],
  );
  for (const request of received) {
    assert.equal(request.path, `/storage/v1/s3/narrativee-images/${key}`);
  }
  assert.deepEqual(received[0].body, bytes);
  assert.equal(received[0].contentType, "image/png");
  delete process.env.SUPABASE_STORAGE_REGION;
  await assert.rejects(
    uploadAsset(key, bytes, "image/png"),
    StorageUnavailableError,
  );
});
