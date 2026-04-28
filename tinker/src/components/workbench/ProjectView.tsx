import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { PlaygroundWorkbench } from "./PlaygroundWorkbench";
import { ItemCreator } from "./ItemCreator";
import { SkillPanel } from "./SkillPanel";
import { useWorkbench } from "../../hooks/useWorkbenches";
import { useItems } from "../../hooks/useItems";
import { useUiStore } from "../../stores/uiStore";
import { useUpdateDust } from "../../hooks/useWorkbenches";
import { EmptyState } from "../shared/EmptyState";
import { SkeletonBlock } from "../shared/Skeleton";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { cn } from "../../utils/cn";
import { triggerHapticFeedback } from "../../utils/haptics";
import { AnimatedButton } from "../shared/AnimatedButton";
import { SegmentedTabs } from "../shared/SegmentedTabs";
import { SmartTooltip } from "../shared/SmartTooltip";

export function ProjectView({ workbenchId }: { workbenchId: string }) {
  const { data: workbench, isLoading, isError } = useWorkbench(workbenchId);
  const { data: items = [] } = useItems(workbenchId);
  const setViewMode = useUiStore((s) => s.setViewMode);
  const updateDust = useUpdateDust();
  const { isTabletLayout, isCompactLayout } = useResponsiveLayout();
  const [tabletPanel, setTabletPanel] = useState<"create" | "skills">("create");
  const [tabletSheetExpanded, setTabletSheetExpanded] = useState(false);
  const swipeStartXRef = useRef<number | null>(null);

  useEffect(() => {
    void updateDust.mutateAsync({ id: workbenchId, date: new Date() });
  }, [workbenchId]);

  useEffect(() => {
    if (!isTabletLayout) {
      setTabletSheetExpanded(false);
    }
  }, [isTabletLayout]);

  const handleTabletTabChange = (nextPanel: "create" | "skills") => {
    setTabletPanel(nextPanel);
    setTabletSheetExpanded(true);
    triggerHapticFeedback("light");
  };

  const handlePanelTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    swipeStartXRef.current = event.changedTouches[0]?.clientX ?? null;
  };

  const handlePanelTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (swipeStartXRef.current === null) {
      return;
    }

    const endX = event.changedTouches[0]?.clientX ?? swipeStartXRef.current;
    const deltaX = endX - swipeStartXRef.current;
    swipeStartXRef.current = null;

    if (Math.abs(deltaX) < 48) {
      return;
    }

    if (deltaX < 0) {
      handleTabletTabChange("skills");
      return;
    }

    handleTabletTabChange("create");
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-col gap-6 overflow-hidden bg-[var(--ui-surface-0)] p-6">
        <div className="border-b border-[var(--ui-border-muted)] pb-4">
          <SkeletonBlock className="h-8 w-60" />
          <SkeletonBlock className="mt-3 h-4 w-96 max-w-full" />
          <SkeletonBlock className="mt-2 h-4 w-48" />
        </div>
        <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <SkeletonBlock className="h-full min-h-[420px] w-full rounded-xl" />
          <div className="space-y-6">
            <SkeletonBlock className="h-72 w-full rounded-xl" />
            <SkeletonBlock className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          title="Couldn't load this project"
          description="Try returning to the canvas and opening it again."
          className="w-full max-w-xl"
        />
      </div>
    );
  }

  if (!workbench) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          title="Project not found"
          description="This workbench may have been removed or the app lost track of it."
          className="w-full max-w-xl"
        />
      </div>
    );
  }

  return (
    <div className={cn("flex h-full flex-col overflow-hidden bg-[var(--ui-surface-0)]", isTabletLayout ? "p-4" : "p-6")}>
      <header className={cn("mb-4 border-b border-[var(--ui-border-muted)] pb-4", isCompactLayout ? "space-y-3" : "mb-6")}>
        <div className={cn("flex gap-4", isCompactLayout ? "flex-col items-start" : "items-end justify-between")}>
          <div className="flex items-center gap-4">
            <SmartTooltip content="Back to canvas">
              <AnimatedButton
                type="button"
                onClick={() => setViewMode("workbench")}
                variant="ghost"
                size="icon"
                className="shrink-0"
                data-testid="btn-back-to-workbench"
              >
                <ArrowLeft className="h-4 w-4" />
              </AnimatedButton>
            </SmartTooltip>
            <div>
              <h1 className="font-serif text-3xl font-normal leading-tight text-[var(--ui-text-1)]">{workbench.name}</h1>
              {workbench.description && (
                <p className="mt-1 max-w-2xl text-sm text-[var(--ui-text-2)]">{workbench.description}</p>
              )}
              <p className="mt-1 text-sm text-[var(--ui-text-2)]">
                Last opened {new Date(workbench.lastOpenedAt || workbench.createdAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-[var(--ui-text-3)]">{items.length} items on this bench</p>
            </div>
          </div>
        </div>
      </header>

      {!isTabletLayout ? (
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <PlaygroundWorkbench workbenchId={workbenchId} />
          </div>

          <aside className="ui-inspector flex min-h-0 w-full shrink-0 flex-col gap-4 overflow-y-auto rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] p-3">
            <div className="shrink-0">
              <ItemCreator workbenchId={workbenchId} />
            </div>

            <div className="flex-1 min-h-[400px]">
              <SkillPanel workbenchId={workbenchId} />
            </div>
          </aside>
        </div>
      ) : (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <PlaygroundWorkbench workbenchId={workbenchId} />
          </div>

          <section
            className={cn(
              "mt-4 shrink-0 rounded-t-[var(--ui-radius-xl)] border border-b-0 border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] backdrop-blur transition-all",
              tabletSheetExpanded ? "max-h-[68svh]" : "max-h-24"
            )}
            data-testid="project-touch-sheet"
          >
            <button
              type="button"
              onClick={() => setTabletSheetExpanded((current) => !current)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
              data-testid="btn-toggle-project-sheet"
            >
              <div>
                <p className="text-sm font-semibold text-[var(--ui-text-1)]">Project tools</p>
                <p className="text-xs text-[var(--ui-text-3)]">Swipe between Create and Skills, or tap to expand.</p>
              </div>
              <span className="text-xs uppercase text-[var(--ui-text-3)]">
                {tabletSheetExpanded ? "Collapse" : "Expand"}
              </span>
            </button>

            <div className="px-4 pb-3">
              <SegmentedTabs
                value={tabletPanel}
                onChange={handleTabletTabChange}
                options={[
                  { value: "create", label: "Create", testId: "btn-tablet-tab-create" },
                  { value: "skills", label: "Skills", testId: "btn-tablet-tab-skills" },
                ]}
                className="w-full"
              />
            </div>

            {tabletSheetExpanded && (
              <div
                className="max-h-[calc(68svh-7rem)] overflow-y-auto px-4 pb-6"
                onTouchStart={handlePanelTouchStart}
                onTouchEnd={handlePanelTouchEnd}
              >
                {tabletPanel === "create" ? (
                  <ItemCreator workbenchId={workbenchId} />
                ) : (
                  <SkillPanel workbenchId={workbenchId} />
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
