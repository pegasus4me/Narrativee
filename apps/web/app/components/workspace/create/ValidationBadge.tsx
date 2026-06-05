"use client";

import { useState } from "react";
import type { PlatformValidation } from "@/app/types/api";

interface ValidationBadgeProps {
  /** Platform name to look up in validation results. */
  readonly platform: string;
  /** Full list of validation results from the orchestrator. */
  readonly validationResults: PlatformValidation[];
}

/**
 * Inline badge showing per-draft platform validation status.
 * Green ✓ if valid, amber ⚠ with warning count if issues found.
 */
export function ValidationBadge({ platform, validationResults }: ValidationBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const result = validationResults.find(
    (v) => v.platform.toLowerCase() === platform.toLowerCase()
  );

  if (!result) {
    return null;
  }

  const hasWarnings = result.warnings.length > 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          if (hasWarnings) {
            setIsExpanded((prev) => !prev);
          }
        }}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-all ${
          hasWarnings
            ? "border border-amber-500/20 bg-amber-500/10 text-amber-300 cursor-pointer hover:bg-amber-500/20"
            : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 cursor-default"
        }`}
      >
        {hasWarnings ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            {result.warnings.length} warning{result.warnings.length > 1 ? "s" : ""}
          </>
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Validated
          </>
        )}
      </button>

      {/* Expandable warning details */}
      {isExpanded && hasWarnings && (
        <div className="absolute top-full left-0 mt-2 z-20 w-64 rounded-xl border border-amber-500/20 bg-zinc-950 p-3 shadow-xl">
          <p className="text-[10px] font-mono uppercase tracking-widest text-amber-400 mb-2">
            Validation Warnings
          </p>
          <ul className="space-y-1">
            {result.warnings.map((warning, index) => (
              <li key={index} className="text-[11px] text-zinc-400 leading-relaxed">
                • {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
