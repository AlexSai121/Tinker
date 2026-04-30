import React, { useMemo } from "react";
import {
  Camera,
  CircuitBoard,
  Code2,
  Hammer,
  Plus,
  Scissors,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUiStore } from "../../stores/uiStore";
import { useShops } from "../../hooks/useShops";
import { useAllWorkbenches, useUpdateDust } from "../../hooks/useWorkbenches";
import { useAllItems } from "../../hooks/useItems";
import { EmptyState } from "../shared/EmptyState";
import { SkeletonBlock } from "../shared/Skeleton";
import { AnimatedButton } from "../shared/AnimatedButton";
import { SmartTooltip } from "../shared/SmartTooltip";
import { cn } from "../../utils/cn";
import type { Shop, Workbench } from "../../types";

const BENCH_TONES = [
  { bg: "var(--ui-bg-card)", accent: "#d7a94d", span: 4, minHeight: "16rem" },
  { bg: "var(--ui-bg-card)", accent: "#8fa7bb", span: 4, minHeight: "16rem" },
  { bg: "var(--ui-bg-card)", accent: "#7f9a75", span: 4, minHeight: "16rem" },
  { bg: "var(--ui-bg-card)", accent: "#a994c7", span: 4, minHeight: "16rem" },
  { bg: "var(--ui-bg-card)", accent: "#a88a66", span: 4, minHeight: "16rem" },
] as const;

const SHOP_ICONS: LucideIcon[] = [Scissors, Code2, CircuitBoard, Utensils, Camera, Hammer];

function getLastWorkedLabel(workbench: Workbench) {
  const date = workbench.lastOpenedAt ?? workbench.updatedAt ?? workbench.createdAt;
  return formatDistanceToNow(new Date(date), { addSuffix: false });
}

function projectStatus(index: number, itemCount: number) {
  if (itemCount === 0) {
    return { label: "Not Started", tone: "#b8afa3" };
  }

  if (index % 3 === 1) {
    return { label: "In Progress", tone: "#d7a94d" };
  }

  return { label: "Active", tone: "#7f9a75" };
}

function ProjectTile({
  workbench,
  itemCount,
  tone,
  index,
  onOpen,
}: {
  workbench: Workbench;
  itemCount: number;
  tone: (typeof BENCH_TONES)[number];
  index: number;
  onOpen: () => void;
}) {
  const status = projectStatus(index, itemCount);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="project-tile"
      style={{ "--bench-accent": tone.accent } as React.CSSProperties}
      data-testid={`workbench-card-${workbench.id}`}
    >
      <span className="project-thumb" aria-hidden="true" />
      <span className="min-w-0">
        <span className="project-tile-title">{workbench.name}</span>
        <span className="project-tile-meta">
          <span className="status-dot" style={{ background: status.tone }} />
          {status.label}
        </span>
        <span className="mt-1 block truncate text-[11px] text-[var(--ui-text-3)]">
          {itemCount} item{itemCount === 1 ? "" : "s"} - {getLastWorkedLabel(workbench)}
        </span>
      </span>
    </button>
  );
}

function ShopBench({
  shop,
  projects,
  itemCounts,
  index,
  active,
  onCreateProject,
  onOpenProject,
}: {
  shop: Shop;
  projects: Workbench[];
  itemCounts: Record<string, number>;
  index: number;
  active: boolean;
  onCreateProject: () => void;
  onOpenProject: (workbench: Workbench) => void;
}) {
  const tone = BENCH_TONES[index % BENCH_TONES.length];
  const Icon = SHOP_ICONS[index % SHOP_ICONS.length];

  return (
    <section
      className={cn("shop-bench", active && "is-active")}
      style={{
        "--bench-bg": tone.bg,
        "--bench-accent": tone.accent,
        "--bench-span": tone.span,
        "--bench-min-height": tone.minHeight,
      } as React.CSSProperties}
      aria-label={`${shop.name} projects`}
    >
      <div className="shop-bench-header">
        <h2 className="shop-bench-title">
          <Icon className="h-4 w-4" />
          {shop.name}
        </h2>
        <SmartTooltip content="Create project in this shop">
          <AnimatedButton
            type="button"
            onClick={onCreateProject}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={`Create project in ${shop.name}`}
          >
            <Plus className="h-4 w-4" />
          </AnimatedButton>
        </SmartTooltip>
      </div>

      <div className="shop-project-grid">
        {projects.length > 0 ? (
          projects.map((project, projectIndex) => (
            <ProjectTile
              key={project.id}
              workbench={project}
              itemCount={itemCounts[project.id] ?? 0}
              tone={tone}
              index={projectIndex}
              onOpen={() => onOpenProject(project)}
            />
          ))
        ) : (
          <button
            type="button"
            onClick={onCreateProject}
            className="flex min-h-24 items-center justify-center rounded-[var(--ui-radius-md)] border border-dashed border-[var(--ui-border-strong)] bg-[var(--ui-bg-card)] px-4 py-6 text-sm text-[var(--ui-text-2)] transition-colors hover:bg-[var(--ui-surface-2)] hover:text-[var(--ui-text-1)]"
          >
            <Plus className="mr-2 h-4 w-4" />
            New project
          </button>
        )}
      </div>
    </section>
  );
}

export function WorkbenchCanvas({ shopId }: { shopId: string }) {
  const { data: shops = [], isLoading: shopsLoading, isError: shopsError } = useShops();
  const { data: workbenches = [], isLoading: workbenchesLoading, isError: workbenchesError } = useAllWorkbenches();
  const { data: allItems = [], isLoading: itemsLoading } = useAllItems();
  const openModal = useUiStore((s) => s.openModal);
  const setActiveShop = useUiStore((s) => s.setActiveShop);
  const setActiveWorkbench = useUiStore((s) => s.setActiveWorkbench);
  const updateDust = useUpdateDust();

  const activeProjects = useMemo(
    () => workbenches.filter((workbench) => !workbench.name.includes("[ARCHIVED]")),
    [workbenches]
  );
  const projectsByShop = useMemo(() => {
    return activeProjects.reduce<Record<string, Workbench[]>>((groups, workbench) => {
      groups[workbench.shopId] = groups[workbench.shopId] ?? [];
      groups[workbench.shopId].push(workbench);
      return groups;
    }, {});
  }, [activeProjects]);
  const itemCounts = useMemo(() => {
    return allItems.reduce<Record<string, number>>((counts, item) => {
      counts[item.workbenchId] = (counts[item.workbenchId] ?? 0) + 1;
      return counts;
    }, {});
  }, [allItems]);
  const activeShop = shops.find((shop) => shop.id === shopId) ?? shops[0];
  const isLoading = shopsLoading || workbenchesLoading || itemsLoading;
  const hasError = shopsError || workbenchesError;

  const handleCreateProject = (targetShopId = activeShop?.id) => {
    if (!targetShopId) {
      openModal({ type: "createShop" });
      return;
    }

    const projectCount = projectsByShop[targetShopId]?.length ?? 0;
    openModal({
      type: "createProject",
      payload: {
        shopId: targetShopId,
        posX: 80 + (projectCount % 3) * 260,
        posY: 120 + Math.floor(projectCount / 3) * 220,
      },
    });
  };

  const handleOpenProject = (workbench: Workbench) => {
    setActiveShop(workbench.shopId);
    setActiveWorkbench(workbench.id);
    void updateDust.mutateAsync({ id: workbench.id, date: new Date() });
  };

  if (hasError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          title="Couldn't load this workshop"
          description="The project record is still here, but the overview could not assemble it right now."
          className="w-full max-w-xl"
        />
      </div>
    );
  }

  return (
    <div className="workshop-page" data-testid="workbench-canvas">
      <div className="workshop-header">
        <div>
          <h1 className="workshop-title">My Workshop</h1>
          <p className="workshop-subtitle">A place for projects, experiments, and ideas.</p>
          <div className="mt-6">
            <AnimatedButton
              type="button"
              onClick={() => handleCreateProject()}
              variant="surface"
              className="border-dashed bg-[var(--ui-bg-card)]"
            >
              <Plus className="h-4 w-4" />
              New Project
            </AnimatedButton>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="workshop-grid">
          <SkeletonBlock className="col-span-4 h-80 rounded-[var(--ui-radius-xl)]" />
          <SkeletonBlock className="col-span-4 h-72 rounded-[var(--ui-radius-xl)]" />
          <SkeletonBlock className="col-span-4 h-80 rounded-[var(--ui-radius-xl)]" />
        </div>
      ) : shops.length === 0 ? (
        <div className="flex min-h-[26rem] items-center justify-center">
          <EmptyState
            title="Your workshop is empty"
            description="Create your first shop and start documenting what you are making."
            className="w-full max-w-xl"
          />
        </div>
      ) : (
        <div className="workshop-grid">
          {shops.map((shop, index) => (
            <ShopBench
              key={shop.id}
              shop={shop}
              projects={projectsByShop[shop.id] ?? []}
              itemCounts={itemCounts}
              index={index}
              active={shop.id === shopId}
              onCreateProject={() => handleCreateProject(shop.id)}
              onOpenProject={handleOpenProject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
