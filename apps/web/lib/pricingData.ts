const isProd = process.env.NODE_ENV === "production";

export const PricingPlans = [
    {
        name: "Free",
        category: "Get started",
        description: "Perfect for testing Narrativee with a small user base.",
        monthlyPrice: 0,
        annualPrice: 0,
        popular: false,
        cta: "Get Started Free",
        color: "gray",
        trialUsers: 20,
        workflows: 1,
        features: [
            { text: "20 tracked trial users", included: true, bold: true },
            { text: "1 workflow", included: true },
            { text: "Basic engagement scoring", included: true },
            { text: "Component triggers", included: true },
            { text: "Email support", included: true },
            { text: "Dashboard analytics", included: true },
            { text: "Priority support", included: false },
            { text: "Custom integrations", included: false }
        ]
    },
    {
        name: "Starter",
        category: "For growing startups",
        description: "Ideal for early-stage SaaS with active trial users to convert.",
        monthlyPrice: 35,
        annualPrice: 28,
        monthlyPriceId: isProd ? "price_1Sldl4LShg9EGCkGkgTqhI3z" : "price_test_starter_monthly",
        annualPriceId: isProd ? "price_1SldilLShg9EGCkG8t3u2Lol" : "price_test_starter_annual",
        savings: 60,
        popular: true,
        cta: "Start 7-day free trial",
        color: "primary",
        trialUsers: 500,
        workflows: 5,
        features: [
            { text: "2500 tracked trial users", included: true, bold: true },
            { text: "5 workflows", included: true, bold: true },
            { text: "Advanced engagement scoring", included: true },
            { text: "Component & popup triggers", included: true },
            { text: "Conversion attribution", included: true, highlight: true },
            { text: "Priority email support", included: true },
            { text: "API access", included: true }
        ]
    },
    {
        name: "Growth",
        category: "For scaling teams",
        description: "For SaaS with high trial volume looking to maximize conversions.",
        monthlyPrice: 79,
        annualPrice: 63,
        monthlyPriceId: isProd ? "price_1SldoJLShg9EGCkG6JROqVrf" : "price_test_growth_monthly",
        annualPriceId: isProd ? "price_1SldpILShg9EGCkGtoYkj5rm" : "price_test_growth_annual",
        savings: 156,
        popular: false,
        cta: "Start 7-day free trial",
        color: "black",
        trialUsers: 2000,
        workflows: 50, // Unlimited
        features: [
            { text: "800 tracked trial users", included: true, bold: true },
            { text: "50 workflows", included: true, bold: true },
            { text: "A/B testing for popups", included: true, highlight: true },
            { text: "Advanced analytics & cohorts", included: true },
            { text: "Slack notifications", included: true },
            { text: "Webhook actions", included: true },
            { text: "Dedicated support", included: true }
        ]
    },
    {
        name: "Scale",
        category: "For large teams",
        description: "For high-volume SaaS with thousands of trial users monthly.",
        monthlyPrice: 199,
        annualPrice: 166,
        monthlyPriceId: isProd ? "price_scale_monthly" : "price_test_scale_monthly",
        annualPriceId: isProd ? "price_scale_annual" : "price_test_scale_annual",
        savings: 396,
        popular: false,
        cta: "Contact Sales",
        color: "amber",
        trialUsers: 20000,
        workflows: 400, // Unlimited
        features: [
            { text: "4000 tracked trial users", included: true, bold: true },
            { text: "Unlimited workflows", included: true, bold: true },
            { text: "Custom integrations", included: true, highlight: true },
            { text: "SSO & team management", included: true },
            { text: "SLA guarantee", included: true },
            { text: "Dedicated account manager", included: true },
            { text: "Priority support (3h response)", included: true }
        ]
    }
] as const;

// ROI Calculator defaults
export const ROI_DEFAULTS = {
    avgMonthlyTrialUsers: 50,
    currentConversionRate: 3, // 3%
    narrativeeConversionLift: 1.8, // 1.8% additional conversions
    avgLTV: 200, // $200 average monthly plan price
};

// Calculate ROI based on inputs
export function calculateROI(
    monthlyTrialUsers: number,
    currentConversionRate: number,
    expectedLift: number = 1.5,
    avgLTV: number = 200
) {
    const currentConversions = monthlyTrialUsers * (currentConversionRate / 100);
    const newConversionRate = currentConversionRate + expectedLift;
    const newConversions = monthlyTrialUsers * (newConversionRate / 100);
    const additionalConversions = newConversions - currentConversions;
    const additionalMRR = additionalConversions * avgLTV;
    const additionalARR = additionalMRR * 12;

    return {
        currentConversions: Math.round(currentConversions),
        newConversions: Math.round(newConversions),
        additionalConversions: Math.round(additionalConversions),
        additionalMRR: Math.round(additionalMRR),
        additionalARR: Math.round(additionalARR),
        newConversionRate: newConversionRate.toFixed(1),
    };
}