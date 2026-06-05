"use client";

import { useState } from "react";
import { X, Check, Zap, ArrowRight } from "lucide-react";
import { authClient } from "../../../lib/auth-client";
import { API_URL } from "@/lib/api-config";
import { useRouter } from "next/navigation";
import { PricingPlans } from "../../../lib/pricingData";

interface PricingPopUpProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PricingPopUp({ isOpen, onClose }: PricingPopUpProps) {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPlan = async (plan: (typeof PricingPlans)[number]) => {
    if (!session?.user) {
      router.push("/auth/signin");
      onClose();
      return;
    }

    if (plan.monthlyPrice === 0) {
      router.push("/workspace");
      onClose();
      return;
    }

    setLoadingPlan(plan.name);

    try {
      const priceId = isAnnual ? plan.annualPriceId : plan.monthlyPriceId;
      if (!priceId) {
        console.error("Price ID missing for plan:", plan.name);
        return;
      }

      const response = await fetch(`${API_URL}/pricing/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          priceId,
          planName: plan.name.toLowerCase(),
          isAnnual,
        }),
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        alert(`Failed to start checkout: ${error.error || "Unknown error"}`);
        return;
      }

      const { url } = (await response.json()) as { url: string };
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("An error occurred. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[780px] bg-[#09090b] border border-white/[0.08] rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-[100px] pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="relative px-8 pt-10 pb-6 text-center">
          <h3 className="text-3xl font-display text-white">
            Upgrade your workflow
          </h3>
          <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto">
            Scale your social presence natively with zero friction. Cancel anytime.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <span
              className={`text-sm font-semibold transition-colors ${
                !isAnnual ? "text-white" : "text-zinc-500"
              }`}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-14 h-7 bg-zinc-800 rounded-full border border-white/10 transition-colors focus:outline-none hover:border-white/20"
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-md transition-all duration-300 ${
                  isAnnual
                    ? "translate-x-7 bg-[#eca8d6]"
                    : "translate-x-0 bg-white"
                }`}
              />
            </button>
            <span
              className={`text-sm font-semibold transition-colors ${
                isAnnual ? "text-white" : "text-zinc-500"
              }`}
            >
              Yearly{" "}
              <span className="bg-[#eca8d6]/20 text-[#eca8d6] border border-[#eca8d6]/30 px-2 py-0.5 rounded-full text-xs font-bold ml-1.5">
                -20%
              </span>
            </span>
          </div>
        </div>

        {/* Plans grid */}
        <div className="relative px-6 pb-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {PricingPlans.map((plan, index) => {
            const isCreator = plan.name === "Creator";
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const isLoading = loadingPlan === plan.name;

            return (
              <div
                key={plan.name}
                className={`relative border transition-all duration-300 flex flex-col justify-between ${
                  isCreator
                    ? "border-[#eca8d6]/60 bg-[#eca8d6]/[0.03]"
                    : "border-white/[0.08] bg-white/[0.02]"
                }`}
              >
                {/* Popular badge */}
                {isCreator && (
                  <div className="absolute -top-3.5 left-6 right-6 flex justify-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#eca8d6] text-black text-[10px] font-mono uppercase tracking-widest font-bold">
                      <Zap className="w-3 h-3 fill-black" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-6 flex flex-col h-full justify-between">
                  <div>
                    {/* Plan header */}
                    <div className="mb-6 pb-5 border-b border-white/[0.08]">
                      <span className="font-mono text-[10px] text-zinc-600">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h4 className="text-xl font-display text-white mt-1">
                        {plan.name}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed min-h-[32px]">
                        {plan.description}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-display text-white">
                          ${price}
                        </span>
                        <span className="text-zinc-500 text-sm">/month</span>
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-1 font-mono">
                        {isAnnual ? "billed annually" : "billed monthly"}
                      </p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 mb-6">
                      {plan.features
                        .filter((f) => f.included)
                        .map((feature) => (
                          <li
                            key={feature.text}
                            className="flex items-start gap-2.5"
                          >
                            <Check className="w-3.5 h-3.5 text-[#eca8d6] mt-0.5 shrink-0" />
                            <span
                              className={`text-xs ${
                                feature.bold
                                  ? "font-bold text-white"
                                  : "text-zinc-400"
                              }`}
                            >
                              {feature.text}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isLoading}
                    className={`w-full py-3 flex items-center justify-center gap-2 text-sm font-medium transition-all group disabled:opacity-70 ${
                      isCreator
                        ? "bg-[#eca8d6] text-black hover:bg-[#eca8d6]/90 font-bold"
                        : "border border-white/20 text-white hover:border-white/40 hover:bg-white/5"
                    }`}
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <svg
                          className="animate-spin h-4 w-4"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Processing…
                      </span>
                    ) : (
                      <>
                        {session?.user ? "Upgrade Now" : plan.cta}
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}