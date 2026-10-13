import { z } from "zod";
import type { BoardResearch } from "../brand-board/research";
import type { IdentityPlan } from "./identity.schema";

const choiceAnswer = z.object({
  type: z.literal("choice"),
  choice: z.enum(["logo_exploration", "campaign_creation", "conversation"]),
  confidence: z.number().min(0).max(1),
});

const scoreAnswer = z.object({
  type: z.literal("score"),
  score: z.number().min(0).max(3),
  confidence: z.number().min(0).max(1),
});

type JevQuestion =
  | { type: "choice"; instructions: string; criteria: Record<string, string> }
  | { type: "score"; instructions: string; criteria: string[] };

export class JevConfigurationError extends Error {}
export class JevRequestError extends Error {}

export async function evaluateJev(
  state: unknown,
  questions: Record<string, JevQuestion>,
): Promise<unknown> {
  const apiKey = process.env.TYPESAFE_API_KEY;
  if (!apiKey) {
    throw new JevConfigurationError(
      "TYPESAFE_API_KEY is required for Creator judgments",
    );
  }

  let response: Response;
  try {
    response = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ state, model: "jev-latest", questions }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    throw new JevRequestError(
      error instanceof Error &&
      ["TimeoutError", "AbortError"].includes(error.name)
        ? "The brief classifier timed out before it could choose the next step. No new visual was created."
        : "The brief classifier could not be reached. No new visual was created.",
    );
  }
  if (!response.ok) {
    throw new JevRequestError(
      `The brief classifier or brand reviewer is unavailable (HTTP ${response.status}). No unapproved visual was created.`,
    );
  }
  try {
    return (await response.json()) as unknown;
  } catch {
    throw new JevRequestError(
      "The brief classifier or brand reviewer returned an unreadable response. No unapproved visual was created.",
    );
  }
}

export async function classifyCreatorIntentWithJev(
  content: string,
  history: Array<{ role: string; content: string }> = [],
) {
  const result = await evaluateJev(
    { request: content, history },
    {
      intent: {
        type: "choice",
        instructions:
          "Read request and history together, including answers to a campaign clarification. Choose campaign_creation for generating a new ad, launch visual, social creative, poster or promotional asset. Choose logo_exploration only for new logo/identity exploration. Existing-layer edits are currently manual: route revision requests about an existing creative to conversation and explain editing controls, rather than generating replacements. Choose conversation for questions and discussion.",
        criteria: {
          logo_exploration:
            "The user asks for new logos, wordmarks, marks or visual identity exploration.",
          campaign_creation:
            "The user asks to create a new campaign, ad, social, launch or promotional visual, or answers the designer's campaign clarification.",
          conversation:
            "The user asks a question or requests discussion without asking to create visual work.",
        },
      },
    },
  );
  const answer = z
    .object({ answers: z.object({ intent: choiceAnswer }) })
    .safeParse(result);
  if (!answer.success)
    throw new JevRequestError(
      "The brief classifier returned an invalid decision. No new visual was created.",
    );
  return answer.data.answers.intent.choice;
}

export async function assessIdentityPlanWithJev(
  research: BoardResearch,
  plan: IdentityPlan,
): Promise<string[]> {
  const result = await evaluateJev(
    {
      brandName: research.brandName,
      diagnosis: research.diagnosis,
      competitorSummary: JSON.parse(research.competitorSummary),
      evidence: research.evidence,
      directions: plan.directions,
    },
    {
      grounding: {
        type: "score",
        instructions:
          "How well are the strategic angles in `directions` supported by `diagnosis` and `evidence`, without inventing product or competitor facts?",
        criteria: [
          "Unsupported or contradictory claims dominate.",
          "Some claims lack support or overreach.",
          "Most claims are plausibly grounded; minor uncertainty remains.",
          "All claims stay carefully within the supplied evidence.",
        ],
      },
      distinction: {
        type: "score",
        instructions:
          "How distinct are the three `directions` in both strategic angle and visual mark construction?",
        criteria: [
          "Essentially the same concept repeated.",
          "Different names but largely similar strategies or marks.",
          "Meaningfully different strategies and mark constructions.",
          "Three sharply distinct, complementary identity territories.",
        ],
      },
      specificity: {
        type: "score",
        instructions:
          "How specific and ownable are the `directions` compared with generic tech-brand symbols and `competitorSummary`?",
        criteria: [
          "Generic or directly derivative of competitors.",
          "Some generic motifs or vague constructions remain.",
          "Mostly specific and differentiated.",
          "Highly specific, memorable, and differentiated.",
        ],
      },
    },
  );
  const answers = z
    .object({
      answers: z.object({
        grounding: scoreAnswer,
        distinction: scoreAnswer,
        specificity: scoreAnswer,
      }),
    })
    .parse(result).answers;

  return Object.entries(answers)
    .filter(([, answer]) => answer.score < 1.75)
    .map(([dimension]) => dimension);
}
