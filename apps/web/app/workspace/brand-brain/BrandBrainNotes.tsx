"use client";

import { useState, type FormEvent } from "react";
import type { BrainCategory, BrainKind } from "@/lib/api/brand-brain";
import type { BrandBrainController } from "./useBrandBrain";
import { WebsiteSource } from "./WebsiteSource";

export function BrandBrainNotes({
  brain,
  kind,
  categories,
  placeholder,
  buttonLabel,
}: {
  brain: BrandBrainController;
  kind: BrainKind;
  categories: [BrainCategory, ...BrainCategory[]];
  placeholder: string;
  buttonLabel: string;
}) {
  const [category, setCategory] = useState<BrainCategory>(categories[0]);
  const [content, setContent] = useState("");
  const items =
    brain.data?.items.filter(
      (item) => item.kind === kind && categories.includes(item.category),
    ) ?? [];

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;
    if (await brain.addItem(kind, category, content.trim())) setContent("");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-3">
        {categories.length > 1 && (
          <label className="block space-y-1.5 text-xs font-medium text-zinc-500">
            Category
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as BrainCategory)
              }
              className="block h-9 w-full max-w-52 rounded-md border border-zinc-200 bg-white px-3 text-sm capitalize text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-[#18181B] dark:text-zinc-100"
            >
              {categories.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>
        )}
        <textarea
          aria-label={buttonLabel}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={4000}
          placeholder={placeholder}
          className="min-h-24 w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm leading-6 outline-none placeholder:text-zinc-400 focus:border-zinc-500 dark:border-zinc-700 dark:bg-[#18181B] dark:focus:border-zinc-400"
        />
        <button
          disabled={brain.busy || !content.trim()}
          className="h-9 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {buttonLabel}
        </button>
      </form>
      {items.length > 0 && (
        <div className="border-t border-zinc-200 dark:border-zinc-800">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-4 border-b border-zinc-200 py-3 dark:border-zinc-800"
            >
              <div className="min-w-0">
                {categories.length > 1 && (
                  <p className="mb-1 text-xs capitalize text-zinc-500">
                    {item.category}
                  </p>
                )}
                <p className="whitespace-pre-wrap text-sm leading-6">
                  {item.content}
                </p>
                <WebsiteSource
                  source={item.source}
                  sourceUrl={item.sourceUrl}
                  busy={brain.busy}
                  onApprove={
                    kind === "rule" && !item.content.startsWith("Hypothesis")
                      ? () => void brain.approveItem(item.id)
                      : undefined
                  }
                />
              </div>
              <button
                type="button"
                onClick={() => void brain.archiveItem(item.id)}
                className="shrink-0 text-xs text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
              >
                Archive
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
