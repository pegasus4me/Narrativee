"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Plus, Upload, X } from "lucide-react";
import { AssetPreview } from "./AssetPreview";
import { ImageFilePreview } from "./ImageFilePreview";
import type { BrandBrainController } from "./useBrandBrain";
import { WebsiteSource } from "./WebsiteSource";

export function BrandBrainImages({
  brain,
  brandId,
  purpose,
  onPendingChange,
}: {
  brain: BrandBrainController;
  brandId: string;
  purpose: "brand" | "inspiration";
  onPendingChange?: (pending: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<"identity" | "imagery">("identity");
  const [caption, setCaption] = useState("");
  const kind = purpose === "brand" ? "rule" : "inspiration";
  const assets =
    brain.data?.assets.filter(
      (asset) => asset.kind === kind && !asset.productId,
    ) ?? [];

  useEffect(() => {
    onPendingChange?.(Boolean(file));
    return () => onPendingChange?.(false);
  }, [file, onPendingChange]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file || !caption.trim()) return;
    if (
      await brain.addImage(
        file,
        kind,
        purpose === "inspiration" ? "imagery" : category,
        caption.trim(),
      )
    ) {
      setFile(null);
      setCaption("");
      setEditing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div
      className="space-y-5"
      onPaste={(event) => {
        if (brain.busy) return;
        const image = Array.from(event.clipboardData.files).find((item) =>
          item.type.startsWith("image/"),
        );
        if (!image) return;
        event.preventDefault();
        setFile(image);
        setEditing(true);
      }}
    >
      {assets.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="group relative overflow-hidden rounded-xl border border-zinc-200 dark:border-white/10"
            >
              <AssetPreview
                brandId={brandId}
                assetId={asset.id}
                alt={asset.caption || asset.filename}
                className={`h-36 w-full object-contain p-4 ${asset.category === "identity" ? "bg-[repeating-conic-gradient(#d4d4d8_0%_25%,#a1a1aa_0%_50%)] bg-size-[16px_16px]" : "bg-zinc-50 dark:bg-white/[0.03]"}`}
              />
              <button
                type="button"
                disabled={brain.busy}
                aria-label={`Archive ${asset.filename}`}
                onClick={() => void brain.archiveImage(asset.id)}
                className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-white/90 text-zinc-600 opacity-0 group-hover:opacity-100 focus:opacity-100"
              >
                <X size={14} />
              </button>
              <div className="border-t border-zinc-200 p-3 dark:border-white/10">
                <p className="truncate text-sm" title={asset.filename}>
                  {asset.filename}
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">
                  {asset.caption}
                </p>
                <WebsiteSource
                  source={asset.source}
                  sourceUrl={asset.sourceUrl}
                  busy={brain.busy}
                  onApprove={
                    kind === "rule"
                      ? () => void brain.approveImage(asset.id)
                      : undefined
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {editing || !assets.length ? (
        <form onSubmit={submit} className="space-y-4">
          <div
            tabIndex={0}
            role="group"
            aria-label="Paste or drop an image"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              setFile(event.dataTransfer.files[0] ?? null);
            }}
            className="flex flex-col items-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 px-5 py-9 text-center outline-none transition-colors hover:bg-zinc-50 focus:ring-2 focus:ring-zinc-400 focus-within:ring-2 focus-within:ring-zinc-400 dark:border-zinc-700 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]"
          >
            {file ? (
              <ImageFilePreview
                file={file}
                className="mb-4 h-40 w-full rounded-lg bg-white object-contain"
              />
            ) : (
              <Upload
                size={22}
                strokeWidth={1.5}
                className="mb-3 text-zinc-500"
              />
            )}
            <span className="text-sm font-medium">
              {file
                ? file.name
                : purpose === "brand"
                  ? "Drop or paste a logo or image here"
                  : "Drop or paste an inspiration image here"}
            </span>
            <span className="mt-1 text-xs text-zinc-500">
              {file
                ? "Paste another image to replace it"
                : "Click here, then press ⌘V or Ctrl+V to paste"}
            </span>
            <label className="mt-3 cursor-pointer text-sm underline underline-offset-4">
              {file ? "Choose a different file" : "Browse files"}
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                aria-label="Choose image"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>
            <span className="mt-2 text-xs text-zinc-500">
              PNG, JPEG, WebP · up to 8 MB
            </span>
          </div>
          {file && (
            <div className="space-y-3">
              {purpose === "brand" && (
                <select
                  aria-label="Asset type"
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as "identity" | "imagery")
                  }
                  className="h-9 rounded-lg border border-zinc-200 bg-transparent px-3 text-sm dark:border-zinc-700"
                >
                  <option value="identity">Logo / brand asset</option>
                  <option value="imagery">Photography / image</option>
                </select>
              )}
              <input
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                maxLength={1000}
                placeholder="e.g. Use this logo on our social posts."
                aria-label="Image guidance"
                className="h-10 w-full rounded-lg border border-zinc-200 bg-transparent px-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700"
              />
              <div className="flex items-center gap-3">
                <button
                  disabled={
                    brain.busy ||
                    !caption.trim() ||
                    file.size > 8 * 1024 * 1024 ||
                    !["image/png", "image/jpeg", "image/webp"].includes(
                      file.type,
                    )
                  }
                  className="h-9 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {brain.busy ? "Uploading…" : "Save image"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setEditing(false);
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                  className="text-sm text-zinc-500"
                >
                  Cancel
                </button>
              </div>
              {(file.size > 8 * 1024 * 1024 ||
                !["image/png", "image/jpeg", "image/webp"].includes(
                  file.type,
                )) && (
                <p role="alert" className="text-xs text-red-500">
                  Choose a PNG, JPEG, or WebP image smaller than 8 MB.
                </p>
              )}
              <p className="text-xs text-zinc-500">
                Describe how your agents should use this image, then save it to
                your brand.
              </p>
            </div>
          )}
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex h-9 items-center gap-2 rounded-lg border border-zinc-200 px-3 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-white/5"
        >
          <Plus size={15} />
          Add image
        </button>
      )}
    </div>
  );
}
