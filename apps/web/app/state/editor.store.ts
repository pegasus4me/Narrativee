import { create } from "zustand";

interface EditorState {
  // Save State
  isSaving: boolean;
  lastSaved: Date | null;

  // Report Metadata
  reportName: string;
  reportId: string | null;

  // Editor Content
  editorContent: string;

  // Actions - Save
  setSaving: (isSaving: boolean) => void;
  setLastSaved: (date: Date) => void;
  markSaved: () => void; // Convenience: setSaving(false) + setLastSaved(now)

  // Actions - Report
  setReportName: (name: string) => void;
  setReportId: (id: string) => void;

  // Actions - Content
  setEditorContent: (content: string) => void;

  // Reset
  reset: () => void;
}

export const useEditorStore = create<EditorState>()((set) => ({
  // Initial State
  isSaving: false,
  lastSaved: null,
  reportName: "",
  reportId: null,
  editorContent: "",

  // Save Actions
  setSaving: (isSaving) => set({ isSaving }),
  setLastSaved: (date) => set({ lastSaved: date }),
  markSaved: () => set({ isSaving: false, lastSaved: new Date() }),

  // Report Actions
  setReportName: (name) => set({ reportName: name }),
  setReportId: (id) => set({ reportId: id }),

  // Content Actions
  setEditorContent: (content) => set({ editorContent: content }),

  // Reset
  reset: () =>
    set({
      isSaving: false,
      lastSaved: null,
      reportName: "",
      reportId: null,
      editorContent: "",
    }),
}));
