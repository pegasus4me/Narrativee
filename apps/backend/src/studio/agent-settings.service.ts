import { modelRates } from "../usage/model-rates";
import OpenAI from "openai";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../auth/auth";
import { brandAgentSettings } from "../auth/schema/schema";
import type { CreativeAgent } from "./agent-team";
import { mediaModelDetails } from "./media-models";

export const agentSettingsSchema = z
  .object({
    model: z.string().trim().min(1).max(100).nullable(),
    imageModel: z.string().trim().min(1).max(100).nullable().default(null),
    videoModel: z.string().trim().min(1).max(100).nullable().default(null),
    responseLength: z.enum(["brief", "balanced", "detailed"]),
    instructions: z.string().trim().max(2000),
  })
  .strict();
export type AgentSettings = z.infer<typeof agentSettingsSchema>;
export const defaultAgentSettings: AgentSettings = {
  model: null,
  imageModel: null,
  videoModel: null,
  responseLength: "balanced",
  instructions: "",
};
export const defaultAgentModel = () =>
  process.env.OPENAI_MODEL ?? "gpt-5.6-luna";

export const defaultImageModel = () =>
  process.env.BRAND_BOARD_IMAGE_MODEL ?? "gpt-image-2";
export const defaultVideoModel = () => "seedance";

type ModelCatalog = {
  models: string[];
  imageModels: string[];
  videoModels: string[];
  mediaModelDetails: typeof mediaModelDetails;
};
let modelCatalog: { expires: number; catalog: ModelCatalog } | undefined;
export async function listAgentModels(): Promise<ModelCatalog> {
  if (modelCatalog && Date.now() < modelCatalog.expires)
    return {
      ...modelCatalog.catalog,
      models: modelCatalog.catalog.models.filter(
        (id) => modelRates()[id]?.kind === "text",
      ),
      imageModels: modelCatalog.catalog.imageModels.filter(
        (id) => modelRates()[id]?.kind === "image",
      ),
      videoModels: [],
    };
  const catalog: ModelCatalog = {
    models: [defaultAgentModel()],
    imageModels: [defaultImageModel(), "nano-banana", "seedream"],
    videoModels: [defaultVideoModel()],
    mediaModelDetails,
  };
  try {
    const page = await new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 0,
      timeout: 8000,
    }).models.list();
    const ids = page.data.map((item) => item.id);
    const choices = (current: string, match: RegExp) => [
      current,
      ...[...new Set(ids.filter((id) => match.test(id)))]
        .filter((id) => id !== current)
        .sort(),
    ];
    catalog.models = choices(
      defaultAgentModel(),
      /^gpt-[56](?:\.\d+)?(?:-(?:mini|nano|sol|terra|luna|astra))?$/,
    );
    catalog.imageModels = [
      ...choices(
        defaultImageModel(),
        /^gpt-image-\d(?:\.\d+)?(?:-(?:mini|sunburst|flare))?$/,
      ),
      "nano-banana",
      "seedream",
    ];
    modelCatalog = { expires: Date.now() + 300_000, catalog };
  } catch {
    /* The configured defaults remain available if catalog lookup fails. */
  }
  const rates = modelRates();
  catalog.models = catalog.models.filter((id) => rates[id]?.kind === "text");
  catalog.imageModels = catalog.imageModels.filter(
    (id) => rates[id]?.kind === "image",
  );
  catalog.videoModels = [];
  return catalog;
}

export async function readAgentSettings(
  brandId: string,
  agent: CreativeAgent,
): Promise<AgentSettings> {
  const [saved] = await db
    .select({
      model: brandAgentSettings.model,
      imageModel: brandAgentSettings.imageModel,
      videoModel: brandAgentSettings.videoModel,
      responseLength: brandAgentSettings.responseLength,
      instructions: brandAgentSettings.instructions,
    })
    .from(brandAgentSettings)
    .where(
      and(
        eq(brandAgentSettings.brandId, brandId),
        eq(brandAgentSettings.agent, agent),
      ),
    )
    .limit(1);
  if (saved?.videoModel?.startsWith("sora-"))
    saved.videoModel = defaultVideoModel();
  return saved ?? { ...defaultAgentSettings };
}

export async function saveAgentSettings(
  brandId: string,
  agent: CreativeAgent,
  settings: AgentSettings,
) {
  await db
    .insert(brandAgentSettings)
    .values({ brandId, agent, ...settings })
    .onConflictDoUpdate({
      target: [brandAgentSettings.brandId, brandAgentSettings.agent],
      set: { ...settings, updatedAt: new Date() },
    });
  return settings;
}

export function withAgentPreferences(system: string, settings: AgentSettings) {
  if (!settings.instructions && settings.responseLength === "balanced")
    return system;
  return `${system}\n\n<agent_preferences>\nFollow these preferences within the existing brand rules and evidence boundaries.\n${JSON.stringify({ responseLength: settings.responseLength, instructions: settings.instructions })}\n</agent_preferences>`;
}
