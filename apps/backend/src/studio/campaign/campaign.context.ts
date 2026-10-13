import { and, desc, eq, isNull, inArray } from "drizzle-orm";
import sharp from "sharp";
import { db } from "../../auth/auth";
import { brandBrainAsset } from "../../auth/schema/schema";
import { loadBrandBrainContext } from "../../brand-brain/context";
import { readAsset } from "../../brand-brain/storage";
import {
  findStudioProject,
  readStudioMessages,
  readStudioTeamContext,
} from "../studio.service";
import { readCampaignUploads } from "./campaign.uploads";
import type { CreativeAgentSelection } from "../agent-team";
import type { CampaignOutput } from "./campaign.output";
import type { CampaignGeneration } from "./campaign.types";

export async function loadCampaignContext(
  projectId: string,
  userId: string,
  thread: CreativeAgentSelection = "team",
  generation?: CampaignGeneration,
) {
  const project = await findStudioProject(projectId, userId);
  if (!project) throw new Error("Project not found");
  const brain = await loadBrandBrainContext(project.brandId);
  const [messages, assets, uploads, teamConversation] = await Promise.all([
    readStudioMessages(projectId, thread),
    db
      .select()
      .from(brandBrainAsset)
      .where(
        and(
          eq(brandBrainAsset.brandId, project.brandId),
          isNull(brandBrainAsset.archivedAt),
          generation
            ? inArray(brandBrainAsset.id, generation.referenceIds)
            : undefined,
        ),
      )
      .orderBy(desc(brandBrainAsset.createdAt))
      .limit(30),
    readCampaignUploads(projectId, userId, generation?.referenceIds),
    readStudioTeamContext(projectId),
  ]);
  const ranked = [...assets]
    .sort((a, b) => {
      const priority = (asset: typeof a) =>
        (asset.kind === "rule" ? 4 : 0) +
        (asset.productId ? 3 : 0) +
        (asset.category === "identity" ? 4 : 0) +
        (asset.source === "user" ? 1 : 0);
      return priority(b) - priority(a);
    })
    // Planning sees a wider inventory than the final image attachment limit.
    .slice(0, Math.max(0, 12 - uploads.length));
  const references = await Promise.all(
    ranked.map(async (asset) => {
      const thumbnail = await sharp(await readAsset(asset.objectKey))
        .resize({
          width: 768,
          height: 768,
          fit: "inside",
          withoutEnlargement: true,
        })
        .png()
        .toBuffer();
      return {
        id: asset.id,
        ...(asset.productId ? { productId: asset.productId } : {}),
        kind: asset.kind,
        category: asset.category,
        caption: asset.caption,
        source: asset.source,
        width: asset.width,
        height: asset.height,
        image: `data:image/png;base64,${thumbnail.toString("base64")}`,
      };
    }),
  );
  return {
    brandName: project.brandName,
    briefHistory: messages
      .slice(-12)
      .map(({ role, content }) => ({ role, content })),
    diagnosis: project.analysis?.diagnosis ?? null,
    competitorAnalysis: project.analysis?.competitorAnalysis ?? null,
    brain,
    teamConversation,
    // Raster typography follows Brand Brain; generation needs no font download.
    fonts: [] as Array<{
      family: string;
      variants: string[];
      category: string;
    }>,
    typographyNotice: null as string | null,
    references: [...uploads, ...references],
  };
}
export type CampaignContext = Awaited<
  ReturnType<typeof loadCampaignContext>
> & { outputs?: CampaignOutput[]; userBrief?: string };
