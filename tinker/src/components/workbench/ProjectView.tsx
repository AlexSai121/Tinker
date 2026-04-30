import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Box, Clock, Link2, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { PlaygroundWorkbench } from "./PlaygroundWorkbench";
import { ItemGrid } from "./ItemGrid";
import { ItemCreator } from "./ItemCreator";
import { SkillPanel } from "./SkillPanel";
import { useWorkbench } from "../../hooks/useWorkbenches";
import { useItems } from "../../hooks/useItems";
import { useItemMedia } from "../../hooks/useItemMedia";
import { useScars } from "../../hooks/useScars";
import { useUiStore } from "../../stores/uiStore";
import { useUpdateDust } from "../../hooks/useWorkbenches";
import { useDeleteItem } from "../../hooks/useItems";
import { EmptyState } from "../shared/EmptyState";
import { SkeletonBlock } from "../shared/Skeleton";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { cn } from "../../utils/cn";
import { triggerHapticFeedback } from "../../utils/haptics";
import { AnimatedButton } from "../shared/AnimatedButton";
import { SegmentedTabs } from "../shared/SegmentedTabs";
import { decodeStructuredItemContent } from "../../utils/itemContent";
import { mediaLabelFromPath, mediaSrcFromPath } from "../../utils/media";
import type { Item, Workbench } from "../../types";
import { CREATABLE_ITEM_TYPES } from "../../utils/constants";

type CreatableType = (typeof CREATABLE_ITEM_TYPES)[number];

function SelectedItemInspector({
  item,
  workbench,
  items,
  onDelete,
}: {
  item: Item;
  workbench: Workbench;
  items: Item[];
  onDelete: (itemId: string) => void;
}) {
  const { data: media = [] } = useItemMedia(item.id);
  const { data: scars = [] } = useScars(item.id);
  const structured = decodeStructuredItemContent(item);
  const title = structured?.title || (item.type === "sticky" ? "Pinned note" : `${item.type[0].toUpperCase()}${item.type.slice(1)}`);
  const body = (structured?.content ?? item.content).trim();
  const sourceUrl = structured?.sourceUrl;
  const preview = media[0];
  const created = new Date(item.createdAt);
  const siblingAttempt = items.find((candidate) => candidate.id !== item.id && candidate.type === "attempt");
  const linkedLabel = decodeStructuredItemContent(siblingAttempt ?? item)?.title || siblingAttempt?.content || "No linked item yet";
  const deleteLabel = `Delete ${title}`;

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 inline-block rounded bg-[#fceec9] px-2 py-1 text-[10px] font-bold tracking-wider text-[#b08226] uppercase">
          {item.type}
        </div>
        <h2 className="font-[var(--ui-font-display)] text-[1.65rem] font-medium leading-tight text-[var(--ui-text-1)]">
          {title}
        </h2>
        <p className="mt-4 text-[0.95rem] leading-7 text-[var(--ui-text-2)]">
          {body || "No detail has been added yet."}
        </p>
      </div>

      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-start gap-2 rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] px-3 py-2 text-sm text-[var(--ui-text-2)] hover:text-[var(--ui-text-1)]"
        >
          <Link2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0 truncate">{sourceUrl}</span>
        </a>
      )}

      {preview && (
        <figure className="overflow-hidden rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-bg-muted)]">
          {preview.type === "photo" ? (
            <img src={mediaSrcFromPath(preview.path)} alt={mediaLabelFromPath(preview.path)} className="h-44 w-full object-cover" />
          ) : (
            <div className="flex h-36 items-center justify-center text-sm text-[var(--ui-text-2)]">
              {mediaLabelFromPath(preview.path)}
            </div>
          )}
          <figcaption className="flex items-center justify-between px-3 py-2 text-xs text-[var(--ui-text-2)]">
            <span className="truncate">{mediaLabelFromPath(preview.path)}</span>
            <MoreHorizontal className="h-4 w-4" />
          </figcaption>
        </figure>
      )}

      <div className="space-y-6">
        <div className="space-y-1 text-sm text-[var(--ui-text-2)]">
          <p>Project</p>
          <div className="flex items-center gap-2 rounded-md bg-[var(--ui-surface-1)] px-3 py-2 text-[var(--ui-text-1)] shadow-sm">
            <Box className="h-4 w-4" />
            {workbench.name}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm text-[var(--ui-text-2)]">
          <div>
            <p className="mb-1">Date</p>
            <p className="text-[var(--ui-text-1)]">
              {created.toLocaleDateString()}{" "}{created.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </p>
          </div>
          <div>
            <p className="mb-1">Tags</p>
            <div className="flex flex-wrap gap-1">
              <span className="rounded bg-[var(--ui-surface-2)] px-2 py-0.5 text-xs">#{item.type}</span>
              {scars.length > 0 && (
                <span className="rounded bg-[var(--ui-surface-2)] px-2 py-0.5 text-xs">#{scars[0].failureType}</span>
              )}
              <span className="flex items-center justify-center rounded bg-[var(--ui-surface-2)] px-2 py-0.5 text-xs">+</span>
            </div>
          </div>
        </div>
        {(structured?.outcome || structured?.confidence !== undefined) && (
          <div className="grid grid-cols-2 gap-4 text-sm text-[var(--ui-text-2)]">
            <div>
              <p className="mb-1">Outcome</p>
              <p className="capitalize text-[var(--ui-text-1)]">{structured?.outcome ?? "success"}</p>
            </div>
            <div>
              <p className="mb-1">Confidence</p>
              <p className="text-[var(--ui-text-1)]">{structured?.confidence ?? 70}%</p>
            </div>
          </div>
        )}
        <div className="space-y-1 text-sm text-[var(--ui-text-2)]">
          <p>Linked to</p>
          <div className="flex items-center gap-2 rounded-md border border-[var(--ui-border)] bg-transparent px-3 py-2 text-[var(--ui-text-1)]">
            <Link2 className="h-4 w-4" />
            <span className="truncate">{linkedLabel}</span>
          </div>
        </div>
        <div className="flex items-end justify-between pt-4 text-xs text-[var(--ui-text-3)]">
          <div>
            <p>Created {new Date(item.createdAt).toLocaleDateString()}</p>
            <p>Updated {new Date(item.updatedAt).toLocaleDateString()}</p>
          </div>
          <AnimatedButton
            variant="danger"
            size="icon"
            className="h-8 w-8 text-[#d48c82] hover:bg-[#faeaea] hover:text-[#c45749]"
            aria-label={deleteLabel}
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
}

function ProjectInspector({
  workbench,
  items,
  workbenchId,
  onCreateRequest,
  onCreated,
  onDelete,
}: {
  workbench: Workbench;
  items: Item[];
  workbenchId: string;
  onCreateRequest: (type?: CreatableType | "import") => void;
  onCreated: (itemId: string) => void;
  onDelete: (itemId: string) => void;
}) {
  const selectedItemId = useUiStore((s) => s.selectedItemId);
  const selectedItem = selectedItemId ? items.find((item) => item.id === selectedItemId) ?? null : null;

  if (!selectedItem) {
    return (
      <div className="space-y-4">
        <ItemCreator
          workbenchId={workbenchId}
          existingItems={items}
          initialType="observation"
          initialStep="details"
          onCreated={onCreated}
        />
        <SkillPanel workbenchId={workbenchId} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SelectedItemInspector item={selectedItem} workbench={workbench} items={items} onDelete={onDelete} />
    </div>
  );
}

function itemTitle(item: Item) {
  const structured = decodeStructuredItemContent(item);
  return structured?.title || (item.type === "sticky" ? "Pinned note" : `${item.type[0].toUpperCase()}${item.type.slice(1)}`);
}

function itemBody(item: Item) {
  const structured = decodeStructuredItemContent(item);
  return (structured?.content ?? item.content).trim();
}

function ProjectTimelineView({
  items,
  onCreateRequest,
  onSelect,
  selectedItemId,
}: {
  items: Item[];
  onCreateRequest: (type?: CreatableType | "import") => void;
  onSelect: (itemId: string) => void;
  selectedItemId: string | null;
}) {
  const sortedItems = [...items].sort((left, right) => {
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });

  if (sortedItems.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <EmptyState
          title="No timeline yet"
          description="Add your first note, attempt, or reference and it will appear here chronologically."
          action={
            <AnimatedButton type="button" variant="surface" onClick={() => onCreateRequest("observation")}>
              <Plus className="h-4 w-4" />
              Add item
            </AnimatedButton>
          }
          className="max-w-lg"
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-8 pb-24 pt-4">
      <div className="mx-auto max-w-4xl space-y-3">
        {sortedItems.map((item) => {
          const created = new Date(item.createdAt);
          const body = itemBody(item);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                "grid w-full grid-cols-[6.5rem_1fr] gap-5 rounded-[18px] border bg-[var(--ui-bg-card)] px-5 py-4 text-left shadow-[var(--ui-shadow-card)] transition-colors duration-150 hover:border-[var(--ui-border-strong)]",
                selectedItemId === item.id ? "border-[var(--ui-accent)]" : "border-[var(--ui-border)]"
              )}
              data-testid={`project-timeline-item-${item.id}`}
            >
              <span className="text-sm text-[var(--ui-text-3)]">
                {created.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </span>
              <span className="min-w-0">
                <span className="mb-2 inline-flex rounded-full bg-[var(--ui-surface-2)] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-3)]">
                  {item.type}
                </span>
                <span className="block text-base font-semibold text-[var(--ui-text-1)]">{itemTitle(item)}</span>
                {body && <span className="mt-1 line-clamp-2 block text-sm leading-6 text-[var(--ui-text-2)]">{body}</span>}
                <span className="mt-3 block text-xs text-[var(--ui-text-3)]">{created.toLocaleDateString()}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GalleryTile({ item, onSelect, selected }: { item: Item; onSelect: (itemId: string) => void; selected: boolean }) {
  const { data: media = [] } = useItemMedia(item.id);
  const preview = media[0];
  const body = itemBody(item);

  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={cn(
        "overflow-hidden rounded-[18px] border bg-[var(--ui-bg-card)] text-left shadow-[var(--ui-shadow-card)] transition-colors duration-150 hover:border-[var(--ui-border-strong)]",
        selected ? "border-[var(--ui-accent)]" : "border-[var(--ui-border)]"
      )}
      data-testid={`project-gallery-item-${item.id}`}
    >
      {preview?.type === "photo" ? (
        <img src={mediaSrcFromPath(preview.path)} alt={mediaLabelFromPath(preview.path)} className="h-44 w-full object-cover" />
      ) : (
        <div className="flex h-44 items-center justify-center bg-[var(--ui-surface-2)] px-6 text-center text-sm text-[var(--ui-text-3)]">
          {preview ? mediaLabelFromPath(preview.path) : "No evidence attached"}
        </div>
      )}
      <div className="p-4">
        <span className="mb-2 inline-flex rounded-full bg-[var(--ui-surface-2)] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-3)]">
          {item.type}
        </span>
        <p className="font-semibold text-[var(--ui-text-1)]">{itemTitle(item)}</p>
        {body && <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--ui-text-2)]">{body}</p>}
      </div>
    </button>
  );
}

function ProjectGalleryView({
  items,
  onCreateRequest,
  onSelect,
  selectedItemId,
}: {
  items: Item[];
  onCreateRequest: (type?: CreatableType | "import") => void;
  onSelect: (itemId: string) => void;
  selectedItemId: string | null;
}) {
  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <EmptyState
          title="No gallery items yet"
          description="Attach photos, sketches, or references and they will gather here."
          action={
            <AnimatedButton type="button" variant="surface" onClick={() => onCreateRequest("import")}>
              <Plus className="h-4 w-4" />
              Import evidence
            </AnimatedButton>
          }
          className="max-w-lg"
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-8 pb-24 pt-4">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
        {items.map((item) => (
          <GalleryTile key={item.id} item={item} onSelect={onSelect} selected={selectedItemId === item.id} />
        ))}
      </div>
    </div>
  );
}

export function ProjectView({ workbenchId }: { workbenchId: string }) {
  const { data: workbench, isLoading, isError } = useWorkbench(workbenchId);
  const { data: items = [] } = useItems(workbenchId);
  const projectView = useUiStore((s) => s.projectView);
  const setViewMode = useUiStore((s) => s.setViewMode);
  const selectItem = useUiStore((s) => s.selectItem);
  const selectedItemId = useUiStore((s) => s.selectedItemId);
  const updateDust = useUpdateDust();
  const deleteItem = useDeleteItem();
  const { isTabletLayout } = useResponsiveLayout();
  const [tabletPanel, setTabletPanel] = useState<"create" | "skills">("create");
  const [tabletSheetExpanded, setTabletSheetExpanded] = useState(false);
  const swipeStartXRef = useRef<number | null>(null);
  const [creationType, setCreationType] = useState<CreatableType | null>(null);
  const [creationOpen, setCreationOpen] = useState(false);

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

  const openCreateFlow = (type?: CreatableType | "import") => {
    const resolvedType = type === "import" ? "observation" : type ?? "observation";
    setCreationType(resolvedType);
    setCreationOpen(true);
    triggerHapticFeedback("light");
  };

  const closeCreateFlow = () => {
    setCreationOpen(false);
  };

  const handleCreated = (itemId: string) => {
    selectItem(itemId);
  };

  const handleCreateComplete = () => {
    setCreationOpen(false);
  };

  const handleDelete = async (itemId: string) => {
    await deleteItem.mutateAsync(itemId);
    if (useUiStore.getState().selectedItemId === itemId) {
      selectItem(null);
    }
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
    <div className={cn("flex h-full min-h-0 bg-transparent", isTabletLayout && "flex-col")}>
      {!isTabletLayout && (
        <div className="m-2 relative flex flex-1 flex-col overflow-hidden rounded-[20px] border border-[var(--ui-border)] bg-[var(--ui-bg-workbench)] shadow-[var(--ui-shadow-1)] lg:m-4 lg:rounded-[24px]">
          <div className="relative z-10 shrink-0 px-4 pb-3 pt-5 pointer-events-none sm:px-6 lg:px-8 lg:pt-8">
            <div className="flex justify-between items-start pointer-events-auto">
              <div className="flex items-start gap-4">
                <AnimatedButton
                  type="button"
                  onClick={() => setViewMode("workbench")}
                  variant="ghost"
                  size="icon"
                  className="mt-1 h-10 w-10 shrink-0"
                  data-testid="btn-back-to-workbench"
                  aria-label="Back to workbench"
                >
                  <ArrowLeft className="h-4 w-4" />
                </AnimatedButton>
                <div>
                  <h1 className="font-[var(--ui-font-display)] text-[clamp(1.75rem,3vw,2.5rem)] font-medium leading-tight text-[var(--ui-text-1)]">{workbench.name}</h1>
                  {workbench.description && (
                    <p className="mt-1 text-[var(--ui-text-2)] text-[15px]">{workbench.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-3 text-[13px] text-[var(--ui-text-2)] font-medium">
                    <span className="flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-1)] px-3 py-1 shadow-sm">
                      <span className="h-2 w-2 rounded-full bg-[#82ab78]" /> Active
                    </span>
                    <span className="flex items-center gap-1.5 text-sm">
                      <Clock size={14} className="text-[var(--ui-text-3)]" /> {items.length} item{items.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 relative overflow-hidden">
            {projectView === "board" && <PlaygroundWorkbench workbenchId={workbenchId} onCreateRequest={openCreateFlow} />}
            {projectView === "timeline" && (
              <ProjectTimelineView
                items={items}
                onCreateRequest={openCreateFlow}
                onSelect={selectItem}
                selectedItemId={selectedItemId}
              />
            )}
            {projectView === "gallery" && (
              <ProjectGalleryView
                items={items}
                onCreateRequest={openCreateFlow}
                onSelect={selectItem}
                selectedItemId={selectedItemId}
              />
            )}

            {creationOpen && creationType && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(34,27,21,0.28)] px-3 py-4 sm:px-6 sm:py-8">
                <div className="max-h-full w-full max-w-[min(720px,calc(100vw-2rem))] overflow-y-auto rounded-[22px] border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4 shadow-[var(--ui-shadow-2)] sm:p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-black/35">Create Item Flow</p>
                      <h2 className="mt-1 text-[1.8rem] font-medium text-[var(--ui-text-1)]">Add something to the workbench</h2>
                    </div>
                    <button
                      type="button"
                      onClick={closeCreateFlow}
                      className="rounded-full border border-black/8 bg-white/85 px-4 py-2 text-sm text-[var(--ui-text-2)] shadow-sm transition-colors hover:bg-white"
                    >
                      Close
                    </button>
                  </div>
                  <ItemCreator
                    workbenchId={workbenchId}
                    existingItems={items}
                    initialType={creationType ?? "observation"}
                    initialStep="details"
                    onCancel={closeCreateFlow}
                    onCreated={handleCreated}
                    onComplete={handleCreateComplete}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isTabletLayout && (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <header className="p-4 space-y-3">
             <div className="flex items-start justify-between">
                <div>
                   <h1 className="font-[var(--ui-font-display)] text-2xl">{workbench.name}</h1>
                   {workbench.description && <p className="text-sm text-[var(--ui-text-2)]">{workbench.description}</p>}
                </div>
             </div>
          </header>
          <div className="min-h-0 flex-1">
            <ItemGrid workbenchId={workbenchId} />
          </div>

          <section
            className={cn(
              "mt-4 shrink-0 rounded-t-[var(--ui-radius-xl)] border border-b-0 border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] transition-all",
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
                  <ItemCreator
                    workbenchId={workbenchId}
                    existingItems={items}
                    initialType={creationType ?? "observation"}
                    onCreated={handleCreated}
                    onComplete={handleCreateComplete}
                  />
                ) : (
                  <SkillPanel workbenchId={workbenchId} />
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {!isTabletLayout && !creationOpen && (
        <aside className="hidden w-[clamp(280px,24vw,360px)] shrink-0 overflow-y-auto xl:block">
          <div className="p-4 pt-8 2xl:p-6 2xl:pt-10">
            <ProjectInspector
              workbench={workbench}
              items={items}
              workbenchId={workbenchId}
              onCreateRequest={openCreateFlow}
              onCreated={handleCreated}
              onDelete={(itemId) => void handleDelete(itemId)}
            />
          </div>
        </aside>
      )}
    </div>
  );
}
