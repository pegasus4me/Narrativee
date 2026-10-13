import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";

export class StorageUnavailableError extends Error {}

function useLocalStorage(): boolean {
  const configured = [
    process.env.R2_ACCOUNT_ID,
    process.env.R2_ACCESS_KEY_ID,
    process.env.R2_SECRET_ACCESS_KEY,
    process.env.R2_BUCKET,
  ].some(Boolean);
  return process.env.NODE_ENV !== "production" && !configured;
}

function localPath(key: string): string {
  const directory = resolve(
    process.env.BRAND_BRAIN_LOCAL_DIR ?? ".data/brand-brain",
  );
  const path = resolve(directory, key);
  const inside = relative(directory, path);
  if (!inside || inside.startsWith("..") || isAbsolute(inside)) {
    throw new Error("Invalid image storage key");
  }
  return path;
}

function storage() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } =
    process.env;
  if (
    !R2_ACCOUNT_ID ||
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !R2_BUCKET
  )
    throw new StorageUnavailableError("Image storage is not configured yet");
  return {
    bucket: R2_BUCKET,
    client: new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    }),
  };
}

export async function uploadAsset(
  key: string,
  bytes: Buffer,
  mimeType: string,
) {
  if (useLocalStorage()) {
    const path = localPath(key);
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    await writeFile(path, bytes, { flag: "wx", mode: 0o600 });
    return;
  }
  const { client, bucket } = storage();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: bytes,
      ContentType: mimeType,
    }),
  );
}

export async function readAsset(key: string): Promise<Uint8Array> {
  if (useLocalStorage()) return readFile(localPath(key));
  const { client, bucket } = storage();
  const result = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  if (!result.Body) throw new Error("Stored asset is empty");
  return result.Body.transformToByteArray();
}

export async function removeAsset(key: string) {
  if (useLocalStorage()) {
    try {
      await unlink(localPath(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    return;
  }
  const { client, bucket } = storage();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
