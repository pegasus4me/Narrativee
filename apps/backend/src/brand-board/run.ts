import sharp from "sharp";
import { BrandBoardGenerator } from "./generate";
import { renderBrandBoard } from "./render";
import type { BoardResearch } from "./research";

export async function generateBrandBoard(
  research: BoardResearch,
  onStage?: (stage: string) => void,
) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is required");

  const generator = new BrandBoardGenerator(apiKey);
  onStage?.("Creating an evidence-backed creative direction");
  const direction = await generator.createDirection(research);
  onStage?.("Generating and selecting text-free artwork");
  const artwork = await generator.createArtwork(direction);
  onStage?.("Rendering and reviewing the board");
  const board = await renderBrandBoard(
    research.brandName,
    direction,
    artwork.png,
  );
  const critique = await generator.critiqueBoard(board, research);

  const dimensions = await sharp(board).metadata();
  if (dimensions.width !== 1920 || dimensions.height !== 1080) {
    throw new Error("Board PNG dimensions are invalid");
  }

  return { board, direction, artwork, critique };
}
