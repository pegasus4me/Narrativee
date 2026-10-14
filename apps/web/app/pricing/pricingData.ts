export const trialDays = 7;

const imageModels = [
  { name: "GPT Image 2", logo: "/openai.svg" },
  { name: "Nano Banana 2", logo: "/model-logos/nanobanana.svg" },
  { name: "Seedream 4.5", logo: "/model-logos/bytedance.svg" },
  { name: "FLUX.2", logo: "/model-logos/flux.svg" },
  { name: "Ideogram 3", logo: "/model-logos/ideogram.svg" },
  { name: "Recraft V4", logo: "/model-logos/recraft.svg" },
  { name: "GPT Image 2.5 Flare", logo: "/openai.svg" },
  { name: "Nano Banana Pro", logo: "/model-logos/nanobanana.svg" },
  { name: "FLUX.3", logo: "/model-logos/flux.svg" },
  { name: "Qwen Image 3", logo: "/model-logos/qwen.svg" },
] as const;

// Marketing features; price and allowance values are served by /api/billing/plans.
export const pricingPlans = [
  {
    name: "Starter",
    description: "For your brand’s next chapter.",
    monthlyPrice: 19,
    imageModels: imageModels.slice(0, 6),
    features: [
      "500 credits every month",
      "2 seats included",
      "Your personal AI brand designer",
      "A Brand Brain for your business",
      "Social posts and ad creatives",
      "Your own logos and imagery",
      "Editable text and graphics",
      "Export ready-to-share PNGs",
    ],
  },
  {
    name: "Pro",
    description: "For brands finding their rhythm.",
    monthlyPrice: 49,
    imageModels,
    features: [
      "1,500 credits every month",
      "4 seats included",
      "Everything in Starter, plus…",
      "More room for recurring creative",
      "Research and creative direction",
      "Saved brand rules and references",
      "Competitor discovery",
      "A shared creative workspace",
      "Priority support",
      "Access to new features",
    ],
  },
  {
    name: "Agency",
    description: "For a whole world of brands.",
    monthlyPrice: null,
    imageModels: [],
    features: [
      "A plan built around your agency",
      "15 seats included",
      "Creative workflows for your clients",
      "Brand context for every brief",
      "Help getting your team started",
      "A direct line to our team",
      "Priority support",
      "Access to new features",
      "Let’s shape what you need together",
    ],
  },
] as const;
