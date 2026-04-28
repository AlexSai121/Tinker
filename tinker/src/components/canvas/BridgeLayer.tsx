import { memo, useCallback, useMemo } from "react";
import { Layer, Line } from "react-konva";
import type { Bridge, Item, Workbench } from "../../types";
import {
  getBridgeFreshness,
  getBridgeFreshnessColor,
  getEffectiveBridgeStrength,
} from "../../data/bridges";

const DORMANT_DASH = [14, 10];
const ESTABLISHED_DASH = [8, 6];
const HIT_STROKE_WIDTH = 24;

interface BridgeLayerProps {
  bridges: Bridge[];
  items: Item[];
  workbenches: Workbench[];
  onSelectBridge?: (bridgeId: string) => void;
}

interface BridgeSegment {
  id: string;
  points: number[];
  stroke: string;
  strokeWidth: number;
  opacity: number;
  dash?: number[];
}

function buildBridgeSegments(
  bridges: Bridge[],
  items: Item[],
  workbenches: Workbench[]
): BridgeSegment[] {
  const itemLookup = new Map(items.map((item) => [item.id, item]));
  const workbenchLookup = new Map(workbenches.map((workbench) => [workbench.id, workbench]));

  return bridges.flatMap((bridge) => {
    const sourceItem = itemLookup.get(bridge.sourceItemId);
    const targetItem = itemLookup.get(bridge.targetItemId);

    if (!sourceItem || !targetItem || sourceItem.workbenchId === targetItem.workbenchId) {
      return [];
    }

    const sourceWorkbench = workbenchLookup.get(sourceItem.workbenchId);
    const targetWorkbench = workbenchLookup.get(targetItem.workbenchId);

    if (!sourceWorkbench || !targetWorkbench) {
      return [];
    }

    const freshness = getBridgeFreshness(bridge);
    const effectiveStrength = getEffectiveBridgeStrength(bridge);
    const points = [
      sourceWorkbench.posX + sourceWorkbench.width / 2,
      sourceWorkbench.posY + sourceWorkbench.height / 2,
      targetWorkbench.posX + targetWorkbench.width / 2,
      targetWorkbench.posY + targetWorkbench.height / 2,
    ];

    return [
      {
        id: bridge.id,
        points,
        stroke: getBridgeFreshnessColor(freshness),
        strokeWidth: Math.max(1.5, effectiveStrength * 1.85),
        opacity: freshness === "dormant" ? 0.45 : freshness === "established" ? 0.7 : 0.92,
        dash: freshness === "dormant" ? DORMANT_DASH : freshness === "established" ? ESTABLISHED_DASH : undefined,
      },
    ];
  });
}

const BridgeLineShape = memo(function BridgeLineShape({
  segment,
  onSelectBridge,
}: {
  segment: BridgeSegment;
  onSelectBridge?: (bridgeId: string) => void;
}) {
  const handleSelect = useCallback(() => {
    onSelectBridge?.(segment.id);
  }, [onSelectBridge, segment.id]);

  return (
    <Line
      points={segment.points}
      stroke={segment.stroke}
      strokeWidth={segment.strokeWidth}
      opacity={segment.opacity}
      lineCap="round"
      lineJoin="round"
      dash={segment.dash}
      hitStrokeWidth={HIT_STROKE_WIDTH}
      onClick={handleSelect}
      onTap={handleSelect}
    />
  );
});

export const BridgeLayer = memo(function BridgeLayer({
  bridges,
  items,
  workbenches,
  onSelectBridge,
}: BridgeLayerProps) {
  const segments = useMemo(
    () => buildBridgeSegments(bridges, items, workbenches),
    [bridges, items, workbenches]
  );

  if (segments.length === 0) {
    return null;
  }

  return (
    <Layer listening={Boolean(onSelectBridge)}>
      {segments.map((segment) => (
        <BridgeLineShape key={segment.id} segment={segment} onSelectBridge={onSelectBridge} />
      ))}
    </Layer>
  );
});
