# SKILL: Tinker Canvas & Spatial UI Patterns

## Philosophy
The workbench canvas is the heart of Tinker. It must feel physical, responsive, and spatial. Users navigate intuitively — zoom out for the big picture, zoom in for detail, pan to explore.

## Technology
- **React-Konva** — Declarative React wrapper for Konva.js 2D canvas
- **Konva** — High-performance 2D canvas library with scene graph

## Coordinate Systems

### World Coordinates
- The infinite canvas uses world coordinates (arbitrary units)
- Origin (0,0) is arbitrary — camera starts at (0,0)
- Workbenches are positioned in world coordinates
- All persistent positions are stored in world coordinates

### Screen Coordinates
- Pixels relative to the viewport
- Mouse events come in screen coordinates
- Convert: `screen = (world - camera) * zoom`
- Convert back: `world = screen / zoom + camera`

```typescript
// src/utils/canvasMath.ts
export interface Point { x: number; y: number; }
export interface Camera { x: number; y: number; scale: number; }

export function screenToWorld(screen: Point, camera: Camera): Point {
  return { x: screen.x / camera.scale + camera.x, y: screen.y / camera.scale + camera.y };
}

export function worldToScreen(world: Point, camera: Camera): Point {
  return { x: (world.x - camera.x) * camera.scale, y: (world.y - camera.y) * camera.scale };
}

export function zoomToward(camera: Camera, factor: number, screenPoint: Point): Camera {
  const worldPoint = screenToWorld(screenPoint, camera);
  const newScale = Math.max(0.1, Math.min(5, camera.scale * factor));
  return {
    x: worldPoint.x - screenPoint.x / newScale,
    y: worldPoint.y - screenPoint.y / newScale,
    scale: newScale,
  };
}
```

## Stage Configuration

```typescript
// src/components/canvas/WorkbenchCanvas.tsx
import { Stage, Layer } from "react-konva";
import { useRef, useCallback, useEffect } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import { useWorkbenches } from "@/hooks/useWorkbenches";
import { useCamera } from "@/hooks/useCamera";
import { WorkbenchLayer } from "./WorkbenchLayer";
import { BackgroundLayer } from "./BackgroundLayer";
import type { KonvaEventObject } from "konva/lib/Node";

export function WorkbenchCanvas({ shopId }: { shopId: string }) {
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { x, y, scale, setCamera, pan, zoom } = useCanvasStore();
  const { data: workbenches } = useWorkbenches(shopId);
  const { data: cameraState } = useCamera(shopId);

  useEffect(() => {
    if (cameraState) setCamera(cameraState.x, cameraState.y, cameraState.scale);
  }, [cameraState, setCamera]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && stageRef.current) {
        stageRef.current.width(containerRef.current.clientWidth);
        stageRef.current.height(containerRef.current.clientHeight);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    zoom(e.evt.deltaY > 0 ? 0.9 : 1.1, pointer.x, pointer.y);
  }, [zoom]);

  const handleDragMove = useCallback((e: KonvaEventObject<DragEvent>) => {
    if (e.target === e.target.getStage()) pan(e.evt.movementX, e.evt.movementY);
  }, [pan]);

  const handleDblClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const worldPos = screenToWorld(pointer, { x, y, scale });
    // uiStore.openModal({ type: "createProject", payload: { shopId, posX: worldPos.x, posY: worldPos.y } })
  }, [x, y, scale, shopId]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <Stage
        ref={stageRef}
        width={containerRef.current?.clientWidth ?? 1400}
        height={containerRef.current?.clientHeight ?? 900}
        onWheel={handleWheel}
        draggable
        onDragMove={handleDragMove}
        onDblClick={handleDblClick}
        x={x} y={y} scaleX={scale} scaleY={scale}
      >
        <BackgroundLayer texture="pegboard" />
        <WorkbenchLayer workbenches={workbenches ?? []} />
      </Stage>
    </div>
  );
}
```

## Background Layer

```typescript
// src/components/canvas/BackgroundLayer.tsx
import { Layer, Rect } from "react-konva";
import { useMemo } from "react";

const TEXTURES: Record<string, string> = {
  pegboard: "#44403c",
  concrete: "#57534e",
  butcherblock: "#78350f",
  gridpaper: "#f5f5f4",
};

export function BackgroundLayer({ texture }: { texture: string }) {
  const color = TEXTURES[texture] ?? TEXTURES.pegboard;
  const gridPattern = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 40; canvas.height = 40;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 40, 40);
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 40, 40);
    return canvas;
  }, [color]);

  return (
    <Layer>
      <Rect x={-10000} y={-10000} width={20000} height={20000} fill={color} />
      {gridPattern && (
        <Rect x={-10000} y={-10000} width={20000} height={20000}
          fillPatternImage={gridPattern} fillPatternRepeat="repeat" />
      )}
    </Layer>
  );
}
```

## Workbench Card

```typescript
// src/components/canvas/WorkbenchCard.tsx
import { memo, useCallback } from "react";
import { Group, Rect, Text } from "react-konva";
import { useCanvasStore } from "@/stores/canvasStore";
import { useUiStore } from "@/stores/uiStore";
import { useUpdateWorkbench } from "@/hooks/useWorkbenches";
import type { Workbench } from "@/types";

interface Props { workbench: Workbench; }

export const WorkbenchCard = memo(function WorkbenchCard({ workbench }: Props) {
  const setActiveWorkbench = useUiStore((s) => s.setActiveWorkbench);
  const setDragging = useCanvasStore((s) => s.setDragging);
  const updateWorkbench = useUpdateWorkbench();

  const handleClick = useCallback(() => setActiveWorkbench(workbench.id), [workbench.id, setActiveWorkbench]);
  const handleDragStart = useCallback(() => setDragging(true), [setDragging]);
  const handleDragEnd = useCallback((e: any) => {
    setDragging(false);
    updateWorkbench.mutate({ id: workbench.id, data: { posX: e.target.x(), posY: e.target.y() } });
  }, [workbench.id, updateWorkbench, setDragging]);

  const isFull = (workbench.itemCount ?? 0) >= workbench.maxItems;
  const borderColor = workbench.isArchived ? "#78716c" : isFull ? "#f97316" : "#0ea5e9";
  const bgColor = workbench.isArchived ? "#292524" : "#1c1917";

  return (
    <Group x={workbench.posX} y={workbench.posY} draggable
      onClick={handleClick} onTap={handleClick}
      onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Rect width={workbench.width} height={workbench.height}
        fill="black" opacity={0.3} cornerRadius={8} x={4} y={4} />
      <Rect width={workbench.width} height={workbench.height}
        fill={bgColor} stroke={borderColor} strokeWidth={2} cornerRadius={8} />
      <Text text={workbench.name} x={16} y={16} width={workbench.width - 32}
        fontSize={15} fontFamily="system-ui, sans-serif" fontStyle="bold" fill="#e7e5e4" wrap="word" ellipsis />
      {workbench.description && (
        <Text text={workbench.description} x={16} y={42} width={workbench.width - 32}
          fontSize={11} fill="#a8a29e" wrap="word" ellipsis height={40} />
      )}
      <Text text={`${workbench.itemCount ?? 0}/${workbench.maxItems}`} x={16} y={workbench.height - 28}
        fontSize={11} fill={isFull ? "#f97316" : "#a8a29e"} />
      {workbench.dustLevel > 0 && (
        <Rect width={workbench.width} height={workbench.height}
          fill="#0c0a09" opacity={workbench.dustLevel * 0.5} cornerRadius={8} />
      )}
    </Group>
  );
});
```

## Bridge Lines (Constellation View)

```typescript
// src/components/canvas/BridgeLayer.tsx
import { Layer, Line } from "react-konva";
import { memo } from "react";
import type { Bridge, Workbench } from "@/types";

interface Props { bridges: Bridge[]; workbenches: Workbench[]; }

export const BridgeLayer = memo(function BridgeLayer({ bridges, workbenches }: Props) {
  const map = new Map(workbenches.map((w) => [w.id, w]));
  return (
    <Layer>
      {bridges.map((bridge) => {
        const s = map.get(bridge.sourceWorkbenchId);
        const t = map.get(bridge.targetWorkbenchId);
        if (!s || !t) return null;
        const age = Date.now() - bridge.lastReinforcedAt.getTime();
        const freshness = Math.max(0, 1 - age / (90 * 24 * 60 * 60 * 1000));
        const color = `rgb(${Math.round(34 + 18 * freshness)},${Math.round(197 + 14 * freshness)},${Math.round(94 + 69 * freshness)})`;
        return (
          <Line key={bridge.id}
            points={[s.posX + s.width / 2, s.posY + s.height / 2, t.posX + t.width / 2, t.posY + t.height / 2]}
            stroke={color} strokeWidth={bridge.strength} opacity={0.3 + freshness * 0.5} lineCap="round" />
        );
      })}
    </Layer>
  );
});
```

## Performance Rules
1. **Memoize everything** — `React.memo` on ALL Konva components
2. **Use `useCallback`** for ALL event handlers passed to Konva
3. **Batch updates** — use `layer.batchDraw()` for multiple changes
4. **Limit node count** — virtualize off-screen workbenches
5. **Cache patterns** — background patterns created once and reused
6. **Debounce saves** — workbench position updates debounced 500ms
7. **No state in render** — precompute values in `useMemo`

## Touch Support
```typescript
const handlePinch = useCallback((e: KonvaEventObject<TouchEvent>) => {
  // Two-finger pinch to zoom
}, []);

const handleTap = useCallback((e: KonvaEventObject<TouchEvent>) => {
  // Single tap = select, long press = context menu
}, []);
```

## No-Go List
- ❌ No DOM elements inside Konva
- ❌ No React state updates on every mouse move
- ❌ No `setState` in `onMouseMove` handlers
- ❌ No unmemoized objects/arrays in Konva props
- ❌ No `fillPatternImage` with new Image() on every render
- ❌ No canvas `getContext("2d")` manipulation outside Konva
