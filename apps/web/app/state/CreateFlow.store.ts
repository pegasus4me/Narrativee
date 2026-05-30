import { create } from "zustand";
import type { ArticleListItem } from "@/app/types/api";

interface CreateFlowState {
  selectedSourceId: string;
  selectedArticle: ArticleListItem | null;
  selectedArticleId: string;
  selectedAngles: Set<number>;
  hasConfirmedAngles: boolean;
  selectedChannelIds: Set<string>;
  requestedDraftCount: number;
  ideas: string[];
  ideasError: string;
  ideasMeta: { cached?: boolean } | null;
  loadingIdeasForArticleId: string;
  isReadyVisible: boolean;
  shouldPollKnowledgeBase: boolean;
  isPreparingNativeTone: boolean;
  isNativeToneReady: boolean;
  isGeneratingCreation: boolean;
  creationError: string;
  setSelectedSourceId: (sourceId: string) => void;
  setSelectedArticle: (article: ArticleListItem | null) => void;
  setSelectedAngles: (selectedAngles: Set<number>) => void;
  setHasConfirmedAngles: (hasConfirmedAngles: boolean) => void;
  setSelectedChannelIds: (selectedChannelIds: Set<string>) => void;
  setRequestedDraftCount: (requestedDraftCount: number) => void;
  setIdeas: (ideas: string[]) => void;
  setIdeasError: (ideasError: string) => void;
  setIdeasMeta: (ideasMeta: { cached?: boolean } | null) => void;
  setLoadingIdeasForArticleId: (articleId: string) => void;
  setIsReadyVisible: (isReadyVisible: boolean) => void;
  setShouldPollKnowledgeBase: (shouldPollKnowledgeBase: boolean) => void;
  setIsPreparingNativeTone: (isPreparingNativeTone: boolean) => void;
  setIsNativeToneReady: (isNativeToneReady: boolean) => void;
  setIsGeneratingCreation: (isGeneratingCreation: boolean) => void;
  setCreationError: (creationError: string) => void;
  resetArticleStep: () => void;
  resetAll: () => void;
  toggleAngle: (index: number) => void;
  toggleChannel: (channelId: string) => void;
}

const createEmptyAngleSelection = (): Set<number> => new Set<number>();
const createEmptyChannelSelection = (): Set<string> => new Set<string>();

/**
 * Shared multi-step state for the Create workflow.
 */
export const useCreateFlowStore = create<CreateFlowState>()((set) => ({
  selectedSourceId: "",
  selectedArticle: null,
  selectedArticleId: "",
  selectedAngles: createEmptyAngleSelection(),
  hasConfirmedAngles: false,
  selectedChannelIds: createEmptyChannelSelection(),
  requestedDraftCount: 2,
  ideas: [],
  ideasError: "",
  ideasMeta: null,
  loadingIdeasForArticleId: "",
  isReadyVisible: false,
  shouldPollKnowledgeBase: false,
  isPreparingNativeTone: false,
  isNativeToneReady: false,
  isGeneratingCreation: false,
  creationError: "",
  setSelectedSourceId: (sourceId) => set({ selectedSourceId: sourceId }),
  setSelectedArticle: (article) =>
    set({
      selectedArticle: article,
      selectedArticleId: article?.id ?? "",
    }),
  setSelectedAngles: (selectedAngles) => set({ selectedAngles }),
  setHasConfirmedAngles: (hasConfirmedAngles) => set({ hasConfirmedAngles }),
  setSelectedChannelIds: (selectedChannelIds) => set({ selectedChannelIds }),
  setRequestedDraftCount: (requestedDraftCount) => set({ requestedDraftCount }),
  setIdeas: (ideas) => set({ ideas }),
  setIdeasError: (ideasError) => set({ ideasError }),
  setIdeasMeta: (ideasMeta) => set({ ideasMeta }),
  setLoadingIdeasForArticleId: (loadingIdeasForArticleId) => set({ loadingIdeasForArticleId }),
  setIsReadyVisible: (isReadyVisible) => set({ isReadyVisible }),
  setShouldPollKnowledgeBase: (shouldPollKnowledgeBase) => set({ shouldPollKnowledgeBase }),
  setIsPreparingNativeTone: (isPreparingNativeTone) => set({ isPreparingNativeTone }),
  setIsNativeToneReady: (isNativeToneReady) => set({ isNativeToneReady }),
  setIsGeneratingCreation: (isGeneratingCreation) => set({ isGeneratingCreation }),
  setCreationError: (creationError) => set({ creationError }),
  resetArticleStep: () =>
    set({
      selectedArticle: null,
      selectedArticleId: "",
      selectedAngles: createEmptyAngleSelection(),
      hasConfirmedAngles: false,
      selectedChannelIds: createEmptyChannelSelection(),
      requestedDraftCount: 2,
      ideas: [],
      ideasError: "",
      ideasMeta: null,
      loadingIdeasForArticleId: "",
      isPreparingNativeTone: false,
      isNativeToneReady: false,
      isGeneratingCreation: false,
      creationError: "",
    }),
  resetAll: () =>
    set({
      selectedSourceId: "",
      selectedArticle: null,
      selectedArticleId: "",
      selectedAngles: createEmptyAngleSelection(),
      hasConfirmedAngles: false,
      selectedChannelIds: createEmptyChannelSelection(),
      requestedDraftCount: 2,
      ideas: [],
      ideasError: "",
      ideasMeta: null,
      loadingIdeasForArticleId: "",
      isReadyVisible: false,
      shouldPollKnowledgeBase: false,
      isPreparingNativeTone: false,
      isNativeToneReady: false,
      isGeneratingCreation: false,
      creationError: "",
    }),
  toggleAngle: (index) =>
    set((state) => {
      const nextSelection = new Set(state.selectedAngles);
      if (nextSelection.has(index)) {
        nextSelection.delete(index);
      } else {
        nextSelection.add(index);
      }
      return { selectedAngles: nextSelection };
    }),
  toggleChannel: (channelId) =>
    set((state) => {
      const nextSelection = new Set(state.selectedChannelIds);
      if (nextSelection.has(channelId)) {
        nextSelection.delete(channelId);
      } else {
        nextSelection.add(channelId);
      }
      return { selectedChannelIds: nextSelection };
    }),
}));
