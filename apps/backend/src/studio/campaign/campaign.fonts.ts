import type { BrandBrainContext } from "../../brand-brain/context";
import type { getGoogleFonts } from "../../fonts/google-fonts.routes";

export function resolveCampaignFonts(
  brain: Pick<BrandBrainContext, "approvedRules" | "websiteObservations">,
  catalog: Awaited<ReturnType<typeof getGoogleFonts>>,
) {
  const approved = brain.approvedRules.filter(
    (item) => item.category === "typography",
  );
  const detected = brain.websiteObservations.filter(
    (item) => item.category === "typography",
  );
  const families = [
    ...new Set(
      (approved.length ? approved : detected).flatMap((item) => {
        const match = item.content.match(
          /^[^:]+:\s*(.+?)(?:\s*\(weight \d{3}\))?$/,
        );
        return match ? [match[1]!.trim()] : [];
      }),
    ),
  ];
  const available = catalog.filter((font) =>
    families.some(
      (family) => family.toLowerCase() === font.family.toLowerCase(),
    ),
  );
  const missing = families.filter(
    (family) =>
      !available.some(
        (font) => font.family.toLowerCase() === family.toLowerCase(),
      ),
  );
  if (approved.length && (missing.length || !families.length))
    throw new Error(
      `Approved brand font ${missing.join(", ") || "is unspecified"} cannot be used from Google Fonts. Choose a supported font in Brand Brain; approved fonts will not be substituted automatically.`,
    );

  const fonts = available.length
    ? available
    : catalog.filter((font) =>
        ["Fraunces", "Instrument Sans"].includes(font.family),
      );
  if (!fonts.length)
    throw new Error(
      "Choose an available Google Font in Brand Brain before generating.",
    );
  const typographyNotice =
    missing.length || !families.length
      ? `${missing.length ? `Website fonts ${missing.join(", ")} are unavailable from Google Fonts.` : "No brand fonts were detected."} This creative uses ${fonts.map((font) => font.family).join(" / ")} as provisional typography options. Brand Kit is unchanged.`
      : null;
  return { fonts, typographyNotice };
}
