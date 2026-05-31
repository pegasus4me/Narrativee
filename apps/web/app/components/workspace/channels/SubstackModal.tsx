"use client";

import { useState } from "react";
import { Loader2, X, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { SUBSTACK_LOGO } from "@/app/constants";

interface SubstackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (params: { identifier: string; sessionCookie: string }) => Promise<void>;
  isConnecting: boolean;
  error: string;
}

export function SubstackModal({ isOpen, onClose, onConnect, isConnecting, error }: SubstackModalProps) {
  const [handle, setHandle] = useState("");
  const [cookie, setCookie] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle || !cookie) return;
    await onConnect({ identifier: handle.trim(), sessionCookie: cookie.trim() });
    setHandle("");
    setCookie("");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
        onClick={() => !isConnecting && onClose()}
      />
      <div className="relative w-full max-w-md transform overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl transition-all animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
        <button
          type="button"
          onClick={onClose}
          disabled={isConnecting}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF581E]/10 text-[#FF581E] border border-[#FF581E]/20 shadow-inner">
            <img src={SUBSTACK_LOGO} alt="Substack" className="h-7 w-7 object-contain" />
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight text-zinc-100">Connect Substack</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Link your Substack account to publish Notes directly from Narrativee.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Publication Subdomain or URL
            </label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="e.g. newsletter.substack.com or just 'newsletter'"
              className="w-full min-h-[44px] rounded-xl bg-zinc-900 px-4 text-sm text-zinc-100 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#FF581E]/20 focus:border-[#FF581E]/40"
              required
              disabled={isConnecting}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Session Cookie (substack.sid)
              </label>
              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <HelpCircle className="w-3 h-3" />
                {showInstructions ? "Hide details" : "How to find this?"}
              </button>
            </div>

            <input
              type="password"
              value={cookie}
              onChange={(e) => setCookie(e.target.value)}
              placeholder="Paste cookie value here"
              className="w-full min-h-[44px] rounded-xl bg-zinc-900 px-4 text-sm text-zinc-100 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#FF581E]/20 focus:border-[#FF581E]/40"
              required
              disabled={isConnecting}
            />

            {showInstructions && (
              <div className="mt-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-4 text-[11px] leading-relaxed text-zinc-400 space-y-2 animate-in slide-in-from-top-2 duration-200">
                <p className="font-semibold text-zinc-300">How to get your Substack session cookie:</p>
                <ol className="list-decimal pl-4 space-y-1 text-zinc-400">
                  <li>Go to <a href="https://substack.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">substack.com</a> and sign in.</li>
                  <li>Right-click anywhere on the page and select <strong className="text-zinc-300 font-medium">Inspect</strong> or press F12 to open Developer Tools.</li>
                  <li>Navigate to the <strong className="text-zinc-300 font-medium">Application</strong> tab (Chrome/Edge) or <strong className="text-zinc-300 font-medium">Storage</strong> tab (Firefox/Safari).</li>
                  <li>In the left pane, expand <strong className="text-zinc-300 font-medium">Cookies</strong> and click on <code className="text-zinc-300 bg-zinc-800 px-1 rounded">https://substack.com</code>.</li>
                  <li>Find the cookie named <strong className="text-zinc-300 font-medium">substack.sid</strong> in the table.</li>
                  <li>Double-click its value, copy it, and paste it in the field above.</li>
                </ol>
                <p className="text-[10px] text-zinc-500 italic mt-2">
                  Note: We store this cookie securely and use it exclusively to post Notes to your feed.
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl bg-red-950/40 p-3 text-xs text-red-400 leading-normal border border-red-900/50">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isConnecting || !handle || !cookie}
            className="w-full min-h-[48px] rounded-xl bg-[#FF581E] font-bold text-white shadow-lg shadow-[#FF581E]/10 transition-all hover:bg-[#FF581E]/90 hover:shadow-[#FF581E]/20 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none text-sm flex items-center justify-center gap-2"
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
