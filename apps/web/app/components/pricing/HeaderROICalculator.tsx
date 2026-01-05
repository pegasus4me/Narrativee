"use client"
import { useState, useMemo } from 'react';
import { calculateROI, ROI_DEFAULTS } from '@/lib/pricingData';
import { TrendingUp, DollarSign, Users } from 'lucide-react';

export function HeaderROICalculator() {
    const [trialUsers, setTrialUsers] = useState(ROI_DEFAULTS.avgMonthlyTrialUsers);
    const [avgLTV, setAvgLTV] = useState(ROI_DEFAULTS.avgLTV);
    const [conversionRate] = useState(ROI_DEFAULTS.currentConversionRate);
    const [expectedLift] = useState(ROI_DEFAULTS.narrativeeConversionLift);

    const roi = useMemo(() => {
        return calculateROI(trialUsers, conversionRate, expectedLift, avgLTV);
    }, [trialUsers, conversionRate, expectedLift, avgLTV]);

    return (
        <div className="bg-secondary py-3 font-manrope">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">

                {/* Inputs */}
                <div className="flex items-center gap-6 flex-1 w-full md:w-auto overflow-x-auto h-[40px] no-scrollbar">

                    {/* Trial Users Slider */}
                    <div className="flex items-center gap-3 min-w-[240px]">
                        <div className="flex flex-col gap-1 w-full">
                            <div className="flex justify-between text-xs font-medium text-white/70 font-manrope">
                                <span className="flex items-center gap-1"><Users size={12} /> Your Avg Trial Users</span>
                                <span className="text-white">{trialUsers.toLocaleString()}</span>
                            </div>
                            <input
                                type="range"
                                min="50"
                                max="5000"
                                step="50"
                                value={trialUsers}
                                onChange={(e) => setTrialUsers(Number(e.target.value))}
                                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                        </div>
                    </div>

                    {/* Avg Price Slider */}
                    <div className="flex items-center gap-3 min-w-[240px]">
                        <div className="flex flex-col gap-1 w-full">
                            <div className="flex justify-between text-xs font-medium text-white/70 font-manrope">
                                <span className="flex items-center gap-1"><DollarSign size={12} /> Your Avg Monthly Price</span>
                                <span className="text-white">${avgLTV}</span>
                            </div>
                            <input
                                type="range"
                                min="20"
                                max="1000"
                                step="5"
                                value={avgLTV}
                                onChange={(e) => setAvgLTV(Number(e.target.value))}
                                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Result */}
                <div className="flex items-center gap-3 pl-4 md:border-l border-white/10 min-w-max">
                    <div className="text-right">
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-white font-manrope">Potential Revenue Lift <span className="text-white/80">(with 1.8% lift)</span></div>
                        <div className="text-xl md:text-3xl font-bold font-urbanist text-white flex items-center justify-end gap-3">
                            <div className="flex flex-col items-end leading-none">
                                <div className="flex items-baseline gap-1">
                                    <TrendingUp size={20} className="text-white" />
                                    +${roi.additionalMRR.toLocaleString()}/mo
                                    <span className="text-xs font-medium text-white/50 font-sans">/month</span>
                                </div>
                                <div className="text-sm font-medium text-white">
                                    +${roi.additionalARR.toLocaleString()}
                                    <span className="text-xs font-medium text-white/50 font-sans">/year</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
