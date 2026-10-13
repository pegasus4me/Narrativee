export const mediaModelDetails = {
  "nano-banana": {
    label: "Nano Banana",
    provider: "Google",
    kind: "image",
    connected: false,
  },
  seedream: {
    label: "Seedream",
    provider: "ByteDance",
    kind: "image",
    connected: false,
  },
  seedance: {
    label: "Seedance",
    provider: "ByteDance",
    kind: "video",
    connected: false,
  },
} as const;

export class MediaModelError extends Error {}

export function assertImageModelConnected(model: string) {
  if (model === "nano-banana" || model === "seedream") {
    throw new MediaModelError(
      `${mediaModelDetails[model].label} is not connected yet. Choose a connected image model in Image settings to generate artwork.`,
    );
  }
  if (!/^gpt-image-/.test(model))
    throw new MediaModelError("This image model is not connected yet.");
}
