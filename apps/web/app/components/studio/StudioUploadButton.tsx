"use client";

import { useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import { Button } from "@/components/motion/button";
import { Loader } from "@/components/motion/loader";
import { uploadProjectImage } from "@/lib/api/studio-canvas";
import { dispatchStudioCanvasEvent } from "@/lib/api/studio";

export default function StudioUploadButton({
  projectId,
  disabled,
  onBusyChange,
  onUploaded,
  label,
}: {
  projectId: string;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
  onUploaded?: (image: {
    id: string;
    width: number;
    height: number;
    name: string;
  }) => void;
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState(false);

  async function upload(file: File) {
    if (busy || disabled) return;
    setBusy(true);
    onBusyChange(true);
    setError(false);
    setStatus("Uploading image…");
    try {
      const image = await uploadProjectImage(projectId, file);
      setStatus("Adding to canvas…");
      await dispatchStudioCanvasEvent(projectId, {
        type: "image_upload",
        image: { ...image, name: file.name },
      });
      onUploaded?.({ ...image, name: file.name });
      setStatus(
        `${file.name} added. The designer can use it in this project. Brand Brain is unchanged.`,
      );
    } catch (cause) {
      setError(true);
      setStatus(
        cause instanceof Error
          ? cause.message
          : "Image upload failed. Please try again.",
      );
    } finally {
      setBusy(false);
      onBusyChange(false);
    }
  }

  return (
    <span className="relative flex items-center">
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        aria-label="Upload a Studio image"
        className="sr-only"
        tabIndex={-1}
        disabled={disabled || busy}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) void upload(file);
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={label ?? "Upload image"}
        title="Upload PNG, JPEG or WebP · up to 8 MB"
        disabled={disabled || busy}
        onClick={() => input.current?.click()}
        className={
          label
            ? "h-9 w-auto gap-1.5 rounded-full px-3 text-xs"
            : "size-8 rounded-xl"
        }
      >
        {busy ? (
          <Loader variant="dither" size={16} label="Uploading image" />
        ) : (
          <Paperclip size={16} />
        )}
        {label}
      </Button>
      {status && (
        <span
          role={error ? "alert" : "status"}
          className={`absolute top-12 left-0 z-20 w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-background p-2 pr-7 text-xs shadow-lg ${error ? "text-destructive" : "text-muted-foreground"}`}
        >
          {status}
          {!busy && (
            <button
              type="button"
              aria-label="Dismiss upload status"
              onClick={() => setStatus("")}
              className="absolute right-1 top-1 rounded p-1 hover:bg-muted"
            >
              <X size={12} />
            </button>
          )}
        </span>
      )}
    </span>
  );
}
