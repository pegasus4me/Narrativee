import { create } from "zustand";

interface ShareState {
  // UI State
  isModalOpen: boolean;
  isGenerating: boolean;

  // Share Data
  shareUrl: string;
  viewCount: number;

  // Actions - Modal
  openModal: () => void;
  closeModal: () => void;

  // Actions - Share Link
  setShareUrl: (url: string) => void;
  setViewCount: (count: number) => void;

  // Actions - Generation
  startGenerating: () => void;
  stopGenerating: () => void;

  // Reset
  reset: () => void;
}

export const useShareStore = create<ShareState>()((set) => ({
  // Initial State
  isModalOpen: false,
  isGenerating: false,
  shareUrl: "",
  viewCount: 0,

  // Modal Actions
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),

  // Share Link Actions
  setShareUrl: (url) => set({ shareUrl: url }),
  setViewCount: (count) => set({ viewCount: count }),

  // Generation Actions
  startGenerating: () => set({ isGenerating: true }),
  stopGenerating: () => set({ isGenerating: false }),

  // Reset
  reset: () =>
    set({
      isModalOpen: false,
      isGenerating: false,
      shareUrl: "",
      viewCount: 0,
    }),
}));
