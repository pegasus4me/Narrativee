import { create } from "zustand";

interface Report {
  id: string;
  name: string;
  fileName: string;
  createdAt: string;
  audience?: string;
  reportStyle?: string;
  shareId?: string | null;
  isShared?: boolean;
  viewCount?: number;
}

interface ReportsState {
  // Data
  reports: Report[];
  isLoading: boolean;
  error: string | null;

  // Actions - Fetch
  setReports: (reports: Report[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Actions - CRUD
  addReport: (report: Report) => void;
  updateReport: (id: string, updates: Partial<Report>) => void;
  deleteReport: (id: string) => void;

  // Actions - Find
  getReportById: (id: string) => Report | undefined;

  // Reset
  reset: () => void;
}

export const useReportsStore = create<ReportsState>()((set, get) => ({
  // Initial State
  reports: [],
  isLoading: false,
  error: null,

  // Fetch Actions
  setReports: (reports) => set({ reports, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),

  // CRUD Actions
  addReport: (report) =>
    set((state) => ({
      reports: [report, ...state.reports],
    })),

  updateReport: (id, updates) =>
    set((state) => ({
      reports: state.reports.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),

  deleteReport: (id) =>
    set((state) => ({
      reports: state.reports.filter((r) => r.id !== id),
    })),

  // Find Action
  getReportById: (id) => {
    return get().reports.find((r) => r.id === id);
  },

  // Reset
  reset: () =>
    set({
      reports: [],
      isLoading: false,
      error: null,
    }),
}));
