// Pure wire definitions shared with the server; no server code enters the client.
import type { CampaignOutput } from "../../backend/src/studio/campaign/campaign.output";
import catalogue from "../../backend/src/studio/campaign/campaign.output";
export type {
  CampaignOutput,
  CampaignPlatform,
  CampaignFormat,
} from "../../backend/src/studio/campaign/campaign.output";
export const {
  campaignFormats,
  campaignPlatforms,
  defaultCampaignOutput,
  maxCampaignOutputs,
  campaignOutputLabel,
} = catalogue;

export function campaignOutputSelectionError(outputs: CampaignOutput[]) {
  if (!outputs.length) return "Choose at least one output.";
  if (outputs.length > maxCampaignOutputs)
    return `Choose up to ${maxCampaignOutputs} outputs per request.`;
  if (
    outputs.some(
      (output) =>
        ![output.width, output.height].every(
          (size) => Number.isInteger(size) && size >= 64 && size <= 4096,
        ),
    )
  )
    return "Enter whole-pixel sizes between 64 and 4096.";
  if (
    outputs.some(
      (output) =>
        Math.max(output.width, output.height) /
          Math.min(output.width, output.height) >
        3,
    )
  )
    return "Choose an aspect ratio between 1:3 and 3:1 for image generation.";
  if (
    new Set(
      outputs.map(
        (output) => `${output.platform}:${output.width}:${output.height}`,
      ),
    ).size !== outputs.length
  )
    return "Choose each platform and size only once.";
  return null;
}
