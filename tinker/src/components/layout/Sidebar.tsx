import { useEffect, useMemo, useState, type ComponentType, type MouseEvent } from "react";
import {
  BookOpen,
  Box,
  CalendarCheck,
  Camera,
  Clock3,
  CodeXml,
  Crosshair,
  House,
  LayoutGrid,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  Wrench,
  Scissors,
  Plug,
  Beaker,
  Trash2,
} from "lucide-react";
import { useShops, useDeleteShop } from "../../hooks/useShops";
import { useAllWorkbenches, useWorkbenches } from "../../hooks/useWorkbenches";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { useUiStore, type ViewMode } from "../../stores/uiStore";
import type { Shop } from "../../types";
import { cn } from "../../utils/cn";
import { AnimatedButton } from "../shared/AnimatedButton";
import { EmptyState } from "../shared/EmptyState";
import { SkeletonBlock } from "../shared/Skeleton";

const shopIconMap = [
  { match: "wood", icon: Scissors },
  { match: "code", icon: CodeXml },
  { match: "electronics", icon: Plug },
  { match: "kitchen", icon: Beaker },
  { match: "studio", icon: Camera },
] as const;

function getShopIcon(name: string) {
  const lowerName = name.toLowerCase();
  return shopIconMap.find((entry) => lowerName.includes(entry.match))?.icon ?? Wrench;
}

function SidebarSection({ label }: { label: string }) {
  return <h3 className="px-3 pb-2 pt-4 text-[10px] font-bold uppercase tracking-widest text-[var(--ui-text-3)]">{label}</h3>;
}

function NavButton({
  active,
  count,
  icon: Icon,
  label,
  onClick,
  testId,
}: {
  active?: boolean;
  count?: number | string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  testId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-[12px] px-3 py-2.5 text-left text-sm transition-colors duration-150",
        active
          ? "bg-[var(--ui-accent-soft)] text-[var(--ui-accent)]"
          : "text-[var(--ui-text-2)] hover:bg-[var(--ui-surface-2)] hover:text-[var(--ui-text-1)]"
      )}
      data-testid={testId}
    >
      <span className="flex min-w-0 items-center gap-3">
        <Icon className="h-[18px] w-[18px] shrink-0" />
        <span className="truncate font-medium">{label}</span>
      </span>
      {count !== undefined && <span className="text-xs text-[var(--ui-text-3)]">{count}</span>}
    </button>
  );
}

function ShopRow({ count, shop }: { count: number; shop: Shop }) {
  const [expanded, setExpanded] = useState(false);
  const { data: workbenches = [], isLoading } = useWorkbenches(shop.id);
  const activeShopId = useUiStore((state) => state.activeShopId);
  const activeWorkbenchId = useUiStore((state) => state.activeWorkbenchId);
  const openModal = useUiStore((state) => state.openModal);
  const setActiveShop = useUiStore((state) => state.setActiveShop);
  const setActiveWorkbench = useUiStore((state) => state.setActiveWorkbench);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const setViewMode = useUiStore((state) => state.setViewMode);
  const { isTabletLayout } = useResponsiveLayout();
  const deleteShop = useDeleteShop();
  const Icon = getShopIcon(shop.name);
  const visibleProjects = workbenches.filter((workbench) => !workbench.name.includes("[ARCHIVED]"));

  useEffect(() => {
    if (activeShopId === shop.id) {
      setExpanded(true);
    }
  }, [activeShopId, shop.id]);

  const handleOpenShop = () => {
    setExpanded((current) => !current);
    setActiveShop(shop.id);
    if (isTabletLayout) {
      setSidebarOpen(false);
    }
  };

  const handleCreateProject = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    openModal({ type: "createProject", payload: { shopId: shop.id } });
    if (isTabletLayout) {
      setSidebarOpen(false);
    }
  };

  const handleDeleteShop = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the workshop "${shop.name}" and all its projects? This cannot be undone.`)) {
      await deleteShop.mutateAsync(shop.id);
      if (activeShopId === shop.id) {
        setActiveShop(null);
        setActiveWorkbench(null);
      }
    }
  };

  return (
    <div>
      <div
        className={cn(
          "group flex items-center rounded-[12px] transition-colors duration-150",
          activeShopId === shop.id ? "bg-[var(--ui-surface-2)]" : "hover:bg-[var(--ui-surface-2)]"
        )}
      >
        <button
          type="button"
          onClick={handleOpenShop}
          className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left text-sm text-[var(--ui-text-2)]"
          data-testid={`shop-item-${shop.id}`}
          aria-expanded={expanded}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" />
          <span className="min-w-0 flex-1 truncate font-medium text-[var(--ui-text-1)]">{shop.name}</span>
          <span className="text-xs text-[var(--ui-text-3)]">{count}</span>
        </button>
        <div className="mr-1 flex items-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <AnimatedButton
            type="button"
            onClick={handleCreateProject}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[var(--ui-text-2)] hover:text-[var(--ui-text-1)]"
            data-testid={`btn-create-workbench-${shop.id}`}
            aria-label={`Create project in ${shop.name}`}
          >
            <Plus size={15} />
          </AnimatedButton>
          <AnimatedButton
            type="button"
            onClick={handleDeleteShop}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#d48c82] hover:bg-[#faeaea] hover:text-[#c45749]"
            data-testid={`btn-delete-shop-${shop.id}`}
            aria-label={`Delete ${shop.name}`}
          >
            <Trash2 size={15} />
          </AnimatedButton>
        </div>
      </div>

      {expanded && (
        <div className="ml-4 mt-1 space-y-1 border-l border-[var(--ui-border-muted)] pl-3">
          {isLoading ? (
            <SkeletonBlock className="h-9 w-full" />
          ) : visibleProjects.length > 0 ? (
            visibleProjects.map((workbench) => (
              <button
                key={workbench.id}
                type="button"
                onClick={() => {
                  setActiveShop(shop.id);
                  setActiveWorkbench(workbench.id);
                  setViewMode("project");
                  if (isTabletLayout) {
                    setSidebarOpen(false);
                  }
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left text-sm transition-colors duration-150",
                  activeWorkbenchId === workbench.id
                    ? "bg-[var(--ui-accent-soft)] text-[var(--ui-accent)]"
                    : "text-[var(--ui-text-2)] hover:bg-[var(--ui-surface-2)] hover:text-[var(--ui-text-1)]"
                )}
                data-testid={`workbench-item-${workbench.id}`}
              >
                <LayoutGrid className="h-4 w-4 shrink-0" />
                <span className="truncate">{workbench.name}</span>
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-xs text-[var(--ui-text-3)]">No projects yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { data: shops = [], isLoading, isError } = useShops();
  const { data: allWorkbenches = [] } = useAllWorkbenches();
  const activeView = useUiStore((state) => state.viewMode);
  const openModal = useUiStore((state) => state.openModal);
  const setViewMode = useUiStore((state) => state.setViewMode);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const { isTabletLayout } = useResponsiveLayout();

  const activeProjects = useMemo(
    () => allWorkbenches.filter((workbench) => !workbench.name.includes("[ARCHIVED]")),
    [allWorkbenches]
  );
  const shopCounts = useMemo(() => {
    return activeProjects.reduce<Record<string, number>>((counts, project) => {
      counts[project.shopId] = (counts[project.shopId] ?? 0) + 1;
      return counts;
    }, {});
  }, [activeProjects]);

  const navigate = (mode: ViewMode) => {
    setViewMode(mode);
    if (isTabletLayout) {
      setSidebarOpen(false);
    }
  };

  return (
    <aside className="flex h-full flex-col select-none" data-testid="sidebar">
      <div className="shrink-0 px-6 pb-4 pt-6">
        <button
          type="button"
          onClick={() => navigate("workbench")}
          className="font-[var(--ui-font-display)] text-3xl font-medium tracking-tight text-[var(--ui-text-1)]"
        >
          tinker
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <nav className="space-y-1">
          <NavButton active={activeView === "workbench"} icon={House} label="Workshop" onClick={() => navigate("workbench")} />
          <NavButton active={activeView === "recentlyOpened"} icon={Clock3} label="Recently Opened" onClick={() => navigate("recentlyOpened" as ViewMode)} />
        </nav>

        <SidebarSection label="Shops" />
        <div className="space-y-1" data-testid="shop-list">
          {isLoading ? (
            <div className="space-y-2 px-2">
              <SkeletonBlock className="h-10 w-full" />
              <SkeletonBlock className="h-10 w-11/12" />
              <SkeletonBlock className="h-10 w-10/12" />
            </div>
          ) : isError ? (
            <EmptyState
              title="Couldn't load workshops"
              description="Try reopening the app or creating a fresh workshop once data is available again."
              className="m-2"
            />
          ) : shops.length === 0 ? (
            <EmptyState title="No workshops yet" description="Create one to start mapping projects." className="m-2" />
          ) : (
            shops.map((shop) => (
              <ShopRow key={shop.id} shop={shop} count={shopCounts[shop.id] ?? 0} />
            ))
          )}
          <button
            type="button"
            onClick={() => openModal({ type: "createShop" })}
            className="mt-2 flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left text-sm text-[var(--ui-text-2)] transition-colors duration-150 hover:bg-[var(--ui-surface-2)] hover:text-[var(--ui-text-1)]"
            data-testid="btn-create-shop"
          >
            <Plus className="h-[18px] w-[18px]" />
            <span className="font-medium">New Shop</span>
          </button>
        </div>

        <SidebarSection label="Insights" />
        <nav className="space-y-1">
          <NavButton
            active={activeView === "scarMap"}
            icon={Crosshair}
            label="Scar Map"
            onClick={() => navigate("scarMap")}
            testId="btn-view-scarMap"
          />
          <NavButton
            active={activeView === "review"}
            icon={CalendarCheck}
            label="Weekly Review"
            onClick={() => navigate("review")}
            testId="btn-view-review"
          />
          <NavButton
            active={activeView === "portfolio"}
            icon={Sparkles}
            label="Skill Portfolio"
            onClick={() => navigate("portfolio")}
            testId="btn-view-portfolio"
          />
          <NavButton
            active={activeView === "constellation"}
            icon={BookOpen}
            label="Constellations"
            onClick={() => navigate("constellation")}
            testId="btn-view-constellation"
          />
        </nav>

        <SidebarSection label="Resources" />
        <nav className="space-y-1">
          <NavButton
            active={activeView === "locker"}
            icon={LayoutGrid}
            label="Reference Locker"
            onClick={() => navigate("locker")}
            testId="btn-view-locker"
          />
        </nav>
      </div>

      <div className="shrink-0 px-6 pb-6">
        <div className="rounded-[16px] border border-[var(--ui-border)] bg-[var(--ui-surface-2)] p-4">
          <p className="font-[var(--ui-font-display)] text-[15px] leading-relaxed text-[var(--ui-text-1)]">
            Quiet progress leaves a trail.
          </p>
          <p className="mt-3 text-xs text-[var(--ui-text-3)]">Keep building.</p>
        </div>

        <AnimatedButton
          type="button"
          onClick={() => openModal({ type: "settings" })}
          variant="ghost"
          size="md"
          className="mt-4 w-full justify-start"
          data-testid="btn-settings-sidebar"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
          Settings
        </AnimatedButton>
      </div>
    </aside>
  );
}
