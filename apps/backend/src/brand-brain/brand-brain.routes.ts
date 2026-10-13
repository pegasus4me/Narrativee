import { randomUUID } from "node:crypto";
import express, { Router } from "express";
import { and, desc, eq, isNull } from "drizzle-orm";
import sharp from "sharp";
import { z } from "zod";
import { db } from "../auth/auth";
import {
  brandProduct,
  brandBrainAsset,
  brandBrainItem,
} from "../auth/schema/schema";
import { verifyAuth } from "../middleware/auth";
import { readAsset, removeAsset, uploadAsset } from "./storage";
import { syncWebsiteBrain } from "./website-sync";
import { BrainError, handle, ownedBrand } from "./brain-http";
import { productsRouter } from "./products.routes";

const uuid = z.string().uuid();
const category = z.enum([
  "identity",
  "color",
  "typography",
  "imagery",
  "voice",
  "layout",
  "other",
]);
const itemInput = z.object({
  kind: z.enum(["rule", "inspiration", "feedback"]),
  category,
  content: z.string().trim().min(1).max(4000),
});
const assetInput = z.object({
  kind: z.enum(["rule", "inspiration"]),
  category: category.exclude(["voice"]),
  caption: z.string().trim().max(1000).default(""),
  productId: uuid.optional(),
});

export const brandBrainRouter = Router();
brandBrainRouter.use("/:brandId/brain", verifyAuth);
brandBrainRouter.use("/:brandId/brain", (request, response, next) => {
  const origin = request.get("origin");
  if (
    request.method !== "GET" &&
    origin &&
    ![
      "http://localhost:3000",
      "http://localhost:3010",
      "https://narrativee.com",
    ].includes(origin)
  ) {
    response.status(403).json({ error: "Origin not allowed" });
    return;
  }
  next();
});
brandBrainRouter.use("/:brandId/brain/products", productsRouter);

brandBrainRouter.get(
  "/:brandId/brain",
  handle(async (request, response) => {
    const brandId = await ownedBrand(request);
    const [items, assets, products] = await Promise.all([
      db
        .select()
        .from(brandBrainItem)
        .where(
          and(
            eq(brandBrainItem.brandId, brandId),
            isNull(brandBrainItem.archivedAt),
          ),
        )
        .orderBy(desc(brandBrainItem.createdAt)),
      db
        .select({
          id: brandBrainAsset.id,
          productId: brandBrainAsset.productId,
          kind: brandBrainAsset.kind,
          category: brandBrainAsset.category,
          caption: brandBrainAsset.caption,
          filename: brandBrainAsset.filename,
          mimeType: brandBrainAsset.mimeType,
          width: brandBrainAsset.width,
          height: brandBrainAsset.height,
          createdAt: brandBrainAsset.createdAt,
          source: brandBrainAsset.source,
          sourceUrl: brandBrainAsset.sourceUrl,
        })
        .from(brandBrainAsset)
        .where(
          and(
            eq(brandBrainAsset.brandId, brandId),
            isNull(brandBrainAsset.archivedAt),
          ),
        )
        .orderBy(desc(brandBrainAsset.createdAt)),
      db
        .select()
        .from(brandProduct)
        .where(
          and(
            eq(brandProduct.brandId, brandId),
            isNull(brandProduct.archivedAt),
          ),
        )
        .orderBy(desc(brandProduct.createdAt)),
    ]);
    response.json({ items, assets, products });
  }),
);

brandBrainRouter.post(
  "/:brandId/brain/sync",
  handle(async (request, response) => {
    const brandId = await ownedBrand(request);
    response.json(await syncWebsiteBrain(brandId));
  }),
);

brandBrainRouter.post(
  "/:brandId/brain/items/:id/approve",
  handle(async (request, response) => {
    const brandId = await ownedBrand(request);
    const [item] = await db
      .update(brandBrainItem)
      .set({ source: "user", createdBy: request.user!.id })
      .where(
        and(
          eq(brandBrainItem.id, uuid.parse(request.params.id)),
          eq(brandBrainItem.brandId, brandId),
          eq(brandBrainItem.kind, "rule"),
          isNull(brandBrainItem.archivedAt),
        ),
      )
      .returning();
    if (!item) throw new BrainError(404, "Item not found");
    response.json(item);
  }),
);

brandBrainRouter.post(
  "/:brandId/brain/assets/:id/approve",
  handle(async (request, response) => {
    const brandId = await ownedBrand(request);
    const [asset] = await db
      .update(brandBrainAsset)
      .set({ source: "user", createdBy: request.user!.id })
      .where(
        and(
          eq(brandBrainAsset.id, uuid.parse(request.params.id)),
          eq(brandBrainAsset.brandId, brandId),
          eq(brandBrainAsset.kind, "rule"),
          isNull(brandBrainAsset.archivedAt),
        ),
      )
      .returning({ id: brandBrainAsset.id });
    if (!asset) throw new BrainError(404, "Asset not found");
    response.status(204).end();
  }),
);

brandBrainRouter.post(
  "/:brandId/brain/items",
  handle(async (request, response) => {
    const brandId = await ownedBrand(request);
    const input = itemInput.parse(request.body);
    const [item] = await db
      .insert(brandBrainItem)
      .values({ ...input, brandId, createdBy: request.user!.id })
      .returning();
    response.status(201).json(item);
  }),
);

brandBrainRouter.patch(
  "/:brandId/brain/items/:id",
  handle(async (request, response) => {
    const brandId = await ownedBrand(request);
    const input = itemInput.pick({ content: true }).parse(request.body);
    const [item] = await db
      .update(brandBrainItem)
      .set({ ...input, source: "user", createdBy: request.user!.id })
      .where(
        and(
          eq(brandBrainItem.id, uuid.parse(request.params.id)),
          eq(brandBrainItem.brandId, brandId),
          isNull(brandBrainItem.archivedAt),
        ),
      )
      .returning();
    if (!item) throw new BrainError(404, "Item not found");
    response.json(item);
  }),
);

brandBrainRouter.delete(
  "/:brandId/brain/items/:id",
  handle(async (request, response) => {
    const brandId = await ownedBrand(request);
    const [item] = await db
      .update(brandBrainItem)
      .set({ archivedAt: new Date() })
      .where(
        and(
          eq(brandBrainItem.id, uuid.parse(request.params.id)),
          eq(brandBrainItem.brandId, brandId),
          isNull(brandBrainItem.archivedAt),
        ),
      )
      .returning({ id: brandBrainItem.id });
    if (!item) throw new BrainError(404, "Item not found");
    response.status(204).end();
  }),
);

brandBrainRouter.post(
  "/:brandId/brain/assets",
  express.raw({
    type: ["image/png", "image/jpeg", "image/webp"],
    limit: "8mb",
  }),
  handle(async (request, response) => {
    const brandId = await ownedBrand(request);
    if (!Buffer.isBuffer(request.body) || !request.body.length)
      throw new BrainError(400, "Upload a PNG, JPEG, or WebP image up to 8 MB");
    const input = assetInput.parse({
      kind: request.query.kind,
      category: request.query.category,
      caption: request.query.caption ?? "",
      productId: request.query.productId,
    });
    if (input.productId) {
      if (input.kind !== "rule" || input.category !== "imagery")
        throw new BrainError(400, "Product photos must be product imagery");
      const [product] = await db
        .select({ id: brandProduct.id })
        .from(brandProduct)
        .where(
          and(
            eq(brandProduct.id, input.productId),
            eq(brandProduct.brandId, brandId),
            isNull(brandProduct.archivedAt),
          ),
        )
        .limit(1);
      if (!product) throw new BrainError(404, "Product not found");
    }
    const metadata = await sharp(request.body, { limitInputPixels: 40_000_000 })
      .metadata()
      .catch(() => null);
    const mimeByFormat = {
      png: "image/png",
      jpeg: "image/jpeg",
      webp: "image/webp",
    } as const;
    const mimeType =
      metadata?.format && metadata.format in mimeByFormat
        ? mimeByFormat[metadata.format as keyof typeof mimeByFormat]
        : null;
    if (
      !mimeType ||
      mimeType !== request.get("content-type") ||
      !metadata?.width ||
      !metadata.height ||
      metadata.width > 12000 ||
      metadata.height > 12000
    )
      throw new BrainError(400, "Invalid image file");
    const extension = metadata.format === "jpeg" ? "jpg" : metadata.format;
    const objectKey = `${brandId}/${randomUUID()}.${extension}`;
    let filename = `asset.${extension}`;
    try {
      filename = decodeURIComponent(request.get("x-filename") ?? filename);
    } catch {
      /* Keep safe default. */
    }
    filename =
      filename.replace(/[\\/\x00-\x1f]/g, "").slice(0, 160) ||
      `asset.${extension}`;
    await uploadAsset(objectKey, request.body, mimeType);
    try {
      const asset = await db.transaction(async (tx) => {
        if (input.productId) {
          const [product] = await tx
            .select({ id: brandProduct.id })
            .from(brandProduct)
            .where(
              and(
                eq(brandProduct.id, input.productId),
                eq(brandProduct.brandId, brandId),
                isNull(brandProduct.archivedAt),
              ),
            )
            .for("update");
          if (!product) throw new BrainError(404, "Product not found");
        }
        const [saved] = await tx
          .insert(brandBrainAsset)
          .values({
            ...input,
            brandId,
            objectKey,
            filename,
            mimeType,
            bytes: request.body.length,
            width: metadata.width,
            height: metadata.height,
            createdBy: request.user!.id,
          })
          .returning();
        return saved!;
      });
      response.status(201).json({
        id: asset.id,
        productId: asset.productId,
        kind: asset.kind,
        category: asset.category,
        caption: asset.caption,
        filename: asset.filename,
        mimeType: asset.mimeType,
        width: asset.width,
        height: asset.height,
        createdAt: asset.createdAt,
        source: asset.source,
        sourceUrl: asset.sourceUrl,
      });
    } catch (error) {
      await removeAsset(objectKey).catch((cleanupError) =>
        console.error("Brand Brain upload cleanup failed", cleanupError),
      );
      throw error;
    }
  }),
);

brandBrainRouter.get(
  "/:brandId/brain/assets/:id",
  handle(async (request, response) => {
    const brandId = await ownedBrand(request);
    const [asset] = await db
      .select()
      .from(brandBrainAsset)
      .where(
        and(
          eq(brandBrainAsset.id, uuid.parse(request.params.id)),
          eq(brandBrainAsset.brandId, brandId),
          isNull(brandBrainAsset.archivedAt),
        ),
      )
      .limit(1);
    if (!asset) throw new BrainError(404, "Asset not found");
    const bytes = await readAsset(asset.objectKey);
    response.set({
      "Content-Type": asset.mimeType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    });
    response.send(Buffer.from(bytes));
  }),
);

brandBrainRouter.delete(
  "/:brandId/brain/assets/:id",
  handle(async (request, response) => {
    const brandId = await ownedBrand(request);
    const [asset] = await db
      .update(brandBrainAsset)
      .set({ archivedAt: new Date() })
      .where(
        and(
          eq(brandBrainAsset.id, uuid.parse(request.params.id)),
          eq(brandBrainAsset.brandId, brandId),
          isNull(brandBrainAsset.archivedAt),
        ),
      )
      .returning({ id: brandBrainAsset.id });
    if (!asset) throw new BrainError(404, "Asset not found");
    response.status(204).end();
  }),
);
