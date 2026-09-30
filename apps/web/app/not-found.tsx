"use client";

import Link from "next/link";
import { AlertCircle } from "clicons-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] p-4 text-center text-zinc-100">
      <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-zinc-400" />
      </div>

      <h1 className="text-5xl font-bold text-white mb-3">404</h1>

      <h2 className="text-xl font-medium text-zinc-300 mb-4">Page not found</h2>

      <p className="text-zinc-500 max-w-md mb-8 leading-relaxed text-sm">
        Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or doesn&apos;t exist.
      </p>

      <Link
        href="/"
        className="px-5 py-2.5 rounded-xl bg-white text-black font-medium text-sm hover:bg-zinc-200 transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}

