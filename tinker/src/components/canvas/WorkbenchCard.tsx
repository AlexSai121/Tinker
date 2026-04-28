import { memo, useCallback, useEffect, useRef } from "react";
import { Group, Rect, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useCanvasStore } from "../../stores/canvasStore";
import { useUiStore } from "../../stores/uiStore";
import { useUpdateDust, useUpdateWorkbench } from "../../hooks/useWorkbenches";
import { BENCH_MAX_ITEMS } from "../../utils/constants";
import { calculateDustLevel } from "../../data/workbenches";
import type { Workbench } from "../../types";

interface Props { 
  workbench: Workbench; 
  itemCount: number;
  previewItems: string[];
  showDustOverlay: boolean;
  dustThresholdDays: number;
  onOpenMenu?: (workbenchId: string, point: { x: number; y: number }) => void;
}

export const WorkbenchCard = memo(function WorkbenchCard({
  workbench,
  itemCount,
  previewItems,
  showDustOverlay,
  dustThresholdDays,
  onOpenMenu,
}: Props) {
  const setActiveWorkbench = useUiStore((s) => s.setActiveWorkbench);
  const setDragging = useCanvasStore((s) => s.setDragging);
  const setDraggedWorkbench = useCanvasStore((s) => s.setDraggedWorkbench);
  const updateWorkbench = useUpdateWorkbench();
  const updateDust = useUpdateDust();

  // Reference for debouncing
  const timeoutRef = useRef<number | null>(null);

  const handleClick = useCallback((event?: any) => {
    if (event && event.evt && "button" in event.evt && event.evt.button !== 0) {
      return;
    }
    setActiveWorkbench(workbench.id);
    void updateDust.mutateAsync({ id: workbench.id, date: new Date() });
  }, [setActiveWorkbench, updateDust, workbench.id]);

  const handleDragStart = useCallback(() => {
    setDragging(true);
    setDraggedWorkbench(workbench.id);
  }, [setDragging, setDraggedWorkbench, workbench.id]);

  const handleDragMove = useCallback((e: KonvaEventObject<DragEvent>) => {
    // We visually update via Konva's default drag behavior, but we might want to sync DB debounced
    const x = e.target.x();
    const y = e.target.y();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = window.setTimeout(() => {
      updateWorkbench.mutate({ id: workbench.id, data: { posX: x, posY: y } });
    }, 500);
  }, [workbench.id, updateWorkbench]);

  const handleDragEnd = useCallback((e: KonvaEventObject<DragEvent>) => {
    setDragging(false);
    setDraggedWorkbench(null);
    const x = e.target.x();
    const y = e.target.y();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    updateWorkbench.mutate({ id: workbench.id, data: { posX: x, posY: y } });
  }, [workbench.id, updateWorkbench, setDragging, setDraggedWorkbench]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const isArchived = workbench.name.includes("[ARCHIVED]");
  const isFull = itemCount >= BENCH_MAX_ITEMS;
  const resolvedTheme = useUiStore((s) => s.resolvedTheme);
  const isLight = resolvedTheme === "light";

  const borderColor = isArchived ? "#8e8b82" : isFull ? "#C64545" : "#CC785C";
  const bgColor = isArchived
    ? (isLight ? "#efe9de" : "#1f1e1b")
    : (isLight ? "#faf9f5" : "#252320");
  const textFill = isLight ? "#141413" : "#faf9f5";
  const mutedFill = isFull ? "#C64545" : (isLight ? "#6c6a64" : "#a09d96");
  const shadowFill = isLight ? "#e6dfd8" : "#0f0e0c";
  
  const dustLevel = showDustOverlay ? calculateDustLevel(workbench, new Date(), dustThresholdDays) : 0;
  const cardWidth = Number.isFinite(workbench.width) ? workbench.width : 1000;
  const cardHeight = Number.isFinite(workbench.height) ? workbench.height : 1000;
  const previewText = previewItems.length > 0
    ? previewItems.map((entry) => `• ${entry}`).join("\n")
    : "No captured items yet. Open the project to start gathering evidence.";
  const descriptionText = workbench.description?.trim() || "Project surface ready for notes, media, attempts, and bridges.";
  const previewBlockHeight = Math.min(140, Math.max(96, cardHeight * 0.22));
  const contentTop = Math.min(88, Math.max(72, cardHeight * 0.14));

  const handleContextMenu = useCallback((event: KonvaEventObject<PointerEvent>) => {
    event.evt.preventDefault();
    onOpenMenu?.(workbench.id, {
      x: event.evt.clientX,
      y: event.evt.clientY,
    });
  }, [onOpenMenu, workbench.id]);

  return (
    <Group 
      x={workbench.posX} 
      y={workbench.posY} 
      draggable
      onClick={handleClick} 
      onTap={handleClick}
      onDragStart={handleDragStart} 
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onContextMenu={handleContextMenu}
    >
      <Rect 
        width={cardWidth} 
        height={cardHeight}
        fill={shadowFill} 
        opacity={0.18}
        cornerRadius={10}
        x={5}
        y={5}
      />
      <Rect 
        width={cardWidth} 
        height={cardHeight}
        fill={bgColor} 
        stroke={borderColor} 
        strokeWidth={1.25}
        cornerRadius={10}
      />
      <Text 
        text={workbench.name} 
        x={16} 
        y={16} 
        width={cardWidth - 32}
        height={40}
        fontSize={22} 
        fontFamily="Inter, system-ui, sans-serif"
        fontStyle="600"
        fill={textFill} 
        wrap="word" 
        ellipsis 
      />
      <Rect
        x={16}
        y={contentTop}
        width={cardWidth - 32}
        height={88}
        cornerRadius={8}
        fill={isLight ? "#f5f0e8" : "#1f1e1b"}
        stroke={isLight ? "#e6dfd8" : "#3b3730"}
      />
      <Text
        text={descriptionText}
        x={28}
        y={contentTop + 16}
        width={cardWidth - 56}
        height={56}
        fontSize={15}
        fontFamily="Inter, system-ui, sans-serif"
        fill={isLight ? "#3d3d3a" : "#c5c0b7"}
        wrap="word"
        ellipsis
      />
      <Text
        text="Preview"
        x={16}
        y={cardHeight - previewBlockHeight - 56}
        fontSize={11}
        fontFamily="Inter, system-ui, sans-serif"
        fontStyle="600"
        fill={mutedFill}
      />
      <Rect
        x={16}
        y={cardHeight - previewBlockHeight - 32}
        width={cardWidth - 32}
        height={previewBlockHeight}
        cornerRadius={8}
        fill={isLight ? "#faf9f5" : "#1f1e1b"}
        stroke={isLight ? "#e6dfd8" : "#3b3730"}
      />
      <Text
        text={previewText}
        x={28}
        y={cardHeight - previewBlockHeight - 16}
        width={cardWidth - 56}
        height={previewBlockHeight - 20}
        fontSize={15}
        lineHeight={1.35}
        fontFamily="Inter, system-ui, sans-serif"
        fill={isLight ? "#141413" : "#faf9f5"}
        wrap="word"
        ellipsis
      />
      <Text 
        text={`${itemCount}/${BENCH_MAX_ITEMS} items`} 
        x={16} 
        y={cardHeight - 28}
        fontSize={11} 
        fill={mutedFill} 
      />
      {dustLevel > 0 && (
        <Rect 
          width={cardWidth} 
          height={cardHeight}
          fill={isLight ? "#faf9f5" : "#181715"}
          opacity={Math.min(dustLevel * 0.5, 0.8)} 
          cornerRadius={8} 
        />
      )}
    </Group>
  );
});
