import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, type PanInfo } from "framer-motion";
import { nanoid } from "nanoid";
import { useAppSetting, useUpsertAppSetting } from "../../hooks/useAppSettings";
import { useCreateItem, useDeleteItem, useItems, useUpdateItemPosition } from "../../hooks/useItems";
import { useCreateItemMedia, useItemMedia } from "../../hooks/useItemMedia";
import { useScars } from "../../hooks/useScars";
import { useMediaDrop } from "../../hooks/useMediaDrop";
import type { Item } from "../../types";
import { useUiStore } from "../../stores/uiStore";
import { EmptyState } from "../shared/EmptyState";
import { SkeletonBlock } from "../shared/Skeleton";
import { ItemCard } from "./ItemCard";
import { MediaCard } from "./MediaCard";
import { StickyNote } from "./StickyNote";
import { cn } from "../../utils/cn";
import { triggerHapticFeedback } from "../../utils/haptics";
import { decodeStructuredItemContent } from "../../utils/itemContent";
import { TypeBadge } from "../shared/TypeBadge";
import { AnimatedButton } from "../shared/AnimatedButton";
import { MediaUploader, type UploadedMediaValue } from "../shared/MediaUploader";
import {
  ExternalLink,
  FileText,
  GitBranchPlus,
  Link2,
  LocateFixed,
  MoveHorizontal,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
  NotebookPen,
  Library,
  Hammer,
  MessageCircleQuestion,
  Sparkles,
  Import,
  Copy,
  ClipboardPaste,
} from "lucide-react";
import { mediaLabelFromPath } from "../../utils/media";
import { CREATABLE_ITEM_TYPES } from "../../utils/constants";

type CreatableType = (typeof CREATABLE_ITEM_TYPES)[number];

const SURFACE_PADDING = 32;
const SURFACE_MIN_WIDTH = 1400;
const SURFACE_MIN_HEIGHT = 900;
const AUTO_LAYOUT_COLUMNS = 3;
const AUTO_LAYOUT_X_GAP = 336;
const AUTO_LAYOUT_Y_GAP = 296;
const STICKY_WIDTH = 260;
const STICKY_HEIGHT = 220;
const CARD_WIDTH = 320;
const CARD_HEIGHT = 320;
const CARD_COLLISION_GAP = 24;
const CAMERA_MIN_SCALE = 0.45;
const CAMERA_MAX_SCALE = 1.8;

interface BenchPosition {
  x: number;
  y: number;
}

interface BenchCamera {
  x: number;
  y: number;
  scale: number;
}

function clampScale(scale: number) {
  return Math.max(CAMERA_MIN_SCALE, Math.min(CAMERA_MAX_SCALE, scale));
}

function zoomToward(camera: BenchCamera, factor: number, point: BenchPosition): BenchCamera {
  const nextScale = clampScale(camera.scale * factor);
  const worldX = (point.x - camera.x) / camera.scale;
  const worldY = (point.y - camera.y) / camera.scale;

  return {
    x: point.x - worldX * nextScale,
    y: point.y - worldY * nextScale,
    scale: nextScale,
  };
}

function hasStoredPosition(item: Item) {
  return Number.isFinite(item.posX) && Number.isFinite(item.posY) && (item.posX !== 0 || item.posY !== 0);
}

function getCardFootprint(item: Item) {
  if (item.type === "sticky") {
    return { width: STICKY_WIDTH, height: STICKY_HEIGHT };
  }

  return { width: CARD_WIDTH, height: CARD_HEIGHT };
}

function getCardRect(item: Item, position: BenchPosition) {
  const footprint = getCardFootprint(item);
  return {
    x: position.x,
    y: position.y,
    width: footprint.width,
    height: footprint.height,
  };
}

function rectsOverlap(
  rect: { x: number; y: number; width: number; height: number },
  other: { x: number; y: number; width: number; height: number },
  gap = CARD_COLLISION_GAP
) {
  return (
    rect.x < other.x + other.width + gap &&
    rect.x + rect.width + gap > other.x &&
    rect.y < other.y + other.height + gap &&
    rect.y + rect.height + gap > other.y
  );
}

function positionOverlaps(item: Item, position: BenchPosition, occupied: Array<{ item: Item; position: BenchPosition }>) {
  const rect = getCardRect(item, position);
  return occupied.some((entry) => rectsOverlap(rect, getCardRect(entry.item, entry.position)));
}

function findOpenCardPosition(
  item: Item,
  preferredPosition: BenchPosition,
  occupied: Array<{ item: Item; position: BenchPosition }>,
  surfaceWidth: number,
  surfaceHeight: number
) {
  const preferred = clampPosition(preferredPosition, item, surfaceWidth, surfaceHeight);
  if (!positionOverlaps(item, preferred, occupied)) {
    return preferred;
  }

  for (let index = 0; index < 120; index += 1) {
    const column = index % AUTO_LAYOUT_COLUMNS;
    const row = Math.floor(index / AUTO_LAYOUT_COLUMNS);
    const candidate = clampPosition(
      {
        x: SURFACE_PADDING + column * AUTO_LAYOUT_X_GAP,
        y: SURFACE_PADDING + row * AUTO_LAYOUT_Y_GAP,
      },
      item,
      surfaceWidth,
      surfaceHeight
    );

    if (!positionOverlaps(item, candidate, occupied)) {
      return candidate;
    }
  }

  const fallbackRow = Math.ceil(occupied.length / AUTO_LAYOUT_COLUMNS);
  return {
    x: SURFACE_PADDING,
    y: SURFACE_PADDING + fallbackRow * AUTO_LAYOUT_Y_GAP,
  };
}

function clampPosition(position: BenchPosition, item: Item, surfaceWidth: number, surfaceHeight: number): BenchPosition {
  const footprint = getCardFootprint(item);
  return {
    x: Math.max(SURFACE_PADDING, Math.min(position.x, surfaceWidth - footprint.width - SURFACE_PADDING)),
    y: Math.max(SURFACE_PADDING, Math.min(position.y, surfaceHeight - footprint.height - SURFACE_PADDING)),
  };
}

function WorkbenchBenchItem({ item, autoFocusSticky = false }: { item: Item; autoFocusSticky?: boolean }) {
  const { data: media = [], isLoading: mediaLoading, isError: mediaError } = useItemMedia(item.id);
  const { data: scars = [], isLoading: scarsLoading, isError: scarsError } = useScars(item.id);

  if (mediaLoading || scarsLoading) {
    return <SkeletonBlock className="h-[240px] w-[320px] rounded-lg" />;
  }

  if (item.type === "sticky") {
    return <StickyNote item={item} autoFocus={autoFocusSticky} />;
  }

  if ((mediaError ? [] : media).length > 0) {
    return <MediaCard item={item} media={mediaError ? [] : media} scars={scarsError ? [] : scars} />;
  }

  return <ItemCard item={item} media={mediaError ? [] : media} scars={scarsError ? [] : scars} />;
}

function WorkbenchSelectionPanel({ item }: { item: Item }) {
  const openModal = useUiStore((state) => state.openModal);
  const selectItem = useUiStore((state) => state.selectItem);
  const { data: media = [] } = useItemMedia(item.id);
  const { data: scars = [] } = useScars(item.id);
  const structured = decodeStructuredItemContent(item);
  const contentText = (structured?.content ?? item.content).trim();
  const sourceUrl = structured?.sourceUrl;
  const preview = media[0];

  const handleOpenSource = () => {
    if (!sourceUrl) {
      return;
    }

    window.open(sourceUrl, "_blank", "noopener,noreferrer");
  };

  const handlePreview = () => {
    if (!preview) {
      return;
    }

    openModal({
      type: "mediaPreview",
      payload: {
        path: preview.path,
        title: mediaLabelFromPath(preview.path),
        caption: contentText,
      },
    });
  };

  return (
    <aside
      className="absolute bottom-4 right-4 z-30 w-full max-w-sm rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-4 shadow-[var(--ui-shadow-2)]"
      data-testid="workbench-selection-panel"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <TypeBadge type={item.type} />
            {scars.length > 0 && (
              <span className="rounded-full border border-[rgba(198,69,69,0.28)] bg-[var(--ui-danger-soft)] px-2 py-1 text-[11px] text-[var(--ui-danger)]">
                {scars.length} scar{scars.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
          {structured?.title && (
            <p className="mt-3 text-sm font-semibold text-[var(--ui-text-1)]">{structured.title}</p>
          )}
          <p className="mt-2 text-sm text-[var(--ui-text-1)]">
            {contentText.length > 0 ? contentText : item.type === "sticky" ? "Untitled sticky note" : "No content yet."}
          </p>
        </div>
        <AnimatedButton
          type="button"
          onClick={() => selectItem(null)}
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          data-testid="btn-clear-selected-item"
        >
          <X className="h-4 w-4" />
        </AnimatedButton>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--ui-text-3)]">
        <span className="rounded-full border border-[var(--ui-border)] px-2 py-1">{item.type}</span>
        {media.length > 0 && (
          <span className="rounded-full border border-[var(--ui-border)] px-2 py-1">
            {media.length} media file{media.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {preview && (
          <AnimatedButton
            type="button"
            onClick={handlePreview}
            variant="primary"
            size="sm"
            className="text-xs"
            data-testid="btn-preview-selected-media"
          >
            <ExternalLink className="h-3 w-3" />
            Preview Media
          </AnimatedButton>
        )}
        {sourceUrl && (
          <AnimatedButton
            type="button"
            onClick={handleOpenSource}
            variant="surface"
            size="sm"
            className="text-xs"
            data-testid="btn-open-selected-source"
          >
            <Link2 className="h-3 w-3" />
            Open Source
          </AnimatedButton>
        )}
        <AnimatedButton
          type="button"
          onClick={() => openModal({ type: "createBridge", payload: { sourceItemId: item.id } })}
          variant="surface"
          size="sm"
          className="text-xs"
          data-testid="btn-bridge-selected-item"
        >
          <GitBranchPlus className="h-3 w-3" />
          Create Bridge
        </AnimatedButton>
      </div>

      {preview && (
        <div className="mt-4 rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-3 py-2 text-xs text-[var(--ui-text-2)]">
          <div className="mb-1 flex items-center gap-2 text-[var(--ui-text-1)]">
            <FileText className="h-3.5 w-3.5" />
            {mediaLabelFromPath(preview.path)}
          </div>
          The first attached file is ready for preview or external opening.
        </div>
      )}
    </aside>
  );
}

export function PlaygroundWorkbench({
  workbenchId,
  onCreateRequest,
}: {
  workbenchId: string;
  onCreateRequest?: (type?: CreatableType | "import") => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const selectedItemId = useUiStore((state) => state.selectedItemId);
  const selectedItemIds = useUiStore((state) => state.selectedItemIds);
  const selectItem = useUiStore((state) => state.selectItem);
  const selectItems = useUiStore((state) => state.selectItems);
  const toggleItemSelection = useUiStore((state) => state.toggleItemSelection);
  const clearSelection = useUiStore((state) => state.clearSelection);
  const clipboard = useUiStore((state) => state.clipboard);
  const setClipboard = useUiStore((state) => state.setClipboard);
  const pushHistory = useUiStore((state) => state.pushHistory);
  const undo = useUiStore((state) => state.undo);
  const redo = useUiStore((state) => state.redo);
  const openModal = useUiStore((state) => state.openModal);
  const createItem = useCreateItem();
  const createItemMedia = useCreateItemMedia();
  const deleteItem = useDeleteItem();
  const updateItemPosition = useUpdateItemPosition();
  const upsertAppSetting = useUpsertAppSetting();
  const { data: cameraSetting } = useAppSetting(`camera.project.${workbenchId}`);
  const { data: items = [], isLoading, isError } = useItems(workbenchId);
  const [localPositions, setLocalPositions] = useState<Record<string, BenchPosition>>({});
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [focusedStickyId, setFocusedStickyId] = useState<string | null>(null);
  const [activeFilter] = useState<"all" | Item["type"]>("all");
  const [camera, setCamera] = useState<BenchCamera>({ x: 32, y: 32, scale: 1 });
  const [cameraHydrated, setCameraHydrated] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: "item" | "canvas"; itemId?: string } | null>(null);
  const panStateRef = useRef<{ pointerId: number | null; startX: number; startY: number; originX: number; originY: number }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });
  const saveCameraTimerRef = useRef<number | null>(null);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? null,
    [items, selectedItemId]
  );
  const filteredItems = useMemo(
    () => items.filter((item) => activeFilter === "all" || item.type === activeFilter),
    [activeFilter, items]
  );

  useEffect(() => {
    let parsed: BenchCamera | null = null;

    if (cameraSetting?.value) {
      try {
        const raw = JSON.parse(cameraSetting.value) as Partial<BenchCamera>;
        if (typeof raw.x === "number" && typeof raw.y === "number" && typeof raw.scale === "number") {
          parsed = {
            x: raw.x,
            y: raw.y,
            scale: clampScale(raw.scale),
          };
        }
      } catch {
        parsed = null;
      }
    }

    setCamera(parsed ?? { x: 32, y: 32, scale: 1 });
    setCameraHydrated(true);
  }, [cameraSetting?.value, workbenchId]);

  useEffect(() => {
    if (!cameraHydrated) {
      return;
    }

    if (saveCameraTimerRef.current) {
      window.clearTimeout(saveCameraTimerRef.current);
    }

    saveCameraTimerRef.current = window.setTimeout(() => {
      void upsertAppSetting.mutateAsync({
        id: cameraSetting?.id ?? `camera.project.${workbenchId}`,
        key: `camera.project.${workbenchId}`,
        value: JSON.stringify(camera),
        createdAt: cameraSetting?.createdAt ?? new Date(),
        updatedAt: new Date(),
      });
    }, 350);

    return () => {
      if (saveCameraTimerRef.current) {
        window.clearTimeout(saveCameraTimerRef.current);
      }
    };
  }, [camera, cameraHydrated, cameraSetting?.createdAt, cameraSetting?.id, upsertAppSetting, workbenchId]);

  useEffect(() => {
    setLocalPositions((current) => {
      let autoIndex = 0;
      let changed = false;
      const next: Record<string, BenchPosition> = {};
      const occupied: Array<{ item: Item; position: BenchPosition }> = [];
      const orderedItems = [...items].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());

      for (const item of orderedItems) {
        if (current[item.id]) {
          next[item.id] = current[item.id];
          occupied.push({ item, position: current[item.id] });
          continue;
        }

        if (hasStoredPosition(item)) {
          next[item.id] = { x: item.posX, y: item.posY };
          occupied.push({ item, position: next[item.id] });
          changed = true;
          continue;
        }

        const column = autoIndex % AUTO_LAYOUT_COLUMNS;
        const row = Math.floor(autoIndex / AUTO_LAYOUT_COLUMNS);
        const preferredPosition = {
          x: SURFACE_PADDING + column * AUTO_LAYOUT_X_GAP,
          y: SURFACE_PADDING + row * AUTO_LAYOUT_Y_GAP,
        };
        next[item.id] = findOpenCardPosition(item, preferredPosition, occupied, SURFACE_MIN_WIDTH, SURFACE_MIN_HEIGHT);
        occupied.push({ item, position: next[item.id] });
        autoIndex += 1;
        changed = true;
      }

      const hasRemovedIds = Object.keys(current).some((key) => !(key in next));
      return changed || hasRemovedIds ? next : current;
    });
  }, [items]);

  useEffect(() => {
    if (selectedItem && activeFilter !== "all" && selectedItem.type !== activeFilter) {
      selectItem(null);
    }
  }, [activeFilter, selectItem, selectedItem]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "Backspace" || e.key === "Delete") {
        if (selectedItemIds.length > 0) {
          void handleDeleteSelected();
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "c") {
        handleCopySelected();
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "v") {
        void handlePaste(null); // Paste at center or last known point
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        selectItems(items.map((i) => i.id));
      }

      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "z") {
        void redo();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        void undo();
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        void redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItemIds]);

  const autoPositions = useMemo(() => {
    const map = new Map<string, BenchPosition>();
    const occupied: Array<{ item: Item; position: BenchPosition }> = [];
    const itemsNeedingPosition: Item[] = [];
    let autoIndex = 0;

    for (const item of filteredItems) {
      const anchoredPosition = localPositions[item.id] ?? (hasStoredPosition(item) ? { x: item.posX, y: item.posY } : null);
      if (anchoredPosition) {
        occupied.push({ item, position: anchoredPosition });
        continue;
      }

      itemsNeedingPosition.push(item);
    }

    for (const item of itemsNeedingPosition) {
      const column = autoIndex % AUTO_LAYOUT_COLUMNS;
      const row = Math.floor(autoIndex / AUTO_LAYOUT_COLUMNS);
      const position = findOpenCardPosition(item, {
        x: SURFACE_PADDING + column * AUTO_LAYOUT_X_GAP,
        y: SURFACE_PADDING + row * AUTO_LAYOUT_Y_GAP,
      }, occupied, SURFACE_MIN_WIDTH, SURFACE_MIN_HEIGHT);
      map.set(item.id, position);
      occupied.push({ item, position });
      autoIndex += 1;
    }

    return map;
  }, [filteredItems, localPositions]);

  const positionedItems = useMemo(() => {
    return filteredItems.map((item) => {
      const position = localPositions[item.id] ?? autoPositions.get(item.id) ?? { x: item.posX, y: item.posY };
      return { item, position };
    });
  }, [autoPositions, filteredItems, localPositions]);

  const surfaceWidth = useMemo(() => {
    const maxX = positionedItems.reduce((currentMax, { item, position }) => {
      return Math.max(currentMax, position.x + getCardFootprint(item).width + SURFACE_PADDING);
    }, SURFACE_MIN_WIDTH);

    return Math.max(SURFACE_MIN_WIDTH, maxX);
  }, [positionedItems]);

  const surfaceHeight = useMemo(() => {
    const maxY = positionedItems.reduce((currentMax, { item, position }) => {
      return Math.max(currentMax, position.y + getCardFootprint(item).height + SURFACE_PADDING);
    }, SURFACE_MIN_HEIGHT);

    return Math.max(SURFACE_MIN_HEIGHT, maxY);
  }, [positionedItems]);

  const registerCreatedItems = useCallback((createdItems: Array<{ id: string; posX: number; posY: number }>) => {
    setLocalPositions((current) => ({
      ...current,
      ...Object.fromEntries(createdItems.map((item) => [item.id, { x: item.posX, y: item.posY }])),
    }));
  }, []);

  const { isDraggingOver, handleDragOver, handleDragLeave, handleDrop } = useMediaDrop({
    workbenchId,
    onItemsCreated: registerCreatedItems,
  });

  const resolveSurfacePoint = useCallback((clientX: number, clientY: number) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) {
      return null;
    }

    return {
      x: (clientX - rect.left - camera.x) / camera.scale,
      y: (clientY - rect.top - camera.y) / camera.scale,
    };
  }, [camera]);

  const adjustZoom = useCallback((factor: number) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const point = { x: rect.width / 2, y: rect.height / 2 };
    setCamera((current) => zoomToward(current, factor, point));
  }, []);

  const handleCreateSticky = useCallback(async (point: BenchPosition) => {
    const stickyId = nanoid();
    const now = new Date();
    const stickyItem: Item = {
      id: stickyId,
      workbenchId,
      type: "sticky",
      content: "",
      posX: point.x,
      posY: point.y,
      createdAt: now,
      updatedAt: now,
    };
    const occupied = positionedItems.map(({ item, position }) => ({ item, position }));
    const clampedPoint = findOpenCardPosition(stickyItem, point, occupied, surfaceWidth, surfaceHeight);

    setFocusedStickyId(stickyId);
    registerCreatedItems([{ id: stickyId, posX: clampedPoint.x, posY: clampedPoint.y }]);

    await createItem.mutateAsync({
      ...stickyItem,
      posX: clampedPoint.x,
      posY: clampedPoint.y,
    });

    triggerHapticFeedback("light");
  }, [createItem, positionedItems, registerCreatedItems, surfaceHeight, surfaceWidth, workbenchId]);

  const handleQuickMediaUpload = useCallback(async (value: UploadedMediaValue) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    const preferredPosition = rect
      ? {
          x: ((rect.width / 2) - camera.x) / camera.scale - CARD_WIDTH / 2,
          y: ((rect.height / 2) - camera.y) / camera.scale - CARD_HEIGHT / 2,
        }
      : { x: SURFACE_PADDING, y: SURFACE_PADDING };
    const itemId = nanoid();
    const now = new Date();
    const mediaItem: Item = {
      id: itemId,
      workbenchId,
      type: "reference",
      content: value.name,
      posX: preferredPosition.x,
      posY: preferredPosition.y,
      createdAt: now,
      updatedAt: now,
    };
    const occupied = positionedItems.map(({ item, position }) => ({ item, position }));
    const position = findOpenCardPosition(mediaItem, preferredPosition, occupied, surfaceWidth, surfaceHeight);

    registerCreatedItems([{ id: itemId, posX: position.x, posY: position.y }]);
    await createItem.mutateAsync({
      ...mediaItem,
      posX: position.x,
      posY: position.y,
    });
    await createItemMedia.mutateAsync({
      id: nanoid(),
      itemId,
      type: value.type,
      path: value.path,
      createdAt: now,
      updatedAt: now,
    });
    selectItem(itemId);
  }, [camera.scale, camera.x, camera.y, createItem, createItemMedia, positionedItems, registerCreatedItems, selectItem, surfaceHeight, surfaceWidth, workbenchId]);

  const handleViewportDoubleClick = useCallback(async (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("[data-testid^='playground-item-']")) {
      return;
    }

    const point = resolveSurfacePoint(event.clientX, event.clientY);
    if (!point) {
      return;
    }

    await handleCreateSticky({
      x: point.x - STICKY_WIDTH / 2,
      y: point.y - 28,
    });
  }, [handleCreateSticky, resolveSurfacePoint]);

  const handleSurfaceDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    const point = resolveSurfacePoint(event.clientX, event.clientY);
    if (!point) {
      event.preventDefault();
      return;
    }

    await handleDrop(event, {
      x: point.x - CARD_WIDTH / 2,
      y: point.y - 48,
    });
  }, [handleDrop, resolveSurfacePoint]);

  const handleDragEnd = useCallback(async (item: Item, startPosition: BenchPosition, info: PanInfo) => {
    const nextPosition = clampPosition(
      {
        x: startPosition.x + (info.offset.x / camera.scale),
        y: startPosition.y + (info.offset.y / camera.scale),
      },
      item,
      surfaceWidth,
      surfaceHeight
    );

    const oldPos = { x: startPosition.x, y: startPosition.y };
    setDraggingItemId(null);
    setLocalPositions((current) => ({
      ...current,
      [item.id]: nextPosition,
    }));

    pushHistory({
      label: `Move ${item.type}`,
      undo: async () => {
        await updateItemPosition.mutateAsync({ id: item.id, posX: oldPos.x, posY: oldPos.y });
        setLocalPositions((curr) => ({ ...curr, [item.id]: oldPos }));
      },
      redo: async () => {
        await updateItemPosition.mutateAsync({ id: item.id, posX: nextPosition.x, posY: nextPosition.y });
        setLocalPositions((curr) => ({ ...curr, [item.id]: nextPosition }));
      },
    });

    await updateItemPosition.mutateAsync({
      id: item.id,
      posX: nextPosition.x,
      posY: nextPosition.y,
    });
  }, [camera.scale, surfaceHeight, surfaceWidth, updateItemPosition]);

  const handleViewportPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const isBackgroundTarget = Boolean(target.closest("[data-bench-background='true']"));

    if (!isBackgroundTarget) {
      return;
    }

    selectItem(null);
    setContextMenu(null);
    setIsPanning(true);
    panStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: camera.x,
      originY: camera.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [camera.x, camera.y, selectItem]);

  const handleViewportPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning || panStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    setCamera((current) => ({
      ...current,
      x: panStateRef.current.originX + (event.clientX - panStateRef.current.startX),
      y: panStateRef.current.originY + (event.clientY - panStateRef.current.startY),
    }));
  }, [isPanning]);

  const handleViewportPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (panStateRef.current.pointerId === event.pointerId) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    panStateRef.current.pointerId = null;
    setIsPanning(false);
  }, []);

  const handleViewportWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    const factor = event.deltaY > 0 ? 0.92 : 1.08;
    setCamera((current) => zoomToward(current, factor, point));
  }, []);

  const handleArrangeCards = useCallback(async () => {
    const arrangedItems = [...filteredItems].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
    const nextPositions: Record<string, BenchPosition> = {};

    arrangedItems.forEach((item, index) => {
      const column = index % AUTO_LAYOUT_COLUMNS;
      const row = Math.floor(index / AUTO_LAYOUT_COLUMNS);
      nextPositions[item.id] = {
        x: SURFACE_PADDING + column * AUTO_LAYOUT_X_GAP,
        y: SURFACE_PADDING + row * AUTO_LAYOUT_Y_GAP,
      };
    });

    setLocalPositions((current) => ({
      ...current,
      ...nextPositions,
    }));

    await Promise.allSettled(
      arrangedItems.map((item) =>
        updateItemPosition.mutateAsync({
          id: item.id,
          posX: nextPositions[item.id].x,
          posY: nextPositions[item.id].y,
        })
      )
    );
  }, [filteredItems, updateItemPosition]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedItemIds.length === 0) return;
    const idsToDelete = [...selectedItemIds];
    const itemsToDelete = items.filter((i) => idsToDelete.includes(i.id));

    pushHistory({
      label: `Delete ${itemsToDelete.length} items`,
      undo: async () => {
        await Promise.all(itemsToDelete.map((i) => createItem.mutateAsync(i)));
        selectItems(itemsToDelete.map((i) => i.id));
      },
      redo: async () => {
        await Promise.all(idsToDelete.map((id) => deleteItem.mutateAsync(id)));
        clearSelection();
      },
    });

    clearSelection();
    setContextMenu(null);

    await Promise.allSettled(idsToDelete.map((id) => deleteItem.mutateAsync(id)));
    triggerHapticFeedback("medium");
  }, [selectedItemIds, items, clearSelection, deleteItem, pushHistory, createItem, selectItems]);

  const handleCopySelected = useCallback(() => {
    if (selectedItemIds.length === 0) return;
    const itemsToCopy = items.filter(i => selectedItemIds.includes(i.id));
    setClipboard({
      type: "items",
      workbenchId,
      data: itemsToCopy.map(i => ({
        type: i.type,
        content: i.content,
        // We don't copy position exactly to allow offset pasting
        posX: i.posX,
        posY: i.posY,
      }))
    });
    triggerHapticFeedback("light");
    setContextMenu(null);
  }, [selectedItemIds, items, workbenchId, setClipboard]);

  const handlePaste = useCallback(async (point: BenchPosition | null) => {
    if (!clipboard || clipboard.type !== "items") return;
    
    const now = new Date();
    const newItems = clipboard.data.map((template, index) => {
      const id = nanoid();
      const offset = index * 20;
      // If no point, use template position + offset
      const x = (point?.x ?? template.posX) + (point ? offset : 40);
      const y = (point?.y ?? template.posY) + (point ? offset : 40);
      
      return {
        ...template,
        id,
        workbenchId,
        posX: x,
        posY: y,
        createdAt: now,
        updatedAt: now,
      };
    });

    setContextMenu(null);
    await Promise.allSettled(newItems.map((item) => createItem.mutateAsync(item)));

    pushHistory({
      label: `Paste ${newItems.length} items`,
      undo: async () => {
        await Promise.all(newItems.map((i) => deleteItem.mutateAsync(i.id)));
        clearSelection();
      },
      redo: async () => {
        await Promise.all(newItems.map((i) => createItem.mutateAsync(i)));
        selectItems(newItems.map((i) => i.id));
      },
    });

    // Select the new items
    selectItems(newItems.map((i) => i.id));
    triggerHapticFeedback("success");
  }, [clipboard, workbenchId, createItem, selectItems, pushHistory, deleteItem, clearSelection]);

  const handleDeleteSelectedItem = useCallback(async (itemId: string) => {
    setContextMenu(null);
    await deleteItem.mutateAsync(itemId);
    if (selectedItemIds.includes(itemId)) {
      toggleItemSelection(itemId);
    }
  }, [deleteItem, selectedItemIds, toggleItemSelection]);

  const selectedContextItem = useMemo(
    () => items.find((item) => item.id === contextMenu?.itemId) ?? null,
    [contextMenu?.itemId, items]
  );

  if (isLoading) {
    return (
      <div className="grid h-full grid-cols-1 gap-4 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-1)] p-4 lg:grid-cols-2 xl:grid-cols-3">
        <SkeletonBlock className="h-[280px] w-full rounded-lg" />
        <SkeletonBlock className="h-[280px] w-full rounded-lg" />
        <SkeletonBlock className="h-[280px] w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Couldn't load this workbench surface"
        description="The project opened, but the playground didn't finish assembling."
        className="h-full"
      />
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-transparent">
      <div className="pointer-events-none absolute right-4 top-6 z-20 flex max-w-[calc(100%-2rem)] flex-col items-end gap-3">
        <div className="pointer-events-auto flex items-center gap-1 rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-1 shadow-[var(--ui-shadow-1)]">
          <AnimatedButton type="button" onClick={() => adjustZoom(0.92)} variant="ghost" size="icon" className="h-9 w-9" aria-label="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </AnimatedButton>
          <button
            type="button"
            onClick={() => setCamera({ x: 32, y: 32, scale: 1 })}
            className="h-9 min-w-14 rounded-[var(--ui-radius-xs)] px-2 text-xs text-[var(--ui-text-2)] transition-colors hover:bg-[var(--ui-bg-muted)] hover:text-[var(--ui-text-1)]"
            data-testid="btn-reset-project-camera"
          >
            {Math.round(camera.scale * 100)}%
          </button>
          <AnimatedButton type="button" onClick={() => adjustZoom(1.08)} variant="ghost" size="icon" className="h-9 w-9" aria-label="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </AnimatedButton>
          <AnimatedButton type="button" onClick={() => setCamera({ x: 32, y: 32, scale: 1 })} variant="ghost" size="icon" className="h-9 w-9" data-testid="btn-center-project-camera" aria-label="Reset view">
            <LocateFixed className="h-4 w-4" />
          </AnimatedButton>
          <AnimatedButton type="button" onClick={() => void handleArrangeCards()} variant="ghost" size="icon" className="h-9 w-9" data-testid="btn-arrange-cards" aria-label="Arrange cards">
            <MoveHorizontal className="h-4 w-4" />
          </AnimatedButton>
        </div>
      </div>

      <MediaUploader
        className="sr-only"
        buttonText="Import evidence"
        onUploadSuccess={(value) => void handleQuickMediaUpload(value)}
      />

      <div
        ref={viewportRef}
        className={cn(
          "relative min-h-0 flex-1 overflow-hidden bg-transparent",
          isPanning ? "cursor-grabbing" : "cursor-grab"
        )}
        onPointerDown={handleViewportPointerDown}
        onPointerMove={handleViewportPointerMove}
        onPointerUp={handleViewportPointerUp}
        onPointerCancel={handleViewportPointerUp}
        onWheel={handleViewportWheel}
        onDoubleClick={(event) => void handleViewportDoubleClick(event)}
        onContextMenu={(event) => {
          event.preventDefault();
          const rect = viewportRef.current?.getBoundingClientRect();
          if (!rect) return;
          setContextMenu({ 
            type: "canvas", 
            x: event.clientX - rect.left, 
            y: event.clientY - rect.top,
          });
        }}
      >
        <motion.div
          ref={surfaceRef}
          data-bench-background="true"
          className="absolute left-0 top-0 bg-transparent"
          style={{
            width: surfaceWidth,
            height: surfaceHeight,
            x: camera.x,
            y: camera.y,
            scale: camera.scale,
            transformOrigin: "0 0",
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(event) => void handleSurfaceDrop(event)}
          data-testid="playground-workbench"
        >
          {items.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
              <EmptyState
                title="This bench is still clean"
                description="Add your first attempt, note, or reference when you are ready."
                className="pointer-events-none max-w-lg"
              />
            </div>
          )}

          {items.length > 0 && filteredItems.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
              <EmptyState
                title="No cards match this filter"
                description="Switch filters to bring the rest of the bench back into view."
                className="pointer-events-none max-w-lg"
              />
            </div>
          )}

          {positionedItems.map(({ item, position }) => (
            <motion.div
              key={item.id}
              drag
              dragMomentum={false}
              dragElastic={0.03}
              dragTransition={{ power: 0, timeConstant: 0 }}
              initial={false}
              animate={{ x: position.x, y: position.y }}
              whileDrag={{ scale: 1.01 }}
              onDragStart={() => setDraggingItemId(item.id)}
              onDragEnd={(_, info) => void handleDragEnd(item, position, info)}
              onPointerDown={(event) => {
                event.stopPropagation();
                if (event.shiftKey || event.metaKey || event.ctrlKey) {
                  toggleItemSelection(item.id);
                } else if (!selectedItemIds.includes(item.id)) {
                  selectItem(item.id);
                }
                setContextMenu(null);
              }}
              onContextMenu={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (!selectedItemIds.includes(item.id)) {
                  selectItem(item.id);
                }
                const rect = viewportRef.current?.getBoundingClientRect();
                if (!rect) return;
                setContextMenu({ 
                  type: "item", 
                  itemId: item.id, 
                  x: event.clientX - rect.left, 
                  y: event.clientY - rect.top 
                });
              }}
              className={cn(
                "absolute left-0 top-0 touch-none transition-shadow",
                draggingItemId === item.id && "z-20",
                selectedItemId === item.id && "z-10"
              )}
              style={{ width: item.type === "sticky" ? STICKY_WIDTH : CARD_WIDTH }}
              data-testid={`playground-item-${item.id}`}
            >
              <div
                className={cn(
                  "rounded-[var(--ui-radius-md)] transition-all",
                  selectedItemIds.includes(item.id) && "selected-workbench-item"
                )}
              >
                <WorkbenchBenchItem item={item} autoFocusSticky={focusedStickyId === item.id} />
              </div>
            </motion.div>
          ))}

          {isDraggingOver && (
            <div className="pointer-events-none absolute inset-4 rounded-[var(--ui-radius-md)] border border-dashed border-[rgba(204,120,92,0.7)] bg-[var(--ui-accent-soft)]" />
          )}
        </motion.div>
      </div>

      <div className="create-shelf" aria-label="Create item shortcuts">
        <button type="button" onClick={() => onCreateRequest?.("observation")} className="create-shelf-button" data-testid="btn-create-observation-flow">
          <NotebookPen className="h-4 w-4 text-[var(--ui-accent-note)]" />
          Note
        </button>
        <button type="button" onClick={() => onCreateRequest?.("reference")} className="create-shelf-button" data-testid="btn-create-reference-flow">
          <Library className="h-4 w-4 text-[var(--ui-info)]" />
          Reference
        </button>
        <button type="button" onClick={() => onCreateRequest?.("attempt")} className="create-shelf-button" data-testid="item-type-card-attempt">
          <Hammer className="h-4 w-4 text-[var(--ui-text-2)]" />
          Attempt
        </button>
        <button type="button" onClick={() => onCreateRequest?.("question")} className="create-shelf-button" data-testid="btn-create-question-flow">
          <MessageCircleQuestion className="h-4 w-4 text-[var(--ui-danger)]" />
          Question
        </button>
        <button type="button" onClick={() => onCreateRequest?.("breakthrough")} className="create-shelf-button" data-testid="btn-create-breakthrough-flow">
          <Sparkles className="h-4 w-4 text-[var(--ui-success)]" />
          Breakthrough
        </button>
        <button type="button" onClick={() => onCreateRequest?.("import")} className="create-shelf-button" data-testid="btn-create-import-flow">
          <Import className="h-4 w-4 text-[var(--ui-text-2)]" />
          Import
        </button>
      </div>

       {contextMenu && (
        <div
          className="absolute z-30 min-w-52 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-1 shadow-[var(--ui-shadow-2)]"
          style={{ 
            left: contextMenu.x, 
            top: contextMenu.y,
            transform: (contextMenu.x > (viewportRef.current?.clientWidth ?? 0) - 220) ? "translateX(-100%)" : "none"
          }}
        >
          {contextMenu.type === "item" ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setContextMenu(null);
                  selectItem(contextMenu.itemId!);
                }}
                className="block w-full rounded-[var(--ui-radius-sm)] px-3 py-2 text-left text-sm text-[var(--ui-text-2)] hover:bg-[var(--ui-surface-2)] hover:text-[var(--ui-text-1)]"
              >
                Focus Card
              </button>
              <button
                type="button"
                onClick={handleCopySelected}
                className="flex w-full items-center gap-2 rounded-[var(--ui-radius-sm)] px-3 py-2 text-left text-sm text-[var(--ui-text-2)] hover:bg-[var(--ui-surface-2)] hover:text-[var(--ui-text-1)]"
              >
                <Copy className="h-4 w-4" />
                Copy {selectedItemIds.length > 1 ? `(${selectedItemIds.length})` : ""}
              </button>
              <button
                type="button"
                onClick={() => {
                  setContextMenu(null);
                  openModal({ type: "createBridge", payload: { sourceItemId: contextMenu.itemId } });
                }}
                className="block w-full rounded-[var(--ui-radius-sm)] px-3 py-2 text-left text-sm text-[var(--ui-text-2)] hover:bg-[var(--ui-surface-2)] hover:text-[var(--ui-text-1)]"
              >
                Create Bridge
              </button>
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="flex w-full items-center gap-2 rounded-[var(--ui-radius-md)] px-3 py-2 text-left text-sm text-[var(--ui-danger)] hover:bg-[var(--ui-danger-soft)]"
              >
                <Trash2 className="h-4 w-4" />
                Delete {selectedItemIds.length > 1 ? `(${selectedItemIds.length}) items` : "Card"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={!clipboard}
                onClick={() => {
                  const point = resolveSurfacePoint(contextMenu.x, contextMenu.y);
                  void handlePaste(point);
                }}
                className="flex w-full items-center gap-2 rounded-[var(--ui-radius-sm)] px-3 py-2 text-left text-sm text-[var(--ui-text-2)] hover:bg-[var(--ui-surface-2)] hover:text-[var(--ui-text-1)] disabled:opacity-50"
              >
                <ClipboardPaste className="h-4 w-4" />
                Paste {clipboard?.data.length ? `(${clipboard.data.length})` : ""}
              </button>
              <button
                type="button"
                onClick={() => {
                  setContextMenu(null);
                  const point = resolveSurfacePoint(contextMenu.x, contextMenu.y);
                  if (point) void handleCreateSticky(point);
                }}
                className="block w-full rounded-[var(--ui-radius-sm)] px-3 py-2 text-left text-sm text-[var(--ui-text-2)] hover:bg-[var(--ui-surface-2)] hover:text-[var(--ui-text-1)]"
              >
                Add Sticky Note
              </button>
              <button
                type="button"
                onClick={() => {
                  setContextMenu(null);
                  clearSelection();
                }}
                className="block w-full rounded-[var(--ui-radius-sm)] px-3 py-2 text-left text-sm text-[var(--ui-text-2)] hover:bg-[var(--ui-surface-2)] hover:text-[var(--ui-text-1)]"
              >
                Clear Selection
              </button>
            </>
          )}
        </div>
      )}

    </div>
  );
}
