import { z } from "zod";
import { AccessError } from "../billing/catalog";
const rateSchema = z.object({
  version: z.string().min(1),
  source: z
    .string()
    .url()
    .refine((s) => new URL(s).hostname === "developers.openai.com"),
  verifiedAt: z.string().datetime(),
  kind: z.enum(["text", "image"]),
  input: z.number().nonnegative(),
  cachedInput: z.number().nonnegative(),
  cacheWrite: z.number().nonnegative(),
  output: z.number().nonnegative(),
  maxInputTokens: z.number().int().positive(),
  maxOutputTokens: z.number().int().positive(),
  contextWindowTokens: z.number().int().positive().optional(),
  longContext: z
    .object({
      threshold: z.number().int().positive(),
      input: z.number().nonnegative(),
      cachedInput: z.number().nonnegative(),
      cacheWrite: z.number().nonnegative(),
      output: z.number().nonnegative(),
    })
    .optional(),
  imageInput: z.number().nonnegative().optional(),
  imageCachedInput: z.number().nonnegative().optional(),
});
export type ModelRate = z.infer<typeof rateSchema>;
// USD per million tokens equals microdollars per token. Restrict to short contexts.
// Verified standard pricing: https://developers.openai.com/api/docs/pricing (2026-10-07).
const base = {
  version: "openai-standard-2026-10-07",
  source: "https://developers.openai.com/api/docs/pricing",
  verifiedAt: "2026-10-07T00:00:00Z",
  kind: "text" as const,
  maxInputTokens: 32_000,
  maxOutputTokens: 8_000,
};
export function modelRates(): Record<string, ModelRate> {
  return {
    "gpt-6-luna": {
      ...base,
      input: 0.1,
      cachedInput: 0.01,
      cacheWrite: 0.125,
      output: 0.5,
    },
    "gpt-6.1-sol": {
      ...base,
      input: 2,
      cachedInput: 0.1,
      cacheWrite: 2.5,
      output: 10,
    },
    "gpt-6-astra": {
      ...base,
      input: 10,
      cachedInput: 1,
      cacheWrite: 12.5,
      output: 50,
    },
    "gpt-image-2": {
      ...base,
      version: "openai-standard-2026-10-08",
      verifiedAt: "2026-10-08T00:00:00Z",
      kind: "image",
      input: 5,
      cachedInput: 1.25,
      cacheWrite: 5,
      imageInput: 8,
      imageCachedInput: 2,
      output: 30,
      // Official image-generation calculator: ceil(96² × (2e6 + 1024²) / 4e6).
      // Transport caps generation at 1 MP; other aspect ratios stay below this bound.
      maxOutputTokens: 7_024,
    },
    ...z
      .record(z.string(), rateSchema)
      .parse(JSON.parse(process.env.AI_MODEL_RATES_JSON ?? "{}")),
  };
}
export function rateFor(model: string, kind: "text" | "image") {
  const rate = modelRates()[model];
  if (!rate || rate.kind !== kind)
    throw new AccessError(
      "MODEL_UNPRICED",
      `The model ${model} has no verified billing configuration. Choose an available model.`,
      503,
    );
  return rate;
}
export type ProviderUsage = {
  input_tokens: number;
  output_tokens: number;
  input_tokens_details?: {
    cached_tokens?: number;
    cache_creation_tokens?: number;
    text_tokens?: number;
    image_tokens?: number;
  };
};
export function usageCost(
  rate: ModelRate,
  usage: ProviderUsage,
  searchCalls = 0,
) {
  const input = usage.input_tokens,
    output = usage.output_tokens,
    details = usage.input_tokens_details ?? {};
  const cached = details.cached_tokens ?? 0,
    write = details.cache_creation_tokens ?? 0;
  if (
    ![input, output, cached, write].every(
      (x) => Number.isSafeInteger(x) && x >= 0,
    ) ||
    cached + write > input
  )
    throw new Error("Provider did not report reliable usage");
  if (rate.kind === "image") {
    if (
      details.text_tokens === undefined ||
      details.image_tokens === undefined ||
      ![details.text_tokens, details.image_tokens].every(
        (tokens) => Number.isSafeInteger(tokens) && tokens >= 0,
      ) ||
      details.text_tokens + details.image_tokens !== input ||
      cached > 0
    )
      throw new Error(
        "Image usage breakdown is not configured for reliable billing",
      );
    return Math.ceil(
      details.text_tokens * rate.input +
        details.image_tokens * (rate.imageInput ?? rate.input) +
        output * rate.output,
    );
  }
  const applied =
    rate.longContext && input > rate.longContext.threshold
      ? rate.longContext
      : rate;
  return Math.ceil(
    (input - cached - write) * applied.input +
      cached * applied.cachedInput +
      write * applied.cacheWrite +
      output * applied.output +
      searchCalls * 10_000,
  );
}
