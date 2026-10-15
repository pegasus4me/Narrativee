"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState, type FormEvent } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/motion/select";
import {
  searchAdReferences,
  importAdReference,
  type AdReference,
} from "@/lib/api/ad-references";
import { dispatchStudioCanvasEvent } from "@/lib/api/studio";
import AdReferenceCard from "./AdReferenceCard";

const categories = [
  ["skincare", "Skincare"],
  ["cosmetics", "Cosmetics"],
  ["fashion", "Fashion & clothing"],
  ["jewelry", "Jewelry"],
  ["food", "Food & beverages"],
  ["coffee", "Coffee"],
  ["furniture", "Home & furniture"],
  ["fitness", "Fitness"],
  ["pets", "Pets"],
  ["electronics", "Electronics"],
  ["travel", "Travel"],
  ["software", "Software"],
] as const;

export default function StudioAdReferences({
  projectId,
  disabled,
  onBusyChange,
  onSelected,
}: {
  projectId: string;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
  onSelected: (image: { id: string; name: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("ALL");
  const [items, setItems] = useState<AdReference[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [lastSearch, setLastSearch] = useState<{
    query: string;
    country: string;
  } | null>(null);
  const [searching, setSearching] = useState(false);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function search(more = false) {
    if (searching || selecting) return;
    const input =
      more && lastSearch ? lastSearch : { query: query.trim(), country };
    if (input.query.length < 2) return;
    setSearching(true);
    setError(null);
    if (!more) {
      setItems([]);
      setCursor(null);
    }
    try {
      const result = await searchAdReferences(projectId, {
        ...input,
        ...(more && cursor ? { cursor } : {}),
      });
      setItems((current) => [
        ...new Map(
          [...(more ? current : []), ...result.items].map((ad) => [ad.id, ad]),
        ).values(),
      ]);
      setCursor(result.cursor);
      setLastSearch(input);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Search failed. Please retry.",
      );
    } finally {
      setSearching(false);
    }
  }

  async function select(ad: AdReference) {
    if (!ad.imageUrl || selecting || disabled) return;
    setSelecting(ad.id);
    setError(null);
    onBusyChange(true);
    try {
      const image = await importAdReference(projectId, ad.imageUrl);
      const name = `Meta ad · ${ad.advertiser} · ${ad.id}`.slice(0, 255);
      await dispatchStudioCanvasEvent(projectId, {
        type: "image_upload",
        image: { ...image, name },
      });
      onSelected({ id: image.id, name });
      setOpen(false);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Reference could not be added. Please retry.",
      );
    } finally {
      setSelecting(null);
      onBusyChange(false);
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!selecting) setOpen(value);
      }}
    >
      <Dialog.Trigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-9 gap-1.5 rounded-full px-3 text-xs"
        >
          <Search size={15} />
          Ad references
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[1200] bg-black/30 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[1201] flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-border bg-background p-5 shadow-xl sm:p-7">
          <Dialog.Close
            disabled={Boolean(selecting)}
            aria-label="Close ad references"
            className="absolute right-4 top-4 rounded p-1 hover:bg-muted"
          >
            <X size={18} />
          </Dialog.Close>
          <Dialog.Title className="pr-6 text-2xl font-semibold">
            Find an ad reference
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            Explore active Facebook and Instagram ads. Add an image to guide
            your brief’s visual direction.
          </Dialog.Description>
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              void search();
            }}
            className="my-5 flex flex-wrap gap-2"
          >
            <Select
              value={query}
              onValueChange={setQuery}
              disabled={searching || Boolean(selecting)}
              className="relative z-20 min-w-0 flex-1 basis-full sm:basis-auto"
            >
              <SelectTrigger className="h-10 bg-muted">
                <SelectValue placeholder="Choose a product category" />
              </SelectTrigger>
              <SelectContent className="max-h-52 overflow-y-auto">
                {categories.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <select
              aria-label="Country"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              disabled={searching || Boolean(selecting)}
              className="h-10 rounded-xl border border-border bg-background px-2 text-sm"
            >
              <option value="ALL">All countries</option>
              <option value="FR">France</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="DE">Germany</option>
              <option value="CA">Canada</option>
            </select>
            <Button
              type="submit"
              size="default"
              disabled={
                searching || Boolean(selecting) || query.trim().length < 2
              }
            >
              {searching ? "Searching…" : "Search"}
            </Button>
          </form>
          {error && (
            <p role="alert" className="mb-3 text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="min-h-32 overflow-y-auto p-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((ad) => (
                <AdReferenceCard
                  key={ad.id}
                  ad={ad}
                  busy={selecting === ad.id}
                  disabled={disabled || Boolean(selecting)}
                  onSelect={() => void select(ad)}
                />
              ))}
            </div>
            {!items.length && (
              <p
                role="status"
                className="py-10 text-center text-sm text-muted-foreground"
              >
                {searching
                  ? "Finding references…"
                  : lastSearch && !error
                    ? "No ads found. Try another category or country."
                    : "Choose a category to find a reference for your next creative."}
              </p>
            )}
            {cursor && (
              <div className="pt-5 text-center">
                <Button
                  variant="outline"
                  disabled={searching || Boolean(selecting)}
                  onClick={() => void search(true)}
                >
                  {searching ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
