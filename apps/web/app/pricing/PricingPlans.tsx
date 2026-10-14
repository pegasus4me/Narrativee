"use client";

import { useState } from "react";
import { Check, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlanButton from "../components/billing/PlanButton";
import { useQuery } from "@tanstack/react-query";
import { billingRequest, type PlanCatalog } from "@/lib/api/billing";
import { pricingPlans } from "./pricingData";
import PricingModels from "./PricingModels";
import styles from "./pricing.module.css";

export default function PricingPlans() {
  const [yearly, setYearly] = useState(true);
  const { data: catalog } = useQuery({
    queryKey: ["billing-plans"],
    queryFn: () => billingRequest<PlanCatalog>("/billing/plans"),
    staleTime: 60000,
  });

  return (
    <section aria-label="Narrativee plans">
      <div className={styles.billing}>
        <div className={`${styles.billingToggle} bg-neutral-50`} aria-label="Billing period">
          <button
            type="button"
            aria-pressed={!yearly}
            onClick={() => setYearly(false)}
          >
            Pay monthly
          </button>
          <button
            type="button"
            aria-pressed={yearly}
            onClick={() => setYearly(true)}
          >
            Pay yearly
          </button>
        </div>
        <span className={styles.savings}>Save 20%</span>
      </div>

      <div className={styles.plans}>
        {pricingPlans.map((fallback, index) => {
          const item =
            catalog?.plans[
              fallback.name.toLowerCase() as "starter" | "pro" | "agency"
            ];
          const plan = {
            ...fallback,
            monthlyPrice: item
              ? item.monthly === null
                ? null
                : item.monthly / 100
              : fallback.monthlyPrice,
          };
          return (
            <article
              className={`${styles.plan} ${index === 0 ? styles.featured : ""} bg-neutral-50 rounded-3xl`}
              key={plan.name}
              aria-labelledby={`plan-${plan.name.toLowerCase()}`}
            >
              <div className={styles.planBody}>
                <h2
                  id={`plan-${plan.name.toLowerCase()}`}
                  className={plan.name === "Starter" ? "text-tertiary" : ""}
                >
                  {plan.name === "Agency"
                    ? "agencies"
                    : plan.name.toLowerCase()}
                </h2>
                {plan.description && (
                  <p className={styles.planDescription}>{plan.description}</p>
                )}
                <div className={styles.priceBlock} aria-live="polite">
                  <div className={styles.priceRow}>
                    <span className={`${styles.price} text-6xl font-bold`}>
                      {plan.monthlyPrice === null
                        ? "Let’s talk"
                        : `$${yearly ? (plan.monthlyPrice * 0.8).toFixed(2) : plan.monthlyPrice}`}
                    </span>
                  </div>
                  <p className={styles.priceCaption}>
                    {plan.monthlyPrice === null
                      ? "Custom pricing, made for your team"
                      : yearly
                        ? `$${(plan.monthlyPrice * 0.8 * 12).toFixed(2)} billed yearly · per month`
                        : `per month · ~$${(plan.monthlyPrice / 30).toFixed(2)}/day`}
                  </p>
                  <p className={styles.priceUnit}>/ per brand</p>
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

                <ul className={styles.features}>
                  {plan.features.map((copy, featureIndex) => (
                    <li key={copy}>
                      <Check size={18} strokeWidth={2.5} aria-hidden="true" />
                      <span>
                        {featureIndex === 0 &&
                        item?.credits !== null &&
                        item?.credits !== undefined
                          ? `${item.credits.toLocaleString()} credits every month`
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
