"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Maximize, Minus, Plus } from "lucide-react";
import icon from "public/icon.png";
import type { useStudioCanvas } from "./useStudioCanvas";

type Editor = ReturnType<typeof useStudioCanvas>;

export function CanvasControls({ editor }: { editor: Editor }) {
  const selected = editor.selection;
  const color = /^#[0-9a-fA-F]{6}$/.test(selected?.fill ?? "")
    ? selected!.fill
    : "#18252A";

  return (
    <>
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1 rounded-lg bg-background/95 p-1 text-foreground">
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => editor.zoomBy(1 / 1.2)}
          className="rounded p-1.5 hover:bg-border"
        >
          <Minus size={16} />
        </button>
        <span className="min-w-12 text-center text-xs tabular-nums">
          {Math.round(editor.zoom * 100)}%
        </span>
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => editor.zoomBy(1.2)}
          className="rounded p-1.5 hover:bg-border"
        >
          <Plus size={16} />
        </button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button
          type="button"
          aria-label="Fit all creatives"
          title="Fit all creatives"
          onClick={editor.fitAll}
          className="rounded p-1.5 hover:bg-border"
        >
          <Maximize size={16} />
        </button>
      </div>

      <div className="absolute bottom-4 right-4 z-10 flex max-w-sm flex-col items-end gap-2 text-xs">
        {editor.canvasError && (
          <div
            role="alert"
            className="rounded-lg border border-red-400/20 bg-background/95 p-3 text-destructive"
          >
            {editor.canvasError}
            {editor.saveStatus === "Not saved" && (
              <button
                type="button"
                onClick={editor.retrySave}
                className="ml-2 underline"
              >
                Retry saving
              </button>
            )}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-end gap-2">
          {selected?.canExport && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-background/95 px-3 py-2 text-muted-foreground shadow-md backdrop-blur">
              <button
                type="button"
                disabled={editor.exporting}
                onClick={() => void editor.exportSelected()}
                className="text-foreground hover:underline disabled:opacity-50"
              >
                {editor.exporting ? "Exporting…" : "Export PNG"}
              </button>
            </div>
          )}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-1.5 rounded-lg  px-2.5 py-2 text-xs text-muted-foreground transition-all duration-150 hover:border-border hover:text-foreground"
            aria-label="Powered by Narrativee"
          >
            <span className="text-xs text-muted-foreground transition-colors group-hover:text-muted-foreground">
              Powered by
            </span>
            <span className="flex items-center gap-1.5 font-medium text-foreground transition-colors group-hover:text-foreground">
              <Image
                src={icon}
                alt=""
                width={14}
                height={14}
                className="size-3.5 object-contain transition-transform duration-200 group-hover:scale-110"
                priority
              />
              Narrativee
            </span>
          </Link>
        </div>
      </div>

      {selected && (
        <div className="absolute right-4 top-4 z-10 w-56 space-y-3 rounded-lg border border-border bg-background/95 p-3 text-foreground shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-medium">
              {selected.directionName ?? "Selected object"}
            </span>
            {selected.directionId && (
              <button
                type="button"
                aria-label={
                  editor.isFavorite ? "Unsave direction" : "Save direction"
                }
                title={editor.isFavorite ? "Saved" : "Keep this direction"}
                onClick={editor.toggleFavorite}
                className={
                  editor.isFavorite ? "text-rose-400" : "text-muted-foreground"
                }
              >
                <Heart
                  size={16}
                  fill={editor.isFavorite ? "currentColor" : "none"}
                />
              </button>
            )}
          </div>
          <label className="flex items-center justify-between text-xs text-muted-foreground">
            Color
            <input
              aria-label="Selected object color"
              type="color"
              value={color}
              onChange={(event) =>
                editor.updateSelectedColor(event.target.value)
              }
              className="h-7 w-9 cursor-pointer border-0 bg-transparent"
            />
          </label>
          {selected.type === "text" && (
            <>
              <label className="block text-xs text-muted-foreground">
                Text
                <input
                  type="text"
                  value={selected.text}
                  onChange={(event) =>
                    editor.updateSelectedText(event.target.value)
                  }
                  className="mt-1 w-full rounded border border-border bg-muted px-2 py-1.5 text-foreground"
                />
              </label>
              <label className="block text-xs text-muted-foreground">
                Size
                <input
                  type="number"
                  min={12}
                  max={200}
                  value={Math.round(selected.fontSize)}
                  onChange={(event) =>
                    editor.updateSelectedFontSize(Number(event.target.value))
                  }
                  className="mt-1 w-full rounded border border-border bg-muted px-2 py-1.5 text-foreground"
                />
              </label>
            </>
          )}
          <p className="text-xs text-muted-foreground">
            Drag to move · handles to resize · Delete to remove
          </p>
        </div>
      )}
    </>
  );
}
