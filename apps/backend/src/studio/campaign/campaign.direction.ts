// Starting points for art direction, not claims of tested ad performance.
export const campaignRecipes = {
  "studio-product": {
    use: "A physical product launch or flavor announcement with a supplied product photo.",
    direction:
      "One dominant real product, purposeful crop, controlled studio light, grounded contact shadow, one concise headline and ample negative space. Preserve packaging geometry and label. Supporting ingredients must relate to the brief.",
  },
  "editorial-product": {
    use: "Fashion, beauty, home or other considered purchases.",
    direction:
      "Asymmetric editorial composition, generous margins, deliberate scale contrast, tactile materials and a restrained type hierarchy. Let the actual product and its material details carry the idea rather than stacked text panels.",
  },
  "sensory-closeup": {
    use: "Food, drink, skincare or a material-led product with a relevant supplied reference.",
    direction:
      "A convincing close-up of texture, liquid or material, with the real product clearly identifiable. Use directional light and one focal area. Do not obscure or substitute the packaging or imply ingredients absent from the evidence.",
  },
  "in-context": {
    use: "An offering best understood through a specific real use case.",
    direction:
      "One believable environment and action connected to the audience's task. Natural light, clear subject separation and room for a short headline. Do not invent testimonials, results, certifications or product features.",
  },
  "graphic-product": {
    use: "A bold launch where the brand supports illustration or graphic design.",
    direction:
      "One purposeful graphic gesture around the actual product, deliberate asymmetry and strong typographic scale. Preserve product identity and avoid generic blobs, repeated panels or competing decorations.",
  },
  "type-led": {
    use: "A service, announcement or message where the wording is the main visual idea.",
    direction:
      "One dominant headline with intentional line breaks, clear alignment and a limited palette. Give supporting copy substantially less weight. Add imagery only if it explains the specific offering; avoid an unnecessary card per line.",
  },
  "interface-proof": {
    use: "Software with an actual supplied screenshot.",
    direction:
      "Feature a legible crop of the real interface around one relevant task, paired with one short headline. Preserve screenshot content; do not fabricate dashboards, metrics or device mockups. Use spacing rather than decorative nested cards.",
  },
  custom: {
    use: "An explicit user direction, a supplied inspiration, or a new identity that the other starting points do not fit.",
    direction:
      "Follow the supplied direction with one central visual idea, intentional hierarchy and specific visible decisions. For a new logo, prioritize a clear silhouette and negative space. Explain the choices without calling them premium as a substitute for detail.",
  },
} as const;

export type CampaignRecipe = keyof typeof campaignRecipes;

export interface CampaignArtDirection {
  recipeId: CampaignRecipe;
  subject: string;
  composition: string;
  lightingAndMaterials: string;
  typography: string;
  palette: string[];
  avoid: string[];
}

export interface CampaignReferenceUse {
  id: string;
  role: "product" | "logo" | "style" | "subject";
  instruction: string;
}

export function describeArtDirection(direction: CampaignArtDirection) {
  return [
    `Visual approach: ${campaignRecipes[direction.recipeId].direction}`,
    `Subject: ${direction.subject}`,
    `Composition and reading order: ${direction.composition}`,
    `Lighting and materials: ${direction.lightingAndMaterials}`,
    `Typography: ${direction.typography}`,
    `Palette: ${direction.palette.join(", ")}`,
    `Avoid: ${direction.avoid.join("; ")}`,
  ].join("\n");
}
