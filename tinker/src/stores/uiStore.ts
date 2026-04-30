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

export type ProjectViewMode = "board" | "timeline" | "gallery";

interface UiState {
  // Navigation
  activeShopId: string | null;
  activeWorkbenchId: string | null;
  viewMode: ViewMode;
  projectView: ProjectViewMode;

  // Selection
  selectedItemId: string | null;
  selectedSkillId: string | null;

  // Modals
  modalStack: ModalState[];

  // Search
  searchQuery: string;

  // Toolbar
  viewTabsExpanded: boolean;

  // Sidebar
  sidebarOpen: boolean;
  sidebarWidth: number;

  // Onboarding
  onboardingCompleted: boolean;

  // Theme (for non-CSS contexts like Konva canvas)
  resolvedTheme: "light" | "dark";

  // Actions
  setActiveShop: (id: string | null) => void;
  setActiveWorkbench: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setProjectView: (mode: ProjectViewMode) => void;
  selectItem: (id: string | null) => void;
  selectSkill: (id: string | null) => void;
  openModal: (modal: ModalState) => void;
  closeModal: () => void;
  closeAllModals: () => void;
  setSearchQuery: (query: string) => void;
  setViewTabsExpanded: (expanded: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setResolvedTheme: (theme: "light" | "dark") => void;
  completeOnboarding: () => void;
  resetUi: () => void;
}

const initialUiState = {
  activeShopId: null,
  activeWorkbenchId: null,
  viewMode: "workbench" as ViewMode,
  projectView: "board" as ProjectViewMode,
  selectedItemId: null,
  selectedSkillId: null,
  modalStack: [],
  searchQuery: "",
  viewTabsExpanded: true,
  sidebarOpen: true,
  sidebarWidth: 240,
  onboardingCompleted: false,
  resolvedTheme: "light" as "light" | "dark",
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
          set({
            activeShopId: id,
            activeWorkbenchId: null,
            viewMode: "workbench",
            projectView: "board",
            selectedItemId: null,
          }),

        setActiveWorkbench: (id) =>
          set({ activeWorkbenchId: id, viewMode: "project", projectView: "board", selectedItemId: null }),

        setViewMode: (mode) =>
          set((state) => ({
            viewMode: mode,
            selectedItemId: mode === "project" ? state.selectedItemId : null,
          })),

        setProjectView: (mode) => set({ projectView: mode }),

        selectItem: (id) => set({ selectedItemId: id }),
        selectSkill: (id) => set({ selectedSkillId: id }),

        openModal: (modal) =>
          set((state) => ({ modalStack: [...state.modalStack, modal] })),

        closeModal: () =>
          set((state) => ({ modalStack: state.modalStack.slice(0, -1) })),

        closeAllModals: () => set({ modalStack: [] }),

        setSearchQuery: (query) => set({ searchQuery: query }),

        setViewTabsExpanded: (expanded) => set({ viewTabsExpanded: expanded }),

        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

        setSidebarOpen: (open) => set({ sidebarOpen: open }),

        setSidebarWidth: (width) => set({ sidebarWidth: Math.max(240, Math.min(320, width)) }),

        setResolvedTheme: (theme) => set({ resolvedTheme: theme }),

        completeOnboarding: () => set({ onboardingCompleted: true }),

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
          projectView: state.projectView,
          viewTabsExpanded: state.viewTabsExpanded,
          sidebarOpen: state.sidebarOpen,
          sidebarWidth: state.sidebarWidth,
          onboardingCompleted: state.onboardingCompleted,
        }),
      }
    ),
    { name: "ui-store" }
  )
);
