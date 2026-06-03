"use client";

import { X, MessageSquare, Mail, ExternalLink } from "lucide-react";

interface SupportPopUpProps {
  /** Determines if the popup modal is open. */
  isOpen: boolean;
  /** Callback fired when the modal requests to close. */
  onClose: () => void;
}

/**
 * SupportPopUp renders a dialog allowing users to request support
 * via the Discord community or through an email ticket.
 */
export default function SupportPopUp({ isOpen, onClose }: SupportPopUpProps): React.ReactNode {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      {/* Backdrop click handler */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#09090b] p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-150 text-zinc-150 z-10">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              Need Support?
            </h3>
            <p className="text-xs text-zinc-400">
              We are here to help you get the most out of Narrativee.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Support Options */}
        <div className="space-y-4">
          {/* Discord Option */}
          <a
            href="https://discord.gg/FwFbK2AJ42"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-[#5865F2]/10 flex items-center justify-center text-[#5865F2]">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 127.14 96.36" xmlns="http://www.w3.org/2000/svg">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,52.8,6.83,77.19,77.19,0,0,0,49.5,0,105.15,105.15,0,0,0,19.06,8.07C-3.41,41.51-1.86,74.36,9.63,95.73A105.78,105.78,0,0,0,41.22,112.5a78,78,0,0,0,6.57-10.71,68.86,68.86,0,0,1-10.37-5c.87-.64,1.71-1.32,2.51-2a75.46,75.46,0,0,0,80.12,0c.8,0.7,1.64,1.38,2.51,2a68.86,68.86,0,0,1-10.37,5,78,78,0,0,0,6.57,10.71,105.78,105.78,0,0,0,31.59-16.77C129,74.36,130.55,41.51,107.7,8.07ZM42.45,77.12C36.33,77.12,31.28,71.5,31.28,64.6s5.05-12.52,11.17-12.52,11.23,5.62,11.17,12.52S48.57,77.12,42.45,77.12Zm42.24,0C78.57,77.12,73.52,71.5,73.52,64.6s5.05-12.52,11.17-12.52,11.23,5.62,11.17,12.52S84.69,77.12,82.81,77.12Z"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-zinc-200">Join Discord Community</p>
                <p className="text-xs text-zinc-400">Get live support from our team & creators</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
          </a>

          {/* Email Option */}
          <a
            href="mailto:support@narrativee.com"
            className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Mail className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-zinc-200">Send an Email Ticket</p>
                <p className="text-xs text-zinc-400">support@narrativee.com</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
          </a>
        </div>
      </div>
    </div>
  );
}
