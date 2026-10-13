"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  billingRequest,
  UPGRADE_REQUIRED,
  USAGE_CHANGED,
  OPEN_UPGRADE,
  type Usage,
  type PlanCatalog,
} from "@/lib/api/billing";
import { authClient } from "@/lib/auth-client";
import UpgradeDialog from "./UpgradeDialog";
const UsageContext = createContext<{ usage?: Usage; openUpgrade: () => void }>({
  openUpgrade: () => {},
});
export const useUsage = () => useContext(UsageContext);
export function UsageProvider({ children }: { children: ReactNode }) {
  const { data: session } = authClient.useSession();
  const params = useSearchParams(),
    router = useRouter();
  const [open, setOpen] = useState(false),
    [reason, setReason] = useState<string | null>(null),
    [seen, setSeen] = useState("");
  const confirming = params.get("billing") === "confirming";
  const query = useQuery({
    queryKey: ["usage", session?.user.id],
    enabled: !!session,
    queryFn: () => billingRequest<Usage>("/usage"),
    refetchOnWindowFocus: true,
    refetchInterval: confirming ? 2000 : 30_000,
    retry: 1,
  });
  const catalog = useQuery({
    queryKey: ["billing-plans"],
    queryFn: () => billingRequest<PlanCatalog>("/billing/plans"),
    staleTime: 60_000,
  });
  const usage = query.data;
  useEffect(() => {
    const changed = () => {
      void query.refetch();
    };
    const blocked = (event: Event) => {
      setReason((event as CustomEvent<string>).detail);
      setOpen(true);
      changed();
    };
    const show = () => {
      setReason(null);
      setOpen(true);
    };
    window.addEventListener(USAGE_CHANGED, changed);
    window.addEventListener(UPGRADE_REQUIRED, blocked);
    window.addEventListener(OPEN_UPGRADE, show);
    window.addEventListener("focus", changed);
    return () => {
      window.removeEventListener(USAGE_CHANGED, changed);
      window.removeEventListener(UPGRADE_REQUIRED, blocked);
      window.removeEventListener(OPEN_UPGRADE, show);
      window.removeEventListener("focus", changed);
    };
  }, [query.refetch]);
  useEffect(() => {
    if (!usage) return;
    const signature = `${usage.reason}:${usage.trialEndsAt}:${usage.resetAt}`;
    if (usage.reason && seen !== signature && !confirming) {
      setSeen(signature);
      setReason(usage.reason);
      setOpen(true);
    }
    if (!usage.reason) setSeen("");
    if (
      usage.plan !== "trial" &&
      usage.accessStatus === "active" &&
      confirming
    ) {
      const target = new URL(window.location.href);
      target.searchParams.delete("billing");
      router.replace(target.pathname + target.search, { scroll: false });
    }
  }, [usage, seen, confirming, router]);
  useEffect(() => {
    const deadline =
      usage?.plan === "trial" ? usage.trialEndsAt : usage?.resetAt;
    if (!deadline || !usage) return;
    const remaining =
      new Date(deadline).getTime() - new Date(usage.serverTime).getTime();
    if (remaining <= 0) return;
    const timer = setTimeout(
      () => void query.refetch(),
      Math.min(remaining + 100, 2_147_483_647),
    );
    return () => clearTimeout(timer);
  }, [usage, query.refetch]);
  useEffect(() => {
    if (params.has("plan")) {
      setOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("plan");
      url.searchParams.delete("interval");
      router.replace(url.pathname + url.search, { scroll: false });
    }
  }, [params, router]);
  return (
    <UsageContext.Provider
      value={{
        usage,
        openUpgrade: () => {
          setReason(null);
          setOpen(true);
        },
      }}
    >
      {confirming && (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-xl border border-pink-200 bg-[#fff8fc] p-4 text-center text-sm shadow-lg"
        >
          Confirming your payment… You can keep viewing your saved work while we
          wait for Stripe.
          <button
            className="ml-2 underline"
            onClick={() => void query.refetch()}
          >
            Refresh
          </button>
        </div>
      )}
      {query.isError && (
        <div
          role="status"
          className="fixed bottom-3 right-3 z-40 rounded-lg bg-white p-3 text-xs shadow"
        >
          Credit status is unavailable.
          <button
            className="ml-2 underline"
            onClick={() => void query.refetch()}
          >
            Retry
          </button>
        </div>
      )}
      {children}
      <UpgradeDialog
        open={open}
        onOpenChange={setOpen}
        usage={usage}
        reason={reason}
        catalog={catalog.data}
        initialInterval={params.get("interval")}
      />
    </UsageContext.Provider>
  );
}
export function CreditStatus() {
  const { usage, openUpgrade } = useUsage();
  if (!usage) return null;
  return (
    <button
      type="button"
      onClick={openUpgrade}
      className="rounded-lg px-2 py-1 flex items-center gap-3 text-left text-xs text-zinc-600 hover:bg-pink-50"
      aria-label="View credits and plans"
    >
      <span className="inline-flex items-center gap-1.5 font-semibold text-zinc-900">
        <Image
          src="/credit-pink.png"
          alt=""
          width={20}
          height={20}
          className="size-5 shrink-0 object-contain"
          unoptimized
        />
        {usage.availableCredits.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })}{" "}
      </span>
    </button>
  );
}
