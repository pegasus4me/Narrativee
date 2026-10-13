"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addBrainItem,
  updateBrainItem,
  approveBrainItem,
  approveBrainAsset,
  archiveBrainAsset,
  archiveBrainItem,
  archiveBrandProduct,
  getBrandBrain,
  syncWebsiteBrain,
  uploadBrainAsset,
  type BrainCategory,
  type BrainKind,
  type BrandBrain,
} from "@/lib/api/brand-brain";

export function useBrandBrain(brandId?: string) {
  const [data, setData] = useState<BrandBrain | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState(true);
  const [revision, setRevision] = useState(0);
  const [warning, setWarning] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!brandId) return;
    setData(await getBrandBrain(brandId));
  }, [brandId]);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    setWarning(null);
    setSyncing(Boolean(brandId));
    if (brandId) {
      getBrandBrain(brandId)
        .then(async (result) => {
          if (!cancelled) setData(result);
          try {
            const sync = await syncWebsiteBrain(brandId);
            if (cancelled) return;
            setWarning(sync.warnings.join(" ") || null);
            if (sync.imported) {
              const updated = await getBrandBrain(brandId);
              if (!cancelled) setData(updated);
            }
          } catch {
            if (!cancelled)
              setWarning(
                "Website findings could not be imported. Your saved kit is still available; reopen Brand Brain to retry.",
              );
          }
        })
        .catch((cause) => {
          if (!cancelled) setError(message(cause));
        })
        .finally(() => {
          if (!cancelled) setSyncing(false);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [brandId, revision]);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await refresh();
      return true;
    } catch (cause) {
      setError(message(cause));
      return false;
    } finally {
      setBusy(false);
    }
  }

  return {
    data,
    error,
    warning,
    busy,
    syncing,
    retry: () => setRevision((value) => value + 1),
    refresh,
    archiveProduct: (id: string) =>
      run(() => archiveBrandProduct(brandId!, id)),
    approveItem: (id: string) => run(() => approveBrainItem(brandId!, id)),
    approveImage: (id: string) => run(() => approveBrainAsset(brandId!, id)),
    addItem: (kind: BrainKind, category: BrainCategory, content: string) =>
      run(() => addBrainItem(brandId!, { kind, category, content })),
    updateItem: (id: string, content: string) =>
      run(() => updateBrainItem(brandId!, id, content)),
    archiveItem: (id: string) => run(() => archiveBrainItem(brandId!, id)),
    addImage: (
      file: File,
      kind: "rule" | "inspiration",
      category: BrainCategory,
      caption: string,
    ) => run(() => uploadBrainAsset(brandId!, file, kind, category, caption)),
    archiveImage: (id: string) => run(() => archiveBrainAsset(brandId!, id)),
  };
}

function message(cause: unknown) {
  return cause instanceof Error
    ? cause.message
    : "Could not update Brand Brain";
}

export type BrandBrainController = ReturnType<typeof useBrandBrain>;
