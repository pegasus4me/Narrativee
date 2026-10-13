import { contrastRatio } from "../../brand-board/render";
import type { BrandBrainContext } from "../../brand-brain/context";
import type { CampaignDocument, CampaignLayer } from "./campaign.types";

type Frame = CampaignDocument["frames"][number];
const minimumContrast = 4.5;

function overlaps(first: CampaignLayer, second: CampaignLayer) {
  return (
    first.x < second.x + second.width &&
    first.y < second.y + second.height &&
    first.x + first.width > second.x &&
    first.y + first.height > second.y
  );
}

function textBackground(frame: Frame, index: number): string | null {
  const text = frame.layers[index]!;
  // A later image/shape can obscure text even if its earlier backing is solid.
  if (
    frame.layers
      .slice(index + 1)
      .some((layer) => layer.type !== "text" && overlaps(layer, text))
  )
    return null;
  for (const layer of frame.layers.slice(0, index).reverse()) {
    if (layer.type === "text" || !overlaps(layer, text)) continue;
    if (
      layer.type === "rect" &&
      layer.radius === 0 &&
      layer.x <= text.x &&
      layer.y <= text.y &&
      layer.x + layer.width >= text.x + text.width &&
      layer.y + layer.height >= text.y + text.height
    )
      return layer.fill;
    // Photos, paths, ellipses and partial/rounded panels have unknown coverage.
    return null;
  }
  return frame.background;
}

export function validateCampaignContrast(document: CampaignDocument) {
  for (const frame of document.frames) {
    for (const [index, layer] of frame.layers.entries()) {
      if (layer.type !== "text") continue;
      const background = textBackground(frame, index);
      if (!background)
        throw new Error(
          `Text layer ${layer.id} needs an opaque backing for reliable contrast`,
        );
      const ratio = contrastRatio(layer.fill, background);
      if (ratio < minimumContrast)
        throw new Error(
          `Text layer ${layer.id} has insufficient contrast: ${layer.fill} on ${background} is ${ratio.toFixed(2)}:1; requires ${minimumContrast}:1`,
        );
    }
  }
}

export class CampaignPaletteError extends Error {
  readonly question =
    "I couldn't find a readable combination within your approved colors. Please add or approve a contrasting text/background color in Brand Brain, then I can finish this creative. Your campaign brief does not need changing.";
}

function readColors(items: Array<{ category: string; content: string }>) {
  return items
    .filter((item) => item.category === "color")
    .flatMap((item) =>
      [...item.content.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)].map(
        (match) => {
          const hex = match[1]!;
          return `#${hex.length === 3 ? [...hex].map((digit) => digit + digit).join("") : hex}`.toUpperCase();
        },
      ),
    );
}

export interface ContrastAdjustment {
  frameId: string;
  layerId: string;
  previousFill: string;
  fill: string;
  background: string;
  addedBacking: boolean;
}

export function repairCampaignContrast(
  document: CampaignDocument,
  brain: Pick<BrandBrainContext, "approvedRules" | "websiteObservations">,
): ContrastAdjustment[] {
  const approved = brain.approvedRules.filter(
    (item) => item.category === "color",
  );
  const palette = [
    ...new Set(
      approved.length
        ? readColors(approved)
        : [
            ...readColors(brain.websiteObservations),
            ...document.frames.flatMap((frame) => [
              frame.background,
              ...frame.layers.flatMap((layer) =>
                layer.type === "image" ? [] : [layer.fill],
              ),
            ]),
            "#18181B",
            "#FFFFFF",
          ].map((color) => color.toUpperCase()),
    ),
  ];
  const adjustments: ContrastAdjustment[] = [];
  for (const frame of document.frames) {
    for (const layer of [...frame.layers]) {
      if (layer.type !== "text") continue;
      const index = frame.layers.indexOf(layer);
      const background = textBackground(frame, index);
      if (
        background &&
        contrastRatio(layer.fill, background) >= minimumContrast
      )
        continue;
      const previousFill = layer.fill;
      const candidates = [
        ...new Set([layer.fill.toUpperCase(), ...palette]),
      ].filter((color) => palette.includes(color));
      const readableFill =
        background &&
        candidates.find(
          (color) => contrastRatio(color, background) >= minimumContrast,
        );
      if (readableFill) {
        layer.fill = readableFill;
        adjustments.push({
          frameId: frame.id,
          layerId: layer.id,
          previousFill,
          fill: layer.fill,
          background: background!,
          addedBacking: false,
        });
        continue;
      }
      const fill = candidates.find((color) =>
        palette.some(
          (backing) => contrastRatio(color, backing) >= minimumContrast,
        ),
      );
      const backing =
        fill &&
        palette.find((color) => contrastRatio(fill, color) >= minimumContrast);
      if (!fill || !backing)
        throw new CampaignPaletteError(
          `No readable palette pair for frame ${frame.id}, text layer ${layer.id}`,
        );
      let id = `${layer.id.slice(0, 80)}-contrast`;
      for (
        let suffix = 1;
        frame.layers.some((item) => item.id === id);
        suffix++
      )
        id = `${layer.id.slice(0, 80)}-contrast-${suffix}`;
      const panel: CampaignLayer = {
        id,
        type: "rect",
        x: Math.max(0, layer.x - 16),
        y: Math.max(0, layer.y - 16),
        width: 0,
        height: 0,
        fill: backing,
        radius: 0,
      };
      panel.width = Math.min(frame.width, layer.x + layer.width + 16) - panel.x;
      panel.height =
        Math.min(frame.height, layer.y + layer.height + 16) - panel.y;
      // Don't let optional padding cover an adjacent text layer.
      if (
        frame.layers.some(
          (other) =>
            other !== layer && other.type === "text" && overlaps(panel, other),
        )
      ) {
        panel.x = layer.x;
        panel.y = layer.y;
        panel.width = layer.width;
        panel.height = layer.height;
      }
      layer.fill = fill;
      // Place the pair above intersecting imagery, without modifying that imagery.
      frame.layers.splice(index, 1);
      frame.layers.push(panel, layer);
      adjustments.push({
        frameId: frame.id,
        layerId: layer.id,
        previousFill,
        fill,
        background: backing,
        addedBacking: true,
      });
    }
  }
  return adjustments;
}
