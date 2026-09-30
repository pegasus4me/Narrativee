"use client";

import { useRef, useState, type FormEvent } from "react";
import { Globe } from "lucide-react";
import { createBrand, rememberBrand, type Brand } from "@/lib/api/brands";
import BrandFavicon from "./BrandFavicon";

export default function BrandForm({
  onCreated,
}: {
  onCreated: (brand: Brand) => void;
}) {
  const [hasSite, setHasSite] = useState(true);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  const attempt = useRef<{ input: string; key: string } | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending.current || !value.trim()) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    const input = `${hasSite}:${value.trim()}`;
    if (attempt.current?.input !== input)
      attempt.current = { input, key: crypto.randomUUID() };
    try {
      const brand = await createBrand({
        ...(hasSite ? { url: value.trim() } : { name: value.trim() }),
        key: attempt.current.key,
      });
      rememberBrand(brand);
      onCreated(brand);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to create brand",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 p-2">
      <p className="text-sm font-medium text-ink">Add a brand</p>
      <div className="flex gap-2">
        {[true, false].map((choice) => (
          <button
            key={String(choice)}
            type="button"
            disabled={busy}
            aria-pressed={hasSite === choice}
            onClick={() => {
              setHasSite(choice);
              setValue("");
              setError(null);
            }}
            className={`rounded-lg px-2 py-1.5 text-xs ${hasSite === choice ? "bg-hover-2 text-ink" : "text-ink-2"}`}
          >
            {choice ? "I have a website" : "Start from scratch"}
          </button>
        ))}
      </div>
      <label className="block text-xs text-ink-2">
        {hasSite ? "Company website" : "Brand name"}
        <div className="relative mt-1">
          {hasSite && (
            <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-ink-3">
              <BrandFavicon
                url={value}
                size={16}
                fallback={<Globe size={16} className="text-ink-3" />}
              />
            </div>
          )}
          <input
            autoFocus
            required
            maxLength={hasSite ? 2048 : 120}
            value={value}
            disabled={busy}
            onChange={(event) => setValue(event.target.value)}
            placeholder={hasSite ? "company.com" : "Your brand"}
            className={`block h-9 w-full rounded-lg border border-line-strong bg-field px-2 text-sm text-ink ${
              hasSite ? "pl-8" : ""
            }`}
          />
        </div>
      </label>
      {error && (
        <p role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}
      <button
        disabled={busy || !value.trim()}
        className="h-8 w-full rounded-lg bg-ink text-xs font-medium text-surface disabled:opacity-50"
      >
        {busy ? "Creating…" : "Open Studio"}
      </button>
    </form>
  );
}
