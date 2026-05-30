const MAX_ANGLE_COUNT = 8;
const MAX_X_LENGTH = 260;

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

function splitSentences(content: string): string[] {
  return normalizeText(content)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 40);
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function formatIdea(sentence: string): string {
  const cleanedSentence = sentence.replace(/["“”]/g, "").trim();
  return truncate(cleanedSentence.replace(/[.!?]$/, ""), 150);
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
  /** Extracts atomic content ideas from an article title and body. */
  static extractAtomicIdeas(title: string, content: string): Promise<string[]> {
    const titleIdea = title.trim() ? `The overlooked angle inside "${title.trim()}"` : "";
    const sentenceIdeas = splitSentences(content).map(formatIdea);
    const ideas = uniqueValues([titleIdea, ...sentenceIdeas]).slice(0, MAX_ANGLE_COUNT);

    return Promise.resolve(ideas);
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
