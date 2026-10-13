"use client";

export function WebsiteSource({
  source,
  sourceUrl,
  busy,
  onApprove,
}: {
  source: "user" | "discovery";
  sourceUrl: string | null;
  busy?: boolean;
  onApprove?: () => void;
}) {
  if (source !== "discovery" && !sourceUrl) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
      <span title={sourceUrl ?? undefined}>
        {source === "discovery"
          ? "From your website · unconfirmed"
          : "Approved · from your website"}
      </span>
      {source === "discovery" && onApprove && (
        <button
          type="button"
          disabled={busy}
          onClick={onApprove}
          className="font-medium text-zinc-700 hover:text-zinc-950 disabled:opacity-40 dark:text-zinc-300 dark:hover:text-white"
        >
          Use as brand rule
        </button>
      )}
    </div>
  );
}
