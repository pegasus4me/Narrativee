const isProd = process.env.NODE_ENV === "production";

export const PricingPlans = [
    {
        name: "Starter",
        subtitle: "To discover Narrativee",
        monthlyPrice: 0,
        annualPrice: 0,
        popular: false,
        cta: "Start Free",
        color: "gray",
        features: [
            { text: "20 credits", included: true, bold: true },
            { text: "5 AI reports per month", included: true },
            { text: "Basic AI analysis", included: true },
            { text: "Export to PDF (with watermark)", included: true },
            { text: "Email support", included: true },
            { text: "Upload up to 5MB files and 1000 rows", included: false },
            { text: "1 data source integration", included: true },
            { text: "Share links expire in 7 days", included: true },
            { text: "Collaboration", included: false },
            { text: "Advanced AI models", included: false },
            { text: "Priority support", included: false }
        ],
        limits: "Perfect for exploring what Narrativee can do"
    },
    {
        name: "Premium",
        subtitle: "For serious creators",
        monthlyPrice: 15,
        annualPrice: 12,
        monthlyPriceId: isProd ? "price_1SZA9wLShg9EGCkGW25Thvw1" : "price_1SZBdXL1bbAsFy34HqQJGg4q",
        annualPriceId: isProd ? "price_1SZAaRLShg9EGCkGpjmDFzIm" : "price_1SZBdpL1bbAsFy34wH6cEfl2",
        savings: 60,
        popular: true,
        cta: "Get started",
        color: "amber",
        features: [
            { text: "130 credits per month", included: true, bold: true },
            { text: "Unlimited AI reports", included: true, highlight: true },
            { text: "Advanced AI analysis & insights", included: true, highlight: true },
            { text: "Export to PDF (no watermark)", included: true },
            { text: "Export to Word, Excel, PowerPoint", included: true, highlight: true },
            { text: "Upload up to 20MB files and 10,000 rows", included: true },
            { text: "Up to 2 collaborators per report", included: true, highlight: true },
            { text: "2+ data source integrations", included: true },
            { text: "Custom branding & templates", included: true, highlight: true },
            { text: "Priority email support (24h response)", included: true },
            { text: "Custom expiration for share links", included: true }
        ],
        limits: "Save 15+ hours per week on reporting"
    },
    {
        name: "Pro",
        subtitle: "For teams & professionals",
        monthlyPrice: 23,
        annualPrice: 20,
        monthlyPriceId: isProd ? "price_1SZADVLShg9EGCkGEyaNibWz" : "price_1SZBe3L1bbAsFy34b3o7wgOK",
        annualPriceId: isProd ? "price_1SZAZvLShg9EGCkGlWkRs5ny" : "price_1SZBeQL1bbAsFy34as2o0Gc7",
        savings: 120,
        popular: false,
        cta: "Get started",
        color: "black",
        features: [
            { text: "Everything in Premium, plus:", included: true, bold: true },
            { text: "300 credits per month", included: true, bold: true },
            { text: "Upload up to 50MB files and 30,000 rows", included: true },
            { text: "Access to powerful AI models for deeper insights", included: true, highlight: true },
            { text: "Unlimited collaborators", included: true, highlight: true },
            { text: "API access for automation", included: true, highlight: true },
            { text: "White-label reports (remove all branding)", included: true, highlight: true },
            { text: "Dedicated support", included: true },
            { text: "Priority chat support (3h response)", included: true },
        ],
        limits: "Built for scaling teams and agencies"
    }
] as const;