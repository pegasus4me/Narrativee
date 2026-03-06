const isProd = process.env.NODE_ENV === "production";

export const PricingPlans = [
    {
        name: "Writer 🖋️",
        category: "For serious creators",
        description: "For creators who want to grow faster, post smarter, and level up using real insights.",
        monthlyPrice: 19.99,
        annualPrice: 17.99,
        monthlyPriceId: "price_writer_monthly", // Needs replacement with real Stripe ID
        annualPriceId: "price_writer_annual",
        savings: 60,
        popular: true,
        cta: "Start 7-day free trial",
        color: "primary",
        features: [
            { text: "100 AI credits/month", included: true, bold: true },
            { text: "Everything in Starter", included: true },
            { text: "Advanced performance analytics", included: true },
            { text: "Content generation features", included: true },
            { text: "Unlimited scheduled queue", included: true },
            { text: "Priority email support", included: true }
        ]
    }
] as const;