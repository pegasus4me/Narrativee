import { Router } from "express";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "../auth/auth";
import { brandProduct, brandBrainAsset } from "../auth/schema/schema";
import { BrainError, handle, ownedBrand } from "./brain-http";

const input = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(4000),
});
export const productsRouter = Router({ mergeParams: true });

productsRouter.post(
  "/",
  handle(async (request, response) => {
    const brandId = await ownedBrand(request);
    const [product] = await db
      .insert(brandProduct)
      .values({ ...input.parse(request.body), brandId })
      .returning();
    response.status(201).json(product);
  }),
);

productsRouter.patch(
  "/:id",
  handle(async (request, response) => {
    const brandId = await ownedBrand(request);
    const [product] = await db
      .update(brandProduct)
      .set({ ...input.parse(request.body), updatedAt: new Date() })
      .where(
        and(
          eq(brandProduct.id, z.string().uuid().parse(request.params.id)),
          eq(brandProduct.brandId, brandId),
          isNull(brandProduct.archivedAt),
        ),
      )
      .returning();
    if (!product) throw new BrainError(404, "Product not found");
    response.json(product);
  }),
);

productsRouter.delete(
  "/:id",
  handle(async (request, response) => {
    const brandId = await ownedBrand(request);
    const id = z.string().uuid().parse(request.params.id);
    await db.transaction(async (tx) => {
      const [product] = await tx
        .update(brandProduct)
        .set({ archivedAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(brandProduct.id, id),
            eq(brandProduct.brandId, brandId),
            isNull(brandProduct.archivedAt),
          ),
        )
        .returning({ id: brandProduct.id });
      if (!product) throw new BrainError(404, "Product not found");
      await tx
        .update(brandBrainAsset)
        .set({ archivedAt: new Date() })
        .where(
          and(
            eq(brandBrainAsset.productId, id),
            eq(brandBrainAsset.brandId, brandId),
            isNull(brandBrainAsset.archivedAt),
          ),
        );
    });
    response.status(204).end();
  }),
);
