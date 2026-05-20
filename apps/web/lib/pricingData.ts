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
        monthlyPrice: 9.99,
        annualPrice: 7.99,
        monthlyPriceId: isProd
            ? process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY || "price_1TZBIKLShg9EGCkGBRZwmLVl"
            : "price_1TZBIKLShg9EGCkGBRZwmLVl",
        annualPriceId: isProd
            ? process.env.NEXT_PUBLIC_STRIPE_STARTER_YEARLY || "price_1TZBJ9LShg9EGCkGZUXpcRlc"
            : "price_1TZBJ9LShg9EGCkGZUXpcRlc",
        savings: 20,
        popular: false,
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
        monthlyPriceId: isProd
            ? process.env.NEXT_PUBLIC_STRIPE_CREATOR_MONTHLY || "price_1TZBJlLShg9EGCkGkYbeh9Uf"
            : "price_1TZBJlLShg9EGCkGkYbeh9Uf",
        annualPriceId: isProd
            ? process.env.NEXT_PUBLIC_STRIPE_CREATOR_YEARLY || "price_1TZBFyLShg9EGCkGVqt5dthM"
            : "price_1TZBFyLShg9EGCkGVqt5dthM",
        savings: 24,
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