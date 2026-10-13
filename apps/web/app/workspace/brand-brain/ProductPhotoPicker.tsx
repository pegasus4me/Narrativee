"use client";

import { Upload, X } from "lucide-react";
import { ImageFilePreview } from "./ImageFilePreview";

export function ProductPhotoPicker({
  files,
  onChange,
  disabled,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  disabled: boolean;
}) {
  function add(incoming: FileList | File[]) {
    if (disabled) return;
    onChange([...files, ...Array.from(incoming)]);
  }
  return (
    <div
      role="group"
      aria-label="Product photos"
      tabIndex={0}
      onPaste={(event) => {
        const images = Array.from(event.clipboardData.files).filter((file) =>
          file.type.startsWith("image/"),
        );
        if (!images.length || disabled) return;
        event.preventDefault();
        add(images);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        add(event.dataTransfer.files);
      }}
      className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-5 outline-none focus-within:ring-2 focus-within:ring-neutral-300"
    >
      <div className="flex items-center gap-3">
        <Upload size={20} className="shrink-0 text-neutral-500" />
        <div>
          <p className="text-sm font-medium">Drop or paste product photos</p>
          <p className="mt-1 text-xs text-neutral-500">
            Main view, other angles, or packaging details. PNG, JPEG, WebP · up
            to 8 MB each.
          </p>
          <label
            className={`mt-2 inline-block text-sm underline underline-offset-4 ${disabled ? "opacity-50" : "cursor-pointer"}`}
          >
            Browse files
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              disabled={disabled}
              aria-label="Choose product photos"
              className="sr-only"
              onChange={(event) => {
                if (event.target.files) add(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
        </div>
      </div>
      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 text-sm"
            >
              <ImageFilePreview
                file={file}
                className="h-20 w-20 shrink-0 rounded-lg border border-neutral-200 bg-white object-contain p-1"
              />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <button
                type="button"
                disabled={disabled}
                aria-label={`Remove pending photo ${file.name}`}
                onClick={() =>
                  onChange(files.filter((_, position) => position !== index))
                }
                className="rounded p-1 text-neutral-500 hover:bg-neutral-200 disabled:opacity-50"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
