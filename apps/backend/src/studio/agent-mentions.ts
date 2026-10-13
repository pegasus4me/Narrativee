import type { CreativeAgent } from "./agent-team";

const handles = { scout: "research", sage: "brand", pixel: "creator" } as const;

// Ignore examples in code and email/URL fragments; keep the user's mention order.
export function mentionedAgents(content: string): CreativeAgent[] {
  const prose = content.replace(/```[\s\S]*?(?:```|$)|`[^`\n]*`/g, " ");
  const matches = prose.matchAll(
    /(?:^|[^\p{L}\p{N}_./:+-])@(scout|sage|pixel)(?![\p{L}\p{N}_-]|\.[\p{L}\p{N}_])/giu,
  );
  return [
    ...new Set(
      Array.from(
        matches,
        (match) => handles[match[1]!.toLowerCase() as keyof typeof handles],
      ),
    ),
  ];
}
