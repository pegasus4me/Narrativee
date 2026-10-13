import { z } from "zod";
import { evaluateJev } from "../identity.judgment";
import type { CampaignContext } from "./campaign.context";
import type { CampaignPlan } from "./campaign.schema";
import { reviewCampaignIssues } from "./campaign.generator";

export async function assessCampaignPlan(
  context: CampaignContext,
  request: string,
  plan: CampaignPlan,
  review: typeof reviewCampaignIssues = reviewCampaignIssues,
) {
  const { references, ...textContext } = context;
  const result = await evaluateJev(
    {
      ...textContext,
      references: references.map(
        ({ image: _image, ...reference }) => reference,
      ),
      request,
      plan,
    },
    {
      grounding: {
        type: "score",
        instructions:
          "Does the creative's copy stay within the brief and brand evidence, without invented offers, features, dates, metrics or factual claims?",
        criteria: [
          "Invented claims dominate",
          "Some claims are unsupported",
          "Grounded with minor uncertainty",
          "Fully grounded",
        ],
      },
      brandFit: {
        type: "score",
        instructions:
          "Does the plan honor explicitly approved brand rules and preserve supplied logos/products when used? Judge only observable image-brief choices. Missing rules or assets are not violations. Website observations and inspirations are not approved requirements. Typography is rendered by GPT Images, so no editable font is required. Do not infer unseen image pixels or require every reference to appear.",
        criteria: [
          "Contradicts brand",
          "Ignores important rules",
          "No established conflict with supplied brand rules",
          "Precisely brand-consistent",
        ],
      },
      specificity: {
        type: "score",
        instructions:
          "Is the concept and composition specific to this brand, offering and campaign, rather than generic AI decoration? Respect the user's explicit requested scene and style; a deliberately requested conventional scene is not a violation. Judge the plan only, not an unseen rendered image.",
        criteria: [
          "Generic",
          "Weakly specific",
          "Purposeful",
          "Distinctive and purposeful",
        ],
      },
    },
  );
  const score = z.object({
    type: z.literal("score"),
    score: z.number().min(0).max(3),
    confidence: z.number().min(0).max(1),
  });
  const { answers } = z
    .object({
      answers: z.object({
        grounding: score,
        brandFit: score,
        specificity: score,
      }),
    })
    .parse(result);
  const dimensions = Object.entries(answers)
    .filter(([, answer]) => answer.score < 2)
    .map(([name]) => name);
  return dimensions.length ? review(context, request, plan, dimensions) : [];
}
