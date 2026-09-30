"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { listStudioProjects, type StudioChat } from "@/lib/api/studio";

export default function StudioChatSwitcher({
  brandId,
  projectId,
  kind,
}: {
  brandId: string;
  projectId: string;
  kind: "discovery" | "creation";
}) {
  const router = useRouter();
  const [chats, setChats] = useState<StudioChat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLElement>(null);

  const title =
    chats.find((chat) => chat.id === projectId)?.title ??
    (kind === "discovery" ? "Discovery" : "Creation");

  useEffect(() => {
    const controller = new AbortController();
    listStudioProjects(brandId, controller.signal)
      .then(setChats)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error ? cause.message : "Could not load chats",
          );
      });
    return () => controller.abort();
  }, [brandId, projectId]);

  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: PointerEvent) {
      if (!menu.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <nav ref={menu} aria-label="Studio chats" className="relative min-w-0">
      <button
        type="button"
        aria-expanded={open}
        aria-label={`Current chat: ${title}. Show chats`}
        onClick={() => setOpen((current) => !current)}
        className="flex max-w-[230px] items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-ink hover:bg-hover-2"
      >
        <span className="truncate">{title}</span>
        <ChevronDown size={14} className="shrink-0 text-ink-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 max-h-72 w-56 overflow-y-auto rounded-lg border border-line bg-surface p-1 shadow-overlay">
          {chats.map((chat) => (
            <button
              key={chat.id}
              type="button"
              onClick={() => {
                setOpen(false);
                router.push(`/workspace/studio/${chat.id}`);
              }}
              aria-current={chat.id === projectId ? "page" : undefined}
              className={`block w-full truncate rounded-md px-3 py-2 text-left text-sm ${chat.id === projectId ? "bg-hover-2 font-medium text-ink" : "text-ink-2 hover:bg-hover-2"}`}
            >
              {chat.title}
            </button>
          ))}
          {error && (
            <p role="alert" className="px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
        </div>
      )}
    </nav>
  );
}
