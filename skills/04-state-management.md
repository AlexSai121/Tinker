# SKILL: Tinker State Management Patterns

## Philosophy
State is split into three layers. NEVER mix them.

| Layer | Technology | Purpose | Persistence |
|-------|-----------|---------|-------------|
| Server State | TanStack Query | DB data, caching, sync | SQLite (via IPC) |
| UI State | Zustand | Selections, modals, view mode | None (ephemeral) |
| Canvas State | Zustand | Camera position, drag state | SQLite (cameraStates table) |
| Form Drafts | Zustand | Unsaved form data | None (ephemeral) |

## TanStack Query Patterns

### Query Keys (Strict Hierarchy)
```typescript
// src/hooks/queryKeys.ts
export const queryKeys = {
  shops: ["shops"] as const,
  shop: (id: string) => ["shops", id] as const,
  workbenches: (shopId?: string) =>
    shopId ? (["workbenches", shopId] as const) : (["workbenches"] as const),
  workbench: (id: string) => ["workbenches", id] as const,
  items: (workbenchId: string) => ["items", workbenchId] as const,
  item: (id: string) => ["items", id] as const,
  scars: (itemId: string) => ["scars", itemId] as const,
  skills: (workbenchId: string) => ["skills", workbenchId] as const,
  skill: (id: string) => ["skills", id] as const,
  bridges: (itemId?: string) =>
    itemId ? (["bridges", itemId] as const) : (["bridges"] as const),
  locker: ["locker"] as const,
  camera: (shopId: string) => ["camera", shopId] as const,
} as const;
```

### Query Hook Pattern
```typescript
// src/hooks/useShops.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllShops, createShop, updateShop, deleteShop } from "@/data/shops";
import { queryKeys } from "./queryKeys";
import type { ShopInsert, ShopUpdate } from "@/types";

export function useShops() {
  return useQuery({
    queryKey: queryKeys.shops,
    queryFn: getAllShops,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30,   // 30 minutes
  });
}

export function useShop(id: string) {
  return useQuery({
    queryKey: queryKeys.shop(id),
    queryFn: () => getShopById(id),
    enabled: !!id,
  });
}

export function useCreateShop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createShop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shops });
    },
    onError: (error) => {
      console.error("Failed to create shop:", error);
      // Toast notification handled by global error handler
    },
  });
}

export function useUpdateShop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ShopUpdate }) =>
      updateShop(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shops });
      queryClient.invalidateQueries({ queryKey: queryKeys.shop(variables.id) });
    },
  });
}

export function useDeleteShop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteShop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shops });
    },
  });
}
```

### Optimistic Updates
```typescript
export function useUpdateWorkbenchPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateWorkbench,
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.workbenches() });

      // Snapshot previous value
      const previous = queryClient.getQueryData(queryKeys.workbenches());

      // Optimistically update
      queryClient.setQueryData(queryKeys.workbenches(), (old: Workbench[] | undefined) =>
        old?.map((w) => (w.id === id ? { ...w, ...data } : w))
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.workbenches(), context.previous);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.workbenches() });
    },
  });
}
```

### Query Client Config
```typescript
// src/main.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

## Zustand Patterns

### Store Structure
```typescript
// src/stores/uiStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface ModalState {
  type: string;
  payload?: Record<string, unknown>;
}

interface UiState {
  // Navigation
  activeShopId: string | null;
  activeWorkbenchId: string | null;
  viewMode: ViewMode;

  // Selection
  selectedItemId: string | null;
  selectedSkillId: string | null;

  // Modals (stack-based)
  modalStack: ModalState[];

  // Search
  searchQuery: string;

  // Sidebar
  sidebarOpen: boolean;

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
}

type ViewMode =
  | "workbench"
  | "project"
  | "scarMap"
  | "constellation"
  | "portfolio"
  | "locker"
  | "review";

export const useUiStore = create<UiState>()(
  devtools(
    (set) => ({
      activeShopId: null,
      activeWorkbenchId: null,
      viewMode: "workbench",
      selectedItemId: null,
      selectedSkillId: null,
      modalStack: [],
      searchQuery: "",
      sidebarOpen: true,

      setActiveShop: (id) =>
        set({ activeShopId: id, activeWorkbenchId: null, viewMode: "workbench" }),

      setActiveWorkbench: (id) =>
        set({ activeWorkbenchId: id, viewMode: "project", selectedItemId: null }),

      setViewMode: (mode) => set({ viewMode: mode }),

      selectItem: (id) => set({ selectedItemId: id }),
      selectSkill: (id) => set({ selectedSkillId: id }),

      openModal: (modal) =>
        set((state) => ({ modalStack: [...state.modalStack, modal] })),

      closeModal: () =>
        set((state) => ({ modalStack: state.modalStack.slice(0, -1) })),

      closeAllModals: () => set({ modalStack: [] }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    { name: "ui-store" }
  )
);
```

### Selector Pattern (CRITICAL for performance)
```typescript
// BAD — causes re-render on any uiStore change
const sidebarOpen = useUiStore((state) => state.sidebarOpen);

// GOOD — only re-renders when sidebarOpen changes
const sidebarOpen = useUiStore((state) => state.sidebarOpen);

// BEST — use atomic selectors
const toggleSidebar = useUiStore((state) => state.toggleSidebar);

// For multiple values, use shallow comparison
import { shallow } from "zustand/shallow";

const { activeShopId, activeWorkbenchId } = useUiStore(
  (state) => ({ activeShopId: state.activeShopId, activeWorkbenchId: state.activeWorkbenchId }),
  shallow
);
```

### Canvas Store
```typescript
// src/stores/canvasStore.ts
import { create } from "zustand";

interface CanvasState {
  x: number;
  y: number;
  scale: number;
  isDragging: boolean;
  draggedWorkbenchId: string | null;

  setCamera: (x: number, y: number, scale: number) => void;
  pan: (dx: number, dy: number) => void;
  zoom: (factor: number, centerX: number, centerY: number) => void;
  resetCamera: () => void;
  setDragging: (v: boolean) => void;
  setDraggedWorkbench: (id: string | null) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  x: 0,
  y: 0,
  scale: 1,
  isDragging: false,
  draggedWorkbenchId: null,

  setCamera: (x, y, scale) => set({ x, y, scale }),

  pan: (dx, dy) => set((state) => ({ x: state.x + dx, y: state.y + dy })),

  zoom: (factor, cx, cy) =>
    set((state) => {
      const newScale = Math.max(0.1, Math.min(5, state.scale * factor));
      const scaleRatio = newScale / state.scale;
      return {
        x: cx - (cx - state.x) * scaleRatio,
        y: cy - (cy - state.y) * scaleRatio,
        scale: newScale,
      };
    }),

  resetCamera: () => set({ x: 0, y: 0, scale: 1 }),

  setDragging: (v) => set({ isDragging: v }),
  setDraggedWorkbench: (id) => set({ draggedWorkbenchId: id }),
}));
```

### Editor Store (Draft State)
```typescript
// src/stores/editorStore.ts
import { create } from "zustand";

interface EditorState {
  draftItem: Partial<ItemInsert> | null;
  draftSkill: Partial<SkillInsert> | null;
  draftBridgeNote: string;

  setDraftItem: (draft: Partial<ItemInsert> | null) => void;
  setDraftSkill: (draft: Partial<SkillInsert> | null) => void;
  setDraftBridgeNote: (note: string) => void;
  resetDrafts: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  draftItem: null,
  draftSkill: null,
  draftBridgeNote: "",

  setDraftItem: (draft) => set({ draftItem: draft }),
  setDraftSkill: (draft) => set({ draftSkill: draft }),
  setDraftBridgeNote: (note) => set({ draftBridgeNote: note }),
  resetDrafts: () => set({ draftItem: null, draftSkill: null, draftBridgeNote: "" }),
}));
```

## State Flow Examples

### Creating a New Item
```
User clicks "+ Add Item"
  → uiStore.openModal({ type: "createItem", payload: { workbenchId } })
  → Modal renders ItemCreator
  → User fills form (React Hook Form state)
  → User submits
  → itemInsertSchema.validate(data)
  → useCreateItem().mutateAsync(data)
  → IPC call to main process
  → better-sqlite3 INSERT
  → Success: invalidate items query
  → UI updates with new item
  → uiStore.closeModal()
```

### Dragging a Workbench
```
User drags workbench on canvas
  → Konva onDragEnd event
  → canvasStore.setDraggedWorkbench(null)
  → useUpdateWorkbenchPosition().mutate({ id, data: { posX, posY } })
  → Optimistic update: workbench moves immediately
  → IPC call to update DB
  → DB update succeeds
  → Query invalidated, but data matches optimistic state
  → No visual jump
```

### Switching Shops
```
User clicks shop in sidebar
  → uiStore.setActiveShop(shopId)
  → WorkbenchCanvas re-renders with new shopId
  → useWorkbenches(shopId) fetches workbenches
  → useCamera(shopId) fetches camera position
  → canvasStore.setCamera(savedX, savedY, savedScale)
  → Canvas shows workbenches for selected shop
```

## Rules
1. **NEVER put server state in Zustand.** Use TanStack Query.
2. **NEVER put UI state in TanStack Query.** Use Zustand.
3. **ALWAYS use selectors** with Zustand to prevent unnecessary re-renders.
4. **ALWAYS invalidate queries** after mutations.
5. **NEVER mutate query cache directly** except for optimistic updates.
6. **ALWAYS use query keys** from the centralized `queryKeys` object.
7. **NEVER create new query keys** inline — add them to `queryKeys.ts`.

## No-Go List
- ❌ No `useState` for global state
- ❌ No React Context for state (except theme/auth if needed)
- ❌ No direct DB access in components
- ❌ No manual cache manipulation outside optimistic updates
- ❌ No `setQueryData` without `cancelQueries` first
- ❌ No Zustand stores with >10 properties (split into focused stores)
