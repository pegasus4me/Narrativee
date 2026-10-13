export const trialDays = 7;

// Marketing features; price and allowance values are served by /api/billing/plans.
export const pricingPlans = [
  {
    name: "Starter",
    description: "For your brand’s next chapter.",
    monthlyPrice: 19,
    features: [
      "500 credits every month",
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
    features: [
      "1,500 credits every month",
      "Everything in Starter, plus…",
      "More room for recurring creative",
      "Research and creative direction",
      "Saved brand rules and references",
      "Competitor discovery",
      "A shared creative workspace",
    ],
  },
  {
    name: "Agency",
    description: "For a whole world of brands.",
    monthlyPrice: null,
    features: [
      "A plan built around your agency",
      "Creative workflows for your clients",
      "Brand context for every brief",
      "Help getting your team started",
      "A direct line to our team",
      "Let’s shape what you need together",
    ],
  },
] as const;
