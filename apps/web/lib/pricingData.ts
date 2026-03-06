const isProd = process.env.NODE_ENV === "production";

export const PricingPlans = [
    {
        name: "Starter",
        category: "Perfect for getting started",
        description: "Save time engaging and start turning Substack notes into growth.",
        monthlyPrice: 15,
        annualPrice: 12,
        monthlyPriceId: "price_starter_monthly", // Needs replacement with real Stripe ID
        annualPriceId: "price_starter_annual",
        savings: 36,
        popular: false,
        cta: "Get Started",
        color: "gray",
        features: [
            { text: "200 AI credits/month", included: true, bold: true },
            { text: "Chrome Extension access", included: true },
            { text: "AI comment generation", included: true },
            { text: "Save & organize inspirations", included: true },
            { text: "Basic dashboard analytics", included: true },
            { text: "Priority email support", included: false }
        ]
    },
    {
        name: "Writer",
        category: "For serious creators",
        description: "Scale your engagement and maximize your audience reach effortlessly.",
        monthlyPrice: 29,
        annualPrice: 24,
        monthlyPriceId: "price_writer_monthly", // Needs replacement with real Stripe ID
        annualPriceId: "price_writer_annual",
        savings: 60,
        popular: true,
        cta: "Start 7-day free trial",
        color: "primary",
        features: [
            { text: "600 AI credits/month", included: true, bold: true },
            { text: "Everything in Starter", included: true },
            { text: "Advanced performance analytics", included: true },
            { text: "Content generation features", included: true },
            { text: "Unlimited scheduled queue", included: true },
            { text: "Priority email support", included: true }
        ]
    }
] as const;