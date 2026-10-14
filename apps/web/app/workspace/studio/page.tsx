"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Filter,
  Layers,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { useBrands } from "@/app/components/workspace/BrandProvider";
import {
  createStudioProject,
  listStudioCreatives,
  listStudioProjects,
  type StudioChat,
  type StudioCreativeSummary,
} from "@/lib/api/studio";
import { StudioCreativeCard } from "@/app/components/studio/StudioCreativeCard";

type FormatFilter = "all" | "square" | "portrait" | "landscape";

export default function StudioPage() {
  const router = useRouter();
  const { active, loading: brandLoading, error: brandError, retry } = useBrands();

  const [creatives, setCreatives] = useState<StudioCreativeSummary[]>([]);
  const [projects, setProjects] = useState<StudioChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formatFilter, setFormatFilter] = useState<FormatFilter>("all");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (brandLoading || !active?.id) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      listStudioCreatives(active.id).catch((cause: unknown) => {
        console.error("Failed to load studio creatives", cause);
        return [] as StudioCreativeSummary[];
      }),
      listStudioProjects(active.id).catch(() => [] as StudioChat[]),
    ])
      .then(([loadedCreatives, loadedProjects]) => {
        if (!mounted) return;
        setCreatives(loadedCreatives);
        setProjects(loadedProjects);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (!mounted) return;
        setLoading(false);
        setError(
          cause instanceof Error ? cause.message : "Could not load creatives",
        );
      });

    return () => {
      mounted = false;
    };
  }, [active?.id, brandLoading]);

  const handleCreateNew = async () => {
    if (creating || !active?.id) return;
    setCreating(true);
    setError(null);
    try {
      const project = await createStudioProject(active.id);
      router.push(`/workspace/studio/${project.id}`);
    } catch (cause) {
      setCreating(false);
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not create new creative project",
      );
    }
  };

  const handleOpenLatest = () => {
    const latest = projects.find((p) => p.kind === "creation") ?? projects[0];
    if (latest) {
      router.push(`/workspace/studio/${latest.id}`);
    } else {
      void handleCreateNew();
    }
  };

  const filteredCreatives = useMemo(() => {
    return creatives.filter((item) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesProject = item.projectTitle.toLowerCase().includes(query);
        if (!matchesName && !matchesProject) return false;
      }

      // Format filter
      if (formatFilter === "square") {
        return (
          item.width === item.height ||
          item.formatId?.includes("square") ||
          item.name.includes("1080 × 1080")
        );
      }
      if (formatFilter === "portrait") {
        return (
          item.height > item.width ||
          item.formatId?.includes("portrait") ||
          item.name.includes("1080 × 1350")
        );
      }
      if (formatFilter === "landscape") {
        return (
          item.width > item.height ||
          item.formatId?.includes("landscape") ||
          item.name.includes("1200 × 628")
        );
      }

      return true;
    });
  }, [creatives, searchQuery, formatFilter]);

  const formatCounts = useMemo(() => {
    let square = 0;
    let portrait = 0;
    let landscape = 0;

    for (const item of creatives) {
      if (
        item.width === item.height ||
        item.formatId?.includes("square") ||
        item.name.includes("1080 × 1080")
      ) {
        square++;
      } else if (
        item.height > item.width ||
        item.formatId?.includes("portrait") ||
        item.name.includes("1080 × 1350")
      ) {
        portrait++;
      } else if (
        item.width > item.height ||
        item.formatId?.includes("landscape")
      ) {
        landscape++;
      }
    }

    return { all: creatives.length, square, portrait, landscape };
  }, [creatives]);

  if (brandLoading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm">Loading studio workspace…</p>
        </div>
      </div>
    );
  }

  if (brandError) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p role="alert" className="text-sm font-medium text-destructive">
            {brandError}
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!active) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold tracking-tight">
            Select a brand to view studio creatives
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a brand from the sidebar or create a new one to access your
            creatives and generate new campaign imagery.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto min-h-full">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              Studio
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs font-medium text-foreground">
              {active.name}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Created Creatives
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Explore all creative variations generated so far on Studio for{" "}
            <span className="font-medium text-foreground">{active.name}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {projects.length > 0 && (
            <button
              type="button"
              onClick={handleOpenLatest}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Layers className="h-4 w-4 text-muted-foreground" />
              Open Canvas
            </button>
          )}

          <button
            type="button"
            disabled={creating}
            onClick={() => void handleCreateNew()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Opening Studio…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                New Creative
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recent Work & Chats Section */}
      {projects.length > 0 && (
        <section aria-labelledby="recent-chats-heading" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h2
                id="recent-chats-heading"
                className="text-sm font-semibold tracking-tight text-foreground"
              >
                Recent Chats & Work
              </h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground font-medium">
                {projects.length}
              </span>
            </div>
            <button
              type="button"
              disabled={creating}
              onClick={() => void handleCreateNew()}
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              New chat
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {projects.map((chat) => {
              const chatCreatives = creatives.filter(
                (c) => c.projectId === chat.id,
              );
              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => router.push(`/workspace/studio/${chat.id}`)}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-3.5 text-left shadow-sm transition-all hover:border-zinc-400 hover:shadow-md dark:hover:border-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {chat.title}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="capitalize">{chat.kind}</span>
                      <span>·</span>
                      <span>
                        {chatCreatives.length}{" "}
                        {chatCreatives.length === 1 ? "creative" : "creatives"}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center justify-center rounded-lg bg-muted/60 p-2 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Creatives Gallery Section */}
      <section aria-labelledby="creatives-gallery-heading" className="flex flex-col gap-4">
        {/* Gallery Section Header & Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2
              id="creatives-gallery-heading"
              className="text-base font-semibold tracking-tight text-foreground"
            >
              Creatives Board
            </h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground font-medium">
              {creatives.length}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Format tabs */}
            <div className="inline-flex items-center rounded-xl border border-border bg-muted/40 p-1 text-xs">
              <button
                type="button"
                onClick={() => setFormatFilter("all")}
                className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  formatFilter === "all"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({formatCounts.all})
              </button>
              <button
                type="button"
                onClick={() => setFormatFilter("square")}
                className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  formatFilter === "square"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Square 1:1 ({formatCounts.square})
              </button>
              <button
                type="button"
                onClick={() => setFormatFilter("portrait")}
                className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  formatFilter === "portrait"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Portrait 4:5 ({formatCounts.portrait})
              </button>
              {formatCounts.landscape > 0 && (
                <button
                  type="button"
                  onClick={() => setFormatFilter("landscape")}
                  className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                    formatFilter === "landscape"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Landscape ({formatCounts.landscape})
                </button>
              )}
            </div>

            {/* Search input */}
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search creatives…"
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-9 text-xs placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Creatives Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square w-full animate-pulse rounded-2xl border border-border/70 bg-muted/40"
              />
            ))}
          </div>
        ) : creatives.length === 0 ? (
          /* Empty State: No creatives yet */
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Wand2 className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
              No creatives created yet
            </h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
              Create your first campaign creative with Pixel. Describe your scene,
              pick formats, and your rendered creatives will automatically appear here
              in this gallery.
            </p>
            <button
              type="button"
              disabled={creating}
              onClick={() => void handleCreateNew()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Opening Studio…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create my first creative
                </>
              )}
            </button>
          </div>
        ) : filteredCreatives.length === 0 ? (
          /* Empty State: Filter/search returned nothing */
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/20 p-8 text-center">
            <Filter className="h-8 w-8 text-muted-foreground/60" />
            <h3 className="mt-3 text-base font-semibold text-foreground">
              No creatives match your filter
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search terms or clearing format filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setFormatFilter("all");
              }}
              className="mt-4 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              Reset filters
            </button>
          </div>
        ) : (
          /* Square Format Creatives Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 sm:gap-6">
            {filteredCreatives.map((creative) => (
              <StudioCreativeCard key={creative.id} creative={creative} />
            ))}
          </div>
        )}
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {error}
        </div>
      )}
    </div>
  );
}
