import { Stage } from "react-konva";
import { useRef, useCallback, useEffect, useMemo, useState } from "react";
import { useCanvasStore } from "../../stores/canvasStore";
import { useUiStore } from "../../stores/uiStore";
import { useShop } from "../../hooks/useShops";
import { useArchiveWorkbench, useDeleteWorkbench, useUpdateWorkbench, useWorkbenches } from "../../hooks/useWorkbenches";
import { useAllItems } from "../../hooks/useItems";
import { useAppSetting, useUpsertAppSetting } from "../../hooks/useAppSettings";
import { useAllBridges } from "../../hooks/useBridges";
import { WorkbenchLayer } from "./WorkbenchLayer";
import { BackgroundLayer } from "./BackgroundLayer";
import { BridgeLayer } from "./BridgeLayer";
import { screenToWorld, zoomToward } from "../../utils/canvasMath";
import { parsePreferences } from "../../utils/preferences";
import { EmptyState } from "../shared/EmptyState";
import { SkeletonBlock } from "../shared/Skeleton";
import { getBridgeAgeInDays, getBridgeFreshness, getEffectiveBridgeStrength } from "../../data/bridges";
import { triggerHapticFeedback } from "../../utils/haptics";
import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import { nanoid } from "nanoid";
import { decodeStructuredItemContent } from "../../utils/itemContent";

type TouchMode = "idle" | "background" | "pinch" | "foreground";

function clampScale(scale: number) {
  return Math.max(0.1, Math.min(5, scale));
}

function getTouchDistance(touches: TouchList) {
  const first = touches[0];
  const second = touches[1];
  const dx = second.clientX - first.clientX;
  const dy = second.clientY - first.clientY;
  return Math.hypot(dx, dy);
}

function getTouchMidpoint(touches: TouchList, rect: DOMRect) {
  const first = touches[0];
  const second = touches[1];
  return {
    x: ((first.clientX + second.clientX) / 2) - rect.left,
    y: ((first.clientY + second.clientY) / 2) - rect.top,
  };
}

export function WorkbenchCanvas({ shopId }: { shopId: string }) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraHydratedRef = useRef<string | null>(null);
  const saveCameraTimerRef = useRef<number | null>(null);
  const touchStateRef = useRef<{
    mode: TouchMode;
    startCamera: { x: number; y: number; scale: number } | null;
    startPoint: { x: number; y: number } | null;
    initialMidpoint: { x: number; y: number } | null;
    initialDistance: number;
    longPressTimer: number | null;
    longPressTriggered: boolean;
  }>({
    mode: "idle",
    startCamera: null,
    startPoint: null,
    initialMidpoint: null,
    initialDistance: 0,
    longPressTimer: null,
    longPressTriggered: false,
  });
  const [selectedBridgeId, setSelectedBridgeId] = useState<string | null>(null);
  const [projectMenu, setProjectMenu] = useState<{ workbenchId: string; x: number; y: number } | null>(null);
  const x = useCanvasStore((s) => s.x);
  const y = useCanvasStore((s) => s.y);
  const scale = useCanvasStore((s) => s.scale);
  const setCamera = useCanvasStore((s) => s.setCamera);
  const openModal = useUiStore((s) => s.openModal);
  const setActiveShop = useUiStore((s) => s.setActiveShop);
  const setActiveWorkbench = useUiStore((s) => s.setActiveWorkbench);
  const { data: workbenches, isLoading: workbenchesLoading, isError: workbenchesError } = useWorkbenches(shopId);
  const { data: shop, isLoading: shopLoading, isError: shopError } = useShop(shopId);
  const { data: allItems = [], isLoading: itemsLoading } = useAllItems();
  const { data: allBridges = [], isLoading: bridgesLoading } = useAllBridges();
  const { data: preferencesSetting } = useAppSetting("preferences");
  const { data: cameraSetting, isLoading: cameraSettingLoading } = useAppSetting(`camera.shop.${shopId}`);
  const upsertAppSetting = useUpsertAppSetting();
  const updateWorkbench = useUpdateWorkbench();
  const deleteWorkbench = useDeleteWorkbench();
  const archiveWorkbench = useArchiveWorkbench();
  
  const persistedCamera = useMemo(() => {
    if (!cameraSetting?.value) {
      return null;
    }

    try {
      const parsed = JSON.parse(cameraSetting.value) as { x?: number; y?: number; scale?: number };
      if (typeof parsed.x === "number" && typeof parsed.y === "number" && typeof parsed.scale === "number") {
        return {
          x: parsed.x,
          y: parsed.y,
          scale: parsed.scale,
        };
      }
      return null;
    } catch {
      return null;
    }
  }, [cameraSetting?.value]);

  useEffect(() => {
    cameraHydratedRef.current = null;
  }, [shopId]);

  useEffect(() => {
    if (cameraSettingLoading) {
      return;
    }

    if (cameraHydratedRef.current === shopId) {
      return;
    }

    if (persistedCamera) {
      setCamera(persistedCamera.x, persistedCamera.y, persistedCamera.scale);
    } else {
      setCamera(0, 0, 1);
    }
    cameraHydratedRef.current = shopId;
  }, [cameraSettingLoading, persistedCamera, setCamera, shopId]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && stageRef.current) {
        stageRef.current.width(containerRef.current.clientWidth);
        stageRef.current.height(containerRef.current.clientHeight);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Initial call
    // A small timeout to ensure container is fully sized after layout changes
    const timer = setTimeout(handleResize, 50);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, []);

  const clearLongPress = useCallback(() => {
    if (touchStateRef.current.longPressTimer) {
      window.clearTimeout(touchStateRef.current.longPressTimer);
      touchStateRef.current.longPressTimer = null;
    }
  }, []);

  const openProjectAtPoint = useCallback((point: { x: number; y: number }) => {
    const worldPos = screenToWorld(point, { x, y, scale });
    openModal({ type: "createProject", payload: { shopId, posX: worldPos.x, posY: worldPos.y } });
    triggerHapticFeedback("light");
  }, [openModal, scale, shopId, x, y]);

  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    // Ctrl + scroll for zoom, normal scroll for pan? 
    // Standard is wheel to zoom.
    const factor = e.evt.deltaY > 0 ? 0.9 : 1.1;
    const currentCamera = { x, y, scale };
    const newCamera = zoomToward(currentCamera, factor, pointer);
    setCamera(newCamera.x, newCamera.y, newCamera.scale);
  }, [x, y, scale, setCamera]);

  const handleDragEnd = useCallback((e: KonvaEventObject<DragEvent>) => {
    if (e.target === e.target.getStage()) {
      setCamera(e.target.x(), e.target.y(), scale);
    }
  }, [scale, setCamera]);

  const handleDblClick = useCallback((e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const targetName = e.target.name?.();
    const isBackgroundTarget = e.target === stage || targetName === "canvas-background";
    if (!isBackgroundTarget) return;
    
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    openProjectAtPoint(pointer);
  }, [openProjectAtPoint]);

  const itemCounts = useMemo(() => {
    return allItems.reduce<Record<string, number>>((counts, item) => {
      counts[item.workbenchId] = (counts[item.workbenchId] ?? 0) + 1;
      return counts;
    }, {});
  }, [allItems]);
  const previewByWorkbench = useMemo(() => {
    return allItems.reduce<Record<string, string[]>>((acc, item) => {
      const label = (() => {
        const structured = decodeStructuredItemContent(item);
        if (structured?.title) {
          return structured.content
            ? `${structured.title}: ${structured.content}`
            : structured.title;
        }
        return structured?.content ?? item.content;
      })().trim();

      if (!label) {
        return acc;
      }

      if (!acc[item.workbenchId]) {
        acc[item.workbenchId] = [];
      }

      if (acc[item.workbenchId].length < 3) {
        acc[item.workbenchId].push(label);
      }

      return acc;
    }, {});
  }, [allItems]);
  const workbenchLookup = useMemo(() => {
    return new Map((workbenches ?? []).map((workbench) => [workbench.id, workbench]));
  }, [workbenches]);
  const itemLookup = useMemo(() => {
    return new Map(allItems.map((item) => [item.id, item]));
  }, [allItems]);
  const selectedBridge = useMemo(() => {
    if (!selectedBridgeId) {
      return null;
    }
    return allBridges.find((bridge) => bridge.id === selectedBridgeId) ?? null;
  }, [allBridges, selectedBridgeId]);
  const selectedBridgeMeta = useMemo(() => {
    if (!selectedBridge) {
      return null;
    }

    const sourceItem = itemLookup.get(selectedBridge.sourceItemId);
    const targetItem = itemLookup.get(selectedBridge.targetItemId);
    const sourceWorkbench = sourceItem ? workbenchLookup.get(sourceItem.workbenchId) : undefined;
    const targetWorkbench = targetItem ? workbenchLookup.get(targetItem.workbenchId) : undefined;

    return {
      sourceItem,
      targetItem,
      sourceWorkbench,
      targetWorkbench,
      ageDays: Math.round(getBridgeAgeInDays(selectedBridge)),
      strength: getEffectiveBridgeStrength(selectedBridge).toFixed(1),
      freshness: getBridgeFreshness(selectedBridge),
    };
  }, [itemLookup, selectedBridge, workbenchLookup]);
  const preferences = parsePreferences(preferencesSetting?.value);
  const dustThresholdDays = preferences.behavior.dustThresholdDays;
  const handleBridgeSelect = useCallback((bridgeId: string) => {
    setProjectMenu(null);
    setSelectedBridgeId(bridgeId);
  }, []);
  const handleBridgeDismiss = useCallback(() => {
    setSelectedBridgeId(null);
  }, []);
  const handleWorkbenchMenuOpen = useCallback((workbenchId: string, point: { x: number; y: number }) => {
    setSelectedBridgeId(null);
    setProjectMenu({ workbenchId, x: point.x, y: point.y });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const handleTouchStart = (event: TouchEvent) => {
      const stage = stageRef.current;
      const rect = container.getBoundingClientRect();

      if (event.touches.length === 2) {
        const midpoint = getTouchMidpoint(event.touches, rect);
        touchStateRef.current.mode = "pinch";
        touchStateRef.current.startCamera = { x, y, scale };
        touchStateRef.current.initialMidpoint = midpoint;
        touchStateRef.current.initialDistance = getTouchDistance(event.touches);
        touchStateRef.current.startPoint = null;
        touchStateRef.current.longPressTriggered = false;
        clearLongPress();
        stage?.stopDrag();
        return;
      }

      if (event.touches.length !== 1) {
        return;
      }

      const touch = event.touches[0];
      const point = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };

      const target = stage?.getIntersection(point);
      const isBackgroundTarget = !target || target.name?.() === "canvas-background";

      touchStateRef.current.mode = isBackgroundTarget ? "background" : "foreground";
      touchStateRef.current.startPoint = point;
      touchStateRef.current.startCamera = { x, y, scale };
      touchStateRef.current.longPressTriggered = false;
      touchStateRef.current.initialMidpoint = null;
      touchStateRef.current.initialDistance = 0;
      clearLongPress();

      if (isBackgroundTarget) {
        touchStateRef.current.longPressTimer = window.setTimeout(() => {
          touchStateRef.current.longPressTriggered = true;
          openProjectAtPoint(point);
        }, 550);
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      const rect = container.getBoundingClientRect();
      const state = touchStateRef.current;

      if (state.mode === "pinch" && state.startCamera && state.initialMidpoint && event.touches.length === 2) {
        event.preventDefault();
        const midpoint = getTouchMidpoint(event.touches, rect);
        const distance = getTouchDistance(event.touches);
        const factor = distance / Math.max(state.initialDistance, 1);
        const worldAnchor = screenToWorld(state.initialMidpoint, state.startCamera);
        const nextScale = clampScale(state.startCamera.scale * factor);
        setCamera(
          midpoint.x - worldAnchor.x * nextScale,
          midpoint.y - worldAnchor.y * nextScale,
          nextScale
        );
        return;
      }

      if (state.mode === "background" && state.startPoint && event.touches.length === 1) {
        const touch = event.touches[0];
        const point = {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        };

        if (Math.hypot(point.x - state.startPoint.x, point.y - state.startPoint.y) > 10) {
          clearLongPress();
        }
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const rect = container.getBoundingClientRect();
      const state = touchStateRef.current;
      const changedTouch = event.changedTouches[0];

      if (state.mode === "background" && state.startPoint && changedTouch && !state.longPressTriggered) {
        const point = {
          x: changedTouch.clientX - rect.left,
          y: changedTouch.clientY - rect.top,
        };
        const moved = Math.hypot(point.x - state.startPoint.x, point.y - state.startPoint.y);
        if (moved < 8) {
          handleBridgeDismiss();
          setProjectMenu(null);
        }
      }

      clearLongPress();

      if (event.touches.length === 0) {
        touchStateRef.current.mode = "idle";
        touchStateRef.current.startCamera = null;
        touchStateRef.current.startPoint = null;
        touchStateRef.current.initialMidpoint = null;
        touchStateRef.current.initialDistance = 0;
        touchStateRef.current.longPressTriggered = false;
      }
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    container.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      clearLongPress();
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [clearLongPress, handleBridgeDismiss, openProjectAtPoint, scale, setCamera, x, y]);

  useEffect(() => {
    if (cameraSettingLoading || cameraHydratedRef.current !== shopId) {
      return;
    }

    if (saveCameraTimerRef.current) {
      window.clearTimeout(saveCameraTimerRef.current);
    }

    saveCameraTimerRef.current = window.setTimeout(() => {
      void upsertAppSetting.mutateAsync({
        id: cameraSetting?.id ?? nanoid(),
        key: `camera.shop.${shopId}`,
        value: JSON.stringify({ x, y, scale }),
        createdAt: cameraSetting?.createdAt ?? new Date(),
        updatedAt: new Date(),
      });
    }, 400);

    return () => {
      if (saveCameraTimerRef.current) {
        window.clearTimeout(saveCameraTimerRef.current);
      }
    };
  }, [cameraSetting?.createdAt, cameraSetting?.id, cameraSettingLoading, scale, shopId, upsertAppSetting, x, y]);

  const isLoading = shopLoading || workbenchesLoading || itemsLoading || bridgesLoading;
  const hasError = shopError || workbenchesError;
  const selectedWorkbenchForMenu = projectMenu ? workbenchLookup.get(projectMenu.workbenchId) : null;

  const handleRenameWorkbench = useCallback(async () => {
    if (!selectedWorkbenchForMenu) {
      return;
    }

    setProjectMenu(null);
    const nextName = window.prompt("Rename project", selectedWorkbenchForMenu.name)?.trim();
    if (!nextName || nextName === selectedWorkbenchForMenu.name) {
      return;
    }

    await updateWorkbench.mutateAsync({
      id: selectedWorkbenchForMenu.id,
      data: { name: nextName },
    });
  }, [selectedWorkbenchForMenu, updateWorkbench]);

  const handleArchiveWorkbench = useCallback(async () => {
    if (!selectedWorkbenchForMenu) {
      return;
    }

    setProjectMenu(null);
    await archiveWorkbench.mutateAsync(selectedWorkbenchForMenu.id);
  }, [archiveWorkbench, selectedWorkbenchForMenu]);

  const handleDeleteWorkbench = useCallback(async () => {
    if (!selectedWorkbenchForMenu) {
      return;
    }

    setProjectMenu(null);
    if (!window.confirm(`Delete the "${selectedWorkbenchForMenu.name}" project?`)) {
      return;
    }

    await deleteWorkbench.mutateAsync(selectedWorkbenchForMenu.id);
    setActiveShop(shopId);
  }, [deleteWorkbench, selectedWorkbenchForMenu, setActiveShop, shopId]);

  if (hasError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          title="Couldn't load this workshop canvas"
          description="The workshop data is there, but the canvas couldn't assemble it right now."
          className="w-full max-w-xl"
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden touch-none" data-testid="workbench-canvas">
      {isLoading && (
        <div className="absolute inset-0 z-10 bg-[rgba(24,23,21,0.82)] p-6 backdrop-blur-sm">
          <div className="grid h-full gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SkeletonBlock className="h-40 w-full rounded-xl" />
            <SkeletonBlock className="h-48 w-full rounded-xl" />
            <SkeletonBlock className="h-36 w-full rounded-xl" />
          </div>
        </div>
      )}
      {!isLoading && (workbenches?.length ?? 0) === 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6">
          <EmptyState
            title="No projects on this canvas yet"
            description="Double-click the canvas or use the plus button in the sidebar to create the first project."
            className="pointer-events-auto w-full max-w-xl"
          />
        </div>
      )}
      <Stage
        ref={stageRef}
        width={1000} // Temporary size, will be overwritten by resize handler
        height={800}
        onWheel={handleWheel}
        draggable
        onDragEnd={handleDragEnd}
        onDblClick={handleDblClick}
        onDblTap={handleDblClick}
        onMouseDown={() => setProjectMenu(null)}
        x={x} 
        y={y} 
        scaleX={scale} 
        scaleY={scale}
      >
        <BackgroundLayer texture={shop?.backgroundTexture ?? "pegboard"} />
        <BridgeLayer
          bridges={allBridges}
          items={allItems}
          workbenches={workbenches ?? []}
          onSelectBridge={handleBridgeSelect}
        />
        <WorkbenchLayer
          workbenches={workbenches ?? []}
          itemCounts={itemCounts}
          previewByWorkbench={previewByWorkbench}
          showDustOverlay={preferences.behavior.showDustOverlay}
          dustThresholdDays={dustThresholdDays}
          onOpenMenu={handleWorkbenchMenuOpen}
        />
      </Stage>
      {projectMenu && selectedWorkbenchForMenu && (
        <div
          className="absolute z-30 min-w-56 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-1 shadow-[var(--ui-shadow-2)] backdrop-blur"
          style={{ left: projectMenu.x, top: projectMenu.y }}
        >
          <button
            type="button"
            onClick={() => {
              setProjectMenu(null);
              setActiveWorkbench(selectedWorkbenchForMenu.id);
            }}
            className="block w-full rounded-[var(--ui-radius-sm)] px-3 py-2 text-left text-sm text-[var(--ui-text-2)] hover:bg-[var(--ui-surface-2)] hover:text-[var(--ui-text-1)]"
          >
            Open Project
          </button>
          <button
            type="button"
            onClick={() => {
              setProjectMenu(null);
              openModal({
                type: "createProject",
                payload: {
                  shopId,
                  posX: selectedWorkbenchForMenu.posX + 80,
                  posY: selectedWorkbenchForMenu.posY + 80,
                },
              });
            }}
            className="block w-full rounded-[var(--ui-radius-sm)] px-3 py-2 text-left text-sm text-[var(--ui-text-2)] hover:bg-[var(--ui-surface-2)] hover:text-[var(--ui-text-1)]"
          >
            Create Nearby Project
          </button>
          <button
            type="button"
            onClick={() => void handleRenameWorkbench()}
            className="block w-full rounded-[var(--ui-radius-sm)] px-3 py-2 text-left text-sm text-[var(--ui-text-2)] hover:bg-[var(--ui-surface-2)] hover:text-[var(--ui-text-1)]"
          >
            Rename Project
          </button>
          <button
            type="button"
            onClick={() => void handleArchiveWorkbench()}
            className="block w-full rounded-[var(--ui-radius-sm)] px-3 py-2 text-left text-sm text-[var(--ui-text-2)] hover:bg-[var(--ui-surface-2)] hover:text-[var(--ui-text-1)]"
          >
            Archive Project
          </button>
          <button
            type="button"
            onClick={() => void handleDeleteWorkbench()}
            className="block w-full rounded-[var(--ui-radius-md)] px-3 py-2 text-left text-sm text-[var(--ui-danger)] hover:bg-[var(--ui-danger-soft)]"
          >
            Delete Project
          </button>
        </div>
      )}
      {selectedBridge && selectedBridgeMeta && (
        <aside className="absolute bottom-4 right-4 z-20 w-full max-w-sm rounded-[var(--ui-radius-xl)] border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-4 shadow-[var(--ui-shadow-1)] backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="ui-kicker">Bridge Note</p>
              <h3 className="mt-1 text-sm font-semibold text-[var(--ui-text-1)]">
                {(selectedBridgeMeta.sourceWorkbench?.name ?? "Unknown project")} to {(selectedBridgeMeta.targetWorkbench?.name ?? "Unknown project")}
              </h3>
            </div>
            <button type="button" onClick={handleBridgeDismiss} className="text-sm text-[var(--ui-text-3)] hover:text-[var(--ui-text-1)]">
              Close
            </button>
          </div>
          <p className="mt-3 text-sm text-[var(--ui-text-2)]">{selectedBridge.note}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-[var(--ui-text-2)]">
            <div className="ui-panel-muted px-2 py-2">
              <div className="text-[var(--ui-text-3)]">Strength</div>
              <div className="mt-1 text-[var(--ui-text-1)]">{selectedBridgeMeta.strength}</div>
            </div>
            <div className="ui-panel-muted px-2 py-2">
              <div className="text-[var(--ui-text-3)]">Age</div>
              <div className="mt-1 text-[var(--ui-text-1)]">{selectedBridgeMeta.ageDays}d</div>
            </div>
            <div className="ui-panel-muted px-2 py-2">
              <div className="text-[var(--ui-text-3)]">State</div>
              <div className="mt-1 capitalize text-[var(--ui-text-1)]">{selectedBridgeMeta.freshness}</div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
