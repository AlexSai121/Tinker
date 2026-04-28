# TINKER
## Implementation Plan — Agentic Coding Blueprint
**Version:** 1.0  
**Date:** April 23, 2026  
**Target:** Claude Code, Cursor, GitHub Copilot, or any agentic coding tool  
**Estimated Duration:** 12 Sprints (~12 weeks)  
**Team Size:** 1–2 developers (agent-assisted)

---

## 0. ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                    ELECTRON MAIN PROCESS                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ IPC Handlers │  │ File I/O    │  │ SQLite (better-     │  │
│  │ (channels)   │  │ (media)     │  │ sqlite3)            │  │
│  └──────┬──────┘  └─────────────┘  └─────────────────────┘  │
└─────────┼───────────────────────────────────────────────────┘
          │ IPC (contextBridge / preload)
┌─────────┼───────────────────────────────────────────────────┐
│         ▼          RENDERER PROCESS (Chromium)               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  REACT 19 + TypeScript + Vite + Tailwind CSS           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │  │
│  │  │ Zustand      │  │ React Query  │  │ React-Konva │  │  │
│  │  │ (State)      │  │ (Data Layer) │  │ (Canvas)    │  │  │
│  │  └──────────────┘  └──────────────┘  └─────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Pattern:** Local-first desktop app. All data lives in SQLite. Media lives on filesystem. React Query handles caching and optimistic updates. Zustand holds UI state. React-Konva renders the spatial canvas.

---

## 1. TECH STACK (PINNED VERSIONS)

| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| Desktop Shell | Electron | ^35.0.0 | Cross-platform, mature, agent-friendly |
| Bundler | Vite | ^6.0.0 | Fast HMR, Electron plugin support |
| Framework | React | ^19.0.0 | Latest, concurrent features |
| Language | TypeScript | ^5.7.0 | Strict mode enabled |
| Styling | Tailwind CSS | ^4.0.0 | Utility-first, no CSS files to maintain |
| Canvas | React-Konva | ^19.0.0 | Declarative React wrapper for Konva.js |
| State (UI) | Zustand | ^5.0.0 | Minimal boilerplate, TypeScript native |
| State (Server) | TanStack Query | ^5.60.0 | Caching, optimistic updates, background sync |
| Database | better-sqlite3 | ^12.0.0 | Synchronous, fast, Electron-compatible |
| Schema | Drizzle ORM | ^0.40.0 | Type-safe SQL, migrations, query builder |
| Router | React Router | ^7.0.0 | Declarative routing, data APIs |
| Forms | React Hook Form | ^7.54.0 | Performance, validation |
| Validation | Zod | ^3.24.0 | Schema validation, TypeScript inference |
| Date | date-fns | ^4.0.0 | Tree-shakeable, immutable |
| Icons | Lucide React | ^0.460.0 | Clean, consistent |
| Testing | Vitest | ^3.0.0 | Vite-native, fast |
| E2E | Playwright | ^1.50.0 | Electron support |

---

## 2. DIRECTORY STRUCTURE

```
tinker/
├── electron/
│   ├── main.ts                 # Entry point — creates window, sets up IPC
│   ├── preload.ts              # Context bridge — exposes safe APIs to renderer
│   ├── ipc/
│   │   ├── channels.ts         # IPC channel name constants
│   │   ├── handlers.ts         # All IPC handler registrations
│   │   └── types.ts            # IPC request/response types
│   └── utils/
│       ├── paths.ts            # App data paths (userData, documents)
│       └── media.ts            # Media file operations (save, delete, thumbnail)
│
├── src/
│   ├── main.tsx                # React entry point
│   ├── App.tsx                 # Root component, router setup
│   ├── index.css               # Tailwind directives + global styles
│   │
│   ├── db/
│   │   ├── index.ts            # Drizzle client initialization
│   │   ├── schema.ts           # ALL table definitions (single source of truth)
│   │   ├── migrations/         # Drizzle migration files
│   │   └── seed.ts             # Dev seed data
│   │
│   ├── data/
│   │   ├── shops.ts            # Shop DAO — all CRUD + queries
│   │   ├── workbenches.ts      # Workbench DAO
│   │   ├── items.ts            # Item DAO
│   │   ├── scars.ts            # Scar DAO
│   │   ├── skills.ts           # Skill DAO
│   │   ├── bridges.ts          # Bridge DAO
│   │   ├── locker.ts           # ReferenceLocker DAO
│   │   └── scarMap.ts          # Scar aggregation queries
│   │
│   ├── hooks/
│   │   ├── useShops.ts         # TanStack Query hooks for shops
│   │   ├── useWorkbenches.ts   # Query hooks for workbenches
│   │   ├── useItems.ts         # Query hooks for items
│   │   ├── useScars.ts         # Query hooks for scars
│   │   ├── useSkills.ts        # Query hooks for skills
│   │   ├── useBridges.ts       # Query hooks for bridges
│   │   ├── useLocker.ts        # Query hooks for locker
│   │   ├── useCamera.ts        # Camera position persistence
│   │   ├── useExport.ts        # JSON export logic
│   │   └── useMedia.ts         # Media capture/save helpers
│   │
│   ├── stores/
│   │   ├── uiStore.ts          # Zustand — UI state (selection, modals, view mode)
│   │   ├── canvasStore.ts      # Zustand — Canvas state (zoom, pan, active shop)
│   │   └── editorStore.ts      # Zustand — Active editor state (draft content)
│   │
│   ├── types/
│   │   └── index.ts            # Shared TypeScript types/interfaces
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx    # Main layout shell (sidebar + canvas area)
│   │   │   ├── Sidebar.tsx     # Shop/project navigation sidebar
│   │   │   ├── Toolbar.tsx     # Top toolbar (view toggle, search, export)
│   │   │   └── StatusBar.tsx   # Bottom status bar (zoom level, item count)
│   │   │
│   │   ├── canvas/
│   │   │   ├── WorkbenchCanvas.tsx      # Main Konva Stage component
│   │   │   ├── WorkbenchLayer.tsx       # Layer containing all workbenches
│   │   │   ├── WorkbenchCard.tsx        # Individual workbench Konva Group
│   │   │   ├── ItemLayer.tsx            # Layer for items on active bench
│   │   │   ├── ItemNode.tsx             # Individual item Konva shape
│   │   │   ├── BackgroundLayer.tsx      # Shop background texture
│   │   │   ├── Minimap.tsx              # Overview map (optional v2)
│   │   │   └── BridgeLayer.tsx          # Constellation view bridge lines
│   │   │
│   │   ├── workbench/
│   │   │   ├── ProjectView.tsx          # Full-screen project/workbench view
│   │   │   ├── ItemGrid.tsx             # Grid/list of items on bench
│   │   │   ├── ItemCard.tsx             # Single item display card
│   │   │   ├── ItemCreator.tsx          # Form to create new items
│   │   │   ├── ScarTagger.tsx           # Failure tagging UI
│   │   │   └── SkillPanel.tsx           # Skills attached to project
│   │   │
│   │   ├── modals/
│   │   │   ├── CreateShopModal.tsx
│   │   │   ├── CreateProjectModal.tsx
│   │   │   ├── CreateBridgeModal.tsx
│   │   │   ├── SkillEvidenceModal.tsx
│   │   │   ├── ExportModal.tsx
│   │   │   └── SettingsModal.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── ScarMapView.tsx          # Failure pattern dashboard
│   │   │   ├── ConstellationView.tsx    # Bridge visualization
│   │   │   ├── SkillPortfolio.tsx       # Owned skills with evidence
│   │   │   ├── LockerView.tsx           # Reference locker management
│   │   │   └── WeeklyReview.tsx         # Guided weekly review flow
│   │   │
│   │   └── shared/
│   │       ├── DustOverlay.tsx          # Visual dust effect on inactive benches
│   │       ├── MediaUploader.tsx        # Photo/video/file upload component
│   │       ├── EvidenceViewer.tsx       # Photo/video/file viewer
│   │       ├── WhyThisMatters.tsx       # Mandatory context input
│   │       ├── TypeBadge.tsx            # Item type badge (Attempt, Reference, etc.)
│   │       └── EmptyState.tsx           # Empty state illustrations
│   │
│   └── utils/
│       ├── id.ts               # NanoID wrapper for entity IDs
│       ├── date.ts             # date-fns wrappers
│       ├── validators.ts       # Zod schemas for all inputs
│       ├── constants.ts        # Bench size limits, stale dates, colors
│       └── canvasMath.ts       # Zoom/pan/world-to-screen coordinate math
│
├── resources/
│   ├── textures/               # Background textures (pegboard, concrete, etc.)
│   ├── icons/                  # App icons for build
│   └── sounds/                 # Optional UI sounds (v2)
│
├── tests/
│   ├── unit/                   # Vitest tests (mirror src/ structure)
│   └── e2e/                    # Playwright tests
│
├── drizzle.config.ts           # Drizzle ORM config
├── vite.main.config.ts         # Vite config for main process
├── vite.preload.config.ts      # Vite config for preload
├── vite.renderer.config.ts     # Vite config for renderer
├── electron-builder.json       # Electron Builder config
├── tsconfig.json
├── tailwind.config.ts
└── package.json
```

---

## 3. DATABASE SCHEMA (EXACT SQL — DRIZZLE)

**File:** `src/db/schema.ts`

```typescript
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ─── SHOPS ─────────────────────────────────────────────
export const shops = sqliteTable("shops", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  backgroundTexture: text("background_texture").notNull().default("pegboard"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const shopsRelations = relations(shops, ({ many }) => ({
  workbenches: many(workbenches),
}));

// ─── WORKBENCHES ───────────────────────────────────────
export const workbenches = sqliteTable("workbenches", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  // Canvas position (world coordinates)
  posX: real("pos_x").notNull().default(0),
  posY: real("pos_y").notNull().default(0),
  // Physical size (in pixels on canvas at zoom=1)
  width: real("width").notNull().default(400),
  height: real("height").notNull().default(300),
  // Soft limit: max items before visual warning
  maxItems: integer("max_items").notNull().default(50),
  // Dust level: 0-1, increases with inactivity
  dustLevel: real("dust_level").notNull().default(0),
  lastOpenedAt: integer("last_opened_at", { mode: "timestamp" }),
  isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const workbenchesRelations = relations(workbenches, ({ one, many }) => ({
  shop: one(shops, { fields: [workbenches.shopId], references: [shops.id] }),
  items: many(items),
  skills: many(skills),
}));

// ─── ITEMS ─────────────────────────────────────────────
export const itemTypeEnum = [
  "observation",
  "reference",
  "attempt",
  "question",
  "breakthrough",
] as const;

export const items = sqliteTable("items", {
  id: text("id").primaryKey(),
  workbenchId: text("workbench_id").notNull().references(() => workbenches.id, { onDelete: "cascade" }),
  type: text("type", { enum: itemTypeEnum }).notNull(),
  content: text("content").notNull(),
  // Position on the workbench surface
  benchPosX: real("bench_pos_x").notNull().default(20),
  benchPosY: real("bench_pos_y").notNull().default(20),
  // For references: the external URL or file path
  sourceUrl: text("source_url"),
  sourceFilePath: text("source_file_path"),
  // Mandatory "why this matters" for references
  whyThisMatters: text("why_this_matters"),
  // For attempts: what was tried
  attemptWhat: text("attempt_what"),
  attemptResult: text("attempt_result"),
  attemptToolsUsed: text("attempt_tools_used"), // JSON array
  // For breakthroughs: requires evidence
  hasEvidence: integer("has_evidence", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const itemsRelations = relations(items, ({ one, many }) => ({
  workbench: one(workbenches, { fields: [items.workbenchId], references: [workbenches.id] }),
  scars: many(scars),
  media: many(itemMedia),
  sourceBridges: many(bridges, { relationName: "source" }),
  targetBridges: many(bridges, { relationName: "target" }),
}));

// ─── ITEM MEDIA ────────────────────────────────────────
export const itemMedia = sqliteTable("item_media", {
  id: text("id").primaryKey(),
  itemId: text("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  mediaType: text("media_type", { enum: ["photo", "video", "file"] }).notNull(),
  filePath: text("file_path").notNull(),
  thumbnailPath: text("thumbnail_path"),
  fileSize: integer("file_size"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const itemMediaRelations = relations(itemMedia, ({ one }) => ({
  item: one(items, { fields: [itemMedia.itemId], references: [items.id] }),
}));

// ─── SCARS ─────────────────────────────────────────────
export const scarTypeEnum = [
  "misunderstood_instruction",
  "wrong_tool_material",
  "impatience",
  "overconfidence",
  "environmental_factor",
  "conceptual_gap",
  "execution_error",
  "unknown",
] as const;

export const scarSeverityEnum = [
  "minor",
  "significant",
  "restart",
  "injury_risk",
] as const;

export const scars = sqliteTable("scars", {
  id: text("id").primaryKey(),
  itemId: text("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  scarType: text("scar_type", { enum: scarTypeEnum }).notNull(),
  severity: text("severity", { enum: scarSeverityEnum }).notNull(),
  costTimeMinutes: integer("cost_time_minutes"),
  costMaterials: text("cost_materials"),
  costMoney: integer("cost_money"), // cents
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const scarsRelations = relations(scars, ({ one }) => ({
  item: one(items, { fields: [scars.itemId], references: [items.id] }),
}));

// ─── SKILLS ────────────────────────────────────────────
export const skillStatusEnum = [
  "exposed",
  "attempted",
  "practiced",
  "owned",
] as const;

export const skills = sqliteTable("skills", {
  id: text("id").primaryKey(),
  workbenchId: text("workbench_id").notNull().references(() => workbenches.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status", { enum: skillStatusEnum }).notNull().default("exposed"),
  // For practiced/owned: evidence required
  evidenceItemIds: text("evidence_item_ids"), // JSON array of item IDs
  practicedAt: integer("practiced_at", { mode: "timestamp" }),
  // 30-day challenge
  reviewDueAt: integer("review_due_at", { mode: "timestamp" }),
  ownedAt: integer("owned_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const skillsRelations = relations(skills, ({ one, many }) => ({
  workbench: one(workbenches, { fields: [skills.workbenchId], references: [workbenches.id] }),
  bridges: many(skillBridges),
}));

// ─── BRIDGES ───────────────────────────────────────────
export const bridges = sqliteTable("bridges", {
  id: text("id").primaryKey(),
  sourceItemId: text("source_item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  targetItemId: text("target_item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
  strength: integer("strength").notNull().default(1), // 1-5
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  lastReinforcedAt: integer("last_reinforced_at", { mode: "timestamp" }),
});

export const bridgesRelations = relations(bridges, ({ one }) => ({
  sourceItem: one(items, { fields: [bridges.sourceItemId], references: [items.id], relationName: "source" }),
  targetItem: one(items, { fields: [bridges.targetItemId], references: [items.id], relationName: "target" }),
}));

// ─── SKILL BRIDGES (skill-to-skill connections) ────────
export const skillBridges = sqliteTable("skill_bridges", {
  id: text("id").primaryKey(),
  sourceSkillId: text("source_skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  targetSkillId: text("target_skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
  strength: integer("strength").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  lastReinforcedAt: integer("last_reinforced_at", { mode: "timestamp" }),
});

// ─── REFERENCE LOCKER ──────────────────────────────────
export const lockerItems = sqliteTable("locker_items", {
  id: text("id").primaryKey(),
  sourceType: text("source_type", { enum: ["book", "video", "article", "course"] }).notNull(),
  title: text("title").notNull(),
  sourceUrl: text("source_url"),
  sourceFilePath: text("source_file_path"),
  whyThisMatters: text("why_this_matters"),
  // Stale date logic
  staleDate: integer("stale_date", { mode: "timestamp" }).notNull(),
  isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
  rescuedToWorkbenchId: text("rescued_to_workbench_id").references(() => workbenches.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ─── CAMERA STATE (per shop) ───────────────────────────
export const cameraStates = sqliteTable("camera_states", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
  x: real("x").notNull().default(0),
  y: real("y").notNull().default(0),
  scale: real("scale").notNull().default(1),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ─── APP SETTINGS ──────────────────────────────────────
export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
```

---

## 4. IPC CHANNELS & API SURFACE

**File:** `electron/ipc/channels.ts`

```typescript
export const IPC_CHANNELS = {
  // Database operations
  DB_QUERY: "db:query",
  DB_MUTATE: "db:mutate",
  DB_MIGRATE: "db:migrate",
  DB_EXPORT: "db:export",
  DB_IMPORT: "db:import",

  // Media operations
  MEDIA_SAVE: "media:save",
  MEDIA_DELETE: "media:delete",
  MEDIA_GET_THUMBNAIL: "media:getThumbnail",
  MEDIA_OPEN_EXTERNAL: "media:openExternal",

  // File system
  FS_GET_PATH: "fs:getPath",
  FS_SHOW_OPEN_DIALOG: "fs:showOpenDialog",
  FS_SHOW_SAVE_DIALOG: "fs:showSaveDialog",

  // App lifecycle
  APP_GET_VERSION: "app:getVersion",
  APP_QUIT: "app:quit",

  // Window
  WINDOW_MINIMIZE: "window:minimize",
  WINDOW_MAXIMIZE: "window:maximize",
  WINDOW_CLOSE: "window:close",
} as const;
```

**File:** `electron/ipc/types.ts`

```typescript
import { IPC_CHANNELS } from "./channels";

export type IpcChannels = typeof IPC_CHANNELS;

// DB Query
export interface DbQueryRequest {
  sql: string;
  params?: unknown[];
}

export interface DbQueryResponse<T = unknown> {
  data: T[];
}

// DB Mutate
export interface DbMutateRequest {
  sql: string;
  params?: unknown[];
}

export interface DbMutateResponse {
  lastInsertRowid: number | bigint;
  changes: number;
}

// Media Save
export interface MediaSaveRequest {
  fileName: string;
  buffer: ArrayBuffer;
  subDir: "photos" | "videos" | "files" | "thumbnails";
}

export interface MediaSaveResponse {
  filePath: string;
  success: boolean;
}

// Media Delete
export interface MediaDeleteRequest {
  filePath: string;
}

// Export
export interface DbExportResponse {
  json: string;
  filePath: string;
}

// Import
export interface DbImportRequest {
  filePath: string;
}
```

**File:** `electron/ipc/handlers.ts`

```typescript
// Register all IPC handlers in main process
// Uses better-sqlite3 for sync DB operations
// Uses fs/promises for media I/O
// Uses electron dialog for file pickers
```

---

## 5. DATA ACCESS LAYER (DAO PATTERN)

Every DAO file exports typed functions. Example pattern:

**File:** `src/data/shops.ts`

```typescript
import { db } from "../db";
import { shops } from "../db/schema";
import { eq } from "drizzle-orm";
import type { Shop, ShopInsert, ShopUpdate } from "../types";

export async function getAllShops(): Promise<Shop[]> {
  return db.select().from(shops).orderBy(shops.sortOrder);
}

export async function getShopById(id: string): Promise<Shop | undefined> {
  const results = await db.select().from(shops).where(eq(shops.id, id)).limit(1);
  return results[0];
}

export async function createShop(data: ShopInsert): Promise<Shop> {
  const result = await db.insert(shops).values(data).returning();
  return result[0];
}

export async function updateShop(id: string, data: ShopUpdate): Promise<Shop> {
  const result = await db.update(shops).set(data).where(eq(shops.id, id)).returning();
  return result[0];
}

export async function deleteShop(id: string): Promise<void> {
  await db.delete(shops).where(eq(shops.id, id));
}

export async function reorderShops(orderedIds: string[]): Promise<void> {
  // Batch update sortOrder
}
```

**All DAO files to implement:**
- `src/data/shops.ts` — 5 functions
- `src/data/workbenches.ts` — 8 functions (CRUD + byShop + archive + dust update)
- `src/data/items.ts` — 8 functions (CRUD + byWorkbench + byType + search)
- `src/data/scars.ts` — 6 functions (CRUD + byItem + aggregate)
- `src/data/skills.ts` — 8 functions (CRUD + byWorkbench + status update + review due)
- `src/data/bridges.ts` — 7 functions (CRUD + byItem + reinforce + decay check)
- `src/data/locker.ts` — 7 functions (CRUD + stale check + archive + rescue)
- `src/data/scarMap.ts` — 4 aggregation queries (timeline, distribution, heatmap, trend)
- `src/data/camera.ts` — 3 functions (get, save, delete)

---

## 6. TANSTACK QUERY HOOKS

Every hook follows this pattern:

**File:** `src/hooks/useShops.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllShops, createShop, updateShop, deleteShop } from "../data/shops";
import type { ShopInsert, ShopUpdate } from "../types";

const SHOPS_KEY = ["shops"] as const;

export function useShops() {
  return useQuery({
    queryKey: SHOPS_KEY,
    queryFn: getAllShops,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createShop,
    onSuccess: () => qc.invalidateQueries({ queryKey: SHOPS_KEY }),
  });
}

export function useUpdateShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ShopUpdate }) => updateShop(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: SHOPS_KEY }),
  });
}

export function useDeleteShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteShop,
    onSuccess: () => qc.invalidateQueries({ queryKey: SHOPS_KEY }),
  });
}
```

**All hooks to implement:**
- `useShops` — query + 3 mutations
- `useWorkbenches` — query (by shop) + 4 mutations
- `useItems` — query (by workbench) + 4 mutations
- `useScars` — query (by item) + 3 mutations
- `useSkills` — query (by workbench) + 5 mutations (includes status transitions)
- `useBridges` — query (by item) + 4 mutations
- `useLocker` — query (active/archived) + 4 mutations
- `useCamera` — query (by shop) + mutation
- `useExport` — mutation (JSON dump)
- `useMedia` — mutation (save/delete)

---

## 7. ZUSTAND STORES

**File:** `src/stores/uiStore.ts`

```typescript
import { create } from "zustand";

interface UiState {
  // Navigation
  activeShopId: string | null;
  activeWorkbenchId: string | null;
  viewMode: "workbench" | "project" | "scarMap" | "constellation" | "portfolio" | "locker" | "review";

  // Selection
  selectedItemId: string | null;
  selectedSkillId: string | null;

  // Modals
  modalStack: ModalType[];
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  closeAllModals: () => void;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

type ModalType =
  | { type: "createShop" }
  | { type: "createProject"; shopId: string }
  | { type: "createItem"; workbenchId: string; itemType: ItemType }
  | { type: "createBridge"; sourceItemId: string }
  | { type: "tagScar"; itemId: string }
  | { type: "addEvidence"; skillId: string }
  | { type: "export" }
  | { type: "settings" };

export const useUiStore = create<UiState>((set) => ({
  activeShopId: null,
  activeWorkbenchId: null,
  viewMode: "workbench",
  selectedItemId: null,
  selectedSkillId: null,
  modalStack: [],
  openModal: (modal) => set((s) => ({ modalStack: [...s.modalStack, modal] })),
  closeModal: () => set((s) => ({ modalStack: s.modalStack.slice(0, -1) })),
  closeAllModals: () => set({ modalStack: [] }),
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
```

**File:** `src/stores/canvasStore.ts`

```typescript
import { create } from "zustand";

interface CanvasState {
  // Camera (world coordinates)
  x: number;
  y: number;
  scale: number;

  // Interaction
  isDragging: boolean;
  isZooming: boolean;
  draggedWorkbenchId: string | null;

  // Actions
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
  isZooming: false,
  draggedWorkbenchId: null,

  setCamera: (x, y, scale) => set({ x, y, scale }),
  pan: (dx, dy) => set((s) => ({ x: s.x + dx, y: s.y + dy })),
  zoom: (factor, cx, cy) => set((s) => {
    // Zoom toward cursor point
    const newScale = Math.max(0.1, Math.min(5, s.scale * factor));
    const scaleRatio = newScale / s.scale;
    const newX = cx - (cx - s.x) * scaleRatio;
    const newY = cy - (cy - s.y) * scaleRatio;
    return { x: newX, y: newY, scale: newScale };
  }),
  resetCamera: () => set({ x: 0, y: 0, scale: 1 }),

  setDragging: (v) => set({ isDragging: v }),
  setDraggedWorkbench: (id) => set({ draggedWorkbenchId: id }),
}));
```

**File:** `src/stores/editorStore.ts`

```typescript
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

---

## 8. COMPONENT BLUEPRINTS

### 8.1 Layout Components

**`AppShell.tsx`**
- Props: none
- State: reads uiStore (sidebarOpen, viewMode)
- Renders: Sidebar (left, collapsible) + main content area (right)
- Main content switches based on viewMode
- Includes Toolbar (top of main area) and StatusBar (bottom)

**`Sidebar.tsx`**
- Props: none
- Data: useShops() query
- Renders: List of shops (collapsible accordion)
- Each shop shows workbenches as sub-items
- Click workbench → set activeWorkbenchId + viewMode="project"
- Right-click context menu: rename, archive, delete
- Drag-and-drop to reorder shops
- "+ New Shop" button at bottom

**`Toolbar.tsx`**
- Props: none
- State: reads uiStore (viewMode, searchQuery)
- Renders:
  - View mode toggle buttons: Workbench / Project / Scar Map / Constellation / Portfolio / Locker / Review
  - Search input (debounced, filters items/skills)
  - Export button (JSON dump)
  - Settings button

**`StatusBar.tsx`**
- Props: none
- Data: active workbench item count, current zoom level
- Renders: zoom percentage, item count, last saved timestamp

### 8.2 Canvas Components

**`WorkbenchCanvas.tsx`**
- Props: `shopId: string`
- Data: useWorkbenches(shopId), useCamera(shopId)
- Renders: Konva Stage (full viewport)
- Layers (bottom to top):
  1. BackgroundLayer (shop texture, infinite tiling)
  2. WorkbenchLayer (all workbench cards)
  3. BridgeLayer (lines between workbenches — constellation mode only)
- Event handlers:
  - onWheel: zoom toward cursor
  - onDragMove (stage): pan camera
  - onDblClick: create new workbench at click position
- Performance: memoized workbench cards, only re-render changed workbenches

**`WorkbenchCard.tsx`**
- Props: `workbench: Workbench`
- Data: item count (derived from useItems)
- Renders: Konva Group containing:
  - Rect (background, rounded corners, drop shadow)
  - Text (name, truncated)
  - Text (item count, e.g., "12/50")
  - DustOverlay (opacity based on dustLevel)
  - Border (color indicates status: active=blue, archived=gray, full=orange)
- Interactions:
  - onClick: open project view
  - onDragMove: update workbench position (debounced save)
  - onDblClick: rename inline
- DustOverlay: semi-transparent gray overlay, opacity = dustLevel * 0.6

**`BackgroundLayer.tsx`**
- Props: `texture: string`
- Renders: Tiled pattern image (pegboard, concrete, etc.)
- Uses Konva Pattern fill
- Moves with camera but repeats infinitely

### 8.3 Workbench/Project Components

**`ProjectView.tsx`**
- Props: none (reads activeWorkbenchId from uiStore)
- Data: useWorkbench(activeWorkbenchId), useItems(activeWorkbenchId), useSkills(activeWorkbenchId)
- Layout: header (project name + back button) + scrollable item grid + skill panel (right sidebar)
- Renders: ItemGrid + SkillPanel + floating "+ Add Item" button

**`ItemGrid.tsx`**
- Props: `items: Item[]`, `workbenchId: string`
- Renders: CSS Grid of ItemCards
- Sort: manual (user-defined) or by date
- Filter: by type (tabs: All / Observations / References / Attempts / Questions / Breakthroughs)
- Empty state: "This workbench is empty. Document your first attempt."

**`ItemCard.tsx`**
- Props: `item: Item`
- Renders:
  - TypeBadge (color-coded: observation=gray, reference=blue, attempt=red, question=yellow, breakthrough=green)
  - Content preview (first 100 chars)
  - Media thumbnail (if photo/video)
  - Scar indicator (red dot if attempt has scars)
  - Date
- Interactions:
  - Click: expand detail view
  - Drag: reorder within grid
  - Right-click: edit, delete, create bridge from this item

**`ItemCreator.tsx`**
- Props: `workbenchId: string`, `defaultType?: ItemType`
- State: form state (React Hook Form + Zod)
- Fields:
  - Type selector (radio buttons with icons)
  - Content (textarea, auto-resize)
  - For Reference: URL input + WhyThisMatters (mandatory)
  - For Attempt: What (textarea), Result (textarea), Tools Used (tag input)
  - For Breakthrough: MediaUploader (mandatory)
  - Media attachments: MediaUploader
- Validation: Zod schema
- Submit: createItem mutation

**`ScarTagger.tsx`**
- Props: `itemId: string`
- State: form state
- Fields:
  - Scar Type (select from enum)
  - Severity (radio: Minor / Significant / Restart / Injury Risk)
  - Cost: Time (number, minutes), Materials (text), Money (number, cents)
  - Notes (textarea)
- Submit: createScar mutation

**`SkillPanel.tsx`**
- Props: `workbenchId: string`
- Data: useSkills(workbenchId)
- Renders: List of skills with status badges
- Each skill:
  - Name + status (Exposed → Attempted → Practiced → Owned)
  - Evidence thumbnails (if practiced/owned)
  - "Add Evidence" button (opens SkillEvidenceModal)
  - 30-day countdown (if reviewDueAt is set)
- "+ New Skill" button

### 8.4 Dashboard Components

**`ScarMapView.tsx`**
- Props: none
- Data: useScarMap() aggregation query
- Renders:
  - Timeline chart (failures over time — use recharts or custom SVG)
  - Pie chart (failure type distribution)
  - Heat map (projects × failure types — custom grid)
  - Trend line (failures per week)
- Filters: date range, project selector, failure type

**`ConstellationView.tsx`**
- Props: none
- Data: useBridges() (all bridges)
- Renders: Konva Stage with:
  - Nodes: projects (workbenches) as circles
  - Edges: bridges as lines (thickness = strength, color = age)
  - Labels: bridge note on hover
- Interactions:
  - Pan/zoom
  - Click node: navigate to project
  - Click edge: view bridge detail
  - Hover edge: show bridge note tooltip

**`SkillPortfolio.tsx`**
- Props: none
- Data: useSkills() (all with status="owned")
- Renders: Grid of owned skills
- Each skill:
  - Name
  - Evidence gallery (photos/videos)
  - Project origin
  - Date owned
- Export button: generate PDF (using jsPDF or html2pdf)

**`LockerView.tsx`**
- Props: none
- Data: useLocker() (active + archived)
- Renders: Two tabs — Active / Archived
- Active tab:
  - List of locker items with stale countdown
  - Color coding: green (>7 days), yellow (3-7 days), red (<3 days)
  - Actions: Rescue (move to project), Edit, Archive
- Archived tab:
  - Searchable list
  - Action: Restore to active

**`WeeklyReview.tsx`**
- Props: none
- State: step index (0-4)
- Steps:
  1. Scar Map Check — show weekly scar summary
  2. Bridge Reinforcement — list fading bridges, prompt to reinforce or delete
  3. Mastery Audit — list skills approaching 30-day review
  4. Locker Cleanup — list stale locker items
  5. Shop Reorganization — suggest archiving old projects
- Navigation: Next/Previous/Skip buttons
- Completion: confetti animation + summary

### 8.5 Modal Components

**`CreateShopModal.tsx`**
- Fields: name (text), background texture (radio grid with previews)
- Submit: createShop mutation

**`CreateProjectModal.tsx`**
- Fields: name (text), description (textarea), shop (select)
- Template questions:
  - What are you trying to build/learn?
  - What do you already know?
  - What's your first step?
- Submit: createWorkbench mutation

**`CreateBridgeModal.tsx`**
- Props: `sourceItemId: string`
- Data: useItems() (all items across all projects — searchable)
- Flow:
  1. Search/select target item
  2. Write bridge note (min 50 chars, enforced)
  3. Submit: createBridge mutation

**`SkillEvidenceModal.tsx`**
- Props: `skillId: string`
- Fields: evidence type selector + MediaUploader
- Submit: updateSkill mutation (status → practiced, set evidenceItemIds)

**`ExportModal.tsx`**
- Options: Full export / Shop-only / Date range
- Format: JSON (pretty-printed)
- Action: triggers db export via IPC, shows save dialog

**`SettingsModal.tsx`**
- Sections:
  - Data: Export, Import, Storage usage
  - Appearance: Theme (light/dark/system), default shop texture
  - Behavior: Stale date duration (default 14 days), dust threshold (default 30 days)
  - About: Version, license, GitHub link

### 8.6 Shared Components

**`DustOverlay.tsx`**
- Props: `level: number` (0-1)
- Renders: CSS overlay with noise texture + opacity = level * 0.6
- Animation: subtle dust particle drift (CSS keyframes)

**`MediaUploader.tsx`**
- Props: `onUpload: (files: MediaFile[]) => void`, `accept?: string`
- Renders: Dropzone + file picker button
- Process:
  1. User drops/selects files
  2. Files copied to app media directory via IPC
  3. Thumbnails generated for photos/videos
  4. onUpload called with file metadata
- Progress indicator during copy

**`EvidenceViewer.tsx`**
- Props: `media: ItemMedia[]`
- Renders: Lightbox-style viewer
- Supports: images (zoom), videos (play), files (open externally)

**`WhyThisMatters.tsx`**
- Props: `value: string`, `onChange: (v: string) => void`, `error?: string`
- Renders: Textarea with character count
- Validation: min 10 chars, enforced before save

**`TypeBadge.tsx`**
- Props: `type: ItemType`
- Renders: Pill badge with icon + label
- Colors: observation=stone, reference=sky, attempt=rose, question=amber, breakthrough=emerald

---

## 9. SPRINT BREAKDOWN (12 SPRINTS)

### SPRINT 0: Foundation (Week 0)
**Goal:** Project scaffold, build system, database layer

**Tasks:**
1. Initialize project: `npm create vite@latest tinker -- --template react-ts`
2. Install all dependencies (see Tech Stack)
3. Configure Electron + Vite multi-entry build
4. Configure Tailwind CSS
5. Configure TypeScript strict mode
6. Set up Drizzle ORM with SQLite
7. Write complete schema (`src/db/schema.ts`)
8. Generate and run initial migration
9. Set up IPC channels, types, and preload script
10. Set up better-sqlite3 in main process with basic query handler
11. Set up media directory structure in userData
12. Configure ESLint + Prettier
13. Set up Vitest with basic test
14. Set up Playwright with basic E2E test
15. Create `src/types/index.ts` with all shared interfaces

**Acceptance Criteria:**
- `npm run dev` launches Electron with React
- Database file created in userData
- Can execute raw SQL via IPC and see results in renderer
- All CI checks pass (lint, typecheck, test)

---

### SPRINT 1: Shops & Workbenches (Week 1)
**Goal:** Core spatial canvas with shops and workbenches

**Tasks:**
1. Implement `src/data/shops.ts` DAO (all 5 functions)
2. Implement `src/data/workbenches.ts` DAO (all 8 functions)
3. Implement `src/hooks/useShops.ts` and `src/hooks/useWorkbenches.ts`
4. Implement `src/stores/uiStore.ts` and `src/stores/canvasStore.ts`
5. Implement `src/components/layout/Sidebar.tsx`
   - Shop list with accordion
   - Workbench sub-list
   - Create shop button
6. Implement `src/components/layout/Toolbar.tsx`
   - View mode buttons (stubbed)
   - Search input (stubbed)
7. Implement `src/components/canvas/WorkbenchCanvas.tsx`
   - Konva Stage setup
   - Pan and zoom handlers
8. Implement `src/components/canvas/WorkbenchCard.tsx`
   - Visual representation
   - Drag to reposition
   - Dust overlay (static for now)
9. Implement `src/components/canvas/BackgroundLayer.tsx`
   - Tiled background texture
10. Implement `src/components/modals/CreateShopModal.tsx`
11. Implement `src/components/modals/CreateProjectModal.tsx`
12. Seed database with 2 sample shops + 3 sample workbenches

**Acceptance Criteria:**
- Can create shops and see them in sidebar
- Can create workbenches and see them on canvas
- Can pan and zoom canvas
- Can drag workbenches to reposition (persisted)
- Background texture renders correctly

---

### SPRINT 2: Items & Project View (Week 2)
**Goal:** Content creation and project workbench view

**Tasks:**
1. Implement `src/data/items.ts` DAO (all 8 functions)
2. Implement `src/hooks/useItems.ts`
3. Implement `src/components/workbench/ProjectView.tsx`
   - Header with back button
   - Item grid layout
4. Implement `src/components/workbench/ItemGrid.tsx`
   - Filter tabs by type
   - Sort options
5. Implement `src/components/workbench/ItemCard.tsx`
   - All 5 type variants
   - Media thumbnail
   - Scar indicator
6. Implement `src/components/workbench/ItemCreator.tsx`
   - All type-specific fields
   - Zod validation
   - Media upload integration
7. Implement `src/components/shared/MediaUploader.tsx`
   - Dropzone
   - IPC integration for file save
   - Thumbnail generation
8. Implement `src/components/shared/WhyThisMatters.tsx`
9. Implement `src/components/shared/TypeBadge.tsx`
10. Implement `src/components/modals/CreateItemModal.tsx` (wrapper)
11. Wire up: click workbench → open ProjectView
12. Seed items on sample workbenches

**Acceptance Criteria:**
- Can create all 5 item types
- Reference items require "why this matters"
- Attempt items show scar indicator when scars exist
- Media uploads save to disk and show thumbnails
- Item grid filters and sorts correctly

---

### SPRINT 3: Failure Archaeology (Week 3)
**Goal:** Scar tagging and scar map dashboard

**Tasks:**
1. Implement `src/data/scars.ts` DAO (all 6 functions)
2. Implement `src/data/scarMap.ts` aggregation queries (all 4)
3. Implement `src/hooks/useScars.ts`
4. Implement `src/components/workbench/ScarTagger.tsx`
   - All scar type options
   - Severity selection
   - Cost fields
5. Implement `src/components/dashboard/ScarMapView.tsx`
   - Timeline chart (custom SVG or recharts)
   - Pie chart (failure distribution)
   - Heat map (project × type)
   - Trend line
   - Date/project filters
6. Implement scar sharing export (JSON file)
7. Add scar visualization to ItemCard (red dot + tooltip)
8. Update dust level calculation: based on lastOpenedAt + activity
9. Implement `src/components/shared/DustOverlay.tsx`

**Acceptance Criteria:**
- Can tag failures on attempt items
- Scar Map shows accurate aggregations
- Filters work on scar map
- Dust overlay appears on inactive workbenches
- Scar data exports to JSON

---

### SPRINT 4: Mastery Markers (Week 4)
**Goal:** Skill tracking and evidence-based mastery

**Tasks:**
1. Implement `src/data/skills.ts` DAO (all 8 functions)
2. Implement `src/hooks/useSkills.ts`
3. Implement `src/components/workbench/SkillPanel.tsx`
   - Skill list with status badges
   - Evidence thumbnails
   - 30-day countdown
4. Implement `src/components/modals/SkillEvidenceModal.tsx`
   - Evidence upload
   - Status transition logic
5. Implement skill lifecycle state machine:
   - Exposed → Attempted (manual)
   - Attempted → Practiced (evidence required)
   - Practiced → Owned (30-day re-evidence required)
6. Implement 30-day challenge reminder system
   - Background check on app launch
   - Badge/notification in UI
7. Implement `src/components/dashboard/SkillPortfolio.tsx`
   - Grid of owned skills
   - Evidence gallery
   - PDF export (jsPDF)
8. Seed sample skills with evidence

**Acceptance Criteria:**
- Can create skills and attach to projects
- Status transitions require correct evidence
- 30-day reminders appear accurately
- Portfolio exports to PDF
- Evidence viewer displays photos/videos/files

---

### SPRINT 5: Cross-Pollination (Week 5)
**Goal:** Bridge creation and constellation view

**Tasks:**
1. Implement `src/data/bridges.ts` DAO (all 7 functions)
2. Implement `src/hooks/useBridges.ts`
3. Implement `src/components/modals/CreateBridgeModal.tsx`
   - Cross-project item search
   - Bridge note input (50 char minimum)
4. Implement `src/components/canvas/BridgeLayer.tsx`
   - Render bridge lines between workbenches
   - Line thickness = strength
   - Color = age
5. Implement `src/components/dashboard/ConstellationView.tsx`
   - Full-screen constellation canvas
   - Node = project, Edge = bridge
   - Pan/zoom
   - Hover tooltips
6. Implement bridge reinforcement flow
   - Prompt when viewing fading bridge
   - "Still true?" → reinforce or delete
7. Implement bridge decay logic
   - Strength decreases over time
   - Visual fading
8. Implement `src/stores/editorStore.ts`

**Acceptance Criteria:**
- Can create bridges between any two items
- Bridge note enforces 50 char minimum
- Constellation view renders all projects and bridges
- Bridge lines reflect strength and age
- Decay prompts appear for old bridges

---

### SPRINT 6: Reference Locker (Week 6)
**Goal:** Stale-date reference management

**Tasks:**
1. Implement `src/data/locker.ts` DAO (all 7 functions)
2. Implement `src/hooks/useLocker.ts`
3. Implement `src/components/dashboard/LockerView.tsx`
   - Active tab with stale countdown
   - Color-coded urgency
   - Rescue/Edit/Archive actions
   - Archived tab with search/restore
4. Implement stale date logic
   - Auto-archive after 14 days
   - Daily background check
5. Implement rescue flow
   - Select target workbench
   - Convert to item with "why this matters"
6. Implement locker creation from anywhere
   - "Save to Locker" button in toolbar
   - Quick-add modal
7. Add locker badge to toolbar (count of stale items)

**Acceptance Criteria:**
- Can save references to locker
- Stale items auto-archive after 14 days
- Rescue flow creates proper project item
- Urgency colors update correctly
- Archived items searchable and restorable

---

### SPRINT 7: Weekly Review & Polish (Week 7)
**Goal:** Guided review flow and UI refinement

**Tasks:**
1. Implement `src/components/dashboard/WeeklyReview.tsx`
   - 5-step guided flow
   - Step 1: Scar Map summary
   - Step 2: Bridge reinforcement list
   - Step 3: Mastery audit (due skills)
   - Step 4: Locker cleanup
   - Step 5: Shop reorganization suggestions
2. Implement review reminder system
   - Weekly prompt (configurable day)
   - Badge on toolbar
3. Polish WorkbenchCanvas
   - Smooth pan/zoom animations
   - Workbench hover states
   - Context menu (right-click)
4. Polish ProjectView
   - Empty states for all tabs
   - Loading skeletons
   - Error boundaries
5. Implement `src/components/layout/StatusBar.tsx`
6. Implement keyboard shortcuts
   - Ctrl/Cmd+N: new item
   - Ctrl/Cmd+S: save (no-op, auto-saves)
   - Esc: close modal
   - Ctrl/Cmd+1-7: switch view mode
7. Add onboarding tooltips (first-run only)

**Acceptance Criteria:**
- Weekly review flows smoothly through all 5 steps
- Review reminders appear on schedule
- Keyboard shortcuts work globally
- Empty states are helpful and on-brand
- No console errors in normal use

---

### SPRINT 8: Search, Export & Import (Week 8)
**Goal:** Data portability and discovery

**Tasks:**
1. Implement full-text search
   - Search across items (content, whyThisMatters)
   - Search across skills (name)
   - Search across locker (title)
   - Fuzzy matching (fuse.js or custom)
2. Implement `src/components/modals/ExportModal.tsx`
   - Full JSON export
   - Shop-filtered export
   - Date range export
3. Implement import flow
   - JSON validation (Zod schema)
   - Merge or replace strategy
   - Progress indicator
4. Implement `src/hooks/useExport.ts`
5. Implement `src/hooks/useImport.ts`
6. Add search results view
   - Grouped by entity type
   - Click to navigate
7. Add recent items sidebar section

**Acceptance Criteria:**
- Search finds content across all entity types
- Export produces valid JSON with all data + media paths
- Import validates and restores data correctly
- Media files referenced in import exist or are handled gracefully

---

### SPRINT 9: Camera Persistence & Settings (Week 9)
**Goal:** Session continuity and customization

**Tasks:**
1. Implement `src/data/camera.ts` DAO
2. Implement `src/hooks/useCamera.ts`
3. Wire camera save on pan/zoom end (debounced 500ms)
4. Implement `src/components/modals/SettingsModal.tsx`
   - Data section (export/import/storage)
   - Appearance (theme, texture)
   - Behavior (stale date, dust threshold, review day)
   - About
5. Implement theme system
   - Light/dark/system mode
   - CSS variables for workshop colors
6. Implement texture switching
   - Dynamic background loading
   - Custom texture upload (v2 stretch)
7. Implement app settings persistence
   - `app_settings` table
   - Load on startup
8. Add window state persistence (size, position)

**Acceptance Criteria:**
- Camera position restores per shop on reopen
- Settings persist across sessions
- Theme switches correctly
- Window size/position restores

---

### SPRINT 10: Tablet & Responsive (Week 10)
**Goal:** Touch support and tablet optimization

**Tasks:**
1. Add touch event handlers to WorkbenchCanvas
   - Pinch to zoom
   - Two-finger pan
   - Tap to select
   - Long-press for context menu
2. Optimize ProjectView for touch
   - Larger tap targets
   - Swipe between item type tabs
   - Bottom sheet for item creation
3. Add tablet-specific layout
   - Collapsible sidebar (swipe from edge)
   - Full-screen modals
4. Test on iPad + Android tablet
5. Optimize media capture for tablet cameras
   - Direct camera integration
   - Quick photo-to-item flow
6. Add haptic feedback (where supported)

**Acceptance Criteria:**
- Canvas pan/zoom works with touch
- All interactions usable on 10" tablet
- Camera capture works on tablet
- No desktop-only hover dependencies

---

### SPRINT 11: Performance & Testing (Week 11)
**Goal:** Production-ready performance and test coverage

**Tasks:**
1. Performance optimization
   - Virtualize item lists (react-window)
   - Memoize canvas components (React.memo)
   - Lazy load dashboard views
   - Optimize image thumbnails
2. Add comprehensive unit tests
   - DAO functions (Vitest + in-memory SQLite)
   - Utility functions
   - Zod validators
3. Add E2E tests (Playwright)
   - Onboarding flow
   - Create shop → workbench → item
   - Scar tagging
   - Bridge creation
   - Export/import
4. Error handling
   - Global error boundary
   - IPC error propagation
   - Database corruption recovery
5. Logging
   - Structured logging to file
   - Log rotation
   - No telemetry (local only)
6. Memory leak audit
   - Konva cleanup
   - Event listener removal
   - Query cache limits

**Acceptance Criteria:**
- 60fps canvas with 50+ workbenches
- <100ms item list load with 200 items
- >80% unit test coverage on data layer
- All E2E tests pass
- No memory leaks after 30min usage

---

### SPRINT 12: Packaging & Distribution (Week 12)
**Goal:** Build, sign, and ship v1.0

**Tasks:**
1. Configure electron-builder
   - macOS (dmg, zip)
   - Windows (nsis, portable)
   - Linux (AppImage, deb, rpm)
2. Code signing setup
   - macOS (Apple Developer ID)
   - Windows (EV cert or self-signed)
3. Auto-updater (optional v1.1)
   - GitHub releases integration
   - Manual check + download
4. Create GitHub repository
   - MIT license
   - README with screenshots
   - CONTRIBUTING.md
   - Code of conduct
5. Create release assets
   - Binaries for all platforms
   - Changelog
   - Known issues
6. Submit to directories
   - Product Hunt
   - Hacker News
   - Reddit communities
7. Create documentation site
   - User guide
   - Keyboard shortcuts
   - FAQ
8. Post-launch monitoring
   - GitHub issues template
   - Discord server setup

**Acceptance Criteria:**
- Installers work on macOS, Windows, Linux
- App launches without errors on clean system
- GitHub repo has >100 stars (stretch)
- Documentation is complete

---

## 10. TESTING STRATEGY

### Unit Tests (Vitest)

**Coverage Targets:**
- Data layer: 90%+
- Utilities: 80%+
- Components: 60%+ (logic only, not rendering)

**Test Files:**
```
tests/unit/
├── data/
│   ├── shops.test.ts
│   ├── workbenches.test.ts
│   ├── items.test.ts
│   ├── scars.test.ts
│   ├── skills.test.ts
│   ├── bridges.test.ts
│   └── locker.test.ts
├── utils/
│   ├── validators.test.ts
│   ├── canvasMath.test.ts
│   └── id.test.ts
└── stores/
    ├── uiStore.test.ts
    └── canvasStore.test.ts
```

**Pattern:**
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { createShop, getAllShops } from "../../src/data/shops";
import { db } from "../../src/db";

// Use in-memory SQLite for tests
beforeEach(async () => {
  await db.run("DELETE FROM shops");
});

describe("shops DAO", () => {
  it("creates a shop", async () => {
    const shop = await createShop({ name: "Wood Shop", backgroundTexture: "pegboard" });
    expect(shop.name).toBe("Wood Shop");
    expect(shop.id).toBeDefined();
  });
});
```

### E2E Tests (Playwright)

**Test Files:**
```
tests/e2e/
├── onboarding.spec.ts
├── workbench.spec.ts
├── items.spec.ts
├── scars.spec.ts
├── skills.spec.ts
├── bridges.spec.ts
├── locker.spec.ts
├── export.spec.ts
└── settings.spec.ts
```

**Pattern:**
```typescript
import { test, expect } from "@playwright/test";

test("user can create a shop and workbench", async ({ page }) => {
  await page.goto("/");
  await page.click("[data-testid='create-shop-button']");
  await page.fill("[data-testid='shop-name-input']", "Test Shop");
  await page.click("[data-testid='submit-shop-button']");
  await expect(page.locator("text=Test Shop")).toBeVisible();
});
```

---

## 11. BUILD CONFIGURATION

### Vite Configs

**`vite.main.config.ts`**
```typescript
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "electron/main.ts"),
      formats: ["cjs"],
      fileName: () => "main.js",
    },
    outDir: "dist-electron/main",
    rollupOptions: {
      external: ["electron", "better-sqlite3", "fs", "path", "os"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**`vite.renderer.config.ts`**
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: ".",
  base: "./",
  build: {
    outDir: "dist-electron/renderer",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### Electron Builder

**`electron-builder.json`**
```json
{
  "appId": "com.tinker.app",
  "productName": "Tinker",
  "directories": {
    "output": "release"
  },
  "files": [
    "dist-electron/**/*",
    "resources/**/*"
  ],
  "mac": {
    "target": ["dmg", "zip"],
    "category": "public.app-category.productivity"
  },
  "win": {
    "target": ["nsis", "portable"]
  },
  "linux": {
    "target": ["AppImage", "deb"],
    "category": "Office"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true
  }
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "npm run build:main && npm run build:preload && npm run build:renderer",
    "build:main": "vite build --config vite.main.config.ts",
    "build:preload": "vite build --config vite.preload.config.ts",
    "build:renderer": "vite build --config vite.renderer.config.ts",
    "preview": "electron dist-electron/main/main.js",
    "dist": "npm run build && electron-builder",
    "dist:mac": "npm run build && electron-builder --mac",
    "dist:win": "npm run build && electron-builder --win",
    "dist:linux": "npm run build && electron-builder --linux",
    "test": "vitest",
    "test:e2e": "playwright test",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx src/db/seed.ts",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit"
  }
}
```

---
## 12. AGENTIC CODING PROMPTS

### Prompt 1: Scaffold (Sprint 0)
```
You are building Tinker, a desktop learning app for makers. 

Set up the complete project scaffold:
1. Initialize an Electron + Vite + React + TypeScript project
2. Install: electron, vite, @vitejs/plugin-react, react, react-dom, typescript, tailwindcss, @tailwindcss/vite, better-sqlite3, drizzle-orm, drizzle-kit, zustand, @tanstack/react-query, react-konva, konva, react-router-dom, react-hook-form, zod, date-fns, lucide-react, nanoid, jsPDF, fuse.js
3. Configure three Vite configs (main, preload, renderer)
4. Set up Drizzle ORM with SQLite schema file at src/db/schema.ts
5. Write the IPC preload script exposing: dbQuery, dbMutate, mediaSave, mediaDelete, fsGetPath, fsShowOpenDialog, fsShowSaveDialog
6. Create the directory structure exactly as specified
7. Set up TypeScript strict mode and path aliases (@/*)
8. Create a basic App.tsx that renders "Tinker" in a centered div
9. Ensure `npm run dev` launches Electron successfully

Do not write any application logic yet. Just the scaffold.
```

### Prompt 2: Database Layer (Sprint 0 continued)
```
Implement the complete database layer for Tinker:

1. Write src/db/schema.ts with ALL tables: shops, workbenches, items, itemMedia, scars, skills, bridges, skillBridges, lockerItems, cameraStates, appSettings
2. Use Drizzle ORM sqliteTable definitions with proper relations
3. Generate the initial migration
4. Create src/db/index.ts that initializes the SQLite connection using better-sqlite3
5. Create src/types/index.ts with all TypeScript interfaces matching the schema
6. Create src/utils/id.ts that wraps nanoid for entity IDs
7. Create src/utils/constants.ts with: BENCH_MAX_ITEMS=50, LOCKER_STALE_DAYS=14, DUST_THRESHOLD_DAYS=30, BRIDGE_DECAY_DAYS=90
8. Create src/utils/validators.ts with Zod schemas for all inputs
9. Run the migration and verify the database file is created

Ensure all foreign keys and cascade deletes are correct.
```

### Prompt 3: DAOs (Sprint 1)
```
Implement all Data Access Objects for Tinker:

Create these files with complete CRUD operations using Drizzle ORM:
- src/data/shops.ts (getAll, getById, create, update, delete, reorder)
- src/data/workbenches.ts (getAll, getByShop, getById, create, update, delete, archive, updateDust)
- src/data/items.ts (getAll, getByWorkbench, getById, create, update, delete, search, getByType)
- src/data/scars.ts (getAll, getByItem, create, update, delete, getAggregates)
- src/data/skills.ts (getAll, getByWorkbench, getById, create, update, delete, updateStatus, getDueForReview)
- src/data/bridges.ts (getAll, getByItem, create, update, delete, reinforce, getDecaying)
- src/data/locker.ts (getAll, getActive, getArchived, create, update, archive, rescue)
- src/data/scarMap.ts (getTimeline, getDistribution, getHeatmap, getTrend)
- src/data/camera.ts (getByShop, save, delete)

Each function must be typed and return promises. Use Drizzle's type-safe query builder.
```

### Prompt 4: Hooks (Sprint 1)
```
Implement all TanStack Query hooks for Tinker:

Create these files following the exact pattern in the implementation plan:
- src/hooks/useShops.ts (query + create/update/delete mutations)
- src/hooks/useWorkbenches.ts (query by shop + CRUD mutations)
- src/hooks/useItems.ts (query by workbench + CRUD mutations)
- src/hooks/useScars.ts (query by item + CRUD mutations)
- src/hooks/useSkills.ts (query by workbench + CRUD + status transition mutations)
- src/hooks/useBridges.ts (query by item + CRUD + reinforce mutation)
- src/hooks/useLocker.ts (query active/archived + CRUD mutations)
- src/hooks/useCamera.ts (query by shop + save mutation)
- src/hooks/useExport.ts (export mutation)
- src/hooks/useMedia.ts (save/delete mutations)

All hooks must invalidate correct query keys on mutation success.
```

### Prompt 5: Canvas (Sprint 1-2)
```
Implement the spatial canvas for Tinker using React-Konva:

1. src/components/canvas/WorkbenchCanvas.tsx
   - Full-viewport Konva Stage
   - Wheel event: zoom toward cursor
   - Drag: pan camera
   - Double-click: create workbench at position

2. src/components/canvas/WorkbenchCard.tsx
   - Konva Group with Rect, Text
   - Shows name, item count, dust overlay
   - Draggable to reposition
   - Click to open project
   - Border color: blue=active, orange=full (>=50 items), gray=archived

3. src/components/canvas/BackgroundLayer.tsx
   - Tiled background image based on shop texture

4. src/components/canvas/BridgeLayer.tsx
   - Lines between workbenches (for constellation view)

5. src/stores/canvasStore.ts
   - Zustand store for camera position, drag state

Use the workshop color palette: steel gray, pine yellow, oak brown, chalk white.
```

### Prompt 6: Project View (Sprint 2)
```
Implement the project/workbench detail view for Tinker:

1. src/components/workbench/ProjectView.tsx
   - Header with back button, project name, item count
   - Layout: main area (ItemGrid) + right sidebar (SkillPanel)

2. src/components/workbench/ItemGrid.tsx
   - Filter tabs: All / Observations / References / Attempts / Questions / Breakthroughs
   - CSS Grid of ItemCards
   - Sort by date or manual

3. src/components/workbench/ItemCard.tsx
   - TypeBadge, content preview, media thumbnail, scar indicator
   - Click to expand
   - Right-click menu: edit, delete, bridge

4. src/components/workbench/ItemCreator.tsx
   - React Hook Form + Zod
   - Type selector changes visible fields
   - Reference: URL + mandatory WhyThisMatters
   - Attempt: what, result, tools
   - Breakthrough: mandatory MediaUploader

5. src/components/shared/MediaUploader.tsx
   - Dropzone + file picker
   - Saves via IPC to media directory
   - Generates thumbnails

6. src/components/shared/WhyThisMatters.tsx
   - Textarea with 10 char minimum validation

7. src/components/shared/TypeBadge.tsx
   - Color-coded pills with icons
```

### Prompt 7: Sidebar & Navigation (Sprint 1-2)
```
Implement the sidebar and app shell for Tinker:

1. src/components/layout/AppShell.tsx
   - Sidebar (left, collapsible) + main content area
   - Main content switches based on uiStore.viewMode

2. src/components/layout/Sidebar.tsx
   - Accordion list of shops
   - Each shop shows workbenches
   - Click workbench → set activeWorkbenchId + viewMode="project"
   - Right-click context menu on workbenches
   - "+ New Shop" button
   - Collapse/expand toggle

3. src/components/layout/Toolbar.tsx
   - View mode buttons: Workbench, Project, Scar Map, Constellation, Portfolio, Locker, Review
   - Search input (debounced)
   - Export button
   - Settings button

4. src/components/layout/StatusBar.tsx
   - Zoom level, item count, last saved

5. src/stores/uiStore.ts
   - Zustand store for all UI state
```

### Prompt 8: Failure Archaeology (Sprint 3)
```
Implement the failure archaeology system for Tinker:

1. src/components/workbench/ScarTagger.tsx
   - Form with: scar type select, severity radio, cost fields, notes
   - Submit creates scar record

2. src/components/dashboard/ScarMapView.tsx
   - Timeline chart (failures over time)
   - Pie chart (failure type distribution)
   - Heat map (projects × failure types)
   - Trend line (failures per week)
   - Date range and project filters

3. src/data/scarMap.ts
   - Aggregation queries using Drizzle

4. Update ItemCard to show scar indicator (red dot)
5. Update dust calculation in workbenches.ts
6. Create scar sharing export (JSON file via IPC)
```

### Prompt 9: Mastery System (Sprint 4)
```
Implement the evidence-based mastery system for Tinker:

1. src/components/workbench/SkillPanel.tsx
   - List skills with status badges
   - Evidence thumbnails
   - 30-day countdown
   - "Add Evidence" button

2. src/components/modals/SkillEvidenceModal.tsx
   - Evidence upload
   - Status transition: Attempted → Practiced → Owned

3. src/components/dashboard/SkillPortfolio.tsx
   - Grid of owned skills
   - Evidence gallery
   - PDF export using jsPDF

4. Implement 30-day challenge logic
   - reviewDueAt field
   - Background check on app launch
   - Badge/notification in UI

5. Update skills DAO with status transitions and review logic
```

### Prompt 10: Cross-Pollination (Sprint 5)
```
Implement the bridge/constellation system for Tinker:

1. src/components/modals/CreateBridgeModal.tsx
   - Search items across all projects
   - Select target item
   - Bridge note input (50 char minimum enforced)

2. src/components/dashboard/ConstellationView.tsx
   - Konva canvas showing all projects as nodes
   - Bridges as lines (thickness=strength, color=age)
   - Pan/zoom
   - Hover tooltips with bridge note

3. src/components/canvas/BridgeLayer.tsx
   - Renders bridge lines on workbench canvas

4. Implement bridge decay
   - Strength decreases over time
   - Visual fading
   - "Still true?" prompt

5. Update bridges DAO with reinforce and decay logic
```

### Prompt 11: Locker & Review (Sprint 6-7)
```
Implement the reference locker and weekly review for Tinker:

1. src/components/dashboard/LockerView.tsx
   - Active tab: list with stale countdown, color-coded urgency
   - Archived tab: searchable, restorable
   - Actions: Rescue, Edit, Archive

2. src/components/dashboard/WeeklyReview.tsx
   - 5-step guided flow
   - Step 1: Scar Map summary
   - Step 2: Bridge reinforcement
   - Step 3: Mastery audit
   - Step 4: Locker cleanup
   - Step 5: Shop reorganization
   - Next/Previous/Skip navigation

3. Implement stale date logic
   - Auto-archive after 14 days
   - Daily background check

4. Implement review reminder
   - Configurable day of week
   - Badge on toolbar

5. Update locker DAO with stale checking
```

### Prompt 12: Polish & Ship (Sprint 8-12)
```
Polish and prepare Tinker for release:

1. Implement search across all content (fuse.js)
2. Implement export/import (JSON via IPC)
3. Implement settings modal (theme, behavior, data)
4. Implement camera persistence per shop
5. Add keyboard shortcuts
6. Add onboarding tooltips (first-run)
7. Add empty states and loading skeletons
8. Add error boundaries
9. Configure electron-builder for all platforms
10. Write README with screenshots
11. Create GitHub release workflow
12. Run full test suite and fix any failures

Ensure the app is production-ready and shippable.
```


---

## 13. CRITICAL IMPLEMENTATION NOTES

### 13.1 Local-First Data
- NEVER require internet connection
- NEVER phone home
- ALL data in SQLite file in userData
- Media in userData/media/
- Export produces standalone JSON + media folder

### 13.2 No AI
- NO ML models
- NO smart suggestions
- NO auto-tagging
- NO content generation
- ALL "intelligence" is user-created (bridges, scars, skills)

### 13.3 Performance Budgets
- App launch: < 2 seconds
- Canvas pan/zoom: 60fps
- Item list: < 100ms for 200 items
- Search: < 500ms across all content
- Database queries: < 50ms

### 13.4 Accessibility
- All interactive elements keyboard accessible
- ARIA labels on canvas elements (where possible)
- Color contrast WCAG AA minimum
- Focus indicators visible

### 13.5 Security
- IPC only exposes necessary APIs
- No nodeIntegration in renderer
- Context isolation enabled
- File paths validated before access

---

## 14. DELIVERABLES CHECKLIST

- [ ] Project scaffold (Electron + Vite + React + TS)
- [ ] Database schema (Drizzle ORM, SQLite)
- [ ] All DAO functions (typed, tested)
- [ ] All TanStack Query hooks
- [ ] All Zustand stores
- [ ] Workbench Canvas (React-Konva, pan/zoom/drag)
- [ ] Project View (items, skills, creator)
- [ ] Scar tagging + Scar Map dashboard
- [ ] Skill tracking + Portfolio + PDF export
- [ ] Bridge creation + Constellation view
- [ ] Reference Locker + stale management
- [ ] Weekly Review guided flow
- [ ] Search (full-text, cross-entity)
- [ ] Export/Import (JSON)
- [ ] Settings (theme, behavior, data)
- [ ] Camera persistence
- [ ] Keyboard shortcuts
- [ ] Tablet touch support
- [ ] Unit tests (>80% data layer)
- [ ] E2E tests (critical flows)
- [ ] Build scripts (macOS, Windows, Linux)
- [ ] README + Documentation
- [ ] GitHub repo + Release

---

**Document Owner:** Engineering Team  
**Last Updated:** April 23, 2026  
**Next Review:** Per sprint
