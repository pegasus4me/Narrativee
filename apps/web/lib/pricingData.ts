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
    earlyBirdMonthlyPrice?: number;
    features: { text: string; included: boolean; bold?: boolean }[];
}

export const PricingPlans: PricingPlan[] = [
    {
        name: "Writer",
        category: "Personal Growth",
        description: "For creators who want to grow faster, post smarter, and level up using real insights.",
        monthlyPrice: 19.99,
        earlyBirdMonthlyPrice: 9.99,
        annualPrice: 17.99,
        monthlyPriceId: isProd ? process.env.NEXT_PUBLIC_STRIPE_WRITER_MONTHLY || "price_1T8zvkLShg9EGCkGN3uS86kx" : "price_1T90DLL1bbAsFy34FNRk26eX",
        annualPriceId: isProd ? process.env.NEXT_PUBLIC_STRIPE_WRITER_YEARLY || "price_1T8zxGLShg9EGCkGuFDXGFKn" : "price_1T90DvL1bbAsFy34rG5hmUjR",
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
];