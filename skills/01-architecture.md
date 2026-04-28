# SKILL: Tinker Project Architecture & Conventions

## Overview
Tinker is a local-first Electron desktop app for makers. All code must follow these architectural rules. Violations will be rejected.

## Tech Stack (Immutable)
- **Shell:** Electron 35 (main + preload + renderer processes)
- **Renderer:** React 19 + TypeScript 5.7 (strict mode)
- **Bundler:** Vite 6 (three configs: main, preload, renderer)
- **Styling:** Tailwind CSS 4 (utility-only, no custom CSS files)
- **Canvas:** React-Konva 19 (for spatial workbench view)
- **Database:** better-sqlite3 + Drizzle ORM (synchronous, local)
- **State:** Zustand 5 (UI state) + TanStack Query 5 (data/cache)
- **Forms:** React Hook Form 7 + Zod 3
- **Router:** React Router 7
- **Icons:** Lucide React only

## Process Architecture
```
Main Process (Node.js)
  ├─ better-sqlite3 (DB file in userData)
  ├─ fs/promises (media I/O)
  ├─ electron dialog (file pickers)
  └─ IPC Handlers (exposed via contextBridge)
       ↑
       │ contextBridge / preload.js
       ↓
Renderer Process (Chromium)
  ├─ React 19 app
  ├─ Konva canvas (spatial UI)
  └─ TanStack Query (caches DB responses)
```

## Golden Rules
1. **NEVER use nodeIntegration.** All Node APIs go through IPC.
2. **NEVER import better-sqlite3 in renderer.** DB access only in main process.
3. **NEVER use any cloud service.** No analytics, no telemetry, no accounts.
4. **NEVER use AI/ML.** No smart suggestions, no auto-tagging, no content generation.
5. **ALWAYS validate with Zod** before any DB write or IPC call.
6. **ALWAYS use nanoid** for entity IDs. Never auto-increment integers.
7. **ALWAYS handle errors** at IPC boundary — show user-friendly messages in UI.
8. **ALWAYS write types first** — schema → types → DAO → hooks → components.

## File Naming Conventions
- Components: PascalCase + `.tsx` (e.g., `WorkbenchCanvas.tsx`)
- Hooks: camelCase + `use` prefix + `.ts` (e.g., `useWorkbenches.ts`)
- Stores: camelCase + `Store` suffix + `.ts` (e.g., `canvasStore.ts`)
- DAOs: camelCase + `.ts` (e.g., `workbenches.ts`)
- Utils: camelCase + `.ts` (e.g., `validators.ts`)
- Tests: same name + `.test.ts` (e.g., `workbenches.test.ts`)

## Import Order (Enforced)
```typescript
// 1. React / framework
import { useState } from "react";

// 2. External libraries
import { create } from "zustand";

// 3. Internal absolute imports (@/)
import { db } from "@/db";
import { useShops } from "@/hooks/useShops";

// 4. Internal relative imports (./)
import { WorkbenchCard } from "./WorkbenchCard";
```

## Directory Rules
- `src/db/` — Schema and migrations ONLY. No business logic.
- `src/data/` — DAOs ONLY. Raw DB operations. No React hooks.
- `src/hooks/` — TanStack Query hooks ONLY. Wrap DAOs with caching.
- `src/stores/` — Zustand stores ONLY. UI/canvas/editor state.
- `src/components/` — React components ONLY. No direct DB access.
- `src/utils/` — Pure functions ONLY. No side effects.
- `src/types/` — TypeScript types ONLY. No runtime code.

## State Ownership Matrix
| Concern | Owner | Technology |
|---------|-------|------------|
| Persistent data | Main process + SQLite | better-sqlite3 |
| Server state cache | Renderer | TanStack Query |
| UI state | Renderer | Zustand |
| Canvas camera | Renderer | Zustand |
| Form drafts | Renderer | Zustand |
| Media files | Filesystem | fs/promises |

## IPC Rules
- All IPC channel names are constants in `electron/ipc/channels.ts`
- Preload script is the ONLY bridge between main and renderer
- All IPC handlers are registered in `electron/ipc/handlers.ts`
- Renderer calls IPC via `window.electron.invoke(channel, payload)`
- Every IPC call must be typed with request/response interfaces
- IPC handlers must validate payloads with Zod before processing

## Error Handling Pattern
```typescript
// In IPC handler
try {
  const validated = someSchema.parse(payload);
  // ... do work
  return { success: true, data };
} catch (error) {
  if (error instanceof ZodError) {
    return { success: false, error: "Invalid input", details: error.errors };
  }
  console.error("IPC error:", error);
  return { success: false, error: "Internal error" };
}

// In hook
const mutation = useMutation({
  mutationFn: createShop,
  onError: (error) => {
    // Show toast/notification
    toast.error(error.message);
  },
});
```

## Performance Rules
- Canvas components MUST use `React.memo`
- Item lists > 50 MUST use virtualization (react-window)
- Images MUST use lazy loading + thumbnails
- DB queries MUST be indexed (Drizzle handles this via schema)
- Re-renders MUST be minimized — use Zustand selectors
- No `useEffect` for derived state — use memoization

## No-Go List
- ❌ No `any` type (strict mode catches this)
- ❌ No `console.log` in production (use structured logger)
- ❌ No inline styles (Tailwind only)
- ❌ No CSS-in-JS libraries
- ❌ No global state outside Zustand stores
- ❌ No direct DOM manipulation (React only)
- ❌ No `eval()` or `new Function()`
- ❌ No external API calls (offline-first)
- ❌ No cookies, localStorage, or sessionStorage (SQLite only)
- ❌ No service workers (not a PWA)
