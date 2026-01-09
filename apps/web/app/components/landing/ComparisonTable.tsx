"use client";

import { Check, X, Minus } from "lucide-react";
import Image from "next/image";

const competitors = [
    { name: "Narrativee", logo: "/logoDark.png", highlight: true },
    { name: "PostHog", logo: "/posthog-logo.svg", highlight: false },
    { name: "Appcues", logo: "/appques.png", highlight: false },
    { name: "Mixpanel", logo: "/logo_mixpanel.png", highlight: false },
];

const features = [
    {
        name: "Track trial user behavior",
        narrativee: true,
        posthog: true,
        appcues: false,
        mixpanel: true,
    },
    {
        name: "Score users by engagement",
        narrativee: true,
        posthog: false,
        appcues: false,
        mixpanel: false,
    },
    {
        name: "Identify high-intent trials",
        narrativee: true,
        posthog: false,
        appcues: true,
        mixpanel: true,
    },
    {
        name: "Trigger upgrade prompts",
        narrativee: true,
        posthog: false,
        appcues: true,
        mixpanel: false,
    },
    {
        name: "Trial-to-paid workflows",
        narrativee: true,
        posthog: false,
        appcues: false,
        mixpanel: false,
    },
    {
        name: "Built for trial conversion",
        narrativee: true,
        posthog: false,
        appcues: false,
        mixpanel: false,
    },
    {
        name: "Open source SDK",
        narrativee: true,
        posthog: true,
        appcues: false,
        mixpanel: false,
    },
];

function FeatureStatus({ value }: { value: boolean | "partial" }) {
    if (value === true) {
        return (
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                <Check size={14} className="text-green-600" />
            </div>
        );
    }
    if (value === "partial") {
        return (
            <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center">
                <Minus size={14} className="text-yellow-600" />
            </div>
        );
    }
    return (
        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={14} className="text-gray-400" />
        </div>
    );
}

export function ComparisonTable() {
    return (
        <section className="border-b border-neutral-200 py-20 px-6">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <span className="text-primary font-manrope font-semibold text-sm uppercase tracking-wider mb-4 block">
                        Why Narrativee
                    </span>
                    <h2 className="text-4xl md:text-5xl font-medium font-urbanist text-gray-900 mb-4">
                        Built specifically for trial conversion
                    </h2>
                    <p className="text-xl text-gray-500 font-urbanist">
                        Other tools track users or send messages. We do both — with a focus on converting trials.
                    </p>
                </div>

                {/* Comparison Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-4 px-4 font-manrope font-semibold text-gray-500 text-sm">
                                    Feature
                                </th>
                                {competitors.map((comp) => (
                                    <th
                                        key={comp.name}
                                        className={`py-4 px-4 text-center ${comp.highlight
                                            ? "bg-primary/5"
                                            : ""
                                            }`}
                                    >
                                        <div className="flex justify-center items-center">
                                            <Image
                                                src={comp.logo}
                                                alt={comp.name}
                                                width={100}
                                                height={30}
                                                className="h-6 w-auto object-contain"
                                            />
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {features.map((feature, idx) => (
                                <tr
                                    key={feature.name}
                                    className={idx !== features.length - 1 ? "border-b border-gray-100" : ""}
                                >
                                    <td className="py-4 px-4 font-manrope text-gray-700 text-sm">
                                        {feature.name}
                                    </td>
                                    <td className={`py-4 px-4 bg-primary/5`}>
                                        <div className="flex justify-center">
                                            <FeatureStatus value={feature.narrativee} />
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex justify-center">
                                            <FeatureStatus value={feature.posthog} />
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex justify-center">
                                            <FeatureStatus value={feature.appcues} />
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex justify-center">
                                            <FeatureStatus value={feature.mixpanel} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Bottom note */}
                <p className="text-center text-gray-400 text-sm mt-8 font-manrope">
                    Analytics tools show you data. Engagement tools send messages. Narrativee does both — for trial conversion.
                </p>
            </div>
        </section>
    );
}
