import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

export interface ModalState {
  type: string;
  payload?: Record<string, unknown>;
}

export type ViewMode =
  | "workbench"
  | "project"
  | "scarMap"
  | "constellation"
  | "portfolio"
  | "locker"
  | "review";

interface UiState {
  // Navigation
  activeShopId: string | null;
  activeWorkbenchId: string | null;
  viewMode: ViewMode;

  // Selection
  selectedItemId: string | null;
  selectedSkillId: string | null;

  // Modals
  modalStack: ModalState[];

  // Search
  searchQuery: string;

  // Sidebar
  sidebarOpen: boolean;
  sidebarWidth: number;

  // Theme (for non-CSS contexts like Konva canvas)
  resolvedTheme: "light" | "dark";

  // Actions
  setActiveShop: (id: string | null) => void;
  setActiveWorkbench: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  selectItem: (id: string | null) => void;
  selectSkill: (id: string | null) => void;
  openModal: (modal: ModalState) => void;
  closeModal: () => void;
  closeAllModals: () => void;
  setSearchQuery: (query: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setResolvedTheme: (theme: "light" | "dark") => void;
  resetUi: () => void;
}

const initialUiState = {
  activeShopId: null,
  activeWorkbenchId: null,
  viewMode: "workbench" as ViewMode,
  selectedItemId: null,
  selectedSkillId: null,
  modalStack: [],
  searchQuery: "",
  sidebarOpen: true,
  sidebarWidth: 288,
  resolvedTheme: "dark" as "light" | "dark",
};

const UI_STORE_PERSIST_KEY = "tinker-ui-store";

function getUiStorage(): Storage {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }

  if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
    return globalThis.localStorage as Storage;
  }

  return {
    get length() {
      return 0;
    },
    clear() {},
    getItem() {
      return null;
    },
    key() {
      return null;
    },
    removeItem() {},
    setItem() {},
  };
}

export const useUiStore = create<UiState>()(
  devtools(
    persist(
      (set) => ({
        ...initialUiState,

        setActiveShop: (id) =>
          set({ activeShopId: id, activeWorkbenchId: null, viewMode: "workbench", selectedItemId: null }),

        setActiveWorkbench: (id) =>
          set({ activeWorkbenchId: id, viewMode: "project", selectedItemId: null }),

        setViewMode: (mode) =>
          set((state) => ({
            viewMode: mode,
            selectedItemId: mode === "project" ? state.selectedItemId : null,
          })),

        selectItem: (id) => set({ selectedItemId: id }),
        selectSkill: (id) => set({ selectedSkillId: id }),

        openModal: (modal) =>
          set((state) => ({ modalStack: [...state.modalStack, modal] })),

        closeModal: () =>
          set((state) => ({ modalStack: state.modalStack.slice(0, -1) })),

        closeAllModals: () => set({ modalStack: [] }),

        setSearchQuery: (query) => set({ searchQuery: query }),

        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

        setSidebarOpen: (open) => set({ sidebarOpen: open }),

        setSidebarWidth: (width) => set({ sidebarWidth: Math.max(248, Math.min(420, width)) }),

        setResolvedTheme: (theme) => set({ resolvedTheme: theme }),

        resetUi: () => {
          getUiStorage().removeItem(UI_STORE_PERSIST_KEY);
          set(initialUiState);
        },
      }),
      {
        name: UI_STORE_PERSIST_KEY,
        storage: createJSONStorage(getUiStorage),
        partialize: (state) => ({
          activeShopId: state.activeShopId,
          activeWorkbenchId: state.activeWorkbenchId,
          viewMode: state.viewMode,
          sidebarOpen: state.sidebarOpen,
          sidebarWidth: state.sidebarWidth,
        }),
      }
    ),
    { name: "ui-store" }
  )
);
