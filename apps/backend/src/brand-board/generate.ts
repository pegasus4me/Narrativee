import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  boardCritiqueSchema,
  directionSchema,
  imageSelectionSchema,
  type BoardCritique,
  type BrandDirection,
} from "./board.schema";
import {
  BRAND_BOARD_SYSTEM_PROMPT,
  BOARD_CRITIQUE_PROMPT,
  IMAGE_SELECTION_PROMPT,
} from "./prompts";
import { validateDirectionEvidence, type BoardResearch } from "./research";
import { contrastRatio, validateDirectionLayout } from "./render";

export interface SelectedArtwork {
  png: Buffer;
  selectedIndex: number;
  reason: string;
  candidates: number;
}

export class BrandBoardGenerator {
  private readonly client: OpenAI;
  private readonly textModel: string;
  private readonly imageModel: string;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
    this.textModel =
      process.env.BRAND_BOARD_TEXT_MODEL ??
      process.env.OPENAI_MODEL ??
      "gpt-5.6-luna";
    this.imageModel = process.env.BRAND_BOARD_IMAGE_MODEL ?? "gpt-image-2";
  }

  async createDirection(research: BoardResearch): Promise<BrandDirection> {
    const response = await this.client.responses.parse({
      model: this.textModel,
      reasoning: { effort: "high" },
      input: [
        { role: "system", content: BRAND_BOARD_SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            company: research.brandName,
            website: research.url,
            diagnosis: research.diagnosis,
            competitorAnalysis: JSON.parse(research.competitorSummary),
            evidence: research.evidence,
          }),
        },
      ],
      text: { format: zodTextFormat(directionSchema, "brand_board_direction") },
    });
    if (!response.output_parsed) {
      throw new Error("Creative direction model returned no structured result");
    }
    const direction = directionSchema.parse(response.output_parsed);
    validateDirectionEvidence(direction, research.evidence);
    validateDirectionLayout(direction);
    if (
      contrastRatio(
        direction.palette.background,
        direction.palette.foreground,
      ) < 4.5
    ) {
      throw new Error(
        "Creative direction palette has insufficient text contrast",
      );
    }
    return direction;
  }

  async createArtwork(direction: BrandDirection): Promise<SelectedArtwork> {
    const prompt = [
      "Use case: stylized-concept",
      "Asset type: text-free artwork panel for a premium brand exploration board",
      `Primary request: ${direction.imageBrief}`,
      `Color palette: ${Object.values(direction.palette).join(", ")}`,
      "Composition: square artwork, decisive focal point, refined negative space, richly considered materials and light.",
      "Constraints: artwork only. Absolutely no words, letters, typography, logos, brand names, UI, diagrams, mockups, borders, or watermarks.",
    ].join("\n");
    const result = await this.client.images.generate({
      model: this.imageModel,
      prompt,
      n: 2,
      size: "1024x1024",
      quality: "high",
      output_format: "png",
    });
    const candidates = (result.data ?? [])
      .map((item) => item.b64_json)
      .filter((value): value is string => Boolean(value));
    if (candidates.length === 0) {
      throw new Error("Image generation returned no PNG candidates");
    }
    if (candidates.length === 1) {
      return {
        png: Buffer.from(candidates[0], "base64"),
        selectedIndex: 0,
        reason: "Only one image candidate was returned.",
        candidates: 1,
      };
    }

    const selection = await this.client.responses.parse({
      model: this.textModel,
      input: [
        { role: "system", content: IMAGE_SELECTION_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                imageBrief: direction.imageBrief,
                palette: direction.palette,
              }),
            },
            ...candidates.slice(0, 2).flatMap((base64, index) => [
              { type: "input_text" as const, text: `Candidate ${index}` },
              {
                type: "input_image" as const,
                image_url: `data:image/png;base64,${base64}`,
                detail: "low" as const,
              },
            ]),
          ],
        },
      ],
      text: {
        format: zodTextFormat(imageSelectionSchema, "artwork_selection"),
      },
    });
    if (!selection.output_parsed) {
      throw new Error("Artwork selection returned no structured result");
    }
    const picked = imageSelectionSchema.parse(selection.output_parsed);
    return {
      png: Buffer.from(candidates[picked.selectedIndex], "base64"),
      selectedIndex: picked.selectedIndex,
      reason: picked.reason,
      candidates: candidates.length,
    };
  }

  async critiqueBoard(
    board: Buffer,
    research: BoardResearch,
  ): Promise<BoardCritique> {
    const response = await this.client.responses.parse({
      model: this.textModel,
      input: [
        { role: "system", content: BOARD_CRITIQUE_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                company: research.brandName,
                diagnosis: research.diagnosis,
                competitorSummary: research.competitorSummary,
              }),
            },
            {
              type: "input_image",
              image_url: `data:image/png;base64,${board.toString("base64")}`,
              detail: "high",
            },
          ],
        },
      ],
      text: { format: zodTextFormat(boardCritiqueSchema, "board_critique") },
    });
    if (!response.output_parsed) {
      throw new Error("Board critique returned no structured result");
    }
    return boardCritiqueSchema.parse(response.output_parsed);
  }
}
