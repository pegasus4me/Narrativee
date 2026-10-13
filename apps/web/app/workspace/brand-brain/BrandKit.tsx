"use client";

import type { ReactNode } from "react";
import {
  ChevronDown,
  Image,
  Palette,
  Type,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { BrandBrainImages } from "./BrandBrainImages";
import { BrandBrainPalette } from "./BrandBrainPalette";
import { BrandBrainTypography } from "./BrandBrainTypography";
import { BrandBrainNotes } from "./BrandBrainNotes";
import type { BrandBrainController } from "./useBrandBrain";

export function BrandKit({
  brain,
  brandId,
  mode = "all",
  onPendingImageChange,
}: {
  brain: BrandBrainController;
  brandId: string;
  mode?: "all" | "review" | "materials";
  onPendingImageChange?: (pending: boolean) => void;
}) {
  const rules = brain.data?.items.filter((item) => item.kind === "rule") ?? [];
  const colors = rules.filter((item) => item.category === "color");
  const fonts = rules.filter((item) => item.category === "typography");
  const directives = rules.filter(
    (item) => !["color", "typography"].includes(item.category),
  );
  const assets =
    brain.data?.assets.filter(
      (asset) => asset.kind === "rule" && !asset.productId,
    ) ?? [];

  return (
    <div className="divide-y divide-zinc-200 dark:divide-white/[0.08]">
      {mode !== "materials" && (
        <p className="pb-5 text-xs leading-5 text-zinc-500">
          Website findings are a starting point, not approved identity. Confirm
          useful rules, or archive and replace anything incorrect. Your choices
          take priority.
        </p>
      )}
      {mode !== "review" && (
        <KitSection
          title="Logos & images"
          description="Your brand assets, website references, and photography."
          icon={Image}
          count={assets.length}
          defaultOpen
        >
          <BrandBrainImages
            brain={brain}
            brandId={brandId}
            purpose="brand"
            onPendingChange={onPendingImageChange}
          />
        </KitSection>
      )}
      {mode !== "materials" && (
        <>
          <KitSection
            title="Color palette"
            description="Your primary, accent, and background colors."
            icon={Palette}
            count={colors.length}
            defaultOpen={mode === "review"}
            preview={
              colors.length > 0 && (
                <div className="flex gap-1.5">
                  {colors.slice(0, 5).map((item) => (
                    <span
                      key={item.id}
                      className="size-5 rounded border border-black/10 dark:border-white/10"
                      style={{
                        backgroundColor:
                          item.content.match(/#[0-9a-fA-F]{6}$/)?.[0] ??
                          "transparent",
                      }}
                    />
                  ))}
                </div>
              )
            }
          >
            <BrandBrainPalette brain={brain} />
          </KitSection>
          <KitSection
            title="Typography"
            description="Google Fonts for headings, body text, and accents."
            icon={Type}
            count={fonts.length}
          >
            <BrandBrainTypography brain={brain} />
          </KitSection>
          <KitSection
            title="Brand context & directives"
            description="Website understanding, voice, and the rules you want to keep consistent."
            icon={SlidersHorizontal}
            count={directives.length}
          >
            <BrandBrainNotes
              brain={brain}
              kind="rule"
              categories={["identity", "imagery", "voice", "layout", "other"]}
              placeholder="e.g. Keep compositions spacious and the tone warm."
              buttonLabel="Save directive"
            />
          </KitSection>
        </>
      )}
    </div>
  );
}

function KitSection({
  title,
  description,
  icon: Icon,
  count,
  preview,
  defaultOpen,
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  count: number;
  preview?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details name="brand-kit" open={defaultOpen} className="group/section">
      <summary className="flex cursor-pointer list-none items-center gap-3 py-5 [&::-webkit-details-marker]:hidden">
        <Icon size={18} strokeWidth={1.6} className="shrink-0 text-zinc-500" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-medium">{title}</h2>
          <p className="mt-1 text-xs text-zinc-500">{description}</p>
        </div>
        {preview}
        {count > 0 && (
          <span className="text-xs tabular-nums text-zinc-500">{count}</span>
        )}
        <ChevronDown
          size={16}
          className="shrink-0 text-zinc-500 transition-transform group-open/section:rotate-180"
        />
      </summary>
      <div className="pb-6 pt-1 sm:pl-8">{children}</div>
    </details>
  );
}
