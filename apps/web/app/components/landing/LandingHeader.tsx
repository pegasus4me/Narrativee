"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";
import { authClient } from "@/lib/auth-client";

function getDisplayName(name?: string | null, email?: string | null): string {
  if (name && name.trim().length > 0) {
    return name.trim();
  }

  if (email && email.trim().length > 0) {
    return email.split("@")[0] ?? "Account";
  }

  return "Account";
}

/** Top navigation for the public landing page. */
export function LandingHeader(): ReactElement {
  const session = authClient.useSession();
  const user = session.data?.user;
  const displayName = user ? getDisplayName(user.name, user.email) : null;

  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
      <Link href="/" className="flex items-center gap-3">
        <Image src="/logo.png" alt="Narrativee" width={150} height={23} className="h-6 w-auto" priority />
      </Link>

      <nav className="hidden items-center gap-7 text-sm text-zinc-400 lg:flex">
        <a href="#workflow" className="transition-colors hover:text-white">Workflow</a>
        <a href="#moat" className="transition-colors hover:text-white">Moat</a>
        <a href="#channels" className="transition-colors hover:text-white">Channels</a>
        <Link href="/pricing" className="transition-colors hover:text-white">Pricing</Link>
      </nav>

      <div className="flex items-center gap-3">
        {session.isPending ? (
          <div className="hidden h-4 w-24 animate-pulse rounded-full bg-white/10 sm:block" />
        ) : displayName ? (
          <>
            <span className="hidden max-w-36 truncate text-sm font-medium text-zinc-300 sm:block">
              {displayName}
            </span>
            <Link
              href="/workspace"
              className="rounded-full border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
            >
              Dashboard
            </Link>
          </>
        ) : (
          <>
            <Link href="/auth/signin" className="hidden text-sm font-medium text-zinc-300 transition-colors hover:text-white sm:block">
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-full border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
            >
              Get started
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
