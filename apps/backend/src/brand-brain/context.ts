import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "../auth/auth";
import {
  brandProduct,
  brandBrainAsset,
  brandBrainItem,
} from "../auth/schema/schema";
import { syncWebsiteBrain } from "./website-sync";

export interface BrandBrainContext {
  products?: Array<{
    id: string;
    name: string;
    description: string;
    photoIds: string[];
  }>;
  approvedRules: Array<{ category: string; content: string; source: string }>;
  websiteObservations: Array<{
    category: string;
    content: string;
    sourceUrl: string | null;
  }>;
  inspirations: Array<{ category: string; content: string }>;
  feedback: Array<{ category: string; content: string }>;
  assets: Array<{
    kind: string;
    category: string;
    caption: string;
    filename: string;
    source: string;
  }>;
}

type Item = Pick<
  typeof brandBrainItem.$inferSelect,
  "kind" | "category" | "content" | "source"
> & { sourceUrl?: string | null };
type Asset = Pick<
  typeof brandBrainAsset.$inferSelect,
  "kind" | "category" | "caption" | "filename"
> & { source?: string; id?: string; productId?: string | null };

export function compileBrandBrainContext(
  items: Item[],
  assets: Asset[],
  products: Array<
    Pick<typeof brandProduct.$inferSelect, "id" | "name" | "description">
  > = [],
): BrandBrainContext {
  return {
    products: products.map((product) => ({
      ...product,
      photoIds: assets
        .filter((asset) => asset.productId === product.id && asset.id)
        .map((asset) => asset.id!),
    })),
    approvedRules: items
      .filter((item) => item.kind === "rule" && item.source === "user")
      .map(({ category, content, source }) => ({ category, content, source })),
    websiteObservations: items
      .filter((item) => item.source === "discovery")
      .map(({ category, content, sourceUrl }) => ({
        category,
        content,
        sourceUrl: sourceUrl ?? null,
      })),
    inspirations: items
      .filter((item) => item.kind === "inspiration")
      .slice(0, 20)
      .map(({ category, content }) => ({ category, content })),
    feedback: items
      .filter((item) => item.kind === "feedback")
      .slice(0, 20)
      .map(({ category, content }) => ({ category, content })),
    assets: assets.map(({ kind, category, caption, filename, source }) => ({
      kind,
      category,
      caption,
      filename,
      source: source ?? "user",
    })),
  };
}

export async function loadBrandBrainContext(
  brandId: string,
): Promise<BrandBrainContext> {
  // Backfill saved research before designing, without putting image downloads
  // on the reply's critical path. Discovery and the kit handle asset import.
  await syncWebsiteBrain(brandId, false);
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
      .orderBy(desc(brandBrainItem.createdAt))
      .limit(100),
    db
      .select()
      .from(brandBrainAsset)
      .where(
        and(
          eq(brandBrainAsset.brandId, brandId),
          isNull(brandBrainAsset.archivedAt),
        ),
      )
      .orderBy(desc(brandBrainAsset.createdAt))
      .limit(30),
    db
      .select({
        id: brandProduct.id,
        name: brandProduct.name,
        description: brandProduct.description,
      })
      .from(brandProduct)
      .where(
        and(eq(brandProduct.brandId, brandId), isNull(brandProduct.archivedAt)),
      )
      .orderBy(desc(brandProduct.createdAt))
      .limit(50),
  ]);
  return compileBrandBrainContext(items, assets, products);
}
