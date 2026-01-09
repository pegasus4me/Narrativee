"use client";

import { useEffect, useState, useTransition } from "react";
import { X, ArrowRight, Loader2, Check } from "lucide-react";
import { submitToDiscord } from "../../actions/discord";
import Image from "next/image";
import logo from "../../../public/logo.png"

export default function BetaSignupPopup() {
    const [isVisible, setIsVisible] = useState(false);
    const [isClosed, setIsClosed] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        const handleScroll = () => {
            // Show popup after scrolling 300px
            if (window.scrollY > 300) {
                setIsVisible(true);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleSubmit = (formData: FormData) => {
        startTransition(async () => {
            const result = await submitToDiscord(formData);
            if (result.success) {
                setIsSuccess(true);
                // Auto close after 3 seconds
                setTimeout(() => setIsClosed(true), 3000);
            } else {
                alert(result.message || "Something went wrong.");
            }
        });
    };

    if (isClosed || !isVisible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-1 w-[380px] relative overflow-hidden">
                {/* Close Button */}
                <button
                    onClick={() => setIsClosed(true)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X size={16} />
                </button>

                <div className="p-5 flex gap-4">
                    {/* Icon */}
                    <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-primary">
                        {isSuccess ? <Check size={24} /> : <Image src={logo} alt="Logo" width={24} height={24} />}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1 font-manrope">
                            {isSuccess ? "You're on the list!" : "Join the Beta Program"}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed font-manrope mb-4">
                            {isSuccess
                                ? "We'll be in touch shortly."
                                : "Leverage Narrativee for free during our beta period. Limited spots available."}
                        </p>

                        {!isSuccess && (
                            <form action={handleSubmit} className="flex flex-col gap-2">
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Enter your email"
                                    required
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="w-full bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            Joining...
                                        </>
                                    ) : (
                                        <>
                                            Join Beta for Free
                                            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Decorative bloom */}
                <div className="absolute top-0 right-0 -tr-10 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent blur-2xl -z-10" />
            </div>
        </div>
    );
}
