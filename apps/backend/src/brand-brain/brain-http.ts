import type { Response } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../auth/auth";
import { brand } from "../auth/schema/schema";
import type { AuthRequest } from "../middleware/auth";
import { StorageUnavailableError } from "./storage";

export class BrainError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function ownedBrand(request: AuthRequest): Promise<string> {
  const brandId = z.string().uuid().parse(request.params.brandId);
  const [record] = await db
    .select({ id: brand.id })
    .from(brand)
    .where(and(eq(brand.id, brandId), eq(brand.userId, request.user!.id)))
    .limit(1);
  if (!record) throw new BrainError(404, "Brand not found");
  return brandId;
}

export function handle(
  action: (request: AuthRequest, response: Response) => Promise<void>,
) {
  return async (request: AuthRequest, response: Response) => {
    try {
      await action(request, response);
    } catch (error) {
      if (error instanceof z.ZodError)
        response.status(400).json({ error: "Invalid Brand Brain input" });
      else if (error instanceof BrainError)
        response.status(error.status).json({ error: error.message });
      else if (error instanceof StorageUnavailableError)
        response.status(503).json({ error: error.message });
      else {
        console.error("Brand Brain request failed", error);
        response
          .status(500)
          .json({ error: "Brand Brain is unavailable. Please retry." });
      }
    }
  };
}
