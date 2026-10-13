"use client";

import { useState } from "react";
import { Package, Plus, X } from "lucide-react";
import type { BrandProduct } from "@/lib/api/brand-brain";
import type { BrandBrainController } from "./useBrandBrain";
import { AssetPreview } from "./AssetPreview";
import { ProductForm } from "./ProductForm";

export function BrandProducts({
  brain,
  brandId,
  onBusyChange,
  startAdd = false,
}: {
  brain: BrandBrainController;
  brandId: string;
  onBusyChange?: (busy: boolean) => void;
  startAdd?: boolean;
}) {
  const [editing, setEditing] = useState<BrandProduct | "new" | null>(
    startAdd ? "new" : null,
  );
  const [removing, setRemoving] = useState<string | null>(null);
  const products = brain.data?.products ?? [];

  async function remove(id: string) {
    onBusyChange?.(true);
    try {
      if (await brain.archiveProduct(id)) setRemoving(null);
    } finally {
      onBusyChange?.(false);
    }
  }

  if (editing)
    return (
      <ProductForm
        key={typeof editing === "object" ? editing?.id : "new"}
        brandId={brandId}
        product={editing && editing !== "new" ? editing : undefined}
        onBusyChange={onBusyChange}
        onSaved={async () => {
          await brain.refresh();
          setEditing(null);
        }}
        onCancel={() => {
          brain.retry();
          setEditing(null);
        }}
      />
    );

  return (
    <section aria-label="Product library" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-500">
          Your products, photos, and the details your agents should use.
        </p>
        <button
          type="button"
          disabled={brain.busy}
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
        >
          <Plus size={15} />
          {products.length ? "Add product" : "Add your first product"}
        </button>
      </div>
      {!products.length && (
        <p className="rounded-xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
          Add a name, description, and photos so your agents can create with
          your actual product.
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        {products.map((product) => {
          const photos =
            brain.data?.assets.filter(
              (asset) => asset.productId === product.id,
            ) ?? [];
          return (
            <article
              key={product.id}
              className="rounded-xl border border-dashed border-neutral-200 p-4"
            >
              <div className="mb-3 flex items-start gap-3">
                <Package
                  size={18}
                  className="mt-0.5 shrink-0 text-neutral-400"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-medium">{product.name}</h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-neutral-500">
                    {product.description}
                  </p>
                </div>
              </div>
              {photos.length ? (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative overflow-hidden rounded-lg bg-neutral-50"
                    >
                      <AssetPreview
                        brandId={brandId}
                        assetId={photo.id}
                        alt={photo.caption || product.name}
                        className="h-24 w-full object-contain p-2"
                      />
                      <button
                        type="button"
                        aria-label={`Remove ${photo.filename} from ${product.name}`}
                        disabled={brain.busy}
                        onClick={() => void brain.archiveImage(photo.id)}
                        className="absolute right-1 top-1 rounded-full bg-white p-1 text-neutral-500 opacity-0 hover:text-neutral-900 group-hover:opacity-100 focus:opacity-100"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg bg-neutral-50 p-4 text-xs text-neutral-500">
                  No photos yet. Edit this product to add some.
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                <button
                  type="button"
                  disabled={brain.busy}
                  onClick={() => setEditing(product)}
                  className="underline underline-offset-4"
                >
                  Edit / add photos
                </button>
                {removing === product.id ? (
                  <>
                    <button
                      type="button"
                      disabled={brain.busy}
                      onClick={() => void remove(product.id)}
                      className="text-destructive"
                    >
                      Confirm removal
                    </button>
                    <button
                      type="button"
                      disabled={brain.busy}
                      onClick={() => setRemoving(null)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={brain.busy}
                    onClick={() => setRemoving(product.id)}
                    className="text-neutral-500"
                  >
                    Remove product
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
