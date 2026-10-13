import { Router } from "express";
import { z } from "zod";
import { verifyAuth } from "../middleware/auth";

const fontSchema = z.object({
  family: z.string(),
  category: z.string(),
  variants: z.array(z.string()),
});
const catalogSchema = z.object({ items: z.array(fontSchema) });
type Font = z.infer<typeof fontSchema>;

let cached: { items: Font[]; expiresAt: number } | null = null;
let pending: Promise<Font[]> | null = null;

async function catalog(key: string): Promise<Font[]> {
  if (cached && cached.expiresAt > Date.now()) return cached.items;
  if (pending) return pending;
  pending = (async () => {
    const url = new URL("https://www.googleapis.com/webfonts/v1/webfonts");
    url.searchParams.set("key", key);
    url.searchParams.set("sort", "popularity");
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error("Google Fonts catalog request failed");
    const { items } = catalogSchema.parse(await response.json());
    cached = { items, expiresAt: Date.now() + 86_400_000 };
    return items;
  })();
  try {
    return await pending;
  } finally {
    pending = null;
  }
}

export async function getGoogleFonts() {
  const key = process.env.GOOGLE_FONTS_API_KEY;
  if (!key)
    throw new Error(
      "Google Fonts is unavailable. Configure GOOGLE_FONTS_API_KEY before creating campaigns.",
    );
  return catalog(key);
}

export const googleFontsRouter = Router();
googleFontsRouter.get("/", verifyAuth, async (_request, response) => {
  const key = process.env.GOOGLE_FONTS_API_KEY;
  if (!key) {
    response
      .status(503)
      .json({ error: "Font selection is temporarily unavailable." });
    return;
  }
  try {
    response.json({ items: await getGoogleFonts() });
  } catch {
    response
      .status(502)
      .json({ error: "Could not load Google Fonts. Please try again." });
  }
});
