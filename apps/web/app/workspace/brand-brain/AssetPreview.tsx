"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { brainAssetUrl } from "@/lib/api/brand-brain";

export function AssetPreview({
  brandId,
  assetId,
  alt,
  className = "h-16 w-16 shrink-0 rounded object-cover",
}: {
  brandId: string;
  assetId: string;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    fetch(brainAssetUrl(brandId, assetId), { credentials: "include" })
      .then((response) => {
        if (!response.ok) throw new Error("Image unavailable");
        return response.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [brandId, assetId]);
  return url ? (
    <Image
      src={url}
      alt={alt}
      width={64}
      height={64}
      unoptimized
      className={className}
    />
  ) : (
    <div
      aria-label="Image loading"
      className={`${className} bg-zinc-200 dark:bg-zinc-800`}
    />
  );
}
