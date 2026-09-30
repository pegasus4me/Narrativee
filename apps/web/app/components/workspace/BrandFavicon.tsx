"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Globe } from "lucide-react";

export interface BrandFaviconProps {
  url?: string | null;
  name?: string;
  size?: number;
  className?: string;
  fallback?: ReactNode;
}

const loadedFaviconCache = new Set<string>();
const failedFaviconCache = new Set<string>();

export default function BrandFavicon({
  url,
  name,
  size = 17,
  className = "",
  fallback,
}: BrandFaviconProps) {
  const trimmed = url?.trim() ?? "";
  const [hasError, setHasError] = useState(() => failedFaviconCache.has(trimmed));
  const [isLoaded, setIsLoaded] = useState(() => loadedFaviconCache.has(trimmed));

  useEffect(() => {
    if (!trimmed) {
      setHasError(false);
      setIsLoaded(false);
      return;
    }
    setHasError(failedFaviconCache.has(trimmed));
    setIsLoaded(loadedFaviconCache.has(trimmed));
  }, [trimmed]);

  const defaultFallback = fallback ?? <Globe size={size} className={`shrink-0 ${className}`} />;

  if (!url || !url.trim() || hasError) {
    return <>{defaultFallback}</>;
  }

  const encodedUrl = encodeURIComponent(url.trim());
  const iconSrc = `/api/favicon?url=${encodedUrl}`;

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[3px] ${className}`}
      style={{ width: size, height: size }}
    >
      {!isLoaded && (
        <span className="absolute inset-0 flex items-center justify-center">
          {defaultFallback}
        </span>
      )}
      <img
        src={iconSrc}
        alt={name ? `${name} favicon` : "Website favicon"}
        width={size}
        height={size}
        loading="lazy"
        onLoad={() => {
          if (trimmed) loadedFaviconCache.add(trimmed);
          setIsLoaded(true);
        }}
        onError={() => {
          if (trimmed) failedFaviconCache.add(trimmed);
          setHasError(true);
        }}
        className={`size-full object-contain transition-opacity duration-150 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </span>
  );
}
