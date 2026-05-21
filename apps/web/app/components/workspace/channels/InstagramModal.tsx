"use client";

import { CheckCircle2, Instagram, X } from "lucide-react";
import { INSTAGRAM_LOGO } from "@/app/constants";
import { API_URL } from "@/lib/api-config";

interface InstagramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstagramModal({ isOpen, onClose }: InstagramModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md transform overflow-hidden rounded-3xl border border-zinc-100 bg-white p-8 shadow-2xl transition-all animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-50 text-pink-600 shadow-inner">
            <img src={INSTAGRAM_LOGO} alt="Instagram" className="h-7 w-7 object-contain" />
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight text-zinc-900">Instagram</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            Meta requires an <strong>Instagram Creator or Instagram Business</strong> account linked to a Facebook Page to publish content automatically.
          </p>
        </div>
        <div className="mt-6 space-y-4 text-left">
          <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-100">
            <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Prerequisites Checklist:</h4>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5 text-xs text-zinc-600">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                <span>Instagram account switched to <strong>Creator</strong> or <strong>Business</strong> (in App Settings &gt; Account type).</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-zinc-600">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                <span>Instagram account linked to a <strong>Facebook Page</strong> that you admin.</span>
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                window.location.href = `${API_URL}/channels/connect/instagram`;
              }}
              className="w-full min-h-[48px] rounded-md bg-primary font-bold text-white shadow-lg transition-all hover:bg-primary/90 text-sm flex items-center justify-center gap-2"
            >
              <Instagram className="w-4 h-4" />
              Connect to Instagram
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[44px] rounded-md border border-zinc-200 bg-white font-bold text-zinc-600 transition-all hover:bg-zinc-50 text-sm"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
