import { deliveryMarker } from "../../usage/operations";
import { randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import sharp from "sharp";
import { db } from "../../auth/auth";
import {
  studioAsset,
  studioCanvas,
  studioProject,
} from "../../auth/schema/schema";
import { readAsset, removeAsset, uploadAsset } from "../../brand-brain/storage";
import {
  canvasSnapshotSchema,
  validateCanvasSnapshot,
  type CanvasSnapshot,
} from "./canvas.schema";

export class CanvasError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function requireCanvasProject(projectId: string, userId: string) {
  const [project] = await db
    .select()
    .from(studioProject)
    .where(
      and(eq(studioProject.id, projectId), eq(studioProject.userId, userId)),
    );
  if (!project) throw new CanvasError(404, "Project not found");
  return project;
}

export async function readCanvas(projectId: string, userId: string) {
  await requireCanvasProject(projectId, userId);
  const [saved] = await db
    .select()
    .from(studioCanvas)
    .where(eq(studioCanvas.projectId, projectId));
  return {
    revision: saved?.revision ?? 0,
    snapshot: saved?.snapshot
      ? canvasSnapshotSchema.parse(saved.snapshot)
      : null,
  };
}

export async function saveCanvas(
  projectId: string,
  userId: string,
  revision: number,
  snapshot: CanvasSnapshot,
) {
  await requireCanvasProject(projectId, userId);
  let assetIds: string[];
  try {
    assetIds = validateCanvasSnapshot(snapshot);
  } catch (error) {
    throw new CanvasError(
      400,
      error instanceof Error ? error.message : "Invalid canvas",
    );
  }
  if (assetIds.length) {
    const assets = await db
      .select({ id: studioAsset.id })
      .from(studioAsset)
      .where(
        and(
          eq(studioAsset.projectId, projectId),
          inArray(studioAsset.id, assetIds),
        ),
      );
    if (assets.length !== assetIds.length)
      throw new CanvasError(
        400,
        "Canvas references an unavailable project image",
      );
  }
  const saved = await db.transaction(async (transaction) => {
    const [saved] =
      revision === 0
        ? await transaction
            .insert(studioCanvas)
            .values({ projectId, snapshot })
            .onConflictDoNothing()
            .returning({ revision: studioCanvas.revision })
        : await transaction
            .update(studioCanvas)
            .set({
              snapshot,
              revision: sql`${studioCanvas.revision} + 1`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(studioCanvas.projectId, projectId),
                eq(studioCanvas.revision, revision),
              ),
            )
            .returning({ revision: studioCanvas.revision });
    if (!saved)
      throw new CanvasError(
        409,
        "This canvas changed in another tab. Your current canvas has not been overwritten; reopen the project before saving again.",
      );
    await transaction.execute(deliveryMarker());
    return saved;
  });
  return saved;
}

export async function storeProjectImage(
  projectId: string,
  userId: string,
  bytes: Uint8Array,
) {
  const project = await requireCanvasProject(projectId, userId);
  const image = sharp(bytes, { limitInputPixels: 40_000_000 });
  const metadata = await image.metadata();
  if (
    !metadata.width ||
    !metadata.height ||
    metadata.width > 12000 ||
    metadata.height > 12000
  )
    throw new CanvasError(400, "Image dimensions are unsupported");
  const png = await image.png().toBuffer();
  if (png.length > 16 * 1024 * 1024)
    throw new CanvasError(400, "Project image is too large");
  const id = randomUUID();
  const objectKey = `${project.brandId}/studio/${projectId}/${id}.png`;
  await uploadAsset(objectKey, png, "image/png");
  try {
    await db.insert(studioAsset).values({
      id,
      projectId,
      objectKey,
      mimeType: "image/png",
      bytes: png.length,
      width: metadata.width,
      height: metadata.height,
    });
  } catch (error) {
    await removeAsset(objectKey).catch(() => undefined);
    throw error;
  }
  return { id, width: metadata.width, height: metadata.height };
}

export async function storeUploadedProjectImage(
  projectId: string,
  userId: string,
  bytes: unknown,
  mimeType: string,
) {
  await requireCanvasProject(projectId, userId);
  if (
    !Buffer.isBuffer(bytes) ||
    !bytes.length ||
    bytes.length > 8 * 1024 * 1024
  )
    throw new CanvasError(400, "Upload a PNG, JPEG or WebP image up to 8 MB.");
  const metadata = await sharp(bytes, { limitInputPixels: 40_000_000 })
    .metadata()
    .catch(() => null);
  const formats: Record<string, string> = {
    png: "image/png",
    jpeg: "image/jpeg",
    webp: "image/webp",
  };
  if (!metadata?.format || formats[metadata.format] !== mimeType)
    throw new CanvasError(
      400,
      "The file must be a valid PNG, JPEG or WebP image.",
    );
  try {
    return await storeProjectImage(projectId, userId, bytes);
  } catch (error) {
    if (error instanceof CanvasError) throw error;
    if (
      error instanceof Error &&
      /corrupt|unsupported image|premature|invalid chunk/i.test(error.message)
    )
      throw new CanvasError(
        400,
        "The image could not be decoded. Choose another file.",
      );
    throw error;
  }
}

export async function readProjectImage(
  projectId: string,
  userId: string,
  id: string,
) {
  await requireCanvasProject(projectId, userId);
  const [asset] = await db
    .select()
    .from(studioAsset)
    .where(and(eq(studioAsset.id, id), eq(studioAsset.projectId, projectId)));
  if (!asset) throw new CanvasError(404, "Image not found");
  return { bytes: await readAsset(asset.objectKey), mimeType: asset.mimeType };
}

export async function discardProjectImages(projectId: string, ids: string[]) {
  if (!ids.length) return;
  const assets = await db
    .delete(studioAsset)
    .where(
      and(eq(studioAsset.projectId, projectId), inArray(studioAsset.id, ids)),
    )
    .returning({ key: studioAsset.objectKey });
  for (const asset of assets)
    await removeAsset(asset.key).catch((error) =>
      console.error("Project image cleanup failed", asset.key, error),
    );
}
