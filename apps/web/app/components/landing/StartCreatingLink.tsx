"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useState,
  useTransition,
  type ReactNode,
  type FormEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { authClient } from "@/lib/auth-client";
import { authLink, websiteSetupPath } from "@/lib/auth-destination";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const websiteExamples = ["yourbrand.com", "yourstore.com", "yourbusiness.com"];

export default function StartCreatingLink({
  children,
  className,
  location,
  websiteInput = false,
}: {
  children: ReactNode;
  className?: string;
  location: string;
  websiteInput?: boolean;
}) {
  const { data: session } = authClient.useSession();
  const posthog = usePostHog();
  const router = useRouter();
  const inputId = useId();
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [starting, startTransition] = useTransition();
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const reducedMotion = useReducedMotion();
  const destination = "/workspace";
  const href = session ? destination : authLink("signup", destination);

  useEffect(() => {
    if (!websiteInput || website || starting || reducedMotion) return;
    const interval = window.setInterval(() => {
      setPlaceholderIndex((index) => (index + 1) % websiteExamples.length);
    }, 3000);
    return () => window.clearInterval(interval);
  }, [websiteInput, website, starting, reducedMotion]);

  function trackStart() {
    try {
      const params = new URLSearchParams(window.location.search);
      for (const key of [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_content",
        "utm_term",
      ]) {
        const value = params.get(key);
        if (value) sessionStorage.setItem(key, value);
      }
    } catch {
      /* Signup remains available without browser storage. */
    }
    posthog?.capture("start_creating_clicked", { location });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (starting) return;
    let next: string;
    try {
      next = websiteSetupPath(website);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Enter a valid website.",
      );
      return;
    }
    trackStart();
    startTransition(() =>
      router.push(session ? next : authLink("signup", next)),
    );
  }

  if (websiteInput) {
    return (
      <div className="w-full max-w-xl">
        <form
          onSubmit={submit}
          className="flex items-center gap-2 rounded-full bg-neutral-50 p-1.5 text-[#171717] transition-colors focus-within:bg-white focus-within:ring-2 focus-within:ring-neutral-800/15"
          aria-label="Start with your website"
        >
          <label htmlFor={inputId} className="sr-only">
            Your business website
          </label>
          <span
            aria-hidden="true"
            className="shrink-0 pl-3 text-base font-bold text-black sm:pl-4"
          >
            https://
          </span>
          <div className="relative min-w-0 flex-1">
            {!website && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex items-center overflow-hidden text-base text-neutral-500"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={reducedMotion ? 0 : placeholderIndex}
                    initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: reducedMotion ? 0 : -8 }}
                    transition={{ duration: reducedMotion ? 0 : 0.2 }}
                    className="truncate"
                  >
                    {websiteExamples[reducedMotion ? 0 : placeholderIndex]}
                  </motion.span>
                </AnimatePresence>
              </div>
            )}
            <input
              id={inputId}
              name="website"
              type="text"
              inputMode="url"
              autoComplete="url"
              autoCapitalize="none"
              spellCheck={false}
              required
              maxLength={2048}
              value={website}
              onChange={(event) => {
                setWebsite(
                  event.target.value.trimStart().replace(/^https?:\/\//i, ""),
                );
                setError(null);
              }}
              disabled={starting}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${inputId}-error` : undefined}
              className="relative h-12 w-full min-w-0 bg-transparent text-base outline-none disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={starting}
            className={cn(
              buttonVariants({ variant: "primary", size: "lg" }),
              className,
              "h-12 shrink-0 whitespace-nowrap rounded-full px-4 py-0 text-sm",
            )}
          >
            <span className="sr-only sm:not-sr-only">
              {starting ? "Opening…" : children}
            </span>
            <ArrowRight aria-hidden="true" className="size-5 sm:hidden" />
          </button>
        </form>
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="mt-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
  return (
    <Link className={className} href={href} onClick={trackStart}>
      {children}
    </Link>
  );
}
