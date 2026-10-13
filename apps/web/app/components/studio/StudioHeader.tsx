"use client";

import { CreditStatus } from "../billing/UsageProvider";
import { useState } from "react";
import { ArrowLeft, Brain, UserPlus } from "lucide-react";
import Button from "@/components/ui/button";
export default function StudioHeader({
  brandBrainOpen,
  canOpenBrandBrain,
  onToggleBrandBrain,
}: {
  brandBrainOpen: boolean;
  canOpenBrandBrain: boolean;
  onToggleBrandBrain: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [invited, setInvited] = useState(false);

  const handleShare = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // clipboard fallback
    }
  };

  const handleInvite = () => {
    setInvited(true);
    setTimeout(() => setInvited(false), 2000);
  };

  return (
    <div className="ml-auto flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={onToggleBrandBrain}
        disabled={!canOpenBrandBrain}
        className="flex h-7 items-center gap-1.5 rounded-[6px] border border-dashed border-neutral-200 bg-white px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-neutral-100 disabled:opacity-40"
        title={brandBrainOpen ? "Back to canvas" : "Open Brand Brain"}
        aria-label={brandBrainOpen ? "Back to canvas" : "Open Brand Brain"}
      >
        {brandBrainOpen ? <ArrowLeft size={13} /> : <Brain size={13} />}
        <span className="hidden sm:inline">
          {brandBrainOpen ? "Back to canvas" : "Brand Brain"}
        </span>
      </button>
      <CreditStatus />
      <button
        type="button"
        onClick={handleInvite}
        className="flex h-7 items-center gap-1.5 rounded-[6px] border border-border bg-muted px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent active:scale-95"
        title="Invite collaborators"
      >
        <UserPlus size={13} className="text-muted-foreground" />
        <span>{invited ? "Invites coming soon" : "Invite"}</span>
      </button>

      <button
        type="button"
        onClick={handleShare}
        className="flex h-7 items-center justify-center rounded-[6px] border border-border bg-tertiary px-2.5 text-xs font-medium text-black transition-colors hover:bg-secondary/80 hover:text-white active:scale-95"
        title="Share canvas link"
      >
        {copied ? "Link copied!" : "Share"}
      </button>
    </div>
  );
}
