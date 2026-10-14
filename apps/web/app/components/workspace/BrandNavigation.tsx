"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  ChevronDown,
  ExternalLink,
  Globe,
  Plus,
  Shapes,
  X,
} from "lucide-react";
import { useBrands } from "./BrandProvider";
import BrandForm from "./BrandForm";
import BrandFavicon from "./BrandFavicon";
import RemoveBrandConfirmation from "./RemoveBrandConfirmation";
import { studioPath, type Brand } from "@/lib/api/brands";
import { authLink } from "@/lib/auth-destination";

function getSafeDomain(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  try {
    const full = rawUrl.includes("://") ? rawUrl : `https://${rawUrl}`;
    return new URL(full).hostname.replace(/^www\./i, "");
  } catch {
    return null;
  }
}

export default function BrandNavigation({ collapsed }: { collapsed: boolean }) {
  const { active, brands, loading, error, legacyId, retry, select } =
    useBrands();

  const domain = active?.url ? getSafeDomain(active.url) : null;
  const displayName =
    active &&
    domain &&
    active.name.replace(/^www\./i, "").toLowerCase() === domain.toLowerCase()
      ? domain
          .replace(/\..*$/, "")
          .replace(/^./, (letter) => letter.toUpperCase())
      : active?.name;
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<Brand | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const href = active?.id
    ? studioPath(active.id)
    : `/workspace?analysisId=${encodeURIComponent(legacyId || "")}`;

  useEffect(() => {
    if (collapsed) setOpen(false);
  }, [collapsed]);

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>("input, button")?.focus();
    function close(event: PointerEvent) {
      if (
        !panel.current?.contains(event.target as Node) &&
        !trigger.current?.contains(event.target as Node)
      )
        setOpen(false);
    }
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
      if (event.key === "Tab") {
        const items = panel.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input:not(:disabled)",
        );
        if (!items?.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", keyboard);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", keyboard);
    };
  }, [open, creating, removing]);

  function toggle() {
    const rect = trigger.current?.getBoundingClientRect();
    if (rect)
      setPosition({
        top: rect.bottom + 6,
        left: Math.min(rect.left, window.innerWidth - 300),
      });
    setCreating(!active && !brands.length);
    setRemoving(null);
    setOpen(!open);
  }

  return (
    <div className="mx-2 mb-3">
      <div
        className={`relative flex items-center gap-2 overflow-hidden rounded-md px-1 ${active ? "min-h-2 py-1 text-black" : "h-8 text-black"}`}
      >
        {active && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 "
          />
        )}
        {active ? (
          <>
            {active.url ? (
              <BrandFavicon
                url={active.url}
                name={displayName}
                size={17}
                className="z-10"
                fallback={<Globe size={17} className="shrink-0 text-white" />}
              />
            ) : (
              <Shapes size={17} className="relative z-10 shrink-0" />
            )}
            <div className="sidebar-copy relative z-10 flex min-w-0 flex-1 flex-col">
              <a className="truncate text-[14px] font-medium leading-5 text-black " href={active.url ?? undefined}>
                {displayName}
              </a>
            </div>
          </>
        ) : (
          <Plus size={17} className="shrink-0" />
        )}
        <button
          ref={trigger}
          onClick={toggle}
          disabled={loading}
          tabIndex={collapsed ? -1 : 0}
          aria-label={active ? "Choose or add a brand" : "Add a brand"}
          aria-expanded={open}
          className={`sidebar-copy relative z-10 flex h-7 items-center rounded-md ${active ? "w-7 justify-center hover:bg-white/15" : "flex-1 text-left hover:bg-hover-2"}`}
        >
          {active ? (
            <ChevronDown size={15} />
          ) : loading ? (
            "Loading brands…"
          ) : (
            "Add a brand"
          )}
        </button>
      </div>
      {active?.provisional && active.id && (
        <Link
          href={authLink("signup", href)}
          tabIndex={collapsed ? -1 : 0}
          className="sidebar-copy mt-1 block px-2 text-xs text-ink-2 underline"
        >
          Save to your account
        </Link>
      )}
      {legacyId && (
        <p className="sidebar-copy px-2 text-xs text-ink-2">
          Legacy preview. Add a brand to save new work.
        </p>
      )}
      {error && (
        <div
          role="alert"
          className="sidebar-copy px-2 py-2 text-xs text-red-500"
        >
          <p>{error}</p>
          <button onClick={retry} className="mt-1 underline">
            Retry
          </button>
          <Link href="/workspace" className="ml-3 underline">
            My brands
          </Link>
        </div>
      )}
      {open &&
        createPortal(
          <div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label="Brand menu"
            style={{ top: position.top, left: Math.max(8, position.left) }}
            className="fixed z-50 max-h-[70vh] w-[288px] overflow-y-auto rounded-xl border border-line bg-surface p-2 shadow-overlay"
          >
            <div className="flex items-center justify-between px-2 text-xs text-ink-3">
              <span>Your brands</span>
              <button
                aria-label="Close brand menu"
                onClick={() => {
                  setOpen(false);
                  trigger.current?.focus();
                }}
                className="p-1"
              >
                <X size={15} />
              </button>
            </div>
            {removing ? (
              <RemoveBrandConfirmation
                brand={removing}
                onCancel={() => setRemoving(null)}
                onRemoved={() => {
                  setRemoving(null);
                  setCreating(brands.length === 1);
                }}
              />
            ) : creating ? (
              <BrandForm
                onCreated={(record) => {
                  select(record);
                  setOpen(false);
                  trigger.current?.focus();
                }}
              />
            ) : (
              <>
                {brands.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center rounded-lg hover:bg-hover-2"
                  >
                    <button
                      onClick={() => {
                        select(record);
                        setOpen(false);
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-ink"
                    >
                      {record.url ? (
                        <BrandFavicon
                          url={record.url}
                          name={record.name}
                          size={15}
                          fallback={
                            <Globe size={15} className="shrink-0 text-ink-3" />
                          }
                        />
                      ) : (
                        <Shapes size={15} className="shrink-0 text-ink-3" />
                      )}
                      <span className="truncate">{record.name}</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${record.name}`}
                      onClick={() => setRemoving(record)}
                      className="mr-1 shrink-0 rounded-md px-2 py-1.5 text-xs text-ink-3 hover:bg-red-500/10 hover:text-red-500 focus-visible:outline focus-visible:outline-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setCreating(true)}
                  className="mt-1 flex w-full font-slack items-center gap-2 rounded-lg bg-secondary px-2 py-2 text-sm text-ink dark:text-black"
                >
                  <Plus size={15} />
                  Add a brand
                </button>
              </>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
