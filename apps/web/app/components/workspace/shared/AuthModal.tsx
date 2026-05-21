"use client";

import Link from "next/link";
import { X } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-zinc-200 mx-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Create Your Free Account</h2>
        <p className="text-sm text-zinc-600 mb-6">
          Sign up to unlock real pipelines, connect your channels, and start repurposing your newsletter content.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 text-sm font-bold transition-all shadow-sm"
          >
            Sign Up Free
          </Link>
          <Link
            href="/auth/signin"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 px-4 py-3 text-sm font-bold transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
