"use client";

import { useState } from "react";
import { X, Check, Crown } from "lucide-react";
import { authClient } from "../../../lib/auth-client";
import { API_URL } from "@/lib/api-config";
import { useRouter } from "next/navigation";
import PrimaryButton from "../commons/PrimaryButton";
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
      {/* Glassmorphic backdrop — same as channels auth modal */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="relative w-full max-w-[720px] rounded-3xl bg-white">
        {/* Header */}
        <div className="relative px-8 pt-8 pb-6 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            Upgrade your workflow
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500 max-w-md mx-auto">
            Repurpose faster, publish smarter, grow everywhere.
          </p>

          {/* Annual / Monthly toggle */}
          <div className="flex items-center justify-center gap-4 mt-5">
            <span
              className={`text-sm font-medium transition-colors ${!isAnnual ? "text-zinc-900" : "text-zinc-400"}`}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-14 h-7 bg-gray-200 rounded-full transition-colors focus:outline-none"
            >
              <div
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  isAnnual ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium transition-colors ${isAnnual ? "text-zinc-900" : "text-zinc-400"}`}
            >
              Yearly{" "}
              <span className="text-primary text-xs ml-1 font-bold">-20%</span>
            </span>
          </div>
        </div>

        {/* Plans grid */}
        <div className={`px-6 pb-8 grid grid-cols-1 gap-4 ${PricingPlans.length > 1 ? "sm:grid-cols-2" : "max-w-md mx-auto"}`}>
          {PricingPlans.map((plan, index) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const isLoading = loadingPlan === plan.name;
                const isPopular = plan.popular;

            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 flex flex-col transition-all duration-200 border border-zinc-200/80 hover:border-zinc-300`}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <h4 className="text-base font-bold text-zinc-900">{plan.name}</h4>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-extrabold text-zinc-900 tracking-tight">
                    ${price}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">/mo</span>
                </div>

                <p className="text-xs text-zinc-500 leading-relaxed mb-5">
                  {plan.description}
                </p>

                {/* Features */}
                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.filter(f => f.included).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isPopular
                            ? "bg-primary/10 text-primary"
                            : "bg-emerald-100 text-emerald-600"
                        }`}
                      >
                        <Check className="w-2.5 h-2.5" strokeWidth={3} />
                      </div>
                      <span className={`text-xs text-zinc-700 ${feature.bold ? "font-bold" : "font-medium"}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isPopular ? (
                  <PrimaryButton
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isLoading}
                    className="w-full py-3 text-sm"
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Processing…
                      </span>
                    ) : (
                      session?.user ? "Upgrade Now" : plan.cta
                    )}
                  </PrimaryButton>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-70 bg-zinc-900 text-white hover:bg-zinc-800"
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Processing…
                      </span>
                    ) : (
                      session?.user ? "Upgrade Now" : plan.cta
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-8 pb-6 text-center">
        </div>
      </div>
    </div>
  );
}