"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Brand } from "@/lib/api/brands";
import { useBrands } from "./BrandProvider";

export default function RemoveBrandConfirmation({
  brand,
  onCancel,
  onRemoved,
}: {
  brand: Brand;
  onCancel: () => void;
  onRemoved: () => void;
}) {
  const { remove } = useBrands();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);

  async function confirm() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      const warning = await remove(brand);
      if (warning) toast.warning(warning);
      else toast.success(`${brand.name} removed`);
      onRemoved();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to remove brand",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 p-2">
      <p className="break-words text-sm font-medium text-ink">
        Remove {brand.name}?
      </p>
      <p className="text-xs leading-relaxed text-ink-2">
        This permanently deletes its Discovery, Brand Brain, uploaded images,
        and Studio projects. This cannot be undone.
      </p>
      {error && (
        <p role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="h-8 flex-1 rounded-md border border-line text-xs text-ink hover:bg-hover-2 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void confirm()}
          className="h-8 flex-1 rounded-md bg-red-600 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {busy ? "Removing…" : "Remove brand"}
        </button>
      </div>
    </div>
  );
}
