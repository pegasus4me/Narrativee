import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  brandDiagnosisSchema,
  competitorAnalysisSchema,
  competitorDiscoverySchema,
  competitorResearchPlanSchema,
  type BrandDiagnosis,
  type CompetitorAnalysis,
  type CompetitorCandidate,
  type CompetitorResearchPlan,
} from "./analysis.schema";
import type {
  FirecrawlDocument,
  FirecrawlSearchResult,
} from "./firecrawl.client";
import BRAND_DIAGNOSIS_SYSTEM_PROMPT from "./prompts/brand-diagnosis.prompt";
import {
  COMPETITOR_COMPARISON_PROMPT,
  COMPETITOR_DISCOVERY_PROMPT,
  COMPETITOR_RESEARCH_PLAN_PROMPT,
} from "./prompts/competitor-research.prompt";

export class OpenAIBrandSynthesizer {
  private readonly client: OpenAI;

  constructor(
    apiKey: string,
    private readonly model = "gpt-6-luna",
  ) {
    this.client = new OpenAI({ apiKey });
  }

  async planCompetitorResearch(
    companyUrl: string,
    diagnosis: BrandDiagnosis,
  ): Promise<CompetitorResearchPlan> {
    const response = await this.client.responses.parse({
      model: this.model,
      reasoning: { effort: "high" },
      input: [
        { role: "system", content: COMPETITOR_RESEARCH_PLAN_PROMPT },
        { role: "user", content: JSON.stringify({ companyUrl, diagnosis }) },
      ],
      text: {
        format: zodTextFormat(competitorResearchPlanSchema, "competitor_research_plan"),
      },
    });

    if (!response.output_parsed) {
      throw new Error("OpenAI returned no competitor research plan");
    }
    return response.output_parsed;
  }

  async synthesize(
    url: string,
    document: FirecrawlDocument,
  ): Promise<BrandDiagnosis> {
    const response = await this.client.responses.parse({
      model: this.model,
      reasoning: { effort: "low" },
      input: [
        { role: "system", content: BRAND_DIAGNOSIS_SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            url,
            title: document.metadata?.title ?? "",
            description: document.metadata?.description ?? "",
            markdown: document.markdown?.slice(0, 80_000) ?? "",
            branding: document.branding ?? null,
          }),
        },
      ],
      text: {
        format: zodTextFormat(brandDiagnosisSchema, "brand_diagnosis"),
      },
    });

    if (!response.output_parsed) {
      throw new Error("OpenAI returned no structured brand diagnosis");
    }

    return response.output_parsed;
  }

  async discoverCompetitors(
    companyUrl: string,
    diagnosis: BrandDiagnosis,
    searchResults: FirecrawlSearchResult[],
  ): Promise<CompetitorCandidate[]> {
    const response = await this.client.responses.parse({
      model: this.model,
      reasoning: { effort: "high" },
      input: [
        {
          role: "system",
          content: COMPETITOR_DISCOVERY_PROMPT,
        },
        {
          role: "user",
          content: JSON.stringify({ companyUrl, diagnosis, searchResults }),
        },
      ],
      text: {
        format: zodTextFormat(
          competitorDiscoverySchema,
          "competitor_discovery",
        ),
      },
    });

    if (!response.output_parsed) {
      throw new Error("OpenAI returned no competitor candidates");
    }
    return response.output_parsed.candidates;
  }

  async compareCompetitors(
    companyUrl: string,
    diagnosis: BrandDiagnosis,
    competitors: Array<{ url: string; document: FirecrawlDocument }>,
  ): Promise<CompetitorAnalysis> {
    const evidence = competitors.map(({ url, document }, index) => ({
      url,
      title: document.metadata?.title ?? "",
      description: document.metadata?.description ?? "",
      markdown: document.markdown?.slice(0, 50_000) ?? "",
      branding: document.branding ?? null,
      screenshotIndex: usableScreenshot(document.screenshot) ? index : null,
    }));

    const content: Array<
      | { type: "input_text"; text: string }
      | { type: "input_image"; image_url: string; detail: "low" }
    > = [{
      type: "input_text",
      text: JSON.stringify({ companyUrl, diagnosis, competitors: evidence }),
    }];
    competitors.forEach(({ document }, index) => {
      const screenshot = usableScreenshot(document.screenshot);
      if (screenshot) {
        content.push({ type: "input_text", text: `Screenshot ${index}: ${competitors[index]?.url}` });
        content.push({ type: "input_image", image_url: screenshot, detail: "low" });
      }
    });

    const response = await this.client.responses.parse({
      model: this.model,
      reasoning: { effort: "high" },
      input: [
        {
          role: "system",
          content: COMPETITOR_COMPARISON_PROMPT,
        },
        { role: "user", content },
      ],
      text: {
        format: zodTextFormat(competitorAnalysisSchema, "competitor_analysis"),
      },
    });

    if (!response.output_parsed) {
      throw new Error("OpenAI returned no structured competitor analysis");
    }

    return response.output_parsed;
  }
}

function usableScreenshot(screenshot: string | undefined): string | null {
  if (!screenshot) return null;
  if (/^https:\/\//i.test(screenshot) || /^data:image\/(?:png|jpeg|webp);base64,/i.test(screenshot)) {
    return screenshot;
  }
  return null;
}
