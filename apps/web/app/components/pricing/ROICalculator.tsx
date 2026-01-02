"use client"
import { useState, useMemo } from 'react';
import { calculateROI, ROI_DEFAULTS } from '@/lib/pricingData';
import { TrendingUp, DollarSign, Users, Percent } from 'lucide-react';

export function ROICalculator() {
    const [trialUsers, setTrialUsers] = useState(ROI_DEFAULTS.avgMonthlyTrialUsers);
    const [conversionRate, setConversionRate] = useState(ROI_DEFAULTS.currentConversionRate);
    const [avgLTV, setAvgLTV] = useState(ROI_DEFAULTS.avgLTV);
    const [expectedLift] = useState(ROI_DEFAULTS.narrativeeConversionLift);

    const roi = useMemo(() => {
        return calculateROI(trialUsers, conversionRate, expectedLift, avgLTV);
    }, [trialUsers, conversionRate, expectedLift, avgLTV]);

    return (
        <div className="border border-neutral-200 rounded-sm w-full p-8 ">
            <div className="text-center mb-10">
                <h2 className="text-4xl font-medium font-urbanist text-gray-900 mb-2">
                    Calculate Your Revenue Lift
                </h2>
                <p className="text-gray-500 font-urbanist">
                    See how much additional revenue Narrativee can generate for your SaaS
                </p>
            </div>

            {/* Input Sliders */}
            <div className="grid md:grid-cols-3 gap-6 mb-10">
                <div className="border border-neutral-200 rounded-xl p-5">
                    <label className="flex items-center gap-2 text-sm text-gray-500 mb-3 font-manrope">
                        <Users size={16} />
                        Monthly Trial Users
                    </label>
                    <input
                        type="range"
                        min="50"
                        max="5000"
                        step="50"
                        value={trialUsers}
                        onChange={(e) => setTrialUsers(Number(e.target.value))}
                        className="w-full accent-tertiary"
                    />
                    <div className="text-3xl font-medium text-gray-900 mt-2 font-urbanist">{trialUsers.toLocaleString()}</div>
                </div>

                <div className="border border-neutral-200 rounded-xl p-5">
                    <label className="flex items-center gap-2 text-sm text-gray-500 mb-3 font-manrope">
                        <Percent size={16} />
                        Current Conversion Rate
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="15"
                        step="0.5"
                        value={conversionRate}
                        onChange={(e) => setConversionRate(Number(e.target.value))}
                        className="w-full accent-tertiary"
                    />
                    <div className="text-3xl font-medium text-gray-900 mt-2 font-urbanist">{conversionRate}%</div>
                </div>

                <div className="border border-neutral-200 rounded-xl p-5">
                    <label className="flex items-center gap-2 text-sm text-gray-500 mb-3 font-manrope">
                        <DollarSign size={16} />
                        Average Customer LTV
                    </label>
                    <input
                        type="range"
                        min="50"
                        max="1000"
                        step="25"
                        value={avgLTV}
                        onChange={(e) => setAvgLTV(Number(e.target.value))}
                        className="w-full accent-tertiary"
                    />
                    <div className="text-3xl font-medium text-gray-900 mt-2 font-urbanist">${avgLTV}</div>
                </div>
            </div>

            {/* Results */}
            <div className="bg-contrast text-white rounded-xl p-8">
                <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div>
                        <div className="text-white text-sm mb-2 font-manrope">Additional Conversions/mo</div>
                        <div className="text-4xl font-medium font-urbanist flex items-center justify-center gap-2">
                            <TrendingUp size={28} />
                            +{roi.additionalConversions}
                        </div>
                        <div className="text-sm text-white/50 mt-2">
                            {roi.currentConversions} → {roi.newConversions} customers
                        </div>
                    </div>

                    <div>
                        <div className="text-white text-sm mb-2 font-manrope">Additional MRR</div>
                        <div className="text-4xl font-medium font-urbanist">
                            +${roi.additionalMRR.toLocaleString()}
                        </div>
                        <div className="text-sm text-white/50 mt-2">per month</div>
                    </div>

                    <div>
                        <div className="text-white text-sm mb-2 font-manrope">Additional ARR</div>
                        <div className="text-5xl font-medium font-urbanist">
                            +${roi.additionalARR.toLocaleString()}
                        </div>
                        <div className="text-sm text-white mt-2">🚀 Per year</div>
                    </div>
                </div>
            </div>

            <p className="text-center text-tertiary text-sm mt-6 font-manrope">
                Based on an average {expectedLift}% conversion rate lift with Narrativee's behavioral triggers
            </p>
        </div>
    );
}

