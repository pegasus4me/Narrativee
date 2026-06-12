"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CalendarDays, Loader2, Calendar, Clock, Check, AlertCircle } from "lucide-react";
import { useCreationSession, useUpdateCreationSession, useScheduleCreationDraft, useRenderCreationCarousel } from "@/app/hooks/api";
import { toUTCISOString, getBrowserTimezone } from "@/app/components/workspace/TimezoneSelect";
import { OrchestrationPipeline } from "@/app/components/workspace/create/OrchestrationPipeline";
import { StrategyInsightCard } from "@/app/components/workspace/create/StrategyInsightCard";
import { ValidationBadge } from "@/app/components/workspace/create/ValidationBadge";
import { OrchestrationDetailPanel } from "@/app/components/workspace/create/OrchestrationDetailPanel";
import { DraftPreviewModal } from "@/app/components/workspace/create/DraftPreviewModal";
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
  const renderCreationCarousel = useRenderCreationCarousel();

  const [editableDrafts, setEditableDrafts] = useState<CreationDraft[]>([]);
  const [saveMessage, setSaveMessage] = useState("");
  const [previewDraftIdx, setPreviewDraftIdx] = useState<number | null>(null);

  // Loaded Creation Session ID (to avoid overwriting unsaved draft edits on background refetch)
  const [loadedCreationId, setLoadedCreationId] = useState<string | null>(null);

  // Scheduling states
  const [scheduleDates, setScheduleDates] = useState<Record<string, string>>({});
  const [scheduleTimes, setScheduleTimes] = useState<Record<string, string>>({});
  const [scheduledStatus, setScheduledStatus] = useState<Record<string, boolean>>({});
  const [scheduleError, setScheduleError] = useState<Record<string, string>>({});

  useEffect(() => {
    if (creation && creation.id !== loadedCreationId) {
      setEditableDrafts(creation.drafts);
      setLoadedCreationId(creation.id);

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
  }, [creation, loadedCreationId]);

  const handleSchedulePost = async (
    draft: CreationDraft,
    idx: number,
  ): Promise<void> => {
    const key = `${draft.channelId}-${idx}`;
    const selectedDate = scheduleDates[key];
    const selectedTime = scheduleTimes[key];
    const draftText = editableDrafts[idx]?.text ?? draft.text;

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

      const result = await scheduleDraft.mutateAsync({
        creationId,
        channelId: draft.channelId,
        variantNumber: draft.variantNumber,
        scheduledAt: scheduledAtUTC,
        text: draftText,
      });

      setScheduledStatus((prev) => ({ ...prev, [key]: true }));

      if (result && (result as any).firstScheduledPostRewarded) {
        toast.success("🎉 Milestone Complete! You scheduled your first post and earned +10 Credits!", {
          duration: 6000,
        });
      } else {
        toast.success("Post scheduled successfully!");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to schedule post";
      setScheduleError((prev) => ({ ...prev, [key]: message }));
      toast.error(message);
    }
  };

  const hasUnsavedChanges = useMemo(
    () => creation ? JSON.stringify(creation.drafts) !== JSON.stringify(editableDrafts) : false,
    [creation, editableDrafts],
  );

  const handleDraftChange = (index: number, nextDraft: CreationDraft): void => {
    setSaveMessage("");
    setEditableDrafts((currentDrafts) => {
      const nextDrafts = [...currentDrafts];
      nextDrafts[index] = nextDraft;
      return nextDrafts;
    });
  };

  const handleSaveDrafts = async (): Promise<void> => {
    if (!creation || !hasUnsavedChanges) {
      return;
    }

    try {
      setSaveMessage("");
      await updateCreationSession.mutateAsync({
        creationId: creation.id,
        drafts: editableDrafts,
      });
      setSaveMessage("Saved");
    } catch (saveError: unknown) {
      setSaveMessage(saveError instanceof Error ? saveError.message : "Failed to save");
    }
  };

  const handleRenderCarousel = async (index: number): Promise<void> => {
    const draft = editableDrafts[index];
    if (!draft?.carousel) {
      return;
    }

    const result = await renderCreationCarousel.mutateAsync({
      creationId,
      channelId: draft.channelId,
      draft,
    });

    handleDraftChange(index, result.draft);
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-5xl items-center justify-center px-6">
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <Loader2 className="h-5 w-5 animate-spin text-brand" />
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
            <p className="text-sm font-medium  text-white">Saved draft pack</p>
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
              <span className="rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs text-brand">
                {creation.draftCountPerChannel} per channel
              </span>
              {creation.source?.url ? (
                <span className="rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs text-brand">
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

      {creation.metadata && (
        <div className="space-y-6">
          <OrchestrationPipeline metadata={creation.metadata} />
          <StrategyInsightCard metadata={creation.metadata} />
        </div>
      )}

      <section className="flex flex-row">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium ">Drafts</p>
                <h2 className="mt-1 text-xl font-light text-zinc-100">Channel-native outputs</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500">{editableDrafts.length} drafts saved</span>
                <button
                  type="button"
                  disabled={!hasUnsavedChanges || updateCreationSession.isPending}
                  onClick={() => {
                    void handleSaveDrafts();
                  }}
                  className="rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand transition-all hover:bg-brand/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updateCreationSession.isPending ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
            {saveMessage ? (
              <p className="mt-3 text-xs text-zinc-500">{saveMessage}</p>
            ) : null}

            <div className={`mt-5 grid gap-4 ${editableDrafts.length === 1 ? "grid-cols-1" : "xl:grid-cols-2"}`}>
              {editableDrafts.map((draft, index) => {
                const channel = creation.selectedChannels.find((c) => c.id === draft.channelId) || null;
                const avatarUrl = channel?.avatarUrl || getPlatformLogo(draft.platform) || undefined;

                return (
                  <article
                    key={`${draft.channelId}-${draft.angle}-${index}`}
                    onClick={() => setPreviewDraftIdx(index)}
                    className="rounded-3xl border border-zinc-800/80 bg-zinc-950/30 p-6 backdrop-blur-md transition-all duration-300 hover:border-brand/40 hover:bg-zinc-950/50 flex flex-col justify-between shadow-lg cursor-pointer group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0 flex items-center justify-center">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={channel?.accountName || draft.platform}
                              className="h-8 w-8 rounded-full object-cover border border-zinc-800"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700/60 text-xs font-semibold uppercase text-zinc-300 font-sans">
                              {(channel?.accountName || draft.platform).charAt(0).toUpperCase()}
                            </div>
                          )}
                          {getPlatformLogo(draft.platform) && (
                            <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-zinc-950 rounded-full flex items-center justify-center shadow-md p-0.5 border border-zinc-800">
                              <img
                                src={getPlatformLogo(draft.platform)!}
                                alt={draft.platform}
                                className="w-3 h-3 object-contain"
                              />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium capitalize text-zinc-100 flex items-center gap-1.5">
                            {draft.platform}
                            {((channel?.accountName || draft.accountName || "").toLowerCase().includes("demo")) && (
                              <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full font-mono uppercase font-semibold">Demo</span>
                            )}
                          </p>
                          <p className="text-xs text-zinc-500">{draft.accountName ?? "Connected account"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="w-fit px-3 py-1 text-xs font-semibold text-zinc-400">
                          Variation {draft.variantNumber}
                        </span>
                        {creation.metadata?.validationResults && (
                          <ValidationBadge
                            platform={draft.platform}
                            validationResults={creation.metadata.validationResults}
                          />
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <p className="text-xs text-zinc-450 line-clamp-2 leading-relaxed bg-white/[0.01] border border-white/5 rounded-xl p-3">
                        {draft.text}
                      </p>

                      {draft.angle && (
                        <p className="text-[10px] text-brand bg-brand/5 border border-brand/10 w-fit px-2 py-0.5 rounded-full italic font-sans">
                          Focus: {draft.angle}
                        </p>
                      )}
                      {draft.carousel ? (
                        <p className="text-[10px] text-violet-300 bg-violet-500/10 border border-violet-400/20 w-fit px-2 py-0.5 rounded-full font-sans">
                          Carousel · {draft.carousel.renderStatus === "rendered" ? "visuals ready" : draft.carousel.renderStatus}
                        </p>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {creation.metadata && (
        <OrchestrationDetailPanel metadata={creation.metadata} />
      )}

      {/* Live Preview Modal */}
      {(() => {
        if (previewDraftIdx === null) return null;
        const activeDraft = editableDrafts[previewDraftIdx];
        if (!activeDraft) return null;
        const activeChannel = creation.selectedChannels.find((ch) => ch.id === activeDraft.channelId) || null;

        const scheduleKey = `${activeDraft.channelId}-${previewDraftIdx}`;
        const selectedDate = scheduleDates[scheduleKey] ?? "";
        const selectedTime = scheduleTimes[scheduleKey] ?? "";
        const scheduled = scheduledStatus[scheduleKey] ?? false;
        const errorMsg = scheduleError[scheduleKey] ?? "";
        const hasActiveDraftUnsavedChanges = creation.drafts.some((draft, index) => (
          index === previewDraftIdx && JSON.stringify(draft) !== JSON.stringify(activeDraft)
        ));

        const handleDateChange = (date: string) => {
          setScheduleDates((prev) => ({ ...prev, [scheduleKey]: date }));
        };
        const handleTimeChange = (time: string) => {
          setScheduleTimes((prev) => ({ ...prev, [scheduleKey]: time }));
        };
        const handleSchedule = async () => {
          await handleSchedulePost(activeDraft, previewDraftIdx);
        };

        return (
          <DraftPreviewModal
            isOpen={true}
            onClose={() => setPreviewDraftIdx(null)}
            draft={activeDraft}
            channel={activeChannel}
            onDraftChange={(nextDraft) => handleDraftChange(previewDraftIdx, nextDraft)}
            onSave={handleSaveDrafts}
            isSaving={updateCreationSession.isPending}
            hasUnsavedChanges={hasActiveDraftUnsavedChanges}
            validationResults={creation.metadata?.validationResults}
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            selectedTime={selectedTime}
            onTimeChange={handleTimeChange}
            onSchedule={handleSchedule}
            isScheduling={scheduleDraft.isPending && scheduleDraft.variables?.channelId === activeDraft.channelId}
            scheduled={scheduled}
            scheduleErrorMsg={errorMsg}
            onRenderCarousel={activeDraft.carousel ? () => handleRenderCarousel(previewDraftIdx) : undefined}
            isRenderingCarousel={
              renderCreationCarousel.isPending &&
              renderCreationCarousel.variables?.channelId === activeDraft.channelId &&
              renderCreationCarousel.variables?.draft.variantNumber === activeDraft.variantNumber
            }
            carouselRenderErrorMessage={
              renderCreationCarousel.isError &&
              renderCreationCarousel.variables?.channelId === activeDraft.channelId &&
              renderCreationCarousel.variables?.draft.variantNumber === activeDraft.variantNumber
                ? renderCreationCarousel.error?.message
                : undefined
            }
          />
        );
      })()}
    </div>
  );
}
