"use client";

import { useState } from "react";
import { Check, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlanButton from "../components/billing/PlanButton";
import { useQuery } from "@tanstack/react-query";
import { billingRequest, type PlanCatalog } from "@/lib/api/billing";
import { pricingPlans, PLAN_CREDITS } from "./pricingData";
import PricingModels from "./PricingModels";

export default function PricingPlans() {
  const [yearly, setYearly] = useState(true);
  const { data: catalog } = useQuery({
    queryKey: ["billing-plans"],
    queryFn: () => billingRequest<PlanCatalog>("/billing/plans"),
    staleTime: 60000,
  });

  return (
    <section aria-label="Narrativee plans">
      <div className="mb-8 flex items-center justify-center gap-3 sm:mb-16">
        <div
          className="flex items-center gap-[3px] rounded-full border border-[#f0f0f0] bg-neutral-50 p-1"
          aria-label="Billing period"
        >
          <button
            type="button"
            aria-pressed={!yearly}
            onClick={() => setYearly(false)}
            className={`flex min-h-9 cursor-pointer items-center rounded-full px-4 text-sm font-medium transition-colors ${
              !yearly
                ? "bg-[#262626] text-white shadow-xs"
                : "text-[#525252] hover:text-[#171717]"
            }`}
          >
            Pay monthly
          </button>
          <button
            type="button"
            aria-pressed={yearly}
            onClick={() => setYearly(true)}
            className={`flex min-h-9 cursor-pointer items-center rounded-full px-4 text-sm font-medium transition-colors ${
              yearly
                ? "bg-[#262626] text-white shadow-xs"
                : "text-[#525252] hover:text-[#171717]"
            }`}
          >
            Pay yearly
          </button>
        </div>
        <span className="text-sm font-semibold text-tertiary">Save 20%</span>
      </div>

      <div className="mx-auto grid max-w-lg grid-cols-1 items-stretch gap-6 md:max-w-none md:grid-cols-3 lg:gap-8">
        {pricingPlans.map((fallback) => {
          const planKey = fallback.name.toLowerCase();
          const item = catalog?.plans[planKey as "starter" | "pro" | "agency"];
          const plan = {
            ...fallback,
            monthlyPrice: item
              ? item.monthly === null
                ? null
                : item.monthly / 100
              : fallback.monthlyPrice,
          };
          const credits = PLAN_CREDITS[planKey] ?? item?.credits;
          return (
            <article
              className="relative flex flex-col rounded-3xl bg-neutral-50"
              key={plan.name}
              aria-labelledby={`plan-${plan.name.toLowerCase()}`}
            >
              <div className="flex flex-1 flex-col p-6 sm:p-8 lg:p-10">
                <h2
                  id={`plan-${plan.name.toLowerCase()}`}
                  className={`m-0 text-[28px] font-bold tracking-tight ${
                    plan.name === "Starter" ? "text-tertiary" : "text-[#171717]"
                  }`}
                >
                  {plan.name === "Agency"
                    ? "agencies"
                    : plan.name.toLowerCase()}
                </h2>
                {plan.description && (
                  <p className="mt-2 text-[15px] leading-normal text-[#737373]">
                    {plan.description}
                  </p>
                )}
                <div className="my-9" aria-live="polite">
                  <div className="flex min-h-[52px] items-baseline gap-2.5">
                    <span className="text-6xl font-bold leading-tight tracking-tight tabular-nums">
                      {plan.monthlyPrice === null
                        ? "Let’s talk"
                        : `$${yearly ? (plan.monthlyPrice * 0.8).toFixed(2) : plan.monthlyPrice}`}
                    </span>
                  </div>
                  <p className="mt-1.5 min-h-5 text-sm text-[#737373]">
                    {plan.monthlyPrice === null
                      ? "Custom pricing, made for your team"
                      : yearly
                        ? `$${(plan.monthlyPrice * 0.8 * 12).toFixed(2)} billed yearly · per month`
                        : `per month · ~$${(plan.monthlyPrice / 30).toFixed(2)}/day`}
                  </p>
                  <p className="mt-2 text-xl font-bold text-black">
                    / per brand
                  </p>
                </div>

                {plan.monthlyPrice === null ? (
                  <Button
                    variant="outline"
                    size="xl"
                    asChild
                    className="w-full"
                  >
                    <a href="mailto:contact@narrativee.com?subject=Narrativee%20Agency%20plan">
                      Get in touch <ArrowUpRight size={16} aria-hidden="true" />
                    </a>
                  </Button>
                ) : (
                  <PlanButton
                    className="w-full"
                    size="xl"
                    plan={plan.name === "Starter" ? "starter" : "pro"}
                    yearly={yearly}
                  />
                )}

                <ul className="m-0 mt-10 grid list-none gap-6 p-0">
                  {plan.features.map((copy, featureIndex) => (
                    <li
                      key={copy}
                      className="flex items-start gap-3.5 text-base leading-[1.55]"
                    >
                      <Check
                        size={18}
                        strokeWidth={3}
                        className="mt-[3px] shrink-0 text-[#858585]"
                        aria-hidden="true"
                      />
                      <span>
                        {featureIndex === 0 &&
                        credits !== null &&
                        credits !== undefined
                          ? `${credits.toLocaleString()} credits every month`
                          : copy}
                      </span>
                    </li>
                  ))}
                </ul>
                <PricingModels models={plan.imageModels} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
