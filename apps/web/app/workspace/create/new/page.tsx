"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useSources } from "@/app/hooks/api/useSources";
import { useCreateCreationSession, useKnowledgeBase, useStartMemoryLearning } from "@/app/hooks/api";
import { useArticles, useExtractAngles } from "@/app/hooks/api/useArticles";
import { useChannels } from "@/app/hooks/api/useChannels";
import { ArticleList } from "@/app/components/workspace/create/ArticleList";
import { AnglePicker } from "@/app/components/workspace/create/AnglePicker";
import { SocialChannelSelector } from "@/app/components/workspace/create/SocialChannelSelector";
import { useCreateFlowStore } from "@/app/state/CreateFlow.store";
import type { ArticleListItem, Source } from "@/app/types/api";

const LEARNING_STEPS = [
  "Retrieving memory...",
  "Setting up your voice...",
  "Harmonizing your tone with native platforms...",
];

const NATIVE_TONE_STEPS = [
  "Reading your channel memory...",
  "Mapping native tone for each selected social...",
  "Blending memory with external platform signals...",
];

/**
 * Create workspace entry flow for selecting a connected newsletter source.
 */
function NewCreateFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const articleIdParam = searchParams.get("articleId");
  const { data: sourcesData, isLoading } = useSources(true);
  const startMemoryLearning = useStartMemoryLearning();
  const createCreationSession = useCreateCreationSession();
  const [learningStepIndex, setLearningStepIndex] = useState(0);
  const [hasRetriedArticles, setHasRetriedArticles] = useState(false);
  const selectedSourceId = useCreateFlowStore((state) => state.selectedSourceId);
  const selectedArticle = useCreateFlowStore((state) => state.selectedArticle);
  const selectedArticleId = useCreateFlowStore((state) => state.selectedArticleId);
  const selectedAngles = useCreateFlowStore((state) => state.selectedAngles);
  const hasConfirmedAngles = useCreateFlowStore((state) => state.hasConfirmedAngles);
  const selectedChannelIds = useCreateFlowStore((state) => state.selectedChannelIds);
  const requestedDraftCount = useCreateFlowStore((state) => state.requestedDraftCount);
  const ideas = useCreateFlowStore((state) => state.ideas);
  const ideasError = useCreateFlowStore((state) => state.ideasError);
  const ideasMeta = useCreateFlowStore((state) => state.ideasMeta);
  const loadingIdeasForArticleId = useCreateFlowStore((state) => state.loadingIdeasForArticleId);
  const isReadyVisible = useCreateFlowStore((state) => state.isReadyVisible);
  const shouldPollKnowledgeBase = useCreateFlowStore((state) => state.shouldPollKnowledgeBase);
  const isPreparingNativeTone = useCreateFlowStore((state) => state.isPreparingNativeTone);
  const isNativeToneReady = useCreateFlowStore((state) => state.isNativeToneReady);
  const isGeneratingCreation = useCreateFlowStore((state) => state.isGeneratingCreation);
  const creationError = useCreateFlowStore((state) => state.creationError);
  const setSelectedSourceId = useCreateFlowStore((state) => state.setSelectedSourceId);
  const setSelectedArticle = useCreateFlowStore((state) => state.setSelectedArticle);
  const setSelectedAngles = useCreateFlowStore((state) => state.setSelectedAngles);
  const setHasConfirmedAngles = useCreateFlowStore((state) => state.setHasConfirmedAngles);
  const setSelectedChannelIds = useCreateFlowStore((state) => state.setSelectedChannelIds);
  const setRequestedDraftCount = useCreateFlowStore((state) => state.setRequestedDraftCount);
  const setIdeas = useCreateFlowStore((state) => state.setIdeas);
  const setIdeasError = useCreateFlowStore((state) => state.setIdeasError);
  const setIdeasMeta = useCreateFlowStore((state) => state.setIdeasMeta);
  const setLoadingIdeasForArticleId = useCreateFlowStore((state) => state.setLoadingIdeasForArticleId);
  const setIsReadyVisible = useCreateFlowStore((state) => state.setIsReadyVisible);
  const setShouldPollKnowledgeBase = useCreateFlowStore((state) => state.setShouldPollKnowledgeBase);
  const setIsPreparingNativeTone = useCreateFlowStore((state) => state.setIsPreparingNativeTone);
  const setIsNativeToneReady = useCreateFlowStore((state) => state.setIsNativeToneReady);
  const setIsGeneratingCreation = useCreateFlowStore((state) => state.setIsGeneratingCreation);
  const setCreationError = useCreateFlowStore((state) => state.setCreationError);
  const resetArticleStep = useCreateFlowStore((state) => state.resetArticleStep);
  const resetAll = useCreateFlowStore((state) => state.resetAll);
  const toggleAngle = useCreateFlowStore((state) => state.toggleAngle);
  const toggleChannel = useCreateFlowStore((state) => state.toggleChannel);
  const { data: knowledgeBase } = useKnowledgeBase(true, shouldPollKnowledgeBase ? 2000 : false);
  const { data: articlesData, isLoading: areArticlesLoading, error: articlesError, refetch: refetchArticles } = useArticles(isReadyVisible || Boolean(articleIdParam));
  const { data: channelsData, isLoading: areChannelsLoading } = useChannels(isReadyVisible && selectedAngles.size > 0);
  const extractAngles = useExtractAngles();
  const [nativeToneStepIndex, setNativeToneStepIndex] = useState(0);

  const sources = useMemo<Source[]>(() => sourcesData ?? [], [sourcesData]);
  const channels = useMemo(() => channelsData ?? [], [channelsData]);
  const selectedSource = useMemo(
    () => sources.find((source) => source.id === selectedSourceId),
    [sources, selectedSourceId],
  );
  const filteredArticles = useMemo(
    () => {
      const allArticles = articlesData ?? [];
      const sourceMatchedArticles = allArticles.filter((article) => article.sourceId === selectedSourceId);
      if (sourceMatchedArticles.length > 0) {
        return sourceMatchedArticles;
      }
      return allArticles;
    },
    [articlesData, selectedSourceId],
  );
  const isLearning = knowledgeBase?.voiceMemory.status === "learning";
  const currentLearningStep = LEARNING_STEPS[learningStepIndex] ?? LEARNING_STEPS[0];
  const currentNativeToneStep = NATIVE_TONE_STEPS[nativeToneStepIndex] ?? NATIVE_TONE_STEPS[0];
  const selectedChannelLabels = useMemo(
    () => channels.filter((channel) => selectedChannelIds.has(channel.id)).map((channel) => channel.accountName),
    [channels, selectedChannelIds],
  );
  const selectedChannelCount = selectedChannelIds.size;
  const selectedAngleIdeas = useMemo(
    () => ideas.filter((_idea, index) => selectedAngles.has(index)),
    [ideas, selectedAngles],
  );
  const shouldExpectArticles = (selectedSource?.articleCount ?? 0) > 0;

  useEffect(() => {
    if (sources.length === 0) {
      resetAll();
      return;
    }
    const firstSource = sources[0];
    if (!selectedSourceId) {
      if (firstSource) {
        setSelectedSourceId(firstSource.id);
      }
    }
  }, [resetAll, selectedSourceId, setSelectedSourceId, sources]);

  useEffect(() => {
    if (!selectedSourceId) {
      resetAll();
    }
  }, [resetAll, selectedSourceId]);

  useEffect(() => {
    resetArticleStep();
    setHasRetriedArticles(false);
  }, [resetArticleStep, selectedSourceId]);

  useEffect(() => {
    setCreationError("");
    setIsGeneratingCreation(false);
  }, [selectedArticleId, selectedChannelIds, selectedAngles, setCreationError, setIsGeneratingCreation]);

  useEffect(() => {
    if (!isLearning) {
      setLearningStepIndex(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setLearningStepIndex((currentStepIndex) => (
        (currentStepIndex + 1) % LEARNING_STEPS.length
      ));
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isLearning]);

  useEffect(() => {
    if (!isPreparingNativeTone) {
      setNativeToneStepIndex(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setNativeToneStepIndex((currentStepIndex) => (
        (currentStepIndex + 1) % NATIVE_TONE_STEPS.length
      ));
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPreparingNativeTone]);

  useEffect(() => {
    if (!isPreparingNativeTone) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsPreparingNativeTone(false);
      setIsNativeToneReady(true);
    }, 7000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isPreparingNativeTone, setIsNativeToneReady, setIsPreparingNativeTone]);

  useEffect(() => {
    const isReady =
      knowledgeBase?.voiceMemory.status === "ready" &&
      knowledgeBase.voiceMemory.lastLearnedSourceId === selectedSourceId;
    setIsReadyVisible(Boolean(isReady));
    if (isReady || knowledgeBase?.voiceMemory.status === "failed") {
      setShouldPollKnowledgeBase(false);
    }
  }, [knowledgeBase?.voiceMemory.lastLearnedSourceId, knowledgeBase?.voiceMemory.status, selectedSourceId]);

  useEffect(() => {
    if (!isReadyVisible || areArticlesLoading || !shouldExpectArticles || hasRetriedArticles) {
      return;
    }
    if (filteredArticles.length === 0) {
      setHasRetriedArticles(true);
      void refetchArticles();
    }
  }, [areArticlesLoading, filteredArticles.length, hasRetriedArticles, isReadyVisible, refetchArticles, shouldExpectArticles]);

  useEffect(() => {
    if (articleIdParam && articlesData && articlesData.length > 0 && !selectedArticle) {
      const article = articlesData.find((art) => art.id === articleIdParam);
      if (article) {
        setSelectedSourceId(article.sourceId || "");
        setIsReadyVisible(true);
        void handleSelectArticle(article, false);
      }
    }
  }, [articleIdParam, articlesData, selectedArticle]);

  const handleStartLearning = async (): Promise<void> => {
    if (!selectedSourceId) return;
    setIsReadyVisible(false);
    setShouldPollKnowledgeBase(true);
    await startMemoryLearning.mutateAsync(selectedSourceId);
  };

  const handleSelectArticle = async (article: ArticleListItem, force: boolean): Promise<void> => {
    setSelectedArticle(article);
    setSelectedAngles(new Set<number>());
    setHasConfirmedAngles(false);
    setSelectedChannelIds(new Set<string>());
    setIsNativeToneReady(false);
    setIsPreparingNativeTone(false);
    setCreationError("");
    setIdeasError("");
    setLoadingIdeasForArticleId(article.id);

    try {
      const result = await extractAngles.mutateAsync({ articleId: article.id, force });
      setIdeas(result.ideas);
      setIdeasMeta({ cached: result.cached });
    } catch (error: unknown) {
      setIdeas([]);
      setIdeasMeta(null);
      setIdeasError(error instanceof Error ? error.message : "Failed to extract angles");
    } finally {
      setLoadingIdeasForArticleId("");
    }
  };

  const handleToggleAngle = (index: number): void => {
    toggleAngle(index);
  };

  const handleAddCustomAngle = (angle: string): void => {
    const nextIdeas = [...ideas, angle];
    setIdeas(nextIdeas);
    setSelectedAngles(new Set<number>([...selectedAngles, nextIdeas.length - 1]));
  };

  const handleBackToArticles = (): void => {
    resetArticleStep();
  };

  const handleProceedToChannels = (): void => {
    if (selectedAngles.size === 0) {
      return;
    }

    setCreationError("");
    setHasConfirmedAngles(true);
  };

  const handleContinueToNativeTone = (): void => {
    if (selectedChannelIds.size === 0) {
      return;
    }
    setCreationError("");
    setIsNativeToneReady(false);
    setIsPreparingNativeTone(true);
  };

  const handleGenerateDrafts = async (): Promise<void> => {
    if (!selectedSourceId || !selectedArticle || selectedAngleIdeas.length === 0 || selectedChannelIds.size === 0) {
      return;
    }

    setCreationError("");
    setIsGeneratingCreation(true);

    try {
      const result = await createCreationSession.mutateAsync({
        sourceId: selectedSourceId,
        articleId: selectedArticle.id,
        selectedAngles: selectedAngleIdeas,
        selectedChannelIds: Array.from(selectedChannelIds),
        draftCount: requestedDraftCount,
      });
      router.push(`/workspace/create/${result.creationId}`);
    } catch (error: unknown) {
      setCreationError(error instanceof Error ? error.message : "Failed to generate drafts");
    } finally {
      setIsGeneratingCreation(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 mt-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">New creation</h1>
        <p className="text-sm text-zinc-400">Select a newsletter source, then let Narrativee learn your voice and tone.</p>
      </header>

      <section className="border-l border-white/10 p-5">
        <h2 className="text-sm font-semibold text-zinc-100">1. Select newsletter source</h2>

        {isLoading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading connected newsletters...
          </div>
        ) : sources.length === 0 ? (
          <div className="mt-4  p-4 text-sm text-zinc-400">
            No newsletter connected yet.{" "}
            <Link href="/workspace/channels" className="font-medium text-[#e99ab1] hover:text-[#e99ab1]/80">
              Connect one in Channels
            </Link>
            .
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {sources.map((source) => {
              const isSelected = source.id === selectedSourceId;
              return (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => setSelectedSourceId(source.id)}
                  className={`rounded-xl border p-4 text-left transition-colors ${isSelected
                    ? "border-[#e99ab1] bg-[#e99ab1]/10"
                    : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                    }`}
                >
                  <p className="truncate text-sm font-medium text-zinc-100">
                    {source.url.replace("https://", "").replace("/feed", "")}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">{source.articleCount ?? 0} synced articles</p>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-4">
          <button
            type="button"
            disabled={!selectedSourceId || isLearning || startMemoryLearning.isPending}
            onClick={handleStartLearning}
            className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
          >
            {startMemoryLearning.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {isReadyVisible ? "Re-learn voice" : "Start learning"}
          </button>
        </div>
      </section>

      {isLearning && selectedSource && (
        <section className=" p-6">
          <div className="flex items-start gap-3 text-zinc-200">
            <Loader2 className="h-5 w-5 animate-spin text-[#e99ab1]" />
            <div>
              <p className="text-sm font-medium">{currentLearningStep}</p>
              <ul className="mt-2 space-y-1">
                {LEARNING_STEPS.map((step) => (
                  <li
                    key={step}
                    className={`text-xs ${step === currentLearningStep ? "text-zinc-200" : "text-zinc-400"}`}
                  >
                    {step}
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-xs text-zinc-500">
                Source: {selectedSource.url.replace("https://", "").replace("/feed", "")}
              </p>
            </div>
          </div>
        </section>
      )}

      {isReadyVisible && selectedSource && !isLearning && (
        <section className="p-6">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4">
            <p className="text-sm font-medium text-emerald-200">Ready</p>
            <p className="mt-1 text-xs text-emerald-300/80">
              Narrativee finished learning from {selectedSource.url.replace("https://", "").replace("/feed", "")}.
            </p>
          </div>
        </section>
      )}

      {knowledgeBase?.voiceMemory.status === "failed" && selectedSource && !isLearning && (
        <section className="p-6">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4">
            <p className="text-sm font-medium text-red-200">Memory learning failed</p>
            <p className="mt-1 text-xs text-red-300/80">
              Narrativee could not finish learning from {selectedSource.url.replace("https://", "").replace("/feed", "")}.
              Try again once your source content is synced.
            </p>
          </div>
        </section>
      )}

      {isReadyVisible && !selectedArticle && (
        <section className="space-y-3 p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Step 2</p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-100">Choose the newsletter issue to repurpose</h2>
          </div>
          <ArticleList
            articles={filteredArticles}
            loading={areArticlesLoading || (shouldExpectArticles && filteredArticles.length === 0)}
            error={articlesError instanceof Error ? articlesError.message : ""}
            selectedId={selectedArticleId || undefined}
            loadingIdeasForId={loadingIdeasForArticleId || undefined}
            onSelect={(article) => {
              void handleSelectArticle(article, false);
            }}
            onRefresh={() => {
              void refetchArticles();
            }}
          />
        </section>
      )}

      {isReadyVisible && selectedArticle && (
        <section className="space-y-3 p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Step 3</p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-100">Atomic extraction of potential angles</h2>
          </div>
          <AnglePicker
            article={{ id: selectedArticle.id, title: selectedArticle.title }}
            ideas={ideas}
            loading={extractAngles.isPending}
            error={ideasError}
            selectedAngles={selectedAngles}
            ideasMeta={ideasMeta}
            isGenerating={false}
            onToggleAngle={handleToggleAngle}
            onAddCustomAngle={handleAddCustomAngle}
            onReExtract={() => {
              void handleSelectArticle(selectedArticle, true);
            }}
            onGenerate={handleProceedToChannels}
            onBack={handleBackToArticles}
            actionLabel="Continue to channels"
          />
        </section>
      )}

      {isReadyVisible && selectedArticle && hasConfirmedAngles && selectedAngles.size > 0 && (
        <section className="space-y-3 p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Step 4</p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-100">Choose the socials for draft generation</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Select where Narrativee should compile native drafts from your chosen angles.
            </p>
          </div>
          {areChannelsLoading ? (
            <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 text-sm text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading connected social channels...
            </div>
          ) : (
            <SocialChannelSelector
              channels={channels}
              selectedChannelIds={selectedChannelIds}
              requestedDraftCount={requestedDraftCount}
              isPreparingNativeTone={isPreparingNativeTone}
              onToggleChannel={toggleChannel}
              onDraftCountChange={setRequestedDraftCount}
              onContinue={handleContinueToNativeTone}
            />
          )}
        </section>
      )}

      {isPreparingNativeTone && (
        <section className="p-6">
          <div className="flex items-start gap-3 text-zinc-200">
            <Loader2 className="h-5 w-5 animate-spin text-[#e99ab1]" />
            <div>
              <p className="text-sm font-medium">{currentNativeToneStep}</p>
              <ul className="mt-2 space-y-1">
                {NATIVE_TONE_STEPS.map((step) => (
                  <li
                    key={step}
                    className={`text-xs ${step === currentNativeToneStep ? "text-zinc-200" : "text-zinc-400"}`}
                  >
                    {step}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-zinc-500">
                Using memory plus external resources for {selectedChannelLabels.join(", ")} and preparing{" "}
                {requestedDraftCount * selectedChannelCount} draft
                {requestedDraftCount * selectedChannelCount === 1 ? "" : "s"}.
              </p>
            </div>
          </div>
        </section>
      )}

      {isNativeToneReady && !isPreparingNativeTone && selectedChannelLabels.length > 0 && (
        <section className="space-y-3 p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Step 5</p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-100">Generate saved draft pack</h2>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4">
            <p className="text-sm font-medium text-emerald-200">Native tone ready</p>
            <p className="mt-1 text-xs text-emerald-300/80">
              Narrativee prepared channel-native tone guidance for {selectedChannelLabels.join(", ")} and will generate{" "}
              {requestedDraftCount} draft {requestedDraftCount === 1 ? "variant" : "variants"} per selected social.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={isGeneratingCreation}
                onClick={() => {
                  void handleGenerateDrafts();
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
              >
                {isGeneratingCreation ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating drafts...
                  </>
                ) : (
                  <>
                    Generate drafts
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
              {creationError ? <p className="text-xs text-red-300">{creationError}</p> : null}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default function NewCreatePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <Loader2 className="h-5 w-5 animate-spin text-[#e99ab1]" />
          Loading creator flow...
        </div>
      </div>
    }>
      <NewCreateFlow />
    </Suspense>
  );
}
