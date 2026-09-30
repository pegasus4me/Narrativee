"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  brandFromAnalysis,
  BrandApiError,
  claimBrand,
  studioPath,
  getBrand,
  listBrands,
  type Brand,
} from "@/lib/api/brands";
import { getSiteAnalysis } from "@/lib/api/analysis";

type Context = {
  brands: Brand[];
  active: Brand | null;
  loading: boolean;
  error: string | null;
  legacyId: string | null;
  retry: () => void;
  select: (brand: Brand) => void;
};
const BrandContext = createContext<Context | null>(null);

export function useBrands() {
  const context = useContext(BrandContext);
  if (!context) throw new Error("BrandProvider is required");
  return context;
}

export function BrandProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const params = useSearchParams();
  const brandId = params.get("brandId");
  const analysisId = params.get("analysisId");
  const userId = session?.user.id;
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({
    brands: [] as Brand[],
    active: null as Brand | null,
    loading: true,
    error: null as string | null,
    legacyId: null as string | null,
  });

  useEffect(() => {
    if (isPending) return;
    let cancelled = false;
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));
    async function load() {
      let brands: Brand[] = [];
      try {
        brands = userId ? await listBrands() : [];
        let active: Brand | null = null;
        let legacyId: string | null = null;
        const pendingId = window.sessionStorage.getItem("pending_brand_id");
        const rememberedId = window.sessionStorage.getItem("active_brand_id");
        const targetId =
          brandId || (!analysisId && userId ? pendingId || rememberedId : null);
        if (targetId) {
          try {
            active = await getBrand(targetId);
          } catch (error) {
            if (
              brandId ||
              !(error instanceof BrandApiError) ||
              error.status !== 404
            )
              throw error;
            window.sessionStorage.removeItem("pending_brand_id");
            window.sessionStorage.removeItem("active_brand_id");
            active = brands[0] ?? null;
          }
        } else if (analysisId) {
          const analysis = await getSiteAnalysis(analysisId);
          if (analysis.brandId) active = await getBrand(analysis.brandId);
          else {
            if (userId) {
              try {
                active = await brandFromAnalysis(analysisId);
              } catch (error) {
                if (!(error instanceof BrandApiError) || error.status !== 403)
                  throw error;
              }
            }
            if (!active) {
              legacyId = analysisId;
              let hostname = analysis.url;
              try {
                const fullUrl = analysis.url.includes("://")
                  ? analysis.url
                  : `https://${analysis.url}`;
                hostname = new URL(fullUrl).hostname;
              } catch {
                // Keep raw url as fallback
              }
              active = {
                id: "",
                name: hostname,
                url: analysis.url,
                provisional: true,
                createdAt: analysis.createdAt,
                updatedAt: analysis.updatedAt,
              };
            }
          }
        } else active = brands[0] ?? null;
        if (active?.id && active.provisional && userId) {
          active = await claimBrand(active.id);
          brands = [active, ...brands.filter((item) => item.id !== active!.id)];
          if (pendingId === active.id)
            window.sessionStorage.removeItem("pending_brand_id");
        }
        if (cancelled) return;
        if (active?.id) {
          window.sessionStorage.setItem("active_brand_id", active.id);
        }
        setState({ brands, active, loading: false, error: null, legacyId });
        if (active?.id && (analysisId || (!brandId && pendingId)))
          router.replace(studioPath(active.id));
      } catch (error) {
        if (!cancelled)
          setState({
            brands,
            active: null,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Unable to load this brand",
            legacyId: null,
          });
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [brandId, analysisId, userId, isPending, revision, router]);

  function select(brand: Brand) {
    setState((current) => ({
      ...current,
      active: brand,
      error: null,
      brands: [brand, ...current.brands.filter((item) => item.id !== brand.id)],
    }));
    window.sessionStorage.setItem("active_brand_id", brand.id);
    router.push(studioPath(brand.id));
  }

  return (
    <BrandContext.Provider
      value={{
        ...state,
        loading: state.loading || isPending,
        retry: () => setRevision((value) => value + 1),
        select,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}
