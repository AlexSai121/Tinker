import { memo } from "react";
import { Layer } from "react-konva";
import type { Workbench } from "../../types";
import { WorkbenchCard } from "./WorkbenchCard";

interface Props {
  workbenches: Workbench[];
  itemCounts: Record<string, number>;
  previewByWorkbench: Record<string, string[]>;
  showDustOverlay: boolean;
  dustThresholdDays: number;
  onOpenMenu?: (workbenchId: string, point: { x: number; y: number }) => void;
}

export const WorkbenchLayer = memo(function WorkbenchLayer({
  workbenches,
  itemCounts,
  previewByWorkbench,
  showDustOverlay,
  dustThresholdDays,
  onOpenMenu,
}: Props) {
  return (
    <Layer>
      {workbenches.map((wb) => (
        <WorkbenchCard
          key={wb.id}
          workbench={wb}
          itemCount={itemCounts[wb.id] ?? 0}
          previewItems={previewByWorkbench[wb.id] ?? []}
          showDustOverlay={showDustOverlay}
          dustThresholdDays={dustThresholdDays}
          onOpenMenu={onOpenMenu}
        />
      ))}
    </Layer>
  );
});
