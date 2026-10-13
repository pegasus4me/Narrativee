import { createHash } from "node:crypto";
import { brandDiagnosisSchema } from "../analysis/analysis.schema";

export interface WebsiteItem {
  category: "color" | "typography" | "identity" | "voice" | "other";
  content: string;
  sourceKey: string;
  sourceUrl: string;
}

export interface WebsiteAsset {
  category: "identity" | "imagery";
  caption: string;
  url: string;
  sourceKey: string;
  sourceUrl: string;
}

const colorRoles = {
  primary: "Primary",
  secondary: "Secondary",
  accent: "Accent",
  background: "Background",
  textPrimary: "Primary text",
  textSecondary: "Secondary text",
  link: "Link",
};
const genericFonts = new Set([
  "system-ui",
  "-apple-system",
  "blinkmacsystemfont",
  "sans-serif",
  "serif",
  "monospace",
  "ui-sans-serif",
  "ui-serif",
  "ui-monospace",
  "inherit",
  "initial",
]);

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown, max = 200): string | null {
  return typeof value === "string" && value.trim() && value.length <= max
    ? value.trim()
    : null;
}

export function normalizeWebsiteProfile(
  raw: unknown,
  diagnosis: unknown,
  sourceUrl: string,
) {
  const document = record(raw);
  const branding = record(document.branding);
  const items: WebsiteItem[] = [];
  const assets: WebsiteAsset[] = [];
  const colors = record(branding.colors);
  for (const [key, label] of Object.entries(colorRoles)) {
    const hex = text(colors[key]);
    if (!hex || !/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) continue;
    const normalized = (
      hex.length === 4
        ? `#${[...hex.slice(1)].map((digit) => digit + digit).join("")}`
        : hex
    ).toUpperCase();
    items.push({
      category: "color",
      content: `${label}: ${normalized}`,
      sourceKey: `color:${key}`,
      sourceUrl,
    });
  }

  const typography = record(branding.typography);
  const families = record(typography.fontFamilies);
  const fonts = Array.isArray(branding.fonts) ? branding.fonts.map(record) : [];
  const seen = new Set<string>();
  const addFont = (role: string, value: unknown) => {
    const family = text(value, 120)?.replace(/^['"]|['"]$/g, "");
    if (
      !family ||
      genericFonts.has(family.toLowerCase()) ||
      family.includes(",")
    )
      return;
    const signature = `${role}:${family.toLowerCase()}`;
    if (seen.has(signature)) return;
    seen.add(signature);
    // Do not invent font weights; website evidence often contains only families.
    items.push({
      category: "typography",
      content: `${role}: ${family}`,
      sourceKey: `font:${signature}`,
      sourceUrl,
    });
  };
  const fontRoles: Record<string, string> = {
    primary: "Body",
    body: "Body",
    heading: "Headings",
    monospace: "Monospace",
  };
  for (const [key, label] of Object.entries(fontRoles))
    addFont(label, families[key]);
  for (const font of fonts.slice(0, 12)) {
    const role = text(font.role)?.toLowerCase();
    const family = text(font.family, 120);
    if (
      !role &&
      family &&
      [...seen].some((entry) => entry.endsWith(`:${family.toLowerCase()}`))
    )
      continue;
    addFont(fontRoles[role ?? ""] ?? "Detected font", font.family);
  }

  const images = record(branding.images);
  for (const [key, category, label] of [
    ["logo", "identity", "Detected website logo"],
    ["ogImage", "imagery", "Website social sharing image"],
  ] as const) {
    const reference =
      key === "logo" ? (branding.logo ?? images.logo) : images[key];
    const maxLength =
      typeof reference === "string" && reference.startsWith("data:")
        ? 12 * 1024 * 1024
        : 8000;
    const url = text(reference, maxLength);
    if (url)
      assets.push({
        category,
        caption: label,
        url,
        sourceKey: `image:${key}`,
        sourceUrl,
      });
  }

  const parsed = brandDiagnosisSchema.safeParse(diagnosis);
  if (parsed.success) {
    const findings = [
      ...parsed.data.observations
        .filter((entry) => entry.type !== "visual")
        .slice(0, 10)
        .map((entry) => ({ ...entry, hypothesis: false })),
      ...parsed.data.inferences
        .slice(0, 4)
        .map((entry) => ({ ...entry, hypothesis: true })),
    ];
    for (const finding of findings) {
      if (finding.confidence < 0.6 || !finding.statement.trim()) continue;
      const evidence = finding.evidence.find((entry) => {
        try {
          return (
            new URL(entry.sourceUrl).origin === new URL(sourceUrl).origin &&
            !!entry.sourceText.trim()
          );
        } catch {
          return false;
        }
      });
      if (!evidence) continue;
      const key = createHash("sha256")
        .update(`${finding.type}:${finding.statement}`)
        .digest("hex")
        .slice(0, 16);
      items.push({
        category: finding.type === "voice" ? "voice" : "other",
        content:
          `${finding.hypothesis ? "Hypothesis" : "Website observation"} (${finding.type}): ${finding.statement}\nEvidence: ${evidence.sourceText}`.slice(
            0,
            4000,
          ),
        sourceKey: `research:${key}`,
        sourceUrl: evidence.sourceUrl,
      });
    }
  }
  return { items, assets };
}

// Imported records (including archived ones) are never recreated or overwritten.
// Manual choices protect their role, without preventing other gaps being filled.
export function shouldImportWebsiteRecord(
  candidate: { sourceKey: string; category: string; content?: string },
  existing: Array<{
    sourceKey: string | null;
    category: string;
    source: string;
    kind: string;
    archivedAt: Date | null;
    content?: string;
  }>,
) {
  return !existing.some(
    (entry) =>
      entry.sourceKey === candidate.sourceKey ||
      (entry.source === "user" &&
        entry.kind === "rule" &&
        entry.category === candidate.category &&
        !entry.archivedAt &&
        (candidate.sourceKey === "image:logo" ||
          (["color", "typography"].includes(candidate.category) &&
            !!candidate.content &&
            !!entry.content &&
            candidate.content.split(":")[0].trim().toLowerCase() ===
              entry.content.split(":")[0].trim().toLowerCase()))),
  );
}
