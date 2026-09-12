import { create } from "zustand";
import { devtools } from "zustand/middleware";

/**
 * Example global UI store.
 *
 * Store conventions:
 * - One store per domain, file named `<domain>.store.ts`.
 * - State and actions live in the same slice; actions are plain functions.
 * - Wrap with `devtools` in development for time-travel debugging.
 * - Select narrow slices in components: `useUIStore((s) => s.sidebarOpen)`.
 */

interface UIState {
  sidebarOpen: boolean;
  theme: "light" | "dark" | "system";
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  setTheme: (theme: UIState["theme"]) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      sidebarOpen: false,
      theme: "system",
      openSidebar: () => set({ sidebarOpen: true }, false, "ui/openSidebar"),
      closeSidebar: () => set({ sidebarOpen: false }, false, "ui/closeSidebar"),
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen }), false, "ui/toggleSidebar"),
      setTheme: (theme) => set({ theme }, false, "ui/setTheme"),
    }),
    { name: "ui-store", enabled: process.env.NODE_ENV === "development" },
  ),
);
