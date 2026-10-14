"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import Image from "next/image";
import { Check, X } from "lucide-react";
import { pricingPlans } from "@/app/pricing/pricingData";
import PricingModels from "@/app/pricing/PricingModels";
import { Button } from "@/components/ui/button";
import type { Usage, PlanCatalog } from "@/lib/api/billing";
import { navigateBilling } from "@/lib/api/billing";
const reasons: Record<string, [string, string]> = {
  TRIAL_EXPIRED: [
    "Your next chapter starts here.",
    "Your 7-day trial has ended. Choose a plan to keep creating.",
  ],
  TRIAL_CREDITS_EXHAUSTED: [
    "A little more room to create.",
    "Your trial credits are used or reserved by work in progress.",
  ],
  PAID_CREDITS_EXHAUSTED: [
    "You’ve used your monthly allowance.",
    "Wait for your reset, or move from Starter to Pro for more room.",
  ],
  PAYMENT_REQUIRED: [
    "Let’s get you creating again.",
    "Choose a plan or update your payment details to continue.",
  ],
};
export default function UpgradeDialog({
  open,
  onOpenChange,
  usage,
  reason,
  catalog,
  initialInterval,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usage?: Usage;
  reason: string | null;
  catalog?: PlanCatalog;
  initialInterval?: string | null;
}) {
  const [yearly, setYearly] = useState(initialInterval === "yearly"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [title, baseDescription] = reasons[reason ?? ""] ?? [
    "A plan for your next chapter.",
    "More room for research, ideas, and good creative.",
  ];
  const description =
    usage?.plan === "pro" && reason === "PAID_CREDITS_EXHAUSTED"
      ? "Your allowance resets monthly. Contact us if you need help planning your next creative."
      : baseDescription;
  async function go(
    kind: "checkout" | "upgrade" | "portal",
    plan?: "starter" | "pro",
  ) {
    setBusy(true);
    setError("");
    try {
      await navigateBilling(
        kind,
        plan ? { plan, interval: yearly ? "yearly" : "monthly" } : undefined,
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please retry.");
      setBusy(false);
    }
  }
  const paid = usage?.plan === "starter" || usage?.plan === "pro";
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[1200] bg-black/30 backdrop-blur-md" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[1201] max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-950 shadow-xl sm:p-9">
          <Dialog.Close
            aria-label="Close pricing"
            className="absolute right-4 top-4 rounded p-1 hover:bg-zinc-100"
          >
            <X size={18} />
          </Dialog.Close>
          <Dialog.Title className="pr-5 text-4xl font-bold">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-3 text-sm text-zinc-600">
            {description} Your saved work is still available to view, edit, and
            export.
          </Dialog.Description>
          {paid && usage?.plan === "starter" && (
            <p className="mt-3 text-sm text-zinc-600">
              Stripe will confirm the prorated payment. A successful upgrade
              adds 1,000 credits to this month’s allowance and keeps your reset
              date.
            </p>
          )}
          {usage?.resetAt && (
            <p className="mt-3 text-sm">
              Credits reset on {new Date(usage.resetAt).toLocaleDateString()}.
            </p>
          )}
          {!paid && (
            <div className="mt-6 flex w-fit rounded-full bg-zinc-100 p-1">
              {[false, true].map((value) => (
                <button
                  key={String(value)}
                  type="button"
                  aria-pressed={yearly === value}
                  onClick={() => setYearly(value)}
                  className={`rounded-full px-4 py-2 text-sm ${yearly === value ? "bg-zinc-900 text-white" : ""}`}
                >
                  {value ? "Yearly · save 20%" : "Monthly"}
                </button>
              ))}
            </div>
          )}
          {usage?.plan !== "pro" && (
            <div className={`mt-5 grid gap-4 ${paid ? "" : "sm:grid-cols-2"}`}>
              {(["starter", "pro"] as const)
                .filter((plan) => !paid || plan === "pro")
                .map((plan) => {
                  const item = catalog?.plans[plan],
                    credits =
                      item?.credits ?? (plan === "starter" ? 500 : 1500);
                  const annual = paid
                    ? usage?.billingInterval === "yearly"
                    : yearly;
                  const amount =
                    (annual ? item?.yearly : item?.monthly) ??
                    (plan === "starter"
                      ? annual
                        ? 18240
                        : 1900
                      : annual
                        ? 47040
                        : 4900);
                  const dailyPrice = (
                    amount /
                    100 /
                    (annual ? 365 : 30)
                  ).toFixed(2);
                  const planData = pricingPlans.find(
                    (p) => p.name.toLowerCase() === plan,
                  );
                  return (
                    <article
                      key={plan}
                      className="flex flex-col justify-between rounded-xl border border-zinc-200 p-5"
                    >
                      <div>
                        <h3 className="font-semibold capitalize">{plan}</h3>
                        {planData?.description && (
                          <p className="mt-1 text-xs text-zinc-500">
                            {planData.description}
                          </p>
                        )}
                        <p className="mt-4 text-3xl font-bold">
                          $
                          {(amount / 100).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: amount % 100 ? 2 : 0,
                          })}
                          <span className="ml-1 text-sm font-normal text-zinc-500">
                            /{annual ? "year" : "month"}
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {annual
                            ? `$${(amount / 100 / 12).toFixed(2)}/mo · ~$${dailyPrice}/day`
                            : `~$${dailyPrice} / day`}
                        </p>
                        <p className="mt-3 flex items-center gap-1.5 text-sm font-medium">
                          <span>{credits.toLocaleString()}</span>
                          <Image
                            src="/credit-pink.png"
                            alt=""
                            width={18}
                            height={18}
                            className="size-[18px] shrink-0 object-contain"
                            unoptimized
                          />
                          <span>every month</span>
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          For all your brands and projects.
                        </p>
                        {planData?.features && (
                          <ul className="mt-4 space-y-2 border-t border-zinc-100 pt-3 text-xs text-zinc-600">
                            {planData.features
                              .filter(
                                (f) =>
                                  !f
                                    .toLowerCase()
                                    .includes("credits every month"),
                              )
                              .map((feature) => (
                                <li
                                  key={feature}
                                  className="flex items-start gap-2"
                                >
                                  <Check
                                    size={14}
                                    className="mt-0.5 shrink-0 text-zinc-900"
                                  />
                                  <span>{feature}</span>
                                </li>
                              ))}
                          </ul>
                        )}
                        {planData && (
                          <PricingModels models={planData.imageModels} />
                        )}
                      </div>
                      <Button
                        variant="tertiary"
                        size="lg"
                        contrastColor="#600174ff"
                        disabled={busy}
                        onClick={() =>
                          go(
                            paid ? "upgrade" : "checkout",
                            paid ? undefined : plan,
                          )
                        }
                        className="mt-5 w-full text-white"
                      >
                        {busy
                          ? "Opening billing…"
                          : paid
                            ? "Upgrade to Pro"
                            : `Choose ${item?.name ?? plan}`}
                      </Button>
                    </article>
                  );
                })}
            </div>
          )}
          {catalog && !catalog.billingAvailable && (
            <p className="mt-4 text-sm text-zinc-600">
              Paid billing is not available yet. Contact us for help.
            </p>
          )}
          {(paid || usage?.paymentNeedsAttention) && (
            <button
              type="button"
              disabled={busy}
              onClick={() => go("portal")}
              className="mt-5 text-sm font-semibold underline"
            >
              Manage billing and invoices
            </button>
          )}
          {error && (
            <p role="alert" className="mt-4 text-sm text-red-700">
              {error}
            </p>
          )}
          <a
            className="mt-4 inline-block text-sm text-zinc-600 underline"
            href="mailto:contact@narrativee.com"
          >
            Contact the Narrativee team
          </a>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
