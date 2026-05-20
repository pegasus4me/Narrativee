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
        cta: "Start your 7-day free trial",
        color: "primary",
        features: [
            { text: "40 AI credits / month", included: true, bold: true },
            { text: "3 connected channels", included: true },
            { text: "Basic content generation", included: true },
            { text: "Post scheduling", included: true },
            { text: "Email support", included: true },
        ]
    },
    {
        name: "Creator",
        category: "Personal Growth",
        description: "For creators who want to grow faster, push their distribution to next level.",
        monthlyPrice: 25.99,
        annualPrice: 23.99,
        monthlyPriceId: isProd ? process.env.NEXT_PUBLIC_STRIPE_WRITER_MONTHLY || "price_1T8zvkLShg9EGCkGN3uS86kx" : "price_1T90DLL1bbAsFy34FNRk26eX",
        annualPriceId: isProd ? process.env.NEXT_PUBLIC_STRIPE_WRITER_YEARLY || "price_1T8zxGLShg9EGCkGuFDXGFKn" : "price_1T90DvL1bbAsFy34rG5hmUjR",
        savings: 60,
        popular: true,
        cta: "Start your 7-day free trial",
        color: "primary",
        features: [
            { text: "100 AI credits / month", included: true, bold: true },
            { text: "Unlimited channels", included: true },
            { text: "Advanced tone-of-voice", included: true },
            { text: "Priority scheduling", included: true },
            { text: "Auto-publish to all platforms", included: true },
            { text: "Knowledge base & templates", included: true },
            { text: "Priority support", included: true },
        ]
    }
];