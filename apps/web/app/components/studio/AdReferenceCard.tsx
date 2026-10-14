"use client";

import { ExternalLink, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdReference } from "@/lib/api/ad-references";

export default function AdReferenceCard({
  ad,
  busy,
  disabled,
  onSelect,
}: {
  ad: AdReference;
  busy: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-background">
      <div className="relative flex aspect-square shrink-0 items-center justify-center overflow-hidden bg-muted">
        {ad.videoUrl ? (
          <video
            aria-label={`Advertisement by ${ad.advertiser}`}
            src={ad.videoUrl}
            poster={ad.imageUrl ?? undefined}
            controls
            preload="none"
            className="absolute inset-0 h-full w-full object-contain"
          />
        ) : ad.imageUrl ? (
          <img
            src={ad.imageUrl}
            alt={`Advertisement by ${ad.advertiser}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-contain"
          />
        ) : (
          <span className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
            <ImageOff size={24} />
            Preview unavailable
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold">{ad.advertiser}</h3>
          <a
            href={ad.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${ad.advertiser} ad on Meta`}
            className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <ExternalLink size={14} />
          </a>
        </div>
        <p className="line-clamp-3 text-xs leading-5 text-muted-foreground">
          {ad.text || "No ad text available."}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-auto w-full"
          disabled={disabled || !ad.imageUrl}
          onClick={onSelect}
        >
          {busy
            ? "Adding…"
            : ad.videoUrl
              ? "Use preview as reference"
              : "Use as reference"}
        </Button>
      </div>
    </article>
  );
}
