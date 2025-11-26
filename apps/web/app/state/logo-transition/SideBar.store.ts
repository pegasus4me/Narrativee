import {create} from "zustand"

// Define types for state & actions
interface SideBarState {
    opened: boolean;
    toggleSidebar: () => void;
    setSidebar: (opened: boolean) => void;
}

// Create store using the curried form of `create`
export const useSideBarStore = create<SideBarState>()((set) => ({
  opened: true,
  toggleSidebar: () => set((state) => ({ opened: !state.opened })),
  setSidebar: (opened) => set({ opened }),
}))