"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getGoogleFonts, type GoogleFont } from "@/lib/api/google-fonts";
import { useGoogleFontPreview } from "./useGoogleFontPreview";

const control =
  "block h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 disabled:opacity-50 dark:border-zinc-700 dark:bg-[#18181B] dark:text-white";

export function GoogleFontSelect({
  busy,
  onSelect,
  onCancel,
}: {
  busy: boolean;
  onSelect: (family: string, weight: string, role: string) => Promise<void>;
  onCancel?: () => void;
}) {
  const [fonts, setFonts] = useState<GoogleFont[]>([]);
  const [family, setFamily] = useState("");
  const [weight, setWeight] = useState("400");
  const [role, setRole] = useState("Headings");
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useGoogleFontPreview(family, weight);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    getGoogleFonts(controller.signal)
      .then((catalog) => {
        if (!controller.signal.aborted)
          setFonts(
            catalog.items.sort((a, b) => a.family.localeCompare(b.family)),
          );
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error ? cause.message : "Could not load fonts",
          );
      });
    return () => controller.abort();
  }, [revision]);

  const selected = fonts.find((font) => font.family === family);
  const weights =
    selected?.variants
      .filter((variant) => variant === "regular" || /^\d{3}$/.test(variant))
      .map((variant) => (variant === "regular" ? "400" : variant)) ?? [];

  function chooseFamily(value: string) {
    setFamily(value);
    const variants =
      fonts.find((font) => font.family === value)?.variants ?? [];
    setWeight(
      variants.includes("regular")
        ? "400"
        : (variants.find((variant) => /^\d{3}$/.test(variant)) ?? "400"),
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (selected) await onSelect(family, weight, role);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px_100px]">
        <label className="space-y-1.5 text-xs text-zinc-500">
          Google Font
          <select
            aria-label="Google Font"
            value={family}
            onChange={(event) => chooseFamily(event.target.value)}
            disabled={busy || !fonts.length}
            className={control}
          >
            <option value="">
              {fonts.length
                ? "Select a font…"
                : error
                  ? "Fonts unavailable"
                  : "Loading Google Fonts…"}
            </option>
            {fonts.map((font) => (
              <option key={font.family} value={font.family}>
                {font.family}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-xs text-zinc-500">
          Use for
          <select
            aria-label="Font role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className={control}
          >
            <option>Headings</option>
            <option>Body text</option>
            <option>Accent</option>
          </select>
        </label>
        <label className="space-y-1.5 text-xs text-zinc-500">
          Weight
          <select
            aria-label="Font weight"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            disabled={!selected}
            className={control}
          >
            {(weights.length ? weights : ["400"]).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>
      {selected && (
        <p
          className="py-3 text-[28px] leading-tight"
          style={{
            fontFamily: `${JSON.stringify(family)}, sans-serif`,
            fontWeight: Number(weight),
          }}
        >
          Make every word count.
        </p>
      )}
      {error && (
        <div role="alert" className="text-sm text-red-500">
          {error}
          <button
            type="button"
            onClick={() => setRevision((value) => value + 1)}
            className="ml-2 underline"
          >
            Retry
          </button>
        </div>
      )}
      <div className="flex items-center gap-3">
        <button
          disabled={busy || !selected}
          className="h-9 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {busy ? "Saving…" : "Save font"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-zinc-500"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
