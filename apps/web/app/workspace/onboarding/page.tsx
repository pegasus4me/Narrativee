"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Globe,
  LoaderCircle,
  Plus,
  Shapes,
} from "lucide-react";
import {
  createBrand,
  listBrands,
  rememberBrand,
  studioPath,
  type Brand,
} from "@/lib/api/brands";
import {
  getSiteAnalysis,
  type AnalysisStatus,
  type SiteAnalysis,
} from "@/lib/api/analysis";
import {
  getOnboardingProfile,
  saveOnboardingProfile,
  type AgencySize,
  type WorkspaceType,
} from "@/lib/api/onboarding";
import BrandScanProgress from "@/app/components/workspace/BrandScanProgress";

const activeStatuses = new Set<AnalysisStatus>([
  "queued",
  "scraping",
  "synthesizing",
  "discovering_competitors",
  "scanning_competitors",
  "comparing_competitors",
]);

type BrandItem = {
  brand: Brand;
  analysis: SiteAnalysis | null;
  scanError?: boolean;
};

export default function OnboardingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const websiteParam = params.get("website") ?? "";
  const [step, setStep] = useState(1);
  const [workspaceType, setWorkspaceType] =
    useState<WorkspaceType>("small_business");
  const [workspaceName, setWorkspaceName] = useState("");
  const [agencySize, setAgencySize] = useState<AgencySize>("1-5");
  const [items, setItems] = useState<BrandItem[]>([]);
  const [hasWebsite, setHasWebsite] = useState(true);
  const [brandValue, setBrandValue] = useState(websiteParam);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    let mounted = true;
    void Promise.all([getOnboardingProfile(), listBrands()])
      .then(([{ profile }, brands]) => {
        if (!mounted) return;
        if (profile) {
          setWorkspaceType(profile.workspaceType);
          setWorkspaceName(profile.workspaceName);
          if (profile.agencySize) setAgencySize(profile.agencySize);
          if (profile.completedAt && !websiteParam) {
            router.replace(
              brands[0] ? studioPath(brands[0].id) : "/workspace/studio",
            );
            return;
          }
          if (websiteParam) setStep(2);
        }
        setItems(brands.map((brand) => ({ brand, analysis: null })));
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (!mounted) return;
        setError(
          cause instanceof Error ? cause.message : "Could not load onboarding",
        );
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [router, websiteParam]);

  const analysisKey = items
    .map(({ brand }) => `${brand.id}:${brand.analysisId ?? ""}`)
    .join("|");

  useEffect(() => {
    if (!itemsRef.current.some(({ brand }) => brand.analysisId)) return;
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function refresh() {
      const next = await Promise.all(
        itemsRef.current.map(async (item) => {
          if (!item.brand.analysisId) return item;
          try {
            return {
              ...item,
              analysis: await getSiteAnalysis(item.brand.analysisId),
              scanError: false,
            };
          } catch {
            return { ...item, scanError: true };
          }
        }),
      );
      if (!mounted) return;
      setItems(next);
      if (
        next.some(
          ({ analysis }) => analysis && activeStatuses.has(analysis.status),
        )
      )
        timer = setTimeout(() => void refresh(), 1800);
    }
    void refresh();
    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [analysisKey]);

  const scansRunning = useMemo(
    () =>
      items.some(
        ({ brand, analysis, scanError }) =>
          Boolean(brand.analysisId) &&
          ((!analysis && !scanError) ||
            Boolean(analysis && activeStatuses.has(analysis.status))),
      ),
    [items],
  );

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!workspaceName.trim() || (workspaceType === "agency" && !agencySize))
      return;
    setSaving(true);
    setError(null);
    try {
      await saveOnboardingProfile({
        workspaceType,
        workspaceName: workspaceName.trim(),
        agencySize: workspaceType === "agency" ? agencySize : null,
      });
      setStep(2);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save your workspace",
      );
    } finally {
      setSaving(false);
    }
  }

  async function addBrand(event: FormEvent) {
    event.preventDefault();
    if (saving || !brandValue.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const brand = await createBrand({
        ...(hasWebsite
          ? { url: brandValue.trim() }
          : { name: brandValue.trim() }),
        key: crypto.randomUUID(),
      });
      rememberBrand(brand);
      setItems((current) => [
        { brand, analysis: null },
        ...current.filter(({ brand: existing }) => existing.id !== brand.id),
      ]);
      setBrandValue("");
      window.history.replaceState(null, "", "/workspace/onboarding");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not add this brand",
      );
    } finally {
      setSaving(false);
    }
  }

  async function enterStudio() {
    const first = items[0]?.brand;
    if (!first || saving || scansRunning) return;
    setSaving(true);
    setError(null);
    try {
      await saveOnboardingProfile({
        workspaceType,
        workspaceName: workspaceName.trim(),
        agencySize: workspaceType === "agency" ? agencySize : null,
        complete: true,
      });
      window.sessionStorage.setItem("active_brand_id", first.id);
      window.location.replace(studioPath(first.id));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not finish onboarding",
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        <LoaderCircle className="mr-2 size-4 animate-spin" /> Preparing your
        workspace…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-8 sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Narrativee
        </Link>
        <div className="mt-12 flex items-center gap-2 text-xs text-muted-foreground">
          <span className={step === 1 ? "font-medium text-foreground" : ""}>
            01 · Your workspace
          </span>
          <span aria-hidden="true">/</span>
          <span className={step === 2 ? "font-medium text-foreground" : ""}>
            02 · Your brands
          </span>
        </div>

        {step === 1 ? (
          <form
            onSubmit={(event) => void saveProfile(event)}
            className="mt-7 space-y-6"
          >
            <div>
              <h1 className="text-3xl font-medium tracking-tight">
                What are you setting up?
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We’ll shape your workspace around the way you manage marketing.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  [
                    "small_business",
                    "Small business",
                    "I manage marketing for my own business.",
                  ],
                  ["agency", "Agency", "I manage marketing for client brands."],
                ] as const
              ).map(([value, title, description]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={workspaceType === value}
                  onClick={() => setWorkspaceType(value)}
                  className={`rounded-xl border p-4 text-left transition-colors ${workspaceType === value ? "border-foreground bg-muted" : "border-border hover:bg-muted/50"}`}
                >
                  <span className="block text-sm font-medium">{title}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {description}
                  </span>
                </button>
              ))}
            </div>
            <label className="block text-sm font-medium">
              {workspaceType === "agency" ? "Agency name" : "Business name"}
              <input
                required
                maxLength={120}
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
                placeholder={
                  workspaceType === "agency"
                    ? "e.g. North Studio"
                    : "e.g. Liquid Death"
                }
                className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-normal outline-none focus:border-foreground"
              />
            </label>
            {workspaceType === "agency" && (
              <label className="block text-sm font-medium">
                Agency team size
                <select
                  value={agencySize}
                  onChange={(event) =>
                    setAgencySize(event.target.value as AgencySize)
                  }
                  className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-normal"
                >
                  <option value="1-5">1–5 people</option>
                  <option value="6-10">6–10 people</option>
                  <option value="11-25">11–25 people</option>
                  <option value="26+">26+ people</option>
                </select>
              </label>
            )}
            <button
              disabled={saving || !workspaceName.trim()}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background disabled:opacity-50"
            >
              {saving ? "Saving…" : "Continue"}
              <ArrowRight size={15} />
            </button>
          </form>
        ) : (
          <section className="mt-7 space-y-6">
            <div>
              <h1 className="text-3xl font-medium tracking-tight">
                Which brands are you working on?
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Add the brands for your workspace. We’ll research each website
                as soon as you add it.
              </p>
            </div>
            <form
              onSubmit={(event) => void addBrand(event)}
              className="rounded-xl border border-border p-4 sm:p-5"
            >
              <div className="mb-3 flex gap-4 text-xs">
                <button
                  type="button"
                  aria-pressed={hasWebsite}
                  onClick={() => setHasWebsite(true)}
                  className={
                    hasWebsite
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  Website
                </button>
                <button
                  type="button"
                  aria-pressed={!hasWebsite}
                  onClick={() => setHasWebsite(false)}
                  className={
                    !hasWebsite
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  Name only
                </button>
              </div>
              <label className="sr-only" htmlFor="onboarding-brand">
                {hasWebsite ? "Brand website" : "Brand name"}
              </label>
              <div className="flex gap-2">
                {hasWebsite ? (
                  <Globe className="mt-3 size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <Shapes className="mt-3 size-4 shrink-0 text-muted-foreground" />
                )}
                <input
                  id="onboarding-brand"
                  required
                  value={brandValue}
                  onChange={(event) => setBrandValue(event.target.value)}
                  placeholder={hasWebsite ? "brand.com" : "Brand name"}
                  className="h-10 min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
                />
                <button
                  disabled={saving || !brandValue.trim()}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-medium text-background disabled:opacity-50"
                >
                  <Plus size={14} /> Add brand
                </button>
              </div>
            </form>

            {items.length > 0 && (
              <div className="space-y-3" aria-live="polite">
                {items.map(({ brand, analysis, scanError }) => {
                  const scanning = Boolean(
                    analysis && activeStatuses.has(analysis.status),
                  );
                  const failed =
                    analysis?.status === "failed" ||
                    analysis?.status === "competitor_analysis_failed";
                  const complete =
                    analysis?.status === "completed" ||
                    analysis?.status === "awaiting_competitor_confirmation";
                  return (
                    <article
                      key={brand.id}
                      className="rounded-xl border border-border p-4"
                    >
                      <div className="flex items-center gap-2">
                        {complete ? (
                          <Check className="size-4 text-emerald-600" />
                        ) : scanning ? (
                          <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Globe className="size-4 text-muted-foreground" />
                        )}
                        <h2 className="min-w-0 flex-1 truncate text-sm font-medium">
                          {brand.name}
                        </h2>
                        <span className="text-xs text-muted-foreground">
                          {scanning
                            ? "Researching"
                            : failed
                              ? "Scan needs a retry"
                              : scanError
                                ? "Scan status unavailable"
                                : complete
                                  ? "Ready"
                                  : brand.url
                                    ? "Scan starting"
                                    : "Ready to set up manually"}
                        </span>
                      </div>
                      {scanning && <BrandScanProgress analysis={analysis} />}
                      {failed && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          You can continue to Studio and finish setting up this
                          brand there.
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void enterStudio()}
                disabled={!items.length || scansRunning || saving}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background disabled:opacity-50"
              >
                {saving
                  ? "Preparing Studio…"
                  : scansRunning
                    ? "Research in progress…"
                    : "Access Studio"}
                <ArrowRight size={15} />
              </button>
              {scansRunning && (
                <span className="text-xs text-muted-foreground">
                  You can add more brands while the research runs.
                </span>
              )}
            </div>
          </section>
        )}
        {error && step === 1 && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
