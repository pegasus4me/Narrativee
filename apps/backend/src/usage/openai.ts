import OpenAI from "openai";
import { AccessError } from "../billing/catalog";
import { usageContext } from "./operations";
import { rateFor, usageCost, type ProviderUsage } from "./model-rates";
import { recordCall, reserve } from "./ledger";
import sharp from "sharp";
import { imageOutputBound } from "./image-format";

// Meter at the SDK transport so structured parsers, nested agents and streams share accounting.
export function meteredOpenAI(
  options: ConstructorParameters<typeof OpenAI>[0],
) {
  return new OpenAI({ ...options, maxRetries: 0, fetch: meteredFetch });
}
export async function meteredFetch(
  input: string | Request | URL,
  init?: RequestInit,
): Promise<Response> {
  const url = String(input);
  if (!url.startsWith("https://api.openai.com/v1/"))
    throw new Error(
      "Billing supports the configured OpenAI standard endpoint only",
    );
  const image =
    url.endsWith("/images/generations") || url.endsWith("/images/edits");
  if (!url.endsWith("/responses") && !image) return fetch(input, init);
  const context = usageContext.getStore();
  if (!context?.operationId)
    throw new AccessError(
      "PAYMENT_REQUIRED",
      "An authenticated billable operation is required.",
    );
  const multipart = init?.body instanceof FormData ? init.body : null;
  const body = multipart
    ? {
        model: String(multipart.get("model")),
        prompt: String(multipart.get("prompt")),
        size: String(multipart.get("size")),
        n: Number(multipart.get("n")),
        quality: String(multipart.get("quality")),
        stream: multipart.get("stream") === "true",
      }
    : JSON.parse(String(init?.body ?? "{}"));
  const rate = rateFor(body.model, image ? "image" : "text");
  if (
    body.background ||
    body.previous_response_id ||
    body.conversation ||
    body.prompt
  ) {
    if (!image || typeof body.prompt !== "string")
      throw new Error(
        "Opaque or background provider contexts are unavailable for metered calls",
      );
  }
  let inputBound = 0,
    outputBound = rate.maxOutputTokens,
    searchBound = 0;
  if (image) {
    if (body.n !== 1 || body.quality !== "high" || body.stream)
      throw new Error("Only a single high-quality image is available per call");
    outputBound = imageOutputBound(body.model, body.size, rate.maxOutputTokens);
    inputBound = Buffer.byteLength(body.prompt, "utf8");
    if (inputBound > rate.maxInputTokens)
      throw new Error("Image prompt exceeds the configured token bound");
    if (url.endsWith("/images/edits")) {
      if (!multipart || multipart.has("mask"))
        throw new Error(
          "Only reference-image creation is available for metered edits",
        );
      const images = [
        ...multipart.getAll("image[]"),
        ...multipart.getAll("image"),
      ];
      if (!images.length || images.length > 6 || inputBound > 8000)
        throw new Error(
          "Use up to six image references and a concise creative prompt",
        );
      for (const reference of images) {
        if (typeof reference === "string")
          throw new Error("Image references must be uploaded files");
        const metadata = await sharp(
          Buffer.from(await reference.arrayBuffer()),
          { limitInputPixels: 768 * 768 },
        ).metadata();
        if (
          metadata.format !== "png" ||
          !metadata.width ||
          !metadata.height ||
          metadata.width > 768 ||
          metadata.height > 768
        )
          throw new Error(
            "Image references must be PNG thumbnails up to 768 pixels",
          );
      }
      // Reserve the full configured input budget for high-fidelity references,
      // then settle using the provider's actual text/image token breakdown.
      inputBound = rate.maxInputTokens;
    }
  } else {
    body.service_tier = "default";
    body.max_output_tokens = Math.min(
      body.max_output_tokens ?? 8000,
      rate.maxOutputTokens,
    );
    outputBound = body.max_output_tokens;
    if (!Number.isSafeInteger(outputBound) || outputBound <= 0)
      throw new Error("Invalid output limit");
    for (const tool of body.tools ?? []) {
      if (tool.type === "function") continue;
      if (tool.type !== "web_search")
        throw new Error(`Unpriced tool: ${tool.type}`);
      if (!rate.contextWindowTokens || !rate.longContext)
        throw new AccessError(
          "TOOL_UNPRICED",
          "Web search requires verified full-context bounds and long-context rates.",
          503,
        );
      searchBound = 2;
    }
    if (searchBound) body.max_tool_calls = searchBound;
    // Count complete input (including vision and reasoning items) before any charged call.
    const count = await fetch(
      "https://api.openai.com/v1/responses/input_tokens",
      {
        ...init,
        body: JSON.stringify({
          model: body.model,
          input: body.input,
          instructions: body.instructions,
          tools: body.tools,
          text: body.text,
          reasoning: body.reasoning,
        }),
      },
    );
    if (!count.ok) {
      const detail: unknown = await count.json().catch(() => undefined);
      throw OpenAI.APIError.generate(
        count.status,
        detail && typeof detail === "object" ? detail : undefined,
        "Unable to verify the input token count",
        count.headers,
      );
    }
    const tokens = (await count.json()) as { input_tokens: number };
    inputBound = tokens.input_tokens;
    if (!Number.isSafeInteger(inputBound) || inputBound < 0)
      throw new AccessError(
        "PROVIDER_USAGE_UNAVAILABLE",
        "The AI provider returned an invalid token count. Please try again.",
        503,
      );
    if (inputBound > rate.maxInputTokens)
      throw new AccessError(
        "INPUT_TOO_LARGE",
        "The request is too large to analyze. Select fewer competitors or shorten the supplied content and try again.",
        413,
      );
    // Search can fill the supported context; reserve that upper bound before enabling it.
    if (searchBound) inputBound = rate.contextWindowTokens!;
  }
  const bound = Math.max(
    1,
    Math.ceil(
      inputBound *
        Math.max(
          rate.input,
          rate.cacheWrite,
          rate.imageInput ?? 0,
          rate.longContext?.input ?? 0,
          rate.longContext?.cacheWrite ?? 0,
        ) +
        outputBound * Math.max(rate.output, rate.longContext?.output ?? 0) +
        searchBound * 10_000,
    ),
  );
  const callId = await reserve(context.operationId, body.model, rate, bound);
  const response = await fetch(input, {
    ...init,
    body: multipart ?? JSON.stringify(body),
  });
  if (!response.ok) {
    await recordCall(callId, 0, { httpStatus: response.status });
    return response;
  }
  const record = async (result: {
    usage?: ProviderUsage;
    output?: Array<{ type: string }>;
  }) => {
    if (!result.usage)
      throw new Error(
        "Provider usage was missing; credits will not be charged",
      );
    const searches =
      result.output?.filter((x) => x.type === "web_search_call").length ?? 0;
    if (searches > searchBound)
      throw new Error("Provider exceeded the tool limit");
    await recordCall(callId, usageCost(rate, result.usage, searches), {
      usage: result.usage,
      searchCalls: searches,
    });
  };
  if (!body.stream) {
    await record(
      (await response.clone().json()) as {
        usage?: ProviderUsage;
        output?: Array<{ type: string }>;
      },
    );
    return response;
  }
  if (!response.body) throw new Error("Provider stream was missing");
  const decoder = new TextDecoder();
  let buffer = "",
    terminal = false;
  const transform = new TransformStream<Uint8Array, Uint8Array>({
    async transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      let end: number;
      while ((end = buffer.indexOf("\n\n")) !== -1) {
        const event = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        for (const line of event.split("\n")) {
          if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
          const data = JSON.parse(line.slice(6));
          if (
            [
              "response.completed",
              "response.failed",
              "response.incomplete",
            ].includes(data.type)
          ) {
            terminal = true;
            await record(data.response);
          }
        }
      }
      controller.enqueue(chunk);
    },
    flush() {
      if (!terminal)
        throw new Error("Provider stream ended without terminal usage");
    },
  });
  return new Response(response.body.pipeThrough(transform), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
