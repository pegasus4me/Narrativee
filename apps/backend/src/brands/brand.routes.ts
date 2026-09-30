import { Router, type Response } from "express";
import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../auth/auth";
import { brand, siteAnalysis } from "../auth/schema/schema";
import { optionalAuth, verifyAuth, type AuthRequest } from "../middleware/auth";
import { normalizePublicUrl } from "../analysis/url-policy";
import { createAnalysisService } from "../analysis/create-service";
import { guestCookieName, setGuestCookie } from "./brand-access";
import {
  BrandError,
  brandFields,
  claimBrand,
  createBrand,
  readBrand,
  resolveLegacyAnalysis,
} from "./brand.service";

const uuid = z.string().uuid();
const createInput = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  url: z.string().trim().min(1).max(2048).optional(),
  key: uuid,
});

function handle(
  action: (request: AuthRequest, response: Response) => Promise<void>,
) {
  return async (request: AuthRequest, response: Response) => {
    try {
      await action(request, response);
    } catch (error) {
      if (error instanceof BrandError)
        response.status(error.status).json({ error: error.message });
      else if (error instanceof z.ZodError)
        response.status(400).json({ error: "Invalid brand information" });
      else {
        console.error("Brand request failed", error);
        response
          .status(500)
          .json({ error: "Unable to load or save the brand. Please retry." });
      }
    }
  };
}

export const brandRouter = Router();
brandRouter.use(optionalAuth);
brandRouter.use((request, response, next) => {
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

brandRouter.post(
  "/",
  handle(async (request, response) => {
    const input = createInput.parse(request.body);
    let url: string | null = null;
    try {
      url = input.url ? normalizePublicUrl(input.url) : null;
    } catch {
      throw new BrandError(400, "Enter a valid public website URL");
    }
    if (!url && !input.name)
      throw new BrandError(400, "A brand name is required");
    const name = url
      ? new URL(url).hostname.replace(/^www\./, "")
      : input.name!;
    const service = url ? createAnalysisService() : null;
    const result = await createBrand({ name, url, key: input.key }, request);
    if (result.token) {
      setGuestCookie(response, result.id, result.token);
      request.cookies = {
        ...request.cookies,
        [guestCookieName(result.id)]: result.token,
      };
    }
    if (result.created && result.analysisId && url && service)
      void service.run(result.analysisId, url);
    response
      .status(result.created ? 201 : 200)
      .json(await readBrand(result.id, request));
  }),
);

brandRouter.get(
  "/",
  verifyAuth,
  handle(async (request, response) => {
    const records = await db
      .select(brandFields)
      .from(brand)
      .where(eq(brand.userId, request.user!.id))
      .orderBy(desc(brand.createdAt), desc(brand.id));
    if (!records.length) {
      response.json([]);
      return;
    }
    const analyses = await db
      .select({ id: siteAnalysis.id, brandId: siteAnalysis.brandId })
      .from(siteAnalysis)
      .where(inArray(siteAnalysis.brandId, records.map((record) => record.id)))
      .orderBy(desc(siteAnalysis.createdAt));
    const latestAnalysis = new Map<string, string>();
    for (const analysis of analyses) {
      if (analysis.brandId && !latestAnalysis.has(analysis.brandId))
        latestAnalysis.set(analysis.brandId, analysis.id);
    }
    response.json(
      records.map((record) => ({
        ...record,
        analysisId: latestAnalysis.get(record.id) ?? null,
        provisional: false,
      })),
    );
  }),
);

brandRouter.post(
  "/from-analysis/:id",
  handle(async (request, response) => {
    response.json(
      await resolveLegacyAnalysis(uuid.parse(request.params.id), request),
    );
  }),
);

brandRouter.post(
  "/:id/claim",
  verifyAuth,
  handle(async (request, response) => {
    const id = uuid.parse(request.params.id);
    const record = await claimBrand(id, request);
    response.clearCookie(guestCookieName(id), {
      path: "/api",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    response.json(record);
  }),
);

brandRouter.get(
  "/:id",
  handle(async (request, response) => {
    response.json(await readBrand(uuid.parse(request.params.id), request));
  }),
);
