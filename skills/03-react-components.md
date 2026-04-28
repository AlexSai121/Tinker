# SKILL: Tinker React Component Patterns

## Philosophy
Components are dumb where possible, smart where necessary. Data flows down via props and hooks. Events flow up via callbacks and mutations. No prop drilling — use Zustand for shared UI state.

## Component Categories

### Layout Components
Wrap the app structure. No business logic.
```typescript
// src/components/layout/AppShell.tsx
import { useUiStore } from "@/stores/uiStore";
import { Sidebar } from "./Sidebar";
import { Toolbar } from "./Toolbar";
import { StatusBar } from "./StatusBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);

  return (
    <div className="flex h-screen w-screen bg-stone-900 text-stone-100 overflow-hidden">
      <aside
        className={cn(
          "transition-all duration-300 border-r border-stone-700",
          sidebarOpen ? "w-64" : "w-0 overflow-hidden"
        )}
      >
        <Sidebar />
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <Toolbar />
        <div className="flex-1 overflow-hidden relative">{children}</div>
        <StatusBar />
      </main>
    </div>
  );
}
```

### Canvas Components (Konva)
Use React-Konva for the spatial workbench view. These are the ONLY components that use Konva.

```typescript
// src/components/canvas/WorkbenchCanvas.tsx
import { Stage, Layer } from "react-konva";
import { useCanvasStore } from "@/stores/canvasStore";
import { useWorkbenches } from "@/hooks/useWorkbenches";
import { WorkbenchLayer } from "./WorkbenchLayer";
import { BackgroundLayer } from "./BackgroundLayer";
import { useCallback, useRef } from "react";
import type { KonvaEventObject } from "konva/lib/Node";

export function WorkbenchCanvas({ shopId }: { shopId: string }) {
  const stageRef = useRef<any>(null);
  const { x, y, scale, setCamera, pan, zoom } = useCanvasStore();
  const { data: workbenches } = useWorkbenches(shopId);

  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const factor = e.evt.deltaY > 0 ? 0.9 : 1.1;
    zoom(factor, pointer.x, pointer.y);
  }, [zoom]);

  const handleDragMove = useCallback((e: KonvaEventObject<DragEvent>) => {
    // Stage drag = pan
    pan(e.evt.movementX, e.evt.movementY);
  }, [pan]);

  return (
    <Stage
      ref={stageRef}
      width={window.innerWidth}
      height={window.innerHeight}
      onWheel={handleWheel}
      draggable
      onDragMove={handleDragMove}
      x={x}
      y={y}
      scaleX={scale}
      scaleY={scale}
    >
      <BackgroundLayer />
      <WorkbenchLayer workbenches={workbenches ?? []} />
    </Stage>
  );
}
```

**Konva Performance Rules:**
- Memoize ALL Konva children with `React.memo`
- Use `useCallback` for ALL event handlers
- Never update Konva props on every frame — only on state changes
- Use `layer` batching for multiple updates
- Limit re-renders by selecting minimal state from Zustand

```typescript
// src/components/canvas/WorkbenchCard.tsx
import { memo, useCallback } from "react";
import { Group, Rect, Text } from "react-konva";
import type { Workbench } from "@/types";

interface WorkbenchCardProps {
  workbench: Workbench;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

export const WorkbenchCard = memo(function WorkbenchCard({
  workbench,
  onSelect,
  onDragEnd,
}: WorkbenchCardProps) {
  const handleClick = useCallback(() => {
    onSelect(workbench.id);
  }, [workbench.id, onSelect]);

  const handleDragEnd = useCallback((e: any) => {
    onDragEnd(workbench.id, e.target.x(), e.target.y());
  }, [workbench.id, onDragEnd]);

  const isFull = workbench.itemCount >= workbench.maxItems;
  const borderColor = isFull ? "#f97316" : workbench.isArchived ? "#78716c" : "#0ea5e9";

  return (
    <Group
      x={workbench.posX}
      y={workbench.posY}
      draggable
      onClick={handleClick}
      onDragEnd={handleDragEnd}
      onTap={handleClick}
    >
      <Rect
        width={workbench.width}
        height={workbench.height}
        fill="#292524"
        stroke={borderColor}
        strokeWidth={2}
        cornerRadius={8}
        shadowColor="black"
        shadowBlur={10}
        shadowOpacity={0.5}
      />
      <Text
        text={workbench.name}
        x={12}
        y={12}
        width={workbench.width - 24}
        fontSize={14}
        fontFamily="system-ui, sans-serif"
        fill="#e7e5e4"
        wrap="word"
        ellipsis
      />
      <Text
        text={`${workbench.itemCount}/${workbench.maxItems}`}
        x={12}
        y={workbench.height - 24}
        fontSize={11}
        fill={isFull ? "#f97316" : "#a8a29e"}
      />
      {/* Dust overlay */}
      {workbench.dustLevel > 0 && (
        <Rect
          width={workbench.width}
          height={workbench.height}
          fill="#1c1917"
          opacity={workbench.dustLevel * 0.6}
          cornerRadius={8}
        />
      )}
    </Group>
  );
});
```

### Form Components
Use React Hook Form + Zod for ALL forms.

```typescript
// src/components/workbench/ItemCreator.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { itemInsertSchema } from "@/utils/validators";
import { useCreateItem } from "@/hooks/useItems";
import type { ItemInsert } from "@/types";

export function ItemCreator({ workbenchId }: { workbenchId: string }) {
  const createItem = useCreateItem();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ItemInsert>({
    resolver: zodResolver(itemInsertSchema),
    defaultValues: {
      workbenchId,
      type: "observation",
      content: "",
    },
  });

  const itemType = watch("type");

  const onSubmit = async (data: ItemInsert) => {
    await createItem.mutateAsync(data);
    // Reset form or close modal
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-300">Type</label>
        <select {...register("type")} className="mt-1 input">
          <option value="observation">Observation</option>
          <option value="reference">Reference</option>
          <option value="attempt">Attempt</option>
          <option value="question">Question</option>
          <option value="breakthrough">Breakthrough</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-300">Content</label>
        <textarea {...register("content")} className="mt-1 input min-h-[100px]" />
        {errors.content && (
          <p className="text-red-400 text-sm mt-1">{errors.content.message}</p>
        )}
      </div>

      {itemType === "reference" && (
        <div>
          <label className="block text-sm font-medium text-stone-300">Why This Matters</label>
          <textarea
            {...register("whyThisMatters")}
            className="mt-1 input"
            placeholder="Explain why this reference matters to your project..."
          />
          {errors.whyThisMatters && (
            <p className="text-red-400 text-sm mt-1">{errors.whyThisMatters.message}</p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || createItem.isPending}
        className="btn btn-primary"
      >
        {createItem.isPending ? "Saving..." : "Save Item"}
      </button>
    </form>
  );
}
```

### Modal Components
All modals are managed by `uiStore.modalStack`.

```typescript
// src/components/modals/CreateShopModal.tsx
import { useUiStore } from "@/stores/uiStore";
import { useCreateShop } from "@/hooks/useShops";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { shopInsertSchema } from "@/utils/validators";

export function CreateShopModal() {
  const closeModal = useUiStore((s) => s.closeModal);
  const createShop = useCreateShop();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(shopInsertSchema),
  });

  const onSubmit = async (data: any) => {
    await createShop.mutateAsync(data);
    closeModal();
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Create New Shop</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input {...register("name")} placeholder="Shop name" className="input" />
          {errors.name && <p className="text-red-400 text-sm">{errors.name.message}</p>}

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={closeModal} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

## Tailwind Patterns

### Color Palette (Workshop Theme)
```css
/* DO NOT write this file. Use Tailwind classes. These are the allowed colors. */

/* Backgrounds */
bg-stone-900    /* Main app background */
bg-stone-800    /* Card/panel backgrounds */
bg-stone-700    /* Hover states, borders */

/* Text */
text-stone-100  /* Primary text */
text-stone-300  /* Secondary text, labels */
text-stone-400  /* Muted text, placeholders */
text-stone-500  /* Disabled text */

/* Accents */
text-sky-400    /* Active states, links */
bg-sky-600      /* Primary buttons */
bg-sky-700      /* Primary button hover */

/* Type badges */
bg-stone-600    /* Observation */
bg-sky-700      /* Reference */
bg-rose-700     /* Attempt */
bg-amber-700    /* Question */
bg-emerald-700  /* Breakthrough */

/* Status */
text-emerald-400  /* Success, owned */
text-amber-400    /* Warning, practiced */
text-rose-400     /* Error, failure */
```

### Common Component Classes
```typescript
// src/index.css — Tailwind directives + custom utilities
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .input {
    @apply w-full px-3 py-2 bg-stone-800 border border-stone-600 rounded-md 
           text-stone-100 placeholder-stone-500 
           focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent
           transition-colors;
  }

  .btn {
    @apply px-4 py-2 rounded-md font-medium transition-colors 
           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900;
  }

  .btn-primary {
    @apply btn bg-sky-600 text-white hover:bg-sky-700 
           focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-ghost {
    @apply btn text-stone-300 hover:bg-stone-800 hover:text-stone-100 
           focus:ring-stone-500;
  }

  .btn-danger {
    @apply btn bg-rose-700 text-white hover:bg-rose-800 
           focus:ring-rose-500;
  }

  .modal-overlay {
    @apply fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50;
  }

  .modal-content {
    @apply bg-stone-800 border border-stone-700 rounded-lg p-6 max-w-md w-full mx-4 
           shadow-2xl;
  }

  .card {
    @apply bg-stone-800 border border-stone-700 rounded-lg p-4 
           hover:border-stone-600 transition-colors;
  }

  .badge {
    @apply inline-flex items-center px-2 py-0.5 rounded text-xs font-medium;
  }
}
```

## Component Rules
1. **One component per file** — except tiny sub-components used only by parent
2. **Props interface** — every component MUST have a typed props interface
3. **Default exports** — ONLY for page-level components. Use named exports for everything else.
4. **React.memo** — REQUIRED for Konva components and list items
5. **useCallback/useMemo** — REQUIRED for callbacks passed to memoized children
6. **No inline objects/arrays** in JSX props — memoize them
7. **Error boundaries** — wrap every major view component
8. **Loading states** — every async component must handle loading and error
9. **Empty states** — every list must have an empty state design
10. **Accessibility** — all buttons have aria-label, all inputs have labels

## No-Go List
- ❌ No `className` concatenation without `cn()` utility
- ❌ No inline styles (`style={{}}`)
- ❌ No `!important` in Tailwind
- ❌ No arbitrary values (`w-[100px]`) — use standard scale
- ❌ No `any` in component props
- ❌ No `useEffect` without cleanup
- ❌ No `setState` in render
- ❌ No direct Konva manipulation outside React-Konva
