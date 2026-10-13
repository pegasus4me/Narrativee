"use client";

import { useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import type { BrandBrainController } from "./useBrandBrain";
import { WebsiteSource } from "./WebsiteSource";

const hexPattern = /^#[0-9a-fA-F]{6}$/;

export function BrandBrainPalette({ brain }: { brain: BrandBrainController }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("Primary");
  const [hex, setHex] = useState("#18181B");
  const colors =
    brain.data?.items.filter(
      (item) => item.kind === "rule" && item.category === "color",
    ) ?? [];
  const pickerColor = hexPattern.test(hex) ? hex : "#18181B";

  async function submit(event: FormEvent) {
    event.preventDefault();
    const normalized = hex.trim().toUpperCase();
    if (!name.trim() || !hexPattern.test(normalized)) return;
    if (await brain.addItem("rule", "color", `${name.trim()}: ${normalized}`)) {
      setEditing(false);
      setName("Accent");
    }
  }

  return (
    <div className="space-y-6">
      {colors.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {colors.map((item) => {
            const value = item.content.match(/#[0-9a-fA-F]{6}$/)?.[0];
            const label = item.content.replace(/: #[0-9a-fA-F]{6}$/, "");
            return (
              <div
                key={item.id}
                className="group overflow-hidden rounded-xl border border-zinc-200 dark:border-white/10"
              >
                <div
                  className="relative h-28 border-b border-black/5"
                  style={{ backgroundColor: value ?? "transparent" }}
                >
                  <button
                    type="button"
                    aria-label={`Archive ${label}`}
                    disabled={brain.busy}
                    onClick={() => void brain.archiveItem(item.id)}
                    className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-white/90 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium" title={label}>
                    {label}
                  </p>
                  {value && (
                    <p className="mt-1 font-mono text-xs uppercase text-zinc-500">
                      {value}
                    </p>
                  )}
                  <WebsiteSource
                    source={item.source}
                    sourceUrl={item.sourceUrl}
                    busy={brain.busy}
                    onApprove={() => void brain.approveItem(item.id)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl bg-zinc-50 px-6 py-10 text-center dark:bg-white/[0.025]">
          <div
            aria-hidden="true"
            className="mb-5 flex justify-center -space-x-2"
          >
            <span className="size-12 rounded-xl bg-[#18181B] rotate-[-8deg]" />
            <span className="size-12 rounded-xl bg-[#6B7D72]" />
            <span className="size-12 rounded-xl bg-[#E8E1D5] rotate-[8deg]" />
          </div>
          <p className="text-sm font-medium">Build your brand palette</p>
          <p className="mt-1 text-sm text-zinc-500">
            Pick a color and give it a role in your identity.
          </p>
        </div>
      )}
      {editing || !colors.length ? (
        <form
          onSubmit={submit}
          className="rounded-xl border border-zinc-200 p-5 dark:border-white/10"
        >
          <div className="flex flex-wrap items-start gap-5">
            <label
              className="relative block size-24 cursor-pointer overflow-hidden rounded-xl border border-black/10 focus-within:ring-2 focus-within:ring-zinc-400"
              style={{ backgroundColor: pickerColor }}
            >
              <input
                type="color"
                aria-label="Pick a brand color"
                value={pickerColor}
                onChange={(event) => setHex(event.target.value.toUpperCase())}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <span className="absolute inset-x-2 bottom-2 rounded bg-white/90 py-1 text-center text-[10px] font-medium text-zinc-700 pointer-events-none">
                Pick color
              </span>
            </label>
            <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs text-zinc-500">
                Color role
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={80}
                  placeholder="Primary, accent, background…"
                  className="block h-10 w-full rounded-lg border border-zinc-200 bg-transparent px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:text-white"
                />
              </label>
              <label className="space-y-1.5 text-xs text-zinc-500">
                Hex value
                <input
                  value={hex}
                  onChange={(event) => setHex(event.target.value)}
                  maxLength={7}
                  aria-invalid={!hexPattern.test(hex)}
                  className="block h-10 w-full rounded-lg border border-zinc-200 bg-transparent px-3 font-mono text-sm uppercase text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:text-white"
                />
              </label>
              <div className="flex items-center gap-3 sm:col-span-2">
                <button
                  disabled={
                    brain.busy || !name.trim() || !hexPattern.test(hex.trim())
                  }
                  className="h-9 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {brain.busy ? "Saving…" : "Save color"}
                </button>
                {colors.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="text-sm text-zinc-500"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex h-9 items-center gap-2 rounded-lg border border-zinc-200 px-3 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-white/5"
        >
          <Plus size={15} />
          Add color
        </button>
      )}
    </div>
  );
}
