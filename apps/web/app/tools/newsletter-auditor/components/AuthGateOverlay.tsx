"use client";

import { Lock, Sparkles } from "lucide-react";

interface AuthGateOverlayProps {
  /** Title displayed in the lock overlay */
  readonly title: string;
  /** Supporting description text */
  readonly description: string;
  /** Callback to open the auth modal */
  readonly onRequestAuth: () => void;
  /** Child elements to render blurred behind the overlay */
  readonly children: React.ReactNode;
}

/**
 * Overlay that blurs child content and prompts the user
 * to sign up or sign in to unlock premium sections.
 */
export default function AuthGateOverlay({ title, description, onRequestAuth, children }: AuthGateOverlayProps) {
  return (
    <div className="relative rounded-xl border border-white/5 bg-zinc-950/30 overflow-hidden min-h-[200px]">
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-[#050505]/85 backdrop-blur-sm flex flex-col items-center justify-center text-center z-10 px-6">
        <div className="w-10 h-10  flex items-center justify-center text-white mb-3">
          <Lock size={16} />
        </div>

        <h4 className="text-sm font-bold text-zinc-100 font-display">{title}</h4>
        <p className="text-[10px] text-zinc-500 mt-1.5 max-w-xs leading-relaxed">{description}</p>

        <button
          onClick={onRequestAuth}
          className="mt-4 px-5 py-2 bg-brand rounded-lg text-[11px] font-light text-black hover:opacity-90 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Sparkles size={11} />
          <span>Unlock Full Report</span>
        </button>
      </div>

      {/* Blurred content */}
      <div className="filter blur-[3px] pointer-events-none select-none p-4">
        {children}
      </div>
    </div>
  );
}
