import sharp from "sharp";
import { directionSchema, type BrandDirection } from "./board.schema";

export const BOARD_WIDTH = 1920;
export const BOARD_HEIGHT = 1080;

function xml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;",
    };
    return entities[character];
  });
}

export function wrapText(
  text: string,
  maxCharacters: number,
  maxLines: number,
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (word.length > maxCharacters) {
      if (current) lines.push(current);
      if (lines.length === maxLines) break;
      current = `${word.slice(0, maxCharacters - 1)}…`;
      continue;
    }
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxCharacters) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && current) lines.push(current);
  if (lines.length === maxLines && lines.join(" ").length < text.length) {
    lines[maxLines - 1] =
      `${lines[maxLines - 1].replace(/[\s.]+$/, "").slice(0, maxCharacters - 1)}…`;
  }
  return lines;
}

function completeLines(
  text: string,
  maxCharacters: number,
  maxLines: number,
): string[] {
  const lines = wrapText(text, maxCharacters, maxLines);
  if (lines.some((line) => line.endsWith("…"))) {
    throw new Error("Creative direction copy does not fit the board layout");
  }
  return lines;
}

export function validateDirectionLayout(direction: BrandDirection): void {
  directionSchema.parse(direction);
  completeLines(direction.name, 19, 2);
  completeLines(direction.thesis, 50, 2);
  completeLines(direction.rationale.text, 66, 3);
  completeLines(direction.differentiation.text, 66, 3);
  completeLines(direction.headline, 29, 2);
  completeLines(direction.applicationCopy, 47, 2);
}

function textLines(
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
  size: number,
  color: string,
  family: string,
  weight = 400,
): string {
  return lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * lineHeight}" fill="${color}" font-family="${xml(family)}" font-size="${size}" font-weight="${weight}">${xml(line)}</text>`,
    )
    .join("\n");
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map(
    (index) => parseInt(hex.slice(index, index + 2), 16) / 255,
  );
  const values = channels.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}

export function contrastRatio(first: string, second: string): number {
  const [lighter, darker] = [luminance(first), luminance(second)].sort(
    (a, b) => b - a,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

export async function renderBrandBoard(
  brandName: string,
  direction: BrandDirection,
  artwork: Buffer,
): Promise<Buffer> {
  validateDirectionLayout(direction);
  const { background, foreground, accent, secondary } = direction.palette;
  if (contrastRatio(background, foreground) < 4.5) {
    throw new Error(
      "Creative direction has insufficient foreground/background contrast",
    );
  }
  const metadata = await sharp(artwork).metadata();
  if (metadata.format !== "png" || !metadata.width || !metadata.height) {
    throw new Error("Image generation did not return a valid PNG");
  }

  const image = await sharp(artwork)
    .resize(760, 590, { fit: "cover", position: "attention" })
    .png()
    .toBuffer();
  const imageData = image.toString("base64");
  const concept = completeLines(direction.name, 19, 2);
  const thesis = completeLines(direction.thesis, 50, 2);
  const rationale = completeLines(direction.rationale.text, 66, 3);
  const distinction = completeLines(direction.differentiation.text, 66, 3);
  const applicationHeadline = completeLines(direction.headline, 29, 2);
  const applicationCopy = completeLines(direction.applicationCopy, 47, 2);
  const displayFont = direction.typography.display;
  const bodyFont = direction.typography.body;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${BOARD_WIDTH}" height="${BOARD_HEIGHT}" viewBox="0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}">
    <rect width="1920" height="1080" fill="${background}"/>
    <rect x="0" y="0" width="18" height="1080" fill="${accent}"/>
    <text x="86" y="88" fill="${foreground}" font-family="${xml(bodyFont)}" font-size="20" letter-spacing="5">NARRATIVEE  /  BRAND EXPLORATION</text>
    <text x="86" y="169" fill="${foreground}" font-family="${xml(bodyFont)}" font-size="34" font-weight="600">${xml(brandName)}</text>
    <text x="86" y="215" fill="${accent}" font-family="${xml(bodyFont)}" font-size="17" letter-spacing="4">CREATIVE DIRECTION  01</text>
    ${textLines(concept, 82, 308, 87, 82, foreground, displayFont, 700)}
    ${textLines(thesis, 86, 462, 43, 31, foreground, bodyFont)}
    <line x1="86" y1="550" x2="986" y2="550" stroke="${foreground}" stroke-opacity="0.28"/>
    <text x="86" y="598" fill="${accent}" font-family="${xml(bodyFont)}" font-size="18" letter-spacing="4">THE IDEA</text>
    ${textLines(rationale, 86, 638, 31, 22, foreground, bodyFont)}
    <text x="86" y="755" fill="${accent}" font-family="${xml(bodyFont)}" font-size="18" letter-spacing="4">THE EDGE</text>
    ${textLines(distinction, 86, 795, 31, 22, foreground, bodyFont)}
    <text x="86" y="947" fill="${foreground}" font-family="${xml(bodyFont)}" font-size="17" letter-spacing="3">COLOR SYSTEM</text>
    <rect x="86" y="970" width="112" height="42" fill="${background}" stroke="${foreground}" stroke-opacity="0.3"/>
    <rect x="207" y="970" width="112" height="42" fill="${foreground}"/>
    <rect x="328" y="970" width="112" height="42" fill="${accent}"/>
    <rect x="449" y="970" width="112" height="42" fill="${secondary}"/>
    <text x="630" y="947" fill="${foreground}" font-family="${xml(bodyFont)}" font-size="17" letter-spacing="3">TYPE PAIRING</text>
    <text x="630" y="994" fill="${foreground}" font-family="${xml(displayFont)}" font-size="43">Aa</text>
    <text x="714" y="987" fill="${foreground}" font-family="${xml(bodyFont)}" font-size="18">${xml(displayFont)}</text>
    <text x="714" y="1011" fill="${foreground}" font-family="${xml(bodyFont)}" font-size="16">+ ${xml(bodyFont)}</text>
    <clipPath id="artwork-clip"><rect x="1080" y="80" width="760" height="590" rx="12"/></clipPath>
    <image x="1080" y="80" width="760" height="590" href="data:image/png;base64,${imageData}" clip-path="url(#artwork-clip)"/>
    <text x="1080" y="703" fill="${foreground}" font-family="${xml(bodyFont)}" font-size="17" letter-spacing="3">IMAGE WORLD  /  APPLICATION STUDY</text>
    <rect x="1080" y="727" width="760" height="285" rx="12" fill="${foreground}"/>
    <text x="1122" y="777" fill="${background}" font-family="${xml(bodyFont)}" font-size="16" letter-spacing="3">${xml(direction.applicationLabel.toUpperCase())}</text>
    <rect x="1746" y="756" width="50" height="4" fill="${accent}"/>
    ${textLines(applicationHeadline, 1122, 860, 51, 43, background, displayFont, 700)}
    ${textLines(applicationCopy, 1122, 956, 27, 19, background, bodyFont)}
  </svg>`;

  const output = await sharp(Buffer.from(svg)).png().toBuffer();
  const dimensions = await sharp(output).metadata();
  if (dimensions.width !== BOARD_WIDTH || dimensions.height !== BOARD_HEIGHT) {
    throw new Error("Board renderer produced unexpected dimensions");
  }
  return output;
}
