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
        category: "",
        description: "For creators who just started who want to automate their repurposing and scheduling process",
        monthlyPrice: 19.99,
        annualPrice: 17.99,
        monthlyPriceId: isProd ? process.env.NEXT_PUBLIC_STRIPE_WRITER_MONTHLY || "price_1T8zvkLShg9EGCkGN3uS86kx" : "price_1T90DLL1bbAsFy34FNRk26eX",
        annualPriceId: isProd ? process.env.NEXT_PUBLIC_STRIPE_WRITER_YEARLY || "price_1T8zxGLShg9EGCkGuFDXGFKn" : "price_1T90DvL1bbAsFy34rG5hmUjR",
        savings: 60,
        popular: true,
        cta: "Start your 14-day free trial",
        color: "primary",
        features: [
            { text: "40 AI credits / month", included: true, bold: true },
            { text: "4 channels", included: true },
            { text: "10 scheduled posts per channel", included: true },
            { text: "1 user", included: true },
            { text: "Basic Voice memory  ", included: true },
            { text: "24/7 assistance", included: true },


        ]
    },
    {
        name: "Creator",
        category: "Personal Growth",
        description: "For creators who want to grow faster, push their distribution to next level.",
        monthlyPrice: 25.99,
        annualPrice: 23.99,
        monthlyPriceId: isProd ? process.env.NEXT_PUBLIC_STRIPE_CREATOR_MONTHLY || "price_1TZBJlLShg9EGCkGkYbeh9Uf" : "price_1T90DLL1bbAsFy34FNRk26eX",
        annualPriceId: isProd ? process.env.NEXT_PUBLIC_STRIPE_CREATOR_YEARLY || "price_1TZBFyLShg9EGCkGVqt5dthM" : "price_1T90DvL1bbAsFy34rG5hmUjR",
        savings: 60,
        popular: true,
        cta: "Start your 14-day free trial",
        color: "primary",
        features: [
            { text: "100 AI credits / month", included: true, bold: true },
            { text: "Unlimited channels", included: true },
            { text: "30 scheduled posts per channel", included: true },
            { text: "Advanced tone-of-voice", included: true },
            { text: "Priority scheduling", included: true },
            { text: "Auto-publish to all platforms", included: true },
            { text: "Advanced Voice memory system", included: true },
            { text: "24/7 priority assistance", included: true },
            { text: "Early access to beta features ", included: true },
        ]
    }
];