import { create } from "zustand";
import { devtools } from "zustand/middleware";

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
  resetCanvas: () => void;
}

const initialCanvasState = {
  x: 0,
  y: 0,
  scale: 1,
  isDragging: false,
  draggedWorkbenchId: null,
};

export const useCanvasStore = create<CanvasState>()(
  devtools(
    (set) => ({
      ...initialCanvasState,

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

      resetCanvas: () => set(initialCanvasState),
    }),
    { name: "canvas-store" }
  )
);
