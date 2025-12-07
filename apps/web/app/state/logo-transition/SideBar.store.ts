import { create } from "zustand"

// Define types for state & actions
interface SideBarState {
  opened: boolean;
  toggleSidebar: () => void;
  setSidebar: (opened: boolean) => void;
  isChatOpen: boolean;
  toggleChat: () => void;
  setChatOpen: (isOpen: boolean) => void;
}

// Create store using the curried form of `create`
export const useSideBarStore = create<SideBarState>()((set) => ({
  opened: true,
  toggleSidebar: () => set((state) => ({ opened: !state.opened })),
  setSidebar: (opened) => set({ opened }),
  isChatOpen: false,
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  setChatOpen: (isOpen) => set({ isChatOpen: isOpen }),
}))