// Shared wire constants: no server imports, safe for the Studio selectors.
export const campaignFormats = {
  square_1080: {
    id: "square_1080",
    label: "Square · 1:1",
    width: 1080,
    height: 1080,
  },
  portrait_1080: {
    id: "portrait_1080",
    label: "Portrait · 4:5",
    width: 1080,
    height: 1350,
  },
  vertical_1080: {
    id: "vertical_1080",
    label: "Story / vertical image · 9:16",
    width: 1080,
    height: 1920,
  },
  landscape_1200: {
    id: "landscape_1200",
    label: "Landscape · 1.91:1",
    width: 1200,
    height: 628,
  },
  landscape_1920: {
    id: "landscape_1920",
    label: "Wide · 16:9",
    width: 1920,
    height: 1080,
  },
  pin_1000: { id: "pin_1000", label: "Pin · 2:3", width: 1000, height: 1500 },
} as const;

export const campaignPlatforms = {
  general: {
    label: "Any platform",
    formats: [
      "square_1080",
      "portrait_1080",
      "vertical_1080",
      "landscape_1200",
      "landscape_1920",
      "pin_1000",
    ],
  },
  instagram: {
    label: "Instagram",
    formats: ["square_1080", "portrait_1080", "vertical_1080"],
  },
  facebook: {
    label: "Facebook",
    formats: [
      "square_1080",
      "portrait_1080",
      "vertical_1080",
      "landscape_1200",
    ],
  },
  linkedin: {
    label: "LinkedIn",
    formats: ["landscape_1200", "square_1080", "portrait_1080"],
  },
  x: {
    label: "X",
    formats: [
      "landscape_1920",
      "square_1080",
      "landscape_1200",
      "portrait_1080",
    ],
  },
  pinterest: { label: "Pinterest", formats: ["pin_1000", "square_1080"] },
  tiktok: { label: "TikTok · image", formats: ["vertical_1080"] },
} as const;

export type CampaignPlatform = keyof typeof campaignPlatforms;
export type CampaignFormat = keyof typeof campaignFormats | "custom";
export type CampaignOutput = {
  platform: CampaignPlatform;
  formatId: CampaignFormat;
  width: number;
  height: number;
};
export const defaultCampaignOutput: CampaignOutput = {
  platform: "general",
  formatId: "square_1080",
  width: 1080,
  height: 1080,
};

export const maxCampaignOutputs = 12;

export function campaignOutputLabel(output: CampaignOutput) {
  return `${campaignPlatforms[output.platform].label} · ${output.width} × ${output.height} px`;
}

export default {
  campaignFormats,
  campaignPlatforms,
  defaultCampaignOutput,
  maxCampaignOutputs,
  campaignOutputLabel,
};
