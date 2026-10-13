import { randomUUID } from "node:crypto";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "../auth/auth";
import {
  brandBrainAsset,
  brandBrainItem,
  siteAnalysis,
} from "../auth/schema/schema";
import { downloadWebsiteImage } from "./website-image";
import {
  normalizeWebsiteProfile,
  shouldImportWebsiteRecord,
} from "./website-profile";
import { removeAsset, uploadAsset } from "./storage";

const activeSyncs = new Map<
  string,
  Promise<{ imported: number; warnings: string[] }>
>();

export function syncWebsiteBrain(brandId: string, includeAssets = true) {
  const key = `${brandId}:${includeAssets}`;
  const active = activeSyncs.get(key);
  if (active) return active;
  const pending = importWebsiteBrain(brandId, includeAssets).finally(() =>
    activeSyncs.delete(key),
  );
  activeSyncs.set(key, pending);
  return pending;
}

async function importWebsiteBrain(brandId: string, includeAssets: boolean) {
  const [analysis] = await db
    .select({
      url: siteAnalysis.url,
      raw: siteAnalysis.rawDocument,
      diagnosis: siteAnalysis.diagnosis,
    })
    .from(siteAnalysis)
    .where(
      and(
        eq(siteAnalysis.brandId, brandId),
        isNotNull(siteAnalysis.rawDocument),
      ),
    )
    .orderBy(desc(siteAnalysis.createdAt))
    .limit(1);
  if (!analysis) return { imported: 0, warnings: [] };
  const profile = normalizeWebsiteProfile(
    analysis.raw,
    analysis.diagnosis,
    analysis.url,
  );
  // Include archived records: removing a website finding must remain respected.
  const [items, assets] = await Promise.all([
    db.select().from(brandBrainItem).where(eq(brandBrainItem.brandId, brandId)),
    db
      .select()
      .from(brandBrainAsset)
      .where(eq(brandBrainAsset.brandId, brandId)),
  ]);
  const candidates = profile.items.filter((item) =>
    shouldImportWebsiteRecord(item, items),
  );
  let imported = 0;
  if (candidates.length) {
    const inserted = await db
      .insert(brandBrainItem)
      .values(
        candidates.map((item) => ({
          ...item,
          brandId,
          kind: "rule",
          source: "discovery",
        })),
      )
      .onConflictDoNothing()
      .returning({ id: brandBrainItem.id });
    imported += inserted.length;
  }
  const warnings: string[] = [];
  if (!includeAssets) return { imported, warnings };
  for (const asset of profile.assets.filter((candidate) =>
    shouldImportWebsiteRecord(candidate, assets),
  )) {
    const objectKey = `${brandId}/${randomUUID()}.png`;
    let uploaded = false;
    try {
      const image = await downloadWebsiteImage(asset.url, analysis.url);
      await uploadAsset(objectKey, image.bytes, image.mimeType);
      uploaded = true;
      const inserted = await db
        .insert(brandBrainAsset)
        .values({
          brandId,
          kind: "rule",
          category: asset.category,
          caption: asset.caption,
          source: "discovery",
          sourceKey: asset.sourceKey,
          sourceUrl: asset.sourceUrl,
          objectKey,
          filename:
            asset.category === "identity"
              ? "website-logo.png"
              : "website-social-image.png",
          mimeType: image.mimeType,
          bytes: image.bytes.length,
          width: image.width,
          height: image.height,
        })
        .onConflictDoNothing()
        .returning({ id: brandBrainAsset.id });
      if (inserted.length) imported++;
      else await removeAsset(objectKey);
    } catch (error) {
      if (uploaded) await removeAsset(objectKey).catch(() => undefined);
      // A bad or unavailable image must not discard usable text, colors or fonts.
      warnings.push(
        `${asset.caption} could not be imported. You can upload it manually.`,
      );
      console.warn(
        "Website Brand Kit image import failed",
        asset.sourceKey,
        error instanceof Error ? error.message : "Unknown image error",
      );
    }
  }
  return { imported, warnings };
}
