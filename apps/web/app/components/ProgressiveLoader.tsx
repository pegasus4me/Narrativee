"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LOADING_STEPS = [
    "Analyzing file structure...",
    "Identifying key trends...",
    "Drafting narrative arc...",
    "Formatting report...",
    "Finalizing insights..."
];

const TIPS = [
    "Tip: You can ask the AI to rewrite specific sections in a 'wittier' tone.",
    "Did you know? Pro users can upload files up to 50MB.",
    "Tip: Use the 'Story' mode for more engaging, narrative-driven reports.",
    "Did you know? You can share your reports with a public link.",
    "Tip: The AI analyzes your column headers to understand context."
];

export default function ProgressiveLoader() {
    const [currentStep, setCurrentStep] = useState(0);
    const [currentTip, setCurrentTip] = useState(0);

    useEffect(() => {
        // Simulate progress through steps
        const stepInterval = setInterval(() => {
            setCurrentStep((prev) => {
                if (prev < LOADING_STEPS.length - 1) {
                    return prev + 1;
                }
                return prev;
            });
        }, 3500); // Change step every 3.5 seconds

        // Rotate tips
        const tipInterval = setInterval(() => {
            setCurrentTip((prev) => (prev + 1) % TIPS.length);
        }, 5000); // Change tip every 5 seconds

        return () => {
            clearInterval(stepInterval);
            clearInterval(tipInterval);
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-6">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

                <div className="text-center mb-6">
                    <p className="text-sm font-medium text-amber-600 bg-amber-50 px-4 py-2 rounded-full inline-block">
                        Reports take a couple of minutes to be generated
                    </p>
                </div>

                {/* Logo or Icon Animation */}
                <div className="flex justify-center mb-8">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-amber-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-amber-400 rounded-full border-t-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl">✨</span>
                        </div>
                    </div>
                </div>

                {/* Steps Checklist */}
                <div className="space-y-4 mb-8">
                    {LOADING_STEPS.map((step, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <div className="w-6 h-6 flex items-center justify-center">
                                {index < currentStep ? (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                                    >
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </motion.div>
                                ) : index === currentStep ? (
                                    <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <div className="w-2 h-2 bg-gray-200 rounded-full ml-1.5"></div>
                                )}
                            </div>
                            <span
                                className={`text-sm font-medium transition-colors duration-300 ${index <= currentStep ? "text-gray-900" : "text-gray-400"
                                    }`}
                                style={{ fontFamily: index === currentStep ? 'var(--font-petrona)' : undefined }}
                            >
                                {step}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Tips Carousel */}
                <div className="pt-6 border-t border-gray-100">
                    <div className="h-12 relative overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={currentTip}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="text-xs text-center text-gray-500 italic absolute w-full"
                            >
                                {TIPS[currentTip]}
                            </motion.p>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
