import { desc, eq } from "drizzle-orm";
import { db } from "../auth/auth";
import { brand, siteAnalysis } from "../auth/schema/schema";
import type { AuthRequest } from "../middleware/auth";
import { canAccessBrand, guestToken, hash } from "./brand-access";

export class BrandError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const brandFields = {
  id: brand.id,
  name: brand.name,
  url: brand.url,
  createdAt: brand.createdAt,
  updatedAt: brand.updatedAt,
};

export async function readBrand(id: string, request: AuthRequest) {
  const [record] = await db.select().from(brand).where(eq(brand.id, id));
  if (!record || !canAccessBrand(record, request))
    throw new BrandError(404, "Brand not found or access expired");
  const [analysis] = await db
    .select({ id: siteAnalysis.id })
    .from(siteAnalysis)
    .where(eq(siteAnalysis.brandId, id))
    .orderBy(desc(siteAnalysis.createdAt))
    .limit(1);
  return {
    id: record.id,
    name: record.name,
    url: record.url,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    analysisId: analysis?.id ?? null,
    provisional: !record.userId,
  };
}

export async function createBrand(
  input: { name: string; url: string | null; key: string },
  request: AuthRequest,
) {
  const token = request.user ? null : guestToken(input.key);
  return db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(brand)
      .values({
        name: input.name,
        url: input.url,
        userId: request.user?.id,
        creationKeyHash: hash(input.key),
        guestTokenHash: token ? hash(token) : null,
      })
      .onConflictDoNothing({ target: brand.creationKeyHash })
      .returning();
    const record =
      inserted ??
      (
        await tx
          .select()
          .from(brand)
          .where(eq(brand.creationKeyHash, hash(input.key)))
      )[0];
    if (!record) throw new Error("Brand creation failed");
    if (!inserted) {
      const sameGuest =
        !record.userId && token && record.guestTokenHash === hash(token);
      if (
        (!sameGuest && record.userId !== request.user?.id) ||
        record.name !== input.name ||
        record.url !== input.url
      ) {
        throw new BrandError(
          409,
          "This creation request has already been used",
        );
      }
    }
    let analysisId: string | null = null;
    if (inserted && input.url) {
      const [analysis] = await tx
        .insert(siteAnalysis)
        .values({
          brandId: record.id,
          userId: request.user?.id,
          url: input.url,
        })
        .returning({ id: siteAnalysis.id });
      analysisId = analysis.id;
    } else {
      const [analysis] = await tx
        .select({ id: siteAnalysis.id })
        .from(siteAnalysis)
        .where(eq(siteAnalysis.brandId, record.id))
        .limit(1);
      analysisId = analysis?.id ?? null;
    }
    return { id: record.id, analysisId, token, created: Boolean(inserted) };
  });
}

export async function claimBrand(id: string, request: AuthRequest) {
  if (!request.user) throw new BrandError(401, "Sign in to save this brand");
  const userId = request.user.id;
  await db.transaction(async (tx) => {
    const [record] = await tx
      .select()
      .from(brand)
      .where(eq(brand.id, id))
      .for("update");
    if (!record || !canAccessBrand(record, request))
      throw new BrandError(404, "Brand not found or access expired");
    if (record.userId) return;
    await tx
      .update(brand)
      .set({ userId, guestTokenHash: null, updatedAt: new Date() })
      .where(eq(brand.id, id));
    await tx
      .update(siteAnalysis)
      .set({ userId })
      .where(eq(siteAnalysis.brandId, id));
  });
  return readBrand(id, request);
}

export async function resolveLegacyAnalysis(id: string, request: AuthRequest) {
  const brandId = await db.transaction(async (tx) => {
    const [analysis] = await tx
      .select()
      .from(siteAnalysis)
      .where(eq(siteAnalysis.id, id))
      .for("update");
    if (!analysis) throw new BrandError(404, "Analysis not found");
    if (analysis.brandId) return analysis.brandId;
    // Legacy anonymous analyses remain readable, but their IDs cannot prove ownership.
    if (!analysis.userId || analysis.userId !== request.user?.id) {
      throw new BrandError(
        403,
        "Sign in as the owner, or add a brand to start a new discovery",
      );
    }
    const [record] = await tx
      .insert(brand)
      .values({
        name: new URL(analysis.url).hostname.replace(/^www\./, ""),
        url: analysis.url,
        userId: analysis.userId,
      })
      .returning({ id: brand.id });
    await tx
      .update(siteAnalysis)
      .set({ brandId: record.id })
      .where(eq(siteAnalysis.id, id));
    return record.id;
  });
  return readBrand(brandId, request);
}
