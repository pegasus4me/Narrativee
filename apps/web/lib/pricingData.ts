const isProd = process.env.NODE_ENV === "production";

export const PricingPlans = [
    {
        name: "Writer 🖋️",
        description: "For creators who want to grow faster, post smarter, and level up using real insights.",
        monthlyPrice: 19.99,
        annualPrice: 17.99,
        monthlyPriceId: "price_writer_monthly", // Needs replacement with real Stripe ID
        annualPriceId: "price_writer_annual",
        savings: 60,
        popular: true,
        cta: "Start your 7-day free trial",
        color: "primary",
        features: [
            { text: "100 AI credits/month", included: true, bold: true },
            { text: "Profile optimization insights", included: true },
            { text: "40 notes queued simultaneously", included: true },
            { text: "Performance analytics", included: true },
            { text: "Inspiration library", included: true },
            { text: "60 creator follow ups/month", included: true },
            { text: "Priority email support", included: true },
            { text: "Early access to new features", included: true },
            { text: "cross post your notes to other platforms automatically", included: true }
        ]
    }
] as const;