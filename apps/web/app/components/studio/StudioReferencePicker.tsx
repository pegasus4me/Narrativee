"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Images, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBrandBrain, type BrainAsset } from "@/lib/api/brand-brain";
import { AssetPreview } from "@/app/workspace/brand-brain/AssetPreview";

export default function StudioReferencePicker({
  brandId,
  selectedIds,
  disabled,
  onSelected,
}: {
  brandId: string;
  selectedIds: string[];
  disabled: boolean;
  onSelected: (asset: BrainAsset) => void;
}) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<BrainAsset[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setAssets(null);
    setError(null);
    getBrandBrain(brandId)
      .then((brain) => {
        if (!cancelled)
          setAssets(
            brain.assets.filter(
              (asset) => asset.kind === "inspiration" && !asset.productId,
            ),
          );
      })
      .catch(() => {
        if (!cancelled)
          setError("References could not be loaded. Please retry.");
      });
    return () => {
      cancelled = true;
    };
  }, [open, brandId, revision]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Reference"
          disabled={disabled}
          className="h-9 gap-1.5 rounded-full px-3 text-xs"
        >
          <Images size={15} />
          Reference
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[1200] bg-black/30 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[1201] flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-border bg-background p-5 shadow-xl sm:p-7">
          <Dialog.Close
            aria-label="Close references"
            className="absolute right-4 top-4 rounded p-1 hover:bg-muted"
          >
            <X size={18} />
          </Dialog.Close>
          <Dialog.Title className="pr-6 text-xl font-semibold">
            Choose a reference
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            Select an image from your Brand Brain to guide this creative.
          </Dialog.Description>
          <div className="mt-5 overflow-y-auto p-1">
            {error ? (
              <div
                role="alert"
                className="py-8 text-center text-sm text-destructive"
              >
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => setRevision((value) => value + 1)}
                  className="mt-2 underline"
                >
                  Retry
                </button>
              </div>
            ) : !assets ? (
              <p
                role="status"
                className="py-10 text-center text-sm text-muted-foreground"
              >
                Loading references…
              </p>
            ) : !assets.length ? (
              <p
                role="status"
                className="py-10 text-center text-sm text-muted-foreground"
              >
                Add images to References in your Brand Brain, then choose one
                here.
              </p>
            ) : (
              <div className="columns-2 gap-3 sm:columns-3">
                {assets.map((asset) => {
                  const selected = selectedIds.includes(asset.id);
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      aria-label={`Use reference: ${asset.caption || asset.filename}`}
                      aria-pressed={selected}
                      disabled={disabled || selected}
                      onClick={() => {
                        if (disabled || selected) return;
                        onSelected(asset);
                        setOpen(false);
                      }}
                      style={{
                        aspectRatio: `${asset.width} / ${asset.height}`,
                      }}
                      className="relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-xl outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                    >
                      <AssetPreview
                        brandId={brandId}
                        assetId={asset.id}
                        alt={asset.caption || asset.filename}
                        className="h-full w-full object-cover"
                      />
                      {selected && (
                        <span className="absolute right-2 top-2 rounded-full bg-background p-1 text-foreground">
                          <Check size={16} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
