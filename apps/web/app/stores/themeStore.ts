import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "dark" | "light";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "dark",

      setTheme: (theme: Theme) => {
        if (typeof document !== "undefined") {
          if (theme === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
          // Maintain compatibility with the head anti-flicker script
          localStorage.setItem("theme", theme);
        }
        set({ theme });
      },

      toggleTheme: () => {
        const isCurrentlyDark =
          typeof document !== "undefined"
            ? document.documentElement.classList.contains("dark")
            : get().theme === "dark";
        const nextTheme: Theme = isCurrentlyDark ? "light" : "dark";
        get().setTheme(nextTheme);
      },
    }),
    {
      name: "theme-storage",
      onRehydrateStorage: () => (state) => {
        if (typeof window !== "undefined") {
          const stored = (localStorage.getItem("theme") as Theme) || state?.theme || "dark";
          if (stored === "light") {
            document.documentElement.classList.remove("dark");
          } else {
            document.documentElement.classList.add("dark");
          }
          if (state && state.theme !== stored) {
            state.theme = stored;
          }
        }
      },
    }
  )
);
