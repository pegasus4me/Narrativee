import { AnalysisService } from "./analysis.service";
import { FirecrawlClient } from "./firecrawl.client";
import { OpenAIBrandSynthesizer } from "./openai-brand-synthesizer";

export function createAnalysisService() {
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!firecrawlKey || !openaiKey)
    throw new Error("Analysis provider is not configured");
  return new AnalysisService(
    new FirecrawlClient(firecrawlKey),
    new OpenAIBrandSynthesizer(
      openaiKey,
      process.env.OPENAI_MODEL ?? "gpt-5.6-luna",
    ),
  );
}
