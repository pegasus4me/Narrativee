"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { BLUESKY_LOGO } from "@/app/constants";

interface BlueskyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (params: { identifier: string; appPassword: string }) => Promise<void>;
  isConnecting: boolean;
  error: string;
}

export function BlueskyModal({ isOpen, onClose, onConnect, isConnecting, error }: BlueskyModalProps) {
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle || !password) return;
    await onConnect({ identifier: handle.trim(), appPassword: password.trim() });
    setHandle("");
    setPassword("");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
        onClick={() => !isConnecting && onClose()}
      />
      <div className="relative w-full max-w-md transform overflow-hidden rounded-3xl border border-zinc-100 bg-white p-8 shadow-2xl transition-all animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
        <button
          type="button"
          onClick={onClose}
          disabled={isConnecting}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 shadow-inner">
            <img src={BLUESKY_LOGO} alt="Bluesky" className="h-7 w-7 object-contain" />
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight text-zinc-900">Connect Bluesky</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            Enter your handle and app password to connect your Bluesky channel.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">Bluesky Handle</label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="e.g. username.bsky.social"
              className="w-full min-h-[44px] rounded-xl bg-white px-4 text-sm text-zinc-900 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary-500/25"
              required
              disabled={isConnecting}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">App Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="e.g. abcd-efgh-ijkl-mnop"
              className="w-full min-h-[44px] rounded-xl bg-white px-4 text-sm text-zinc-900 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary-500/25"
              required
              disabled={isConnecting}
            />
            <p className="mt-2 text-[11px] text-zinc-400 leading-normal">
              Don&apos;t use your main password. Generate an App Password in Bluesky:{" "}
              <strong className="text-zinc-600 font-medium">Settings &gt; Privacy &amp; Security &gt; App Passwords</strong>.
            </p>
          </div>
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-xs text-red-800 leading-normal border border-red-100">{error}</div>
          )}
          <button
            type="submit"
            disabled={isConnecting || !handle || !password}
            className="w-full min-h-[48px] rounded-md bg-primary font-bold text-white shadow-lg transition-all hover:bg-primary/90 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect Account"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
