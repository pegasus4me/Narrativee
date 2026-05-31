"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Loader2, Calendar, Clock, Check, AlertCircle } from "lucide-react";
import { useCreationSession, useUpdateCreationSession, useScheduleCreationDraft } from "@/app/hooks/api";
import { toUTCISOString, getBrowserTimezone } from "@/app/components/workspace/TimezoneSelect";
import {
  BLUESKY_LOGO,
  FACEBOOK_LOGO,
  INSTAGRAM_LOGO,
  LINKEDIN_LOGO,
  THREADS_LOGO,
  X_LOGO,
  SUBSTACK_LOGO,
} from "@/app/constants";
import type { CreationDraft } from "@/app/types/api";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const PLATFORM_LOGOS: Record<string, string> = {
  bluesky: BLUESKY_LOGO,
  facebook: FACEBOOK_LOGO,
  instagram: INSTAGRAM_LOGO,
  linkedin: LINKEDIN_LOGO,
  threads: THREADS_LOGO,
  twitter: X_LOGO,
  x: X_LOGO,
  substack: SUBSTACK_LOGO,
};

function formatDate(value: string | null): string {
  if (!value) {
    return "Draft session";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Draft session";
  }

  return DATE_FORMATTER.format(parsedDate);
}

function getPlatformLogo(platform: string): string | null {
  return PLATFORM_LOGOS[platform.toLowerCase()] ?? null;
}

/**
 * Displays a saved creation session so drafts remain accessible after navigation.
 */
export default function CreationDetailPage() {
  const params = useParams<{ creationId: string }>();
  const creationId = typeof params.creationId === "string" ? params.creationId : "";
  const { data: creation, isLoading, error } = useCreationSession(creationId, creationId.length > 0);
  const updateCreationSession = useUpdateCreationSession();
  const scheduleDraft = useScheduleCreationDraft();

  const [draftTexts, setDraftTexts] = useState<string[]>([]);
  const [saveMessage, setSaveMessage] = useState("");

  // Scheduling states
  const [scheduleDates, setScheduleDates] = useState<Record<string, string>>({});
  const [scheduleTimes, setScheduleTimes] = useState<Record<string, string>>({});
  const [scheduledStatus, setScheduledStatus] = useState<Record<string, boolean>>({});
  const [scheduleError, setScheduleError] = useState<Record<string, string>>({});

  useEffect(() => {
    setDraftTexts(creation?.drafts.map((draft) => draft.text) ?? []);

    if (creation?.drafts) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
      const dd = String(tomorrow.getDate()).padStart(2, "0");
      const defaultDateStr = `${yyyy}-${mm}-${dd}`;

      const dates: Record<string, string> = {};
      const times: Record<string, string> = {};

      creation.drafts.forEach((draft, idx) => {
        const key = `${draft.channelId}-${idx}`;
        dates[key] = defaultDateStr;
        times[key] = "12:00";
      });

      setScheduleDates((prev) => ({ ...dates, ...prev }));
      setScheduleTimes((prev) => ({ ...times, ...prev }));
    }
  }, [creation]);

  const handleSchedulePost = async (
    channelId: string,
    idx: number,
    platform: string
  ): Promise<void> => {
    const key = `${channelId}-${idx}`;
    const selectedDate = scheduleDates[key];
    const selectedTime = scheduleTimes[key];
    const draftText = draftTexts[idx] ?? "";

    if (!selectedDate || !selectedTime) {
      setScheduleError((prev) => ({
        ...prev,
        [key]: "Please select both a date and a time.",
      }));
      return;
    }

    try {
      setScheduleError((prev) => ({ ...prev, [key]: "" }));
      const userTimezone = getBrowserTimezone();
      const scheduledAtUTC = toUTCISOString(selectedDate, selectedTime, userTimezone);

      await scheduleDraft.mutateAsync({
        creationId,
        channelId,
        scheduledAt: scheduledAtUTC,
        text: draftText,
      });

      setScheduledStatus((prev) => ({ ...prev, [key]: true }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to schedule post";
      setScheduleError((prev) => ({ ...prev, [key]: message }));
    }
  };

  const hasUnsavedChanges = useMemo(
    () => creation?.drafts.some((draft, index) => draft.text !== (draftTexts[index] ?? "")) ?? false,
    [creation, draftTexts],
  );

  const handleDraftTextChange = (index: number, nextText: string): void => {
    setSaveMessage("");
    setDraftTexts((currentDraftTexts) => {
      const nextDraftTexts = [...currentDraftTexts];
      nextDraftTexts[index] = nextText;
      return nextDraftTexts;
    });
  };

  const handleSaveDrafts = async (): Promise<void> => {
    if (!creation || !hasUnsavedChanges) {
      return;
    }

    const nextDrafts: CreationDraft[] = creation.drafts.map((draft, index) => ({
      ...draft,
      text: draftTexts[index] ?? draft.text,
    }));

    try {
      setSaveMessage("");
      await updateCreationSession.mutateAsync({
        creationId: creation.id,
        drafts: nextDrafts,
      });
      setSaveMessage("Saved");
    } catch (saveError: unknown) {
      setSaveMessage(saveError instanceof Error ? saveError.message : "Failed to save");
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-5xl items-center justify-center px-6">
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
          Loading your saved draft pack...
        </div>
      </div>
    );
  }

  if (error instanceof Error) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-6 py-10">
        <Link
          href="/workspace/create"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to create
        </Link>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
          <p className="text-sm font-medium text-red-200">Unable to load this draft pack</p>
          <p className="mt-1 text-xs text-red-300/80">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!creation) {
    return null;
  }

  return (
    <div className="mx-auto w-[90%] space-y-8 px-6 py-8">
      <div className="space-y-4">
        <Link
          href="/workspace/create"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to create
        </Link>

        <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Saved draft pack</p>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-zinc-100 md:text-4xl">
              {creation.article?.title ?? "Untitled creation"}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-zinc-400">
              Narrativee generated a reusable channel pack from your selected newsletter issue and platform-native tone setup.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {formatDate(creation.createdAt)}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
                {creation.draftCountPerChannel} per channel
              </span>
              {creation.source?.url ? (
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
                  {creation.source.url.replace("https://", "").replace("/feed", "")}
                </span>
              ) : null}
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                {creation.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <section className="flex flex-row">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Drafts</p>
                <h2 className="mt-1 text-xl font-semibold text-zinc-100">Channel-native outputs</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500">{creation.drafts.length} drafts saved</span>
                <button
                  type="button"
                  disabled={!hasUnsavedChanges || updateCreationSession.isPending}
                  onClick={() => {
                    void handleSaveDrafts();
                  }}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-zinc-200 transition-colors hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updateCreationSession.isPending ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
            {saveMessage ? (
              <p className="mt-3 text-xs text-zinc-500">{saveMessage}</p>
            ) : null}

            <div className="mt-5 grid gap-4 xl:grid-cols-3">
              {creation.drafts.map((draft, index) => (
                <article
                  key={`${draft.channelId}-${draft.angle}-${index}`}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
                >
                  <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                      {getPlatformLogo(draft.platform) ? (
                        <Image
                          src={getPlatformLogo(draft.platform) ?? ""}
                          alt={draft.platform}
                          width={22}
                          height={22}
                          unoptimized
                          className="h-5.5 w-5.5 rounded-full object-contain"
                        />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-semibold uppercase text-zinc-300">
                          {draft.platform.slice(0, 1)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium capitalize text-zinc-100">{draft.platform}</p>
                        <p className="text-xs text-zinc-500">{draft.accountName ?? "Connected account"}</p>
                      </div>
                    </div>
                    <span className="w-fit rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-200">
                      Variation {draft.variantNumber}
                    </span>
                  </div>
                  <div className="mt-5 space-y-5">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Angle</p>
                      <p className="mt-2 max-w-3xl text-sm leading-7 text-zinc-200">{draft.angle}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Draft</p>
                      <textarea
                        value={draftTexts[index] ?? draft.text}
                        onChange={(event) => handleDraftTextChange(index, event.target.value)}
                        rows={10}
                        className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-zinc-950/80 p-5 text-sm leading-8 text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-white/20"
                      />
                    </div>

                    {/* Calendar Scheduling section */}
                    <div className="mt-6 border-t border-white/10 pt-5">
                      {scheduledStatus[`${draft.channelId}-${index}`] ? (
                        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                          <Check className="h-5 w-5 text-emerald-400 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-emerald-200">Scheduled successfully!</p>
                            <p className="text-[11px] text-emerald-300/80 mt-0.5">
                              Post is scheduled for {scheduleDates[`${draft.channelId}-${index}`]} at {scheduleTimes[`${draft.channelId}-${index}`]}.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5" />
                              Schedule Dispatch
                            </p>
                            <span className="text-[10px] text-zinc-500/80 bg-white/[0.03] px-2 py-0.5 rounded-full border border-white/5">
                              {getBrowserTimezone().split("/")[1]?.replace("_", " ") || getBrowserTimezone()} Time
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                              <input
                                type="date"
                                value={scheduleDates[`${draft.channelId}-${index}`] ?? ""}
                                onChange={(e) =>
                                  setScheduleDates((prev) => ({
                                    ...prev,
                                    [`${draft.channelId}-${index}`]: e.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2 text-xs text-zinc-200 outline-none transition-all hover:border-white/20 focus:border-indigo-500/50"
                              />
                            </div>
                            <div className="relative">
                              <input
                                type="time"
                                value={scheduleTimes[`${draft.channelId}-${index}`] ?? ""}
                                onChange={(e) =>
                                  setScheduleTimes((prev) => ({
                                    ...prev,
                                    [`${draft.channelId}-${index}`]: e.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2 text-xs text-zinc-200 outline-none transition-all hover:border-white/20 focus:border-indigo-500/50"
                              />
                            </div>
                          </div>

                          {scheduleError[`${draft.channelId}-${index}`] && (
                            <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
                              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                              <p className="text-[11px] text-red-200">{scheduleError[`${draft.channelId}-${index}`]}</p>
                            </div>
                          )}

                          <button
                            type="button"
                            disabled={scheduleDraft.isPending && scheduleDraft.variables?.channelId === draft.channelId}
                            onClick={() => {
                              void handleSchedulePost(draft.channelId, index, draft.platform);
                            }}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white py-2 text-xs font-semibold tracking-wide transition-all duration-200 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {scheduleDraft.isPending && scheduleDraft.variables?.channelId === draft.channelId ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Scheduling...
                              </>
                            ) : (
                              <>
                                <Clock className="h-3.5 w-3.5" />
                                Schedule {draft.platform} Post
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
