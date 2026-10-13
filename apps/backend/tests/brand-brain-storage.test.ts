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
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET",
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
