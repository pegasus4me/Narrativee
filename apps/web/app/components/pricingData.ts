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
            { text: "20 credits (one-time)", included: true, bold: true },
            { text: "Basic AI reports", included: true },
            { text: "Basic AI analysis", included: true },
            { text: "Export to PDF (with watermark)", included: true },
            { text: "Email support", included: true },
            { text: "Upload up to 5MB files and 1000 rows", included: false },
            { text: "Share links expire in 7 days", included: true },
            { text: "Collaboration", included: false },
            { text: "Advanced AI models", included: false },
            { text: "Priority support", included: false }
        ],
        limits: "Perfect for exploring what Narrativee can do"
    },
    {
        name: "Premium",
        subtitle: "Unlock the full power of Narrativee: for individuals, students and small teams looking to create data-driven professional reports",
        monthlyPrice: 14.95,
        annualPrice: 11.95,
        monthlyPriceId: isProd ? "price_1SZA9wLShg9EGCkGW25Thvw1" : "price_1SZBdXL1bbAsFy34HqQJGg4q",
        annualPriceId: isProd ? "price_1SZAaRLShg9EGCkGpjmDFzIm" : "price_1SZBdpL1bbAsFy34wH6cEfl2",
        savings: 60,
        popular: true,
        cta: "Get started",
        color: "amber",
        features: [
            { text: "130 credits per month", included: true, bold: true },
            { text: "Advanced AI analysis & insights", included: true, highlight: true },
            { text: "Export to PDF (no watermark)", included: true },
            { text: "Upload up to 20MB files and 10,000 rows", included: true },
            { text: "Up to 2 collaborators per report", included: true, highlight: true },
            { text: "Custom branding & templates", included: true, highlight: true },
            { text: "Priority email support (24h response)", included: true },
            { text: "Custom expiration for share links", included: true }
        ],
        limits: "Save 15+ hours per week on reporting"
    },
    {
        name: "Pro",
        subtitle: "For growing teams & professionals that need higher limits, unlimited collaboration, and priority support",
        monthlyPrice: 22.95,
        annualPrice: 19.95,
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
            { text: "Dedicated support", included: true },
            { text: "Priority chat support (3h response)", included: true },
        ],
        limits: "Built for scaling teams and agencies"
    }
] as const;