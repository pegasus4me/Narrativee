"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import {
  getBrandBrain,
  brainAssetUrl,
  type BrandBrain,
} from "@/lib/api/brand-brain";
import { projectImageUrl } from "@/lib/api/studio-canvas";
import StudioUploadButton from "./StudioUploadButton";
import StudioAdReferences from "./StudioAdReferences";

export interface StudioBriefReference {
  id: string;
  name: string;
  url: string;
  role: "product" | "style";
  productId?: string;
}

export default function StudioBriefMaterials({
  brandId,
  projectId,
  productId,
  references,
  onProductChange,
  onReferencesChange,
  disabled,
  onBusyChange,
  children,
}: {
  brandId: string;
  projectId: string;
  productId?: string;
  references: StudioBriefReference[];
  onProductChange: (id?: string) => void;
  onReferencesChange: (references: StudioBriefReference[]) => void;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
  children?: ReactNode;
}) {
  const [brain, setBrain] = useState<BrandBrain | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setError(null);
    getBrandBrain(brandId)
      .then((data) => {
        if (!cancelled) setBrain(data);
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "Products could not be loaded. You can still attach a photo.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [brandId, revision]);

  function chooseProduct(id: string) {
    const styles = references.filter(({ role }) => role === "style");
    const photos = (brain?.assets ?? [])
      .filter(({ productId }) => productId === id)
      .slice(0, Math.min(3, 5 - styles.length));
    onProductChange(id || undefined);
    onReferencesChange([
      ...styles,
      ...photos.map((photo) => ({
        id: photo.id,
        productId: id,
        name: photo.caption || photo.filename,
        role: "product" as const,
        url: brainAssetUrl(brandId, photo.id),
      })),
    ]);
  }
  function attach(
    image: { id: string; name: string },
    role: "product" | "style",
  ) {
    onReferencesChange(
      [
        ...references.filter(({ id }) => id !== image.id),
        {
          ...image,
          url: projectImageUrl(projectId, image.id),
          role,
          ...(role === "product" && productId ? { productId } : {}),
        },
      ].slice(-5),
    );
  }
  return (
    <div className="pointer-events-auto mx-auto w-fit max-w-full space-y-2">
      <div
        role="toolbar"
        aria-label="Creative materials"
        className="flex max-w-full flex-wrap items-center justify-center gap-1 rounded-b-[28px] border border-t-0 border-border bg-background/95 p-1.5 backdrop-blur-sm"
      >
        <select
          aria-label="Product from Brand Brain"
          value={productId ?? ""}
          disabled={disabled}
          onChange={(event) => chooseProduct(event.target.value)}
          className="h-9 max-w-44 rounded-full border-0 bg-transparent px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Choose a product</option>
          {brain?.products?.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
        <StudioUploadButton
          projectId={projectId}
          disabled={disabled || references.length >= 5}
          onBusyChange={onBusyChange}
          label="Product photo"
          onUploaded={(image) => attach(image, "product")}
        />
        <StudioUploadButton
          projectId={projectId}
          disabled={disabled || references.length >= 5}
          onBusyChange={onBusyChange}
          label="Inspiration"
          onUploaded={(image) => attach(image, "style")}
        />
        <StudioAdReferences
          projectId={projectId}
          disabled={disabled || references.length >= 5}
          onBusyChange={onBusyChange}
          onSelected={(image) => attach(image, "style")}
        />
        {children}
      </div>
      {error && (
        <p role="status" className="text-xs text-muted-foreground">
          {error}{" "}
          <button
            type="button"
            disabled={disabled}
            onClick={() => setRevision((value) => value + 1)}
            className="underline"
          >
            Retry
          </button>
        </p>
      )}
      {references.length > 0 && (
        <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
          {references.map((reference) => (
            <div
              key={reference.id}
              className="flex max-w-56 shrink-0 items-center gap-2 rounded-lg border border-border bg-background py-1 pl-1 pr-2"
            >
              <img
                src={reference.url}
                alt={reference.name}
                className="size-9 rounded-md object-cover"
              />
              <span className="min-w-0">
                <span className="block truncate text-xs">{reference.name}</span>
                <span className="block text-[10px] text-muted-foreground">
                  {reference.role === "product" ? "Product" : "Style reference"}
                </span>
              </span>
              <button
                type="button"
                disabled={disabled}
                aria-label={`Remove ${reference.name} from brief`}
                onClick={() =>
                  onReferencesChange(
                    references.filter(({ id }) => id !== reference.id),
                  )
                }
                className="rounded p-1 hover:bg-muted"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
