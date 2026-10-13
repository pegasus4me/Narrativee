"use client";

import { useState } from "react";
import { Globe, Plus, SlidersHorizontal, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { socialPlatformLogos } from "@/lib/social-platform-logos";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/motion/select";
import {
  campaignFormats,
  campaignPlatforms,
  campaignOutputLabel,
  campaignOutputSelectionError,
  maxCampaignOutputs,
  type CampaignOutput,
  type CampaignPlatform,
  type CampaignFormat,
} from "@/lib/studio-outputs";

function PlatformIcon({ platform }: { platform: CampaignPlatform }) {
  if (platform === "general")
    return <Globe size={16} aria-hidden="true" className="shrink-0" />;
  return (
    <img
      src={socialPlatformLogos[platform]}
      width={16}
      height={16}
      alt=""
      aria-hidden="true"
      className="size-4 shrink-0"
    />
  );
}

export default function StudioOutputSelect({
  outputs,
  onChange,
  disabled,
}: {
  outputs: CampaignOutput[];
  onChange: (outputs: CampaignOutput[]) => void;
  disabled: boolean;
}) {
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState<"platform" | "format" | null>(null);
  const index = Math.min(active, outputs.length - 1);
  const output = outputs[index]!;
  const error = campaignOutputSelectionError(outputs);
  const formats: readonly (keyof typeof campaignFormats)[] =
    campaignPlatforms[output.platform].formats;
  const update = (next: CampaignOutput) =>
    onChange(
      outputs.map((item, position) => (position === index ? next : item)),
    );
  const remove = (position: number) => {
    onChange(outputs.filter((_, i) => i !== position));
    setActive(Math.max(0, index - (position <= index ? 1 : 0)));
  };
  const add = () => {
    const platforms = [
      output.platform,
      ...(Object.keys(campaignPlatforms) as CampaignPlatform[]),
    ];
    const candidates = platforms.flatMap((platform) =>
      campaignPlatforms[platform].formats.map((formatId) => ({
        platform,
        formatId,
        width: campaignFormats[formatId].width,
        height: campaignFormats[formatId].height,
      })),
    );
    const next = candidates.find(
      (candidate) =>
        !outputs.some(
          (item) =>
            item.platform === candidate.platform &&
            item.width === candidate.width &&
            item.height === candidate.height,
        ),
    );
    if (!next) return;
    onChange([...outputs, next]);
    setActive(outputs.length);
  };
  return (
    <Dialog.Root
      open={expanded}
      onOpenChange={(value) => {
        setExpanded(value);
        if (!value) setOpen(null);
      }}
    >
      <Dialog.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="flex h-8 items-center gap-1 rounded-xl px-2 text-xs text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-foreground/20 disabled:opacity-40"
        >
          <PlatformIcon platform={output.platform} />
          Outputs · {outputs.length}
          <SlidersHorizontal size={14} aria-hidden="true" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[1100] bg-black/25 backdrop-blur-sm" />
        <Dialog.Content
          aria-modal="true"
          onEscapeKeyDown={(event) => {
            if (open) {
              event.preventDefault();
              setOpen(null);
            }
          }}
          className="studio-theme fixed left-1/2 top-1/2 z-[1101] w-[calc(100%-32px)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-neutral-200 bg-white p-6 text-foreground shadow-xl outline-none sm:p-8"
        >
          <header className="mb-5 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-medium">
                Outputs
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm leading-6 text-muted-foreground">
                Choose the platforms and sizes for your creatives.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close outputs"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </Dialog.Close>
          </header>
          <div role="group" aria-label="Campaign outputs">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-medium">
                Outputs · {outputs.length}
              </span>
              <button
                type="button"
                onClick={add}
                disabled={disabled || outputs.length >= maxCampaignOutputs}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                <Plus size={12} aria-hidden="true" /> Add output
              </button>
            </div>
            <div className="mb-2 flex max-h-20 flex-wrap gap-1.5 overflow-y-auto">
              {outputs.map((item, position) => (
                <div
                  key={position}
                  className={`flex items-center rounded-lg border text-xs ${position === index ? "border-foreground/30 bg-muted" : "border-border"}`}
                >
                  <button
                    type="button"
                    aria-pressed={position === index}
                    disabled={disabled}
                    onClick={() => setActive(position)}
                    className="flex items-center gap-1.5 px-2 py-1.5 disabled:opacity-40"
                  >
                    <PlatformIcon platform={item.platform} />
                    {campaignOutputLabel(item)}
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove output ${position + 1}`}
                    disabled={disabled || outputs.length === 1}
                    onClick={() => remove(position)}
                    className="mr-1 rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <X size={12} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select
                className={open === "platform" ? "z-30" : "z-0"}
                value={output.platform}
                disabled={disabled}
                open={open === "platform"}
                onOpenChange={(value) => setOpen(value ? "platform" : null)}
                onValueChange={(value) => {
                  const platform = value as CampaignPlatform;
                  const supported: readonly string[] =
                    campaignPlatforms[platform].formats;
                  const formatId =
                    output.formatId === "custom" ||
                    supported.includes(output.formatId)
                      ? output.formatId
                      : campaignPlatforms[platform].formats[0];
                  update(
                    formatId === "custom"
                      ? { ...output, platform }
                      : {
                          platform,
                          formatId,
                          width: campaignFormats[formatId].width,
                          height: campaignFormats[formatId].height,
                        },
                  );
                }}
              >
                <SelectTrigger className="w-full justify-between text-xs">
                  <span className="sr-only">Social platform: </span>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <PlatformIcon platform={output.platform} />
                    <span className="truncate">
                      {campaignPlatforms[output.platform].label}
                    </span>
                  </span>
                </SelectTrigger>
                <SelectContent className="max-h-52 overflow-y-auto">
                  {Object.entries(campaignPlatforms).map(
                    ([value, platform]) => (
                      <SelectItem key={value} value={value} disabled={disabled}>
                        <span className="flex min-w-0 items-center gap-1.5">
                          <PlatformIcon platform={value as CampaignPlatform} />
                          <span className="truncate">{platform.label}</span>
                        </span>
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <Select
                className={open === "format" ? "z-30" : "z-0"}
                value={output.formatId}
                disabled={disabled}
                open={open === "format"}
                onOpenChange={(value) => setOpen(value ? "format" : null)}
                onValueChange={(value) => {
                  const formatId = value as CampaignFormat;
                  update(
                    formatId === "custom"
                      ? { ...output, formatId }
                      : {
                          platform: output.platform,
                          formatId,
                          width: campaignFormats[formatId].width,
                          height: campaignFormats[formatId].height,
                        },
                  );
                }}
              >
                <SelectTrigger className="w-full justify-between text-xs">
                  <span className="sr-only">Output size: </span>
                  <span className="min-w-0 truncate">
                    {output.formatId === "custom"
                      ? "Custom size"
                      : campaignFormats[output.formatId].label}
                  </span>
                </SelectTrigger>
                <SelectContent className="max-h-52 overflow-y-auto">
                  {formats.map((value) => (
                    <SelectItem key={value} value={value} disabled={disabled}>
                      {campaignFormats[value].label} ·{" "}
                      {campaignFormats[value].width} ×{" "}
                      {campaignFormats[value].height}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom" disabled={disabled}>
                    Custom size
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {output.formatId === "custom" && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                {(["width", "height"] as const).map((dimension) => (
                  <label
                    key={dimension}
                    className="flex items-center gap-2 capitalize"
                  >
                    {dimension}
                    <input
                      type="number"
                      aria-label={`Output ${dimension} in pixels`}
                      min={64}
                      max={4096}
                      step={1}
                      value={output[dimension] || ""}
                      disabled={disabled}
                      onChange={(event) =>
                        update({
                          ...output,
                          [dimension]: Number(event.target.value),
                        })
                      }
                      className="w-20 rounded-lg border border-border bg-background px-2 py-1.5"
                    />
                  </label>
                ))}
                <span className="text-muted-foreground">px</span>
              </div>
            )}
            {error && (
              <p role="alert" className="mt-3 text-xs text-destructive">
                {error}
              </p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              One image per format · up to {maxCampaignOutputs}. Cost shown
              before generation.
            </p>
          </div>
          <footer className="mt-6 flex justify-end">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
              >
                Done
              </button>
            </Dialog.Close>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
