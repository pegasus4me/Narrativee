const isProd = process.env.NODE_ENV === "production";

export interface PricingPlan {
    name: string;
    description: string;
    category?: string;
    monthlyPrice: number;
    annualPrice: number;
    monthlyPriceId: string;
    annualPriceId: string;
    savings: number;
    popular: boolean;
    cta: string;
    color: string;
    features: { text: string; included: boolean; bold?: boolean }[];
}

export const PricingPlans: PricingPlan[] = [
    {
        name: "Starter",
        category: "Get started",
        description: "Automate your repurposing and start publishing everywhere — without the busywork.",
        monthlyPrice: 19,
        annualPrice: 15,
        monthlyPriceId: isProd ? process.env.NEXT_PUBLIC_STRIPE_WRITER_MONTHLY || "price_1T8zvkLShg9EGCkGN3uS86kx" : "price_1T90DLL1bbAsFy34FNRk26eX",
        annualPriceId: isProd ? process.env.NEXT_PUBLIC_STRIPE_WRITER_YEARLY || "price_1T8zxGLShg9EGCkGuFDXGFKn" : "price_1T90DvL1bbAsFy34rG5hmUjR",
        savings: 48,
        popular: false,
        cta: "Start for free — 14 days",
        color: "primary",
        features: [
            { text: "40 AI repurposing credits / month", included: true, bold: true },
            { text: "50 Carousel generations / month", included: true, bold: true },
            { text: "4 publishing channels", included: true },
            { text: "10 scheduled posts per channel", included: true },
            { text: "1 workspace", included: true },
            { text: "Voice memory (basic)", included: true },
            { text: "24/7 support", included: true },
        ]
    },
    {
        name: "Creator",
        category: "Scale your reach",
        description: "Turn every newsletter into a multi-platform content engine. Built for creators serious about growth.",
        monthlyPrice: 49,
        annualPrice: 39,
        monthlyPriceId: isProd ? process.env.NEXT_PUBLIC_STRIPE_CREATOR_MONTHLY || "price_1TZBJlLShg9EGCkGkYbeh9Uf" : "price_1T90DLL1bbAsFy34FNRk26eX",
        annualPriceId: isProd ? process.env.NEXT_PUBLIC_STRIPE_CREATOR_YEARLY || "price_1TZBFyLShg9EGCkGVqt5dthM" : "price_1T90DvL1bbAsFy34rG5hmUjR",
        savings: 120,
        popular: true,
        cta: "Get started — 14 days free",
        color: "primary",
        features: [
            { text: "100 AI repurposing credits / month", included: true, bold: true },
            { text: "150 Carousel generations / month", included: true, bold: true },
            { text: "Unlimited publishing channels", included: true },
            { text: "30 scheduled posts per channel", included: true },
            { text: "Advanced tone-of-voice matching", included: true },
            { text: "Priority scheduling & queue", included: true },
            { text: "Auto-publish to all platforms", included: true, bold: true },
            { text: "Advanced Voice memory system", included: true, bold: true },
            { text: "Priority support", included: true },
            { text: "Early access to new features", included: true },
        ]
    }
];