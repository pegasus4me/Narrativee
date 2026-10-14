"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, ExternalLink, Image as ImageIcon, Loader2 } from "lucide-react";
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
    return { platform: parts[0], dimensions: null, title: parts[1], full: fullName };
  }
  return { platform: null, dimensions: null, title: fullName, full: fullName };
}

export function StudioCreativeCard({ creative }: StudioCreativeCardProps) {
  const router = useRouter();
  const [imageSrc, setImageSrc] = useState<string | null>(
    () => previewCache.get(creative.assetId) ?? null,
  );
  const [loadingImage, setLoadingImage] = useState(!previewCache.has(creative.assetId));
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
        const blob = await fetchProjectImage(creative.projectId, creative.assetId);
        downloadUrl = URL.createObjectURL(blob);
      }
      const anchor = document.createElement("a");
      const safeTitle = title ?? "creative";
      const cleanName = safeTitle.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase();
      anchor.download = `${cleanName || "creative"}.png`;
      anchor.click();
    } catch {
      window.open(projectImageUrl(creative.projectId, creative.assetId), "_blank");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpen();
        }
      }}
      aria-label={`Open creative: ${title}`}
      className="group relative aspect-square w-full cursor-pointer overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-zinc-400 hover:shadow-xl dark:border-white/10 dark:bg-zinc-900/60 dark:hover:border-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {/* Background canvas grid pattern */}
      <div
        className="absolute inset-0 opacity-40 dark:opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--studio-dot-color, rgba(120, 120, 120, 0.25)) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
        aria-hidden="true"
      />

      {/* Creative Preview Inside */}
      <div className="absolute inset-0 flex items-center justify-center p-3">
        {loadingImage && (
          <div className="flex h-full w-full items-center justify-center rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        )}

        {imageError ? (
          <div className="flex flex-col items-center justify-center gap-2 text-zinc-400">
            <ImageIcon className="h-8 w-8" />
            <span className="text-xs">Preview unavailable</span>
          </div>
        ) : (
          imageSrc && (
            <img
              src={imageSrc}
              alt={creative.name}
              crossOrigin="use-credentials"
              onError={() => setImageError(true)}
              className={`h-full w-full rounded-xl object-contain shadow-inner transition-transform duration-500 ease-out group-hover:scale-[1.03] ${
                loadingImage ? "opacity-0" : "opacity-100"
              }`}
            />
          )
        )}
      </div>

      {/* Top badges (Platform / Format / Version) */}
      <div className="absolute left-3 right-3 top-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center gap-1.5">
          {dimensions && (
            <span className="rounded-full border border-black/10 bg-black/50 px-2 py-0.5 text-[11px] font-medium tracking-tight text-white backdrop-blur-md dark:border-white/10">
              {dimensions.replace(" px", "")}
            </span>
          )}
          {platform && platform !== "Any platform" && (
            <span className="rounded-full border border-black/10 bg-black/50 px-2 py-0.5 text-[11px] font-medium tracking-tight text-white backdrop-blur-md dark:border-white/10">
              {platform}
            </span>
          )}
        </div>

        {creative.version > 1 && (
          <span className="rounded-full border border-white/10 bg-primary/90 px-2 py-0.5 text-[11px] font-semibold text-primary-foreground shadow-sm">
            v{creative.version}
          </span>
        )}
      </div>

      {/* Bottom overlay with creative name and quick actions */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3.5 pt-12 text-white transition-opacity duration-200">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p
              title={creative.name}
              className="line-clamp-2 text-sm font-semibold tracking-tight text-white drop-shadow-sm group-hover:text-primary-foreground"
            >
              {title}
            </p>
            {creative.projectTitle && (
              <p className="mt-0.5 truncate text-[11px] text-zinc-300">
                {creative.projectTitle}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0 pt-0.5">
            <button
              type="button"
              onClick={handleDownload}
              title="Download image"
              aria-label="Download image"
              className="rounded-lg bg-white/15 p-1.5 text-white backdrop-blur-md transition-colors hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {downloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
            </button>
            <div
              title="Open in Studio"
              aria-hidden="true"
              className="rounded-lg bg-white/15 p-1.5 text-white backdrop-blur-md transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
