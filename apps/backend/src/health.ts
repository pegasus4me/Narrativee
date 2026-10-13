import type { Request, Response } from "express";
import { sql } from "drizzle-orm";
import { db } from "./auth/auth";

export async function health(_request: Request, response: Response) {
  const revision = process.env.APP_REVISION ?? null;
  response.set("Cache-Control", "no-store");
  try {
    await db.execute(sql`SELECT brand_product.id, brand_brain_asset.product_id
      FROM brand_product LEFT JOIN brand_brain_asset ON false LIMIT 0`);
    if (
      process.env.NODE_ENV === "production" &&
      ![
        "R2_ACCOUNT_ID",
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
        "R2_BUCKET",
      ].every((key) => process.env[key])
    ) {
      throw new Error("Production image storage is not configured");
    }
    response.json({ status: "ok", revision });
  } catch (error) {
    console.error(
      "API readiness failed",
      error instanceof Error ? error.message : "Unknown error",
    );
    response.status(503).json({ status: "unavailable", revision });
  }
}
