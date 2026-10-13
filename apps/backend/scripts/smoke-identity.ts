import { loadBoardResearchForBrand } from "../src/brand-board/research";
import {
  createIdentityPlan,
  createLogoScene,
} from "../src/studio/identity.generator";

async function main() {
  const brandId = process.argv[2];
  if (!brandId) {
    throw new Error(
      "Usage: node --import tsx scripts/smoke-identity.ts <brandId>",
    );
  }
  const research = await loadBoardResearchForBrand(brandId);
  const plan = await createIdentityPlan(
    research,
    `Explore three distinctive editable logo directions for ${research.brandName}`,
  );
  const usedFonts: string[] = [];
  for (const [index, direction] of plan.directions.entries()) {
    const scene = await createLogoScene(research, plan, index, usedFonts);
    usedFonts.push(scene.fontFamily);
    console.log(
      `${index + 1}. ${direction.name}: ${scene.paths.length} paths, ${scene.fontFamily}`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
