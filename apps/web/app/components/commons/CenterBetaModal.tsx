"use client";

import { useState, useTransition } from "react";
import { X, ArrowRight, Loader2, Check } from "lucide-react";
import { submitToDiscord } from "../../actions/discord";
import Image from "next/image";
import logo from "../../../public/logo.png"

interface CenterBetaModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CenterBetaModal({ isOpen, onClose }: CenterBetaModalProps) {
    const [isSuccess, setIsSuccess] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (formData: FormData) => {
        startTransition(async () => {
            const result = await submitToDiscord(formData);
            if (result.success) {
                setIsSuccess(true);
                // Auto close after 3 seconds
                setTimeout(() => {
                    setIsSuccess(false);
                    onClose();
                }, 3000);
            } else {
                alert(result.message || "Something went wrong.");
            }
        });
    };

    const handleClose = () => {
        setIsSuccess(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={handleClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md relative overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-8">
                    {/* Icon */}
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 mx-auto">
                        {isSuccess ? (
                            <Check size={32} className="text-green-600" />
                        ) : (
                            <Image src={logo} alt="Logo" width={32} height={32} />
                        )}
                    </div>

                    {/* Content */}
                    <div className="text-center mb-6">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-3 font-urbanist">
                            {isSuccess ? "You're on the list! 🎉" : "Join the Beta — it's FREE!"}
                        </h3>
                        {isSuccess ? (
                            <p className="text-gray-500 leading-relaxed font-manrope">
                                We'll be in touch within 24h with your early access.
                            </p>
                        ) : (
                            <>
                                <p className="text-gray-600 leading-relaxed font-manrope mb-4">
                                    <strong>This is for you if:</strong>
                                </p>
                                <ul className="text-left text-sm text-gray-600 space-y-2 mb-4 max-w-sm mx-auto">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">✓</span>
                                        <span>You run a <strong>SaaS with free trials</strong></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">✓</span>
                                        <span>You're <strong>losing trial users</strong> before they convert</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">✓</span>
                                        <span>You want to <strong>boost your MRR</strong> without guessing</span>
                                    </li>
                                </ul>
                                <p className="text-primary font-medium text-sm font-manrope">
                                    Get free access. Let's 10x your trial conversions together.
                                </p>
                            </>
                        )}
                    </div>

                    {!isSuccess && (
                        <form action={handleSubmit} className="space-y-4">
                            <div>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Enter your work email"
                                    required
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Securing your spot...
                                    </>
                                ) : (
                                    <>
                                        Claim Free Access Now
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                            <p className="text-xs text-gray-400 text-center">
                                ⚡ Limited to 20 SaaS companies • Free forever • No credit card
                            </p>
                        </form>
                    )}
                </div>

                {/* Decorative gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent blur-3xl -z-10" />
            </div>
        </div>
    );
}
