"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchProjectImage, projectImageUrl } from "@/lib/api/studio-canvas";
import type { StudioCreativeSummary } from "@/lib/api/studio";

const previewCache = new Map<string, string>();

interface StudioCreativeCardProps {
  creative: StudioCreativeSummary;
}

export function parseCreativeName(fullName: string) {
  const parts = fullName.split(" · ").map((p) => p.trim());
  if (parts.length >= 3) {
    const platform = parts[0];
    const dimensions = parts[1];
    const title = parts.slice(2).join(" · ");
    return { platform, dimensions, title, full: fullName };
  }
  if (parts.length === 2) {
    return {
      platform: parts[0],
      dimensions: null,
      title: parts[1],
      full: fullName,
    };
  }
  return { platform: null, dimensions: null, title: fullName, full: fullName };
}

export function StudioCreativeCard({ creative }: StudioCreativeCardProps) {
  const router = useRouter();
  const [imageSrc, setImageSrc] = useState<string | null>(
    () => previewCache.get(creative.assetId) ?? null,
  );
  const [loadingImage, setLoadingImage] = useState(
    !previewCache.has(creative.assetId),
  );
  const [imageError, setImageError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { platform, dimensions, title } = parseCreativeName(creative.name);

  useEffect(() => {
    let active = true;
    const cached = previewCache.get(creative.assetId);
    if (cached) {
      setImageSrc(cached);
      setLoadingImage(false);
      return;
    }

    setLoadingImage(true);
    setImageError(false);

    fetchProjectImage(creative.projectId, creative.assetId)
      .then((blob) => {
        if (!active) return;
        const objectUrl = URL.createObjectURL(blob);
        previewCache.set(creative.assetId, objectUrl);
        setImageSrc(objectUrl);
        setLoadingImage(false);
      })
      .catch(() => {
        if (!active) return;
        // Fallback to direct URL if blob fetch fails
        const directUrl = projectImageUrl(creative.projectId, creative.assetId);
        setImageSrc(directUrl);
        setLoadingImage(false);
      });

    return () => {
      active = false;
    };
  }, [creative.projectId, creative.assetId]);

  const handleOpen = () => {
    const destination = creative.id
      ? `/workspace/studio/${creative.projectId}?focus=${encodeURIComponent(creative.id)}`
      : `/workspace/studio/${creative.projectId}`;
    router.push(destination);
  };

  const handleDownload = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (downloading) return;
    setDownloading(true);
    try {
      let downloadUrl = imageSrc;
      if (!downloadUrl || !downloadUrl.startsWith("blob:")) {
        const blob = await fetchProjectImage(
          creative.projectId,
          creative.assetId,
        );
        downloadUrl = URL.createObjectURL(blob);
      }
      const anchor = document.createElement("a");
      const safeTitle = title ?? "creative";
      const cleanName = safeTitle.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase();
      anchor.href = downloadUrl;
      anchor.download = `${cleanName || "creative"}.png`;
      anchor.click();
    } catch {
      window.open(
        projectImageUrl(creative.projectId, creative.assetId),
        "_blank",
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-background">
      <button
        type="button"
        onClick={handleOpen}
        aria-label={`Open creative: ${title}`}
        className="flex aspect-square w-full items-center justify-center bg-muted p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        {loadingImage ? (
          <span role="status" className="text-xs text-muted-foreground">
            Loading preview…
          </span>
        ) : imageError ? (
          <span className="text-xs text-muted-foreground">
            Preview unavailable
          </span>
        ) : (
          imageSrc && (
            <img
              src={imageSrc}
              alt={creative.name}
              crossOrigin="use-credentials"
              onError={() => setImageError(true)}
              className="h-full w-full object-contain"
            />
          )
        )}
      </button>
      <div className="space-y-2 border-t border-border p-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {dimensions && <span>{dimensions.replace(" px", "")}</span>}
          {platform && platform !== "Any platform" && <span>{platform}</span>}
          {creative.version > 1 && <span>v{creative.version}</span>}
        </div>
        <button
          type="button"
          onClick={handleOpen}
          title={creative.name}
          className="line-clamp-2 text-left text-sm font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {title}
        </button>
        {creative.projectTitle && (
          <p className="truncate text-xs text-muted-foreground">
            {creative.projectTitle}
          </p>
        )}
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          aria-label={`Download image: ${title}`}
          className="text-xs text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          {downloading ? "Downloading…" : "Download"}
        </button>
      </div>
    </article>
  );
}
