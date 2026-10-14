import { Router, type Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth";
import { downloadWebsiteImage } from "../brand-brain/website-image";
import { findStudioProject } from "../studio/studio.service";
import {
  CanvasError,
  storeUploadedProjectImage,
} from "../studio/canvas/canvas.service";
import {
  AdReferenceError,
  adSearchSchema,
  metaMediaUrl,
  searchAdReferences,
} from "./ad-references.service";

const importSchema = z.object({
  imageUrl: z
    .string()
    .max(8192)
    .refine((url) => metaMediaUrl(url) !== null),
});
const searchLimits = new Map<string, { count: number; expires: number }>();

function handle(
  action: (
    request: AuthRequest,
    response: Response,
    projectId: string,
  ) => Promise<void>,
) {
  return async (request: AuthRequest, response: Response) => {
    try {
      const projectId = z.string().uuid().parse(request.params.id);
      if (!(await findStudioProject(projectId, request.user!.id))) {
        response.status(404).json({ error: "Project not found" });
        return;
      }
      await action(request, response, projectId);
    } catch (cause) {
      const status =
        cause instanceof AdReferenceError || cause instanceof CanvasError
          ? cause.status
          : cause instanceof z.ZodError
            ? 400
            : 502;
      response.status(status).json({
        error:
          cause instanceof AdReferenceError || cause instanceof CanvasError
            ? cause.message
            : status === 400
              ? "Check your search or reference and try again."
              : "The reference could not be loaded. Please try again.",
      });
    }
  };
}

export const adReferencesRouter = Router();
adReferencesRouter.post(
  "/:id/ad-references/search",
  handle(async (request, response) => {
    const input = adSearchSchema.parse(request.body);
    const now = Date.now();
    for (const [id, limit] of searchLimits)
      if (limit.expires <= now) searchLimits.delete(id);
    const limit = searchLimits.get(request.user!.id) ?? {
      count: 0,
      expires: now + 60000,
    };
    if (limit.count >= 10) {
      response.setHeader(
        "Retry-After",
        Math.ceil((limit.expires - now) / 1000),
      );
      throw new AdReferenceError(
        429,
        "Please wait a moment before searching again.",
      );
    }
    limit.count++;
    searchLimits.set(request.user!.id, limit);
    response.setHeader("Cache-Control", "private, no-store");
    response.json(await searchAdReferences(input));
  }),
);

adReferencesRouter.post(
  "/:id/ad-references/import",
  handle(async (request, response, projectId) => {
    const { imageUrl } = importSchema.parse(request.body);
    const image = await downloadWebsiteImage(
      imageUrl,
      "https://www.facebook.com",
    );
    response
      .status(201)
      .json(
        await storeUploadedProjectImage(
          projectId,
          request.user!.id,
          image.bytes,
          image.mimeType,
        ),
      );
  }),
);
