import { Router, raw, type Response, type ErrorRequestHandler } from "express";
import { z } from "zod";
import type { AuthRequest } from "../../middleware/auth";
import { StorageUnavailableError } from "../../brand-brain/storage";
import { canvasWriteSchema } from "./canvas.schema";
import {
  CanvasError,
  readCanvas,
  readProjectImage,
  saveCanvas,
  storeUploadedProjectImage,
} from "./canvas.service";

function handle(
  action: (request: AuthRequest, response: Response) => Promise<void>,
) {
  return async (request: AuthRequest, response: Response) => {
    try {
      await action(request, response);
    } catch (error) {
      const status =
        error instanceof CanvasError
          ? error.status
          : error instanceof z.ZodError
            ? 400
            : error instanceof StorageUnavailableError
              ? 503
              : 500;
      if (status === 500) console.error("Studio canvas request failed", error);
      response.status(status).json({
        error:
          error instanceof CanvasError ||
          error instanceof StorageUnavailableError
            ? error.message
            : status === 400
              ? "Invalid canvas request"
              : "Could not load or save the canvas",
      });
    }
  };
}
export const canvasRouter = Router();
canvasRouter.post(
  "/:id/assets",
  raw({ type: ["image/png", "image/jpeg", "image/webp"], limit: "8mb" }),
  handle(async (request, response) => {
    response
      .status(201)
      .json(
        await storeUploadedProjectImage(
          z.string().uuid().parse(request.params.id),
          request.user!.id,
          request.body,
          request.get("content-type") ?? "",
        ),
      );
  }),
);
canvasRouter.get(
  "/:id/canvas",
  handle(async (request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.json(
      await readCanvas(
        z.string().uuid().parse(request.params.id),
        request.user!.id,
      ),
    );
  }),
);

const uploadError: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  next,
) => {
  if (
    error &&
    typeof error === "object" &&
    "type" in error &&
    error.type === "entity.too.large"
  ) {
    response.status(413).json({ error: "Choose an image up to 8 MB." });
    return;
  }
  next(error);
};
canvasRouter.use(uploadError);
canvasRouter.put(
  "/:id/canvas",
  handle(async (request, response) => {
    const input = canvasWriteSchema.parse(request.body);
    response.json(
      await saveCanvas(
        z.string().uuid().parse(request.params.id),
        request.user!.id,
        input.revision,
        input.snapshot,
      ),
    );
  }),
);
canvasRouter.get(
  "/:id/assets/:assetId",
  handle(async (request, response) => {
    const image = await readProjectImage(
      z.string().uuid().parse(request.params.id),
      request.user!.id,
      z.string().uuid().parse(request.params.assetId),
    );
    response.set({
      "Content-Type": image.mimeType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    });
    response.send(Buffer.from(image.bytes));
  }),
);
