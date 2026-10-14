"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { authLink } from "@/lib/auth-destination";
import { billingRequest, navigateBilling, type Usage } from "@/lib/api/billing";
import { Button, type ButtonVariant, type ButtonSize } from "@/components/ui/button";
export default function PlanButton({
  plan,
  yearly,
  variant,
  size = "lg",
  className,
}: {
  plan: "starter" | "pro";
  yearly: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  const { data: session } = authClient.useSession();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function choose() {
    if (!session) {
      window.location.assign(
        authLink(
          "signup",
          `/workspace/studio?plan=${plan}&interval=${yearly ? "yearly" : "monthly"}`,
        ),
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const usage = await billingRequest<Usage>("/usage");
      if (usage.plan === "trial")
        await navigateBilling("checkout", {
          plan,
          interval: yearly ? "yearly" : "monthly",
        });
      else if (usage.plan === "starter" && plan === "pro")
        await navigateBilling("upgrade");
      else await navigateBilling("portal");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please retry.");
      setBusy(false);
    }
  }
  return (
    <>
      <Button
        variant={variant ?? (plan === "starter" ? "tertiary" : "primary")}
        size={size}
        className={className}
        disabled={busy}
        onClick={choose}
      >
        {busy ? "Opening billing…" : "Start your 7 day trial"}{" "}
        <span aria-hidden="true">→</span>
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </>
  );
}
