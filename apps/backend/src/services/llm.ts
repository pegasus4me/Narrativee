import { getGrokClient } from "../config/xai";

const MAX_ANGLE_COUNT = 8;
const MAX_X_LENGTH = 260;
const GROK_MODEL = "grok-4.3";

interface AngleExtractionResponse {
  ideas?: unknown;
}

function normalizeText(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trim()}…`;
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function extractJsonObject(rawContent: string): AngleExtractionResponse {
  const cleanedContent = rawContent
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const objectStart = cleanedContent.indexOf("{");
  const objectEnd = cleanedContent.lastIndexOf("}");
  const jsonContent = objectStart >= 0 && objectEnd > objectStart
    ? cleanedContent.slice(objectStart, objectEnd + 1)
    : cleanedContent;

  const parsed = JSON.parse(jsonContent) as unknown;
  if (typeof parsed !== "object" || parsed === null) {
    return {};
  }

  return parsed as AngleExtractionResponse;
}

function normalizeIdeas(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const ideas = value
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      if (typeof item === "object" && item !== null && "idea" in item) {
        const idea = (item as { idea?: unknown }).idea;
        return typeof idea === "string" ? idea : "";
      }

      return "";
    })
    .map((idea) => idea.replace(/\u2014/g, "-").replace(/—/g, "-").trim())
    .filter((idea) => idea.length >= 20 && idea.length <= 220);

  return uniqueValues(ideas).slice(0, MAX_ANGLE_COUNT);
}

async function extractIdeasWithGrok(title: string, content: string): Promise<string[]> {
  console.log("[LLMService] extractIdeasWithGrok started");
  const grok = getGrokClient();
  if (!grok) {
    throw new Error("[LLMService] Grok API key is missing or invalid. Please configure GROK_API_KEY in your env.");
  }

  const plainContent = normalizeText(content);
  console.log("[LLMService] Calling xAI Grok completions api with model:", GROK_MODEL);

  const response = await grok.chat.completions.create({
    model: GROK_MODEL,
    response_format: { type: "json_object" },
    temperature: 0.72,
    messages: [
      {
        role: "system",
        content: `You are Narrativee's High-Signal Angle Engine. Your job is to read an article and extract ${MAX_ANGLE_COUNT} highly compelling, diverse, and scroll-stopping social content angles.

For these ${MAX_ANGLE_COUNT} angles, you MUST generate exactly one of each of the following distinct types to ensure high variety and value:
1. **The Uncomfortable Truth**: A raw, candid, and transparent observation that creators or professionals rarely admit.
2. **The Contrarian Take**: A claim that directly opposes conventional industry wisdom or common advice.
3. **The Hidden Mistake**: Highlighting a subtle, overlooked mistake the reader is likely making right now.
4. **The Belief Shift**: A powerful insight that shatters a common myth and changes how the reader views their work.
5. **The Tension/Contrast**: A sharp juxtaposition of two opposing concepts (e.g., "Anxiety wearing a coat of high standards").
6. **The Concrete Framework**: Synthesizing a workflow or lesson from the article into a simple, memorable formula or framework.
7. **The Surprising Metric/Fact**: A hook built around a specific, high-signal data point, number, or case study claim in the text.
8. **The Actionable Playbook**: A direct, high-value tactical takeaway the reader can execute immediately.

Each angle must:
- Be one standalone, high-impact sentence.
- Be extremely specific to the claims, facts, or stories in the article—never generic summaries.
- Sound like it was written by a top-tier industry thought leader (punchy, clear, authoritative).
- Avoid vague corporate filler and buzzwords (e.g., "unlock", "delve", "leverage", "revolutionize", "game-changer", "testament", "in today's digital landscape").
- Avoid em dashes or complex punctuation.
- Never refer to "the article", "the author", or "the newsletter".

---

### EXAMPLE INSTRUCTION & OUTPUTS:

Title: Why we transitioned to a flat organizational structure
Content: ...

Expected Output JSON:
{
  "ideas": [
    "Most managers promote collaborative flat structures not because they trust their team, but because they are afraid of making hard top-down decisions.",
    "Flat organizational structures actually increase bureaucracy—when no one is officially in charge, everyone has to approve every single decision.",
    "The absolute worst mistake you can make when going flat is assuming people will self-organize without clear boundary rules.",
    "We used to think manager-less teams meant total freedom, until we realized absolute freedom without structure is just a recipe for paralysis.",
    "The paradox of modern leadership: you must provide absolute clarity of direction while relinquishing all control over the execution.",
    "The 3-Rule Autonomy Framework: define the boundaries, assign single-owner responsibilities, and require peer-reviews for major decisions.",
    "After removing traditional managers, our decision-making cycles slowed down by 40% before we implemented automated guardrails.",
    "If you want to decentralize control tomorrow, start by writing down the 5 decisions that absolutely require your sign-off and delegating everything else."
  ]
}

---

Return only valid JSON:
{
  "ideas": ["angle 1", "angle 2"]
}`,
      },
      {
        role: "user",
        content: JSON.stringify({
          title,
          content: plainContent.slice(0, 9000),
        }),
      },
    ],
  });

  const rawContent = response.choices[0]?.message?.content ?? "{}";
  console.log("[LLMService] Raw Grok response successfully received. Length:", rawContent.length);
  const parsed = extractJsonObject(rawContent);
  const normalized = normalizeIdeas(parsed.ideas);
  console.log("[LLMService] Normalized ideas count:", normalized.length);
  return normalized;
}

function getPlatformDraft(params: {
  platform: string;
  angle: string;
  articleTitle: string;
  articleContent: string;
  writingStyle: string;
}): string {
  const { platform, angle, articleTitle, articleContent, writingStyle } = params;
  const insight = truncate(normalizeText(articleContent), 180);
  const voiceNote = writingStyle ? `\n\nVoice: ${truncate(writingStyle, 90)}` : "";

  if (platform.toLowerCase() === "x") {
    return truncate(`${angle}\n\n${insight}`, MAX_X_LENGTH);
  }

  if (platform.toLowerCase() === "linkedin") {
    return `${angle}\n\nMost people read "${articleTitle}" as advice. The sharper takeaway is this:\n\n${insight}\n\nWhat would you add?${voiceNote}`;
  }

  if (platform.toLowerCase() === "threads") {
    return `${angle}\n\nThe part worth sitting with:\n${insight}\n\nCurious if this matches what you see too.`;
  }

  return `${angle}\n\n${insight}\n\nPulled from "${articleTitle}".${voiceNote}`;
}

/** Compatibility service for legacy article routes that need lightweight LLM-style drafting helpers. */
export class LLMService {
  /**
   * Extracts exactly 8 atomic content ideas/angles from an article title and body.
   * Utilizes Grok to guarantee high-signal social content angles.
   * Throws an error if Grok is not configured or if the LLM call fails.
   * 
   * @param title - The title of the article.
   * @param content - The full body content of the article.
   * @returns An array of exactly 8 scroll-stopping social content angles.
   */
  static async extractAtomicIdeas(title: string, content: string): Promise<string[]> {
    console.log("[LLMService] extractAtomicIdeas called. Title:", title);
    // Directly call the LLM and let any errors/missing configurations propagate.
    // We no longer silently fall back to cheap-looking split sentences.
    const llmIdeas = await extractIdeasWithGrok(title, content);
    
    if (llmIdeas.length === 0) {
      throw new Error("[LLMService] Failed to extract content angles from the LLM. Please try again.");
    }

    return llmIdeas;
  }

  /** Generates a platform-aware fallback social draft for legacy article flows. */
  static generateSocialDraft(
    platform: string,
    angle: string,
    articleTitle: string,
    articleContent: string,
    writingStyle: string,
    userId: string,
  ): Promise<string> {
    void userId;

    return Promise.resolve(
      getPlatformDraft({
        platform,
        angle,
        articleTitle,
        articleContent,
        writingStyle,
      }),
    );
  }
}
