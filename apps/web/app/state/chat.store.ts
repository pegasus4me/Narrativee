import { create } from "zustand";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "question" | "edit" | "upload";
}

interface ChatState {
  // UI State
  isOpen: boolean;
  isLoading: boolean;

  // Message State
  messages: Message[];
  input: string;
  uploadedFile: File | null;

  // Actions - UI
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;

  // Actions - Messages
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  setMessages: (messages: Message[]) => void;

  // Actions - Input
  setInput: (input: string) => void;
  clearInput: () => void;

  // Actions - File Upload
  setUploadedFile: (file: File | null) => void;
  clearUploadedFile: () => void;

  // Actions - Loading
  setLoading: (isLoading: boolean) => void;

  // Reset all state
  reset: () => void;
}

const initialMessage: Message = {
  role: "assistant",
  content:
    "Hi! I can help you:\n• Answer questions about your report\n• Add new sections or insights\n• Upload new data to regenerate the report\n\nWhat would you like to do?",
  timestamp: new Date(),
  type: "question",
};

export const useChatStore = create<ChatState>()((set) => ({
  // Initial State
  isOpen: false,
  isLoading: false,
  messages: [initialMessage],
  input: "",
  uploadedFile: null,

  // UI Actions
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  openChat: () => set({ isOpen: true }),
  closeChat: () => set({ isOpen: false }),

  // Message Actions
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  clearMessages: () => set({ messages: [initialMessage] }),
  setMessages: (messages) => set({ messages }),

  // Input Actions
  setInput: (input) => set({ input }),
  clearInput: () => set({ input: "" }),

  // File Upload Actions
  setUploadedFile: (file) => set({ uploadedFile: file }),
  clearUploadedFile: () => set({ uploadedFile: null }),

  // Loading Actions
  setLoading: (isLoading) => set({ isLoading }),

  // Reset
  reset: () =>
    set({
      isOpen: false,
      isLoading: false,
      messages: [initialMessage],
      input: "",
      uploadedFile: null,
    }),
}));
