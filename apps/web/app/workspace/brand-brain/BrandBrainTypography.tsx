"use client";

import { useState } from "react";
import { Plus, Type } from "lucide-react";
import type { BrainItem } from "@/lib/api/brand-brain";
import { GoogleFontSelect } from "./GoogleFontSelect";
import { useGoogleFontPreview } from "./useGoogleFontPreview";
import type { BrandBrainController } from "./useBrandBrain";
import { WebsiteSource } from "./WebsiteSource";

export function BrandBrainTypography({
  brain,
}: {
  brain: BrandBrainController;
}) {
  const [browsing, setBrowsing] = useState(false);
  const fonts =
    brain.data?.items.filter(
      (item) => item.kind === "rule" && item.category === "typography",
    ) ?? [];

  async function selectFont(family: string, weight: string, role: string) {
    if (
      await brain.addItem(
        "rule",
        "typography",
        `${role}: ${family} (weight ${weight})`,
      )
    )
      setBrowsing(false);
  }

  return (
    <div className="space-y-6">
      {fonts.length > 0 && (
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {fonts.map((item) => (
            <SavedFont
              key={item.id}
              item={item}
              busy={brain.busy}
              archive={() => void brain.archiveItem(item.id)}
              approve={() => void brain.approveItem(item.id)}
            />
          ))}
        </div>
      )}
      {browsing || !fonts.length ? (
        <GoogleFontSelect
          busy={brain.busy}
          onSelect={selectFont}
          onCancel={fonts.length ? () => setBrowsing(false) : undefined}
        />
      ) : (
        <button
          type="button"
          onClick={() => setBrowsing(true)}
          className="flex h-9 items-center gap-2 rounded-lg border border-zinc-200 px-3 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-white/5"
        >
          <Plus size={15} />
          Choose another font
        </button>
      )}
    </div>
  );
}

function SavedFont({
  item,
  busy,
  archive,
  approve,
}: {
  item: BrainItem;
  busy: boolean;
  archive: () => void;
  approve: () => void;
}) {
  const match = item.content.match(/^([^:]+): (.+?)(?: \(weight (\d{3})\))?$/);
  const role = match?.[1];
  const family = match?.[2] ?? "";
  const weight = match?.[3] ?? "400";
  useGoogleFontPreview(family, weight);

  return (
    <div className="flex items-start gap-4 py-5 first:pt-0">
      <Type size={18} className="mt-1 shrink-0 text-zinc-500" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-zinc-500">
          {role ?? "Typography guideline"}
          {family && ` · ${family}${match?.[3] ? ` · ${weight}` : ""}`}
        </p>
        <p
          className="mt-2 text-[28px] leading-tight"
          style={
            family
              ? {
                  fontFamily: `${JSON.stringify(family)}, sans-serif`,
                  fontWeight: Number(weight),
                }
              : undefined
          }
        >
          {family ? "Make every word count." : item.content}
        </p>
        <WebsiteSource
          source={item.source}
          sourceUrl={item.sourceUrl}
          busy={busy}
          onApprove={approve}
        />
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={archive}
        className="text-xs text-zinc-500 hover:text-red-500"
      >
        Archive
      </button>
    </div>
  );
}
