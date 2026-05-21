"use client";

import { useState } from "react";
import { Copy, Check, Calendar, Save, Loader2 } from "lucide-react";
import { getPlatformLogo, getPlatformLabel } from "../shared/PlatformLogo";

interface DraftChannel {
  platform: string;
  accountName?: string;
  avatarUrl?: string;
}

interface DraftItem {
  id: string;
  status?: string;
  channel: DraftChannel;
  content: { text?: string };
  scheduledAt?: string;
}

interface DraftCardProps {
  draft: DraftItem;
  isScheduled: boolean;
  isSaving: boolean;
  isSaved: boolean;
  onDraftChange: (id: string, text: string) => void;
  onCopy: (id: string, text: string) => void;
  onSave: (id: string, text: string) => void;
  onSchedule: (id: string) => void;
}

export function DraftCard({
  draft,
  isScheduled,
  isSaving,
  isSaved,
  onDraftChange,
  onCopy,
  onSave,
  onSchedule,
}: DraftCardProps) {
  const [copiedLocal, setCopiedLocal] = useState(false);
  const label = getPlatformLabel(draft.channel.platform);

  const text = draft.content.text || "";

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopiedLocal(true);
    onCopy(draft.id, text);
    setTimeout(() => setCopiedLocal(false), 2000);
  };

  return (
    <div className="flex flex-col justify-between rounded-xl border border-zinc-100 p-5 transition-all border-zinc-200 bg-zinc-50/10 hover:border-zinc-300">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative h-8 w-8 shrink-0">
              {draft.channel.avatarUrl ? (
                <img src={draft.channel.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-black">
                  {(draft.channel.accountName || label).charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white p-0.5 border border-zinc-100">
                <img
                  src={getPlatformLogo(draft.channel.platform)}
                  alt={draft.channel.platform}
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-900 leading-tight">{label}</p>
              <p className="text-[10px] text-zinc-500 font-light">{draft.channel.accountName || "Connected Channel"}</p>
            </div>
          </div>
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[9px] font-semibold text-zinc-600 uppercase">
            {draft.status === "scheduled" ? "Scheduled" : draft.status === "published" ? "Published" : "Draft"}
          </span>
        </div>

        <textarea
          value={text}
          onChange={(e) => onDraftChange(draft.id, e.target.value)}
          className="w-full h-44 rounded-xl border border-zinc-100 bg-white p-3.5 text-sm leading-relaxed text-zinc-800 focus:border-zinc-300 focus:outline-none focus:ring-0 font-normal resize-none"
        />
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-zinc-100/50 pt-4">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            {copiedLocal ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => onSave(draft.id, text)}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" />
                Saving...
              </>
            ) : isSaved ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 text-zinc-400" />
                Save
              </>
            )}
          </button>
        </div>

        <button
          type="button"
          disabled={isScheduled}
          onClick={() => onSchedule(draft.id)}
          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            isScheduled
              ? "bg-emerald-50 text-emerald-800 border border-emerald-100 cursor-default"
              : "bg-primary text-white hover:bg-zinc-800"
          }`}
        >
          {isScheduled ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Scheduled
            </>
          ) : (
            <>
              <Calendar className="h-3.5 w-3.5" />
              Schedule
            </>
          )}
        </button>
      </div>
    </div>
  );
}
