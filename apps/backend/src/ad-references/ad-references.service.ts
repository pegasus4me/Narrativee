import { z } from "zod";

export interface AdReference {
  id: string;
  advertiser: string;
  text: string;
  imageUrl: string | null;
  videoUrl: string | null;
  sourceUrl: string;
  active: boolean;
}

export class AdReferenceError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function metaMediaUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      !["fbcdn.net", "fbsbx.com"].some(
        (domain) =>
          url.hostname === domain || url.hostname.endsWith(`.${domain}`),
      )
    )
      return null;
    return url.toString();
  } catch {
    return null;
  }
}

const mediaSchema = z.object({
  original_image_url: z.string().nullish(),
  resized_image_url: z.string().nullish(),
  video_preview_image_url: z.string().nullish(),
  video_hd_url: z.string().nullish(),
  video_sd_url: z.string().nullish(),
});
const adSchema = z.object({
  ad_archive_id: z.string().regex(/^\d+$/),
  page_name: z.string().nullish(),
  is_active: z.boolean().optional(),
  snapshot: z
    .object({
      body: z.object({ text: z.string().nullish() }).nullish(),
      images: z.array(mediaSchema).nullish(),
      videos: z.array(mediaSchema).nullish(),
      cards: z.array(mediaSchema).nullish(),
    })
    .nullish(),
});
const resultsSchema = z.object({
  success: z.literal(true),
  searchResults: z.array(z.unknown()),
  cursor: z.string().nullish(),
});

export function normalizeAdSearch(value: unknown) {
  const data = resultsSchema.parse(value);
  const items = data.searchResults.flatMap((raw) => {
    const parsed = adSchema.safeParse(raw);
    if (!parsed.success) return [];
    const ad = parsed.data;
    const media = [
      ...(ad.snapshot?.images ?? []),
      ...(ad.snapshot?.cards ?? []),
      ...(ad.snapshot?.videos ?? []),
    ];
    const firstUrl = (fields: Array<keyof z.infer<typeof mediaSchema>>) =>
      media
        .flatMap((item) => fields.map((field) => metaMediaUrl(item[field])))
        .find((url) => url !== null) ?? null;
    return [
      {
        id: ad.ad_archive_id,
        advertiser: ad.page_name || "Advertiser",
        text: ad.snapshot?.body?.text?.slice(0, 4000) ?? "",
        imageUrl: firstUrl([
          "original_image_url",
          "resized_image_url",
          "video_preview_image_url",
        ]),
        videoUrl: firstUrl(["video_hd_url", "video_sd_url"]),
        sourceUrl: `https://www.facebook.com/ads/library/?id=${ad.ad_archive_id}`,
        active: ad.is_active ?? false,
      } satisfies AdReference,
    ];
  });
  return {
    items: [...new Map(items.map((item) => [item.id, item])).values()],
    cursor: data.cursor || null,
  };
}

export const adSearchSchema = z.object({
  query: z.string().trim().min(2).max(100),
  country: z
    .string()
    .regex(/^(ALL|[A-Z]{2})$/)
    .default("ALL"),
  cursor: z.string().max(20000).optional(),
});
type SearchInput = z.infer<typeof adSearchSchema>;
const cachedSearches = new Map<
  string,
  { expires: number; result: ReturnType<typeof normalizeAdSearch> }
>();

// Provider-specific retrieval stays here; callers consume the normalized contract.
export async function searchAdReferences(input: SearchInput) {
  const key = process.env.SCRAPECREATORS_API_KEY;
  if (!key)
    throw new AdReferenceError(
      503,
      "The ad library is temporarily unavailable.",
    );
  const cacheKey = JSON.stringify(input);
  const cached = cachedSearches.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.result;
  const response = await fetch(
    "https://api.scrapecreators.com/v1/facebook/adLibrary/search/ads",
    {
      method: "POST",
      headers: { "x-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        status: "ACTIVE",
        media_type: "ALL",
        sort_by: "relevancy_monthly_grouped",
      }),
      signal: AbortSignal.timeout(30000),
    },
  );
  if (!response.ok)
    throw new AdReferenceError(
      response.status === 429 ? 429 : 502,
      "The ad library could not complete your search. Please retry shortly.",
    );
  let result: ReturnType<typeof normalizeAdSearch>;
  try {
    result = normalizeAdSearch(await response.json());
  } catch {
    throw new AdReferenceError(
      502,
      "The ad library returned an unreadable result. Please retry.",
    );
  }
  if (cachedSearches.size >= 50)
    cachedSearches.delete(cachedSearches.keys().next().value!);
  cachedSearches.set(cacheKey, { result, expires: Date.now() + 300000 });
  return result;
}
