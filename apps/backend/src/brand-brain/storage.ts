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
    process.env.SUPABASE_STORAGE_ENDPOINT,
    process.env.SUPABASE_STORAGE_REGION,
    process.env.SUPABASE_STORAGE_ACCESS_KEY_ID,
    process.env.SUPABASE_STORAGE_SECRET_ACCESS_KEY,
    process.env.SUPABASE_STORAGE_BUCKET,
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

export function imageStorageConfiguration() {
  const endpoint = process.env.SUPABASE_STORAGE_ENDPOINT;
  const region = process.env.SUPABASE_STORAGE_REGION;
  const accessKeyId = process.env.SUPABASE_STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.SUPABASE_STORAGE_SECRET_ACCESS_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;
  if (!endpoint || !region || !accessKeyId || !secretAccessKey || !bucket) {
    throw new StorageUnavailableError(
      "Supabase image storage is not configured yet",
    );
  }
  return { endpoint, region, accessKeyId, secretAccessKey, bucket };
}

function storage() {
  const { bucket, ...configuration } = imageStorageConfiguration();
  const { accessKeyId, secretAccessKey, ...connection } = configuration;
  return {
    bucket,
    client: new S3Client({
      ...connection,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
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
