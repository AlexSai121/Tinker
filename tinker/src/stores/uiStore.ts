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
  | "recentlyOpened"
  | "review";

export type ProjectViewMode = "board" | "timeline" | "gallery";

export interface HistoryCommand {
  label: string;
  undo: () => void | Promise<void>;
  redo: () => void | Promise<void>;
}

interface UiState {
  // Navigation
  activeShopId: string | null;
  activeWorkbenchId: string | null;
  viewMode: ViewMode;
  projectView: ProjectViewMode;

  // Selection
  selectedItemId: string | null;
  selectedItemIds: string[];
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
  tourActive: boolean;

  // Theme (for non-CSS contexts like Konva canvas)
  resolvedTheme: "light" | "dark";

  // Clipboard
  clipboard: { type: "items"; workbenchId: string; data: any[] } | null;

  // History
  historyPast: HistoryCommand[];
  historyFuture: HistoryCommand[];

  // Actions
  setActiveShop: (id: string | null) => void;
  setActiveWorkbench: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setProjectView: (mode: ProjectViewMode) => void;
  selectItem: (id: string | null) => void;
  selectItems: (ids: string[]) => void;
  toggleItemSelection: (id: string) => void;
  clearSelection: () => void;
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
  startTour: () => void;
  stopTour: () => void;
  setClipboard: (clipboard: { type: "items"; workbenchId: string; data: any[] } | null) => void;
  pushHistory: (command: HistoryCommand) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  resetUi: () => void;
}

const initialUiState = {
  activeShopId: null,
  activeWorkbenchId: null,
  viewMode: "workbench" as ViewMode,
  projectView: "board" as ProjectViewMode,
  selectedItemId: null,
  selectedItemIds: [],
  selectedSkillId: null,
  modalStack: [],
  searchQuery: "",
  viewTabsExpanded: true,
  sidebarOpen: true,
  sidebarWidth: 240,
  onboardingCompleted: false,
  tourActive: false,
  resolvedTheme: "light" as "light" | "dark",
  clipboard: null,
  historyPast: [],
  historyFuture: [],
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
            selectedItemIds: [],
          }),

        setActiveWorkbench: (id) =>
          set({ activeWorkbenchId: id, viewMode: "project", projectView: "board", selectedItemId: null, selectedItemIds: [] }),

        setViewMode: (mode) =>
          set((state) => ({
            viewMode: mode,
            selectedItemId: mode === "project" ? state.selectedItemId : null,
          })),

        setProjectView: (mode) => set({ projectView: mode }),

        selectItem: (id) =>
          set((state) => ({
            selectedItemId: id,
            selectedItemIds: id ? (state.selectedItemIds.includes(id) ? state.selectedItemIds : [id]) : [],
          })),
        selectItems: (ids) => set({ selectedItemIds: ids, selectedItemId: ids.length === 1 ? ids[0] : null }),
        toggleItemSelection: (id) =>
          set((state) => {
            const next = state.selectedItemIds.includes(id)
              ? state.selectedItemIds.filter((i) => i !== id)
              : [...state.selectedItemIds, id];
            return {
              selectedItemIds: next,
              selectedItemId: next.length === 1 ? next[0] : null,
            };
          }),
        clearSelection: () => set({ selectedItemIds: [], selectedItemId: null }),
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

        setSidebarWidth: (width) => set({ sidebarWidth: Math.max(200, Math.min(480, width)) }),

        setResolvedTheme: (theme) => set({ resolvedTheme: theme }),

        completeOnboarding: () => set({ onboardingCompleted: true }),
        startTour: () => set({ tourActive: true, onboardingCompleted: true }),
        stopTour: () => set({ tourActive: false }),
        setClipboard: (clipboard) => set({ clipboard }),
        pushHistory: (command) =>
          set((state) => ({
            historyPast: [command, ...state.historyPast].slice(0, 50),
            historyFuture: [],
          })),
        undo: async () => {
          const state = useUiStore.getState();
          if (state.historyPast.length === 0) return;
          const [command, ...rest] = state.historyPast;
          await command.undo();
          set({
            historyPast: rest,
            historyFuture: [command, ...state.historyFuture],
          });
        },
        redo: async () => {
          const state = useUiStore.getState();
          if (state.historyFuture.length === 0) return;
          const [command, ...rest] = state.historyFuture;
          await command.redo();
          set({
            historyPast: [command, ...state.historyPast],
            historyFuture: rest,
          });
        },

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
