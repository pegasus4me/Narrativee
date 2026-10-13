import { CREDIT_MICRODOLLARS } from "../../billing/catalog";
import { rateFor, type ModelRate } from "../../usage/model-rates";
import { creativeImageSize, imageOutputBound } from "../../usage/image-format";
import type { CampaignOutput } from "./campaign.output";

function callBound(rate: ModelRate, outputTokens = rate.maxOutputTokens) {
  return Math.ceil(
    rate.maxInputTokens *
      Math.max(
        rate.input,
        rate.cacheWrite,
        rate.imageInput ?? 0,
        rate.longContext?.input ?? 0,
        rate.longContext?.cacheWrite ?? 0,
      ) +
      outputTokens * Math.max(rate.output, rate.longContext?.output ?? 0),
  );
}

// Upper bound includes two planning attempts, their reviews, and one image correction per output.
export function campaignCreditBound(
  outputs: CampaignOutput[],
  imageModel: string,
  textModel: string,
) {
  const text = rateFor(textModel, "text");
  const image = rateFor(imageModel, "image");
  const textCost = (4 + 2 * outputs.length) * callBound(text);
  const imageCost = outputs.reduce(
    (total, output) =>
      total +
      2 *
        callBound(
          image,
          imageOutputBound(
            imageModel,
            creativeImageSize(output.width, output.height, imageModel),
            image.maxOutputTokens,
          ),
        ),
    0,
  );
  return Math.ceil((textCost + imageCost) / CREDIT_MICRODOLLARS);
}
