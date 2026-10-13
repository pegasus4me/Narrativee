"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon, Clapperboard } from "lucide-react";
import type { StudioMediaModelDetails } from "@/lib/api/studio";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/motion/select";

export default function StudioModelSelect({
  label,
  value,
  models,
  defaultModel,
  onChange,
  disabled,
  modelDetails = {},
}: {
  label: string;
  value: string | null;
  models: string[];
  defaultModel: string;
  onChange: (model: string | null) => void;
  disabled: boolean;
  modelDetails?: Record<string, StudioMediaModelDetails>;
}) {
  const [open, setOpen] = useState(false);
  const choices = [...new Set([...models, ...(value ? [value] : [])])];
  const display = (model: string, isDefault = false) => {
    const details = modelDetails[model];
    const Icon = details?.kind === "video" ? Clapperboard : ImageIcon;
    return (
      <span className="flex min-w-0 items-center gap-2">
        {details ? (
          <Icon aria-hidden="true" className="size-4 shrink-0" />
        ) : (
          <Image
            src="/openai.svg"
            alt=""
            width={16}
            height={16}
            className="size-4 shrink-0"
          />
        )}
        <span className="truncate">
          {isDefault ? "Default · " : ""}
          {details?.label ?? model}
        </span>
        {details && !details.connected && (
          <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
            Not connected
          </span>
        )}
      </span>
    );
  };
  return (
    <div
      role="group"
      aria-label={label}
      className="relative space-y-2"
      style={{ zIndex: open ? 20 : 0 }}
    >
      <p className="text-sm font-medium">{label}</p>
      <Select
        value={value ?? "default"}
        onValueChange={(model) => onChange(model === "default" ? null : model)}
        disabled={disabled}
        open={open}
        onOpenChange={setOpen}
      >
        <SelectTrigger className="w-full justify-between">
          {display(value ?? defaultModel, value === null)}
        </SelectTrigger>
        <SelectContent className="max-h-52 overflow-y-auto">
          <SelectItem value="default">{display(defaultModel, true)}</SelectItem>
          {choices.map((model) => (
            <SelectItem key={model} value={model}>
              {display(model)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {modelDetails[value ?? defaultModel]?.connected === false && (
        <p className="text-xs leading-5 text-muted-foreground">
          {modelDetails[value ?? defaultModel]?.provider} · Your selection is
          saved. {label === "Video model" ? "Video" : "Image"} generation with
          this provider is not connected yet.
        </p>
      )}
    </div>
  );
}
