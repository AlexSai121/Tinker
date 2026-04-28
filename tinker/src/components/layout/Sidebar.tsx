import React, { useEffect, useMemo, useState } from "react";
import {
  Archive,
  ChevronDown,
  ChevronRight,
  Folder,
  LayoutGrid,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useUiStore } from "../../stores/uiStore";
import { useDeleteShop, useShops, useUpdateShop } from "../../hooks/useShops";
import {
  useAllWorkbenches,
  useArchiveWorkbench,
  useDeleteWorkbench,
  useUpdateWorkbench,
  useWorkbenches,
} from "../../hooks/useWorkbenches";
import { useAllItems } from "../../hooks/useItems";
import { cn } from "../../utils/cn";
import type { Shop } from "../../types";
import { EmptyState } from "../shared/EmptyState";
import { SkeletonBlock } from "../shared/Skeleton";
import { decodeStructuredItemContent } from "../../utils/itemContent";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { AnimatedButton } from "../shared/AnimatedButton";
import { SmartTooltip } from "../shared/SmartTooltip";
import { useAppSetting, useUpsertAppSetting } from "../../hooks/useAppSettings";
import { parsePreferences } from "../../utils/preferences";

function SidebarMenu({
  align = "right",
  children,
}: {
  align?: "left" | "right";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "absolute top-full z-40 mt-2 min-w-44 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] p-1 shadow-[var(--ui-shadow-2)] glass-panel",
        align === "right" ? "right-0" : "left-0"
      )}
    >
      {children}
    </div>
  );
}

function SidebarMenuButton({
  children,
  onClick,
  tone = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
        tone === "danger"
          ? "text-[var(--ui-danger)] hover:bg-[var(--ui-danger-soft)]"
          : "text-[var(--ui-text-2)] hover:bg-[var(--ui-surface-2)] hover:text-[var(--ui-text-1)]"
      )}
    >
      {children}
    </button>
  );
}

function ShopAccordion({
  shop,
}: {
  shop: Shop;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const [openWorkbenchMenuId, setOpenWorkbenchMenuId] = useState<string | null>(null);
  const { data: workbenches, isLoading, isError } = useWorkbenches(shop.id);
  const activeWorkbenchId = useUiStore((s) => s.activeWorkbenchId);
  const activeShopId = useUiStore((s) => s.activeShopId);
  const setActiveWorkbench = useUiStore((s) => s.setActiveWorkbench);
  const setActiveShop = useUiStore((s) => s.setActiveShop);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const setViewMode = useUiStore((s) => s.setViewMode);
  const openModal = useUiStore((s) => s.openModal);
  const updateShop = useUpdateShop();
  const deleteShop = useDeleteShop();
  const updateWorkbench = useUpdateWorkbench();
  const deleteWorkbench = useDeleteWorkbench();
  const archiveWorkbench = useArchiveWorkbench();
  const { isTabletLayout } = useResponsiveLayout();

  useEffect(() => {
    if (activeShopId === shop.id) {
      setIsOpen(true);
    }
  }, [activeShopId, shop.id]);

  const shouldCollapseSidebar = isTabletLayout;

  const handleOpenWorkbench = (workbenchId: string) => {
    setActiveShop(shop.id);
    setActiveWorkbench(workbenchId);
    if (shouldCollapseSidebar) {
      setSidebarOpen(false);
    }
  };

  const handleRenameShop = async () => {
    setShopMenuOpen(false);
    const nextName = window.prompt("Rename workshop", shop.name)?.trim();
    if (!nextName || nextName === shop.name) {
      return;
    }

    await updateShop.mutateAsync({
      id: shop.id,
      data: { name: nextName },
    });
  };

  const handleDeleteShop = async () => {
    setShopMenuOpen(false);
    if (!window.confirm(`Delete the "${shop.name}" workshop and everything inside it?`)) {
      return;
    }

    await deleteShop.mutateAsync(shop.id);
    if (activeShopId === shop.id) {
      setActiveShop(null);
      setSidebarOpen(true);
    }
  };

  const handleRenameWorkbench = async (workbenchId: string, currentName: string) => {
    setOpenWorkbenchMenuId(null);
    const nextName = window.prompt("Rename project", currentName)?.trim();
    if (!nextName || nextName === currentName) {
      return;
    }

    await updateWorkbench.mutateAsync({
      id: workbenchId,
      data: { name: nextName },
    });
  };

  const handleArchiveWorkbench = async (workbenchId: string) => {
    setOpenWorkbenchMenuId(null);
    await archiveWorkbench.mutateAsync(workbenchId);
  };

  const handleDeleteWorkbench = async (workbenchId: string, name: string) => {
    setOpenWorkbenchMenuId(null);
    if (!window.confirm(`Delete the "${name}" project?`)) {
      return;
    }

    await deleteWorkbench.mutateAsync(workbenchId);
    if (activeWorkbenchId === workbenchId) {
      setActiveShop(shop.id);
      setViewMode("workbench");
    }
  };

  return (
    <div className="mb-2">
      <div
        className={cn(
          "group flex items-center gap-1 rounded-[var(--ui-radius-lg)] px-1 py-1 transition-colors",
          activeShopId === shop.id ? "bg-[var(--ui-surface-2)]" : "hover:bg-[var(--ui-surface-2)]"
        )}
      >
        <button
          type="button"
          className={cn(
            "flex min-w-0 flex-1 items-center rounded-md px-2 py-1.5 text-left transition-colors",
            activeShopId === shop.id ? "font-medium text-[var(--ui-accent)]" : "text-[var(--ui-text-2)]"
          )}
          onClick={() => {
            setIsOpen(!isOpen);
            setActiveShop(shop.id);
          }}
          data-testid={`shop-item-${shop.id}`}
          aria-expanded={isOpen}
        >
          {isOpen ? <ChevronDown size={16} className="mr-1 shrink-0" /> : <ChevronRight size={16} className="mr-1 shrink-0" />}
          <Folder size={16} className="mr-2 shrink-0" />
          <span className="truncate text-sm font-medium">{shop.name}</span>
        </button>

        <SmartTooltip content="Create project">
          <AnimatedButton
            onClick={(event) => {
              event.stopPropagation();
              openModal({ type: "createProject", payload: { shopId: shop.id } });
              if (isTabletLayout) {
                setSidebarOpen(false);
              }
            }}
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            data-testid={`btn-create-workbench-${shop.id}`}
            aria-label="Create project"
          >
            <Plus size={14} />
          </AnimatedButton>
        </SmartTooltip>

        <div className="relative shrink-0">
          <SmartTooltip content="Workshop actions">
            <AnimatedButton
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setShopMenuOpen((current) => !current);
              }}
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              aria-label="Workshop actions"
            >
              <MoreHorizontal size={14} />
            </AnimatedButton>
          </SmartTooltip>
          {shopMenuOpen && (
            <SidebarMenu>
              <SidebarMenuButton onClick={handleRenameShop}>
                <Pencil className="h-4 w-4" />
                Rename Workshop
              </SidebarMenuButton>
              <SidebarMenuButton onClick={() => {
                setShopMenuOpen(false);
                openModal({ type: "createProject", payload: { shopId: shop.id } });
              }}>
                <Plus className="h-4 w-4" />
                Create Project
              </SidebarMenuButton>
              <SidebarMenuButton onClick={handleDeleteShop} tone="danger">
                <Trash2 className="h-4 w-4" />
                Delete Workshop
              </SidebarMenuButton>
            </SidebarMenu>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="ml-6 mt-1 space-y-1">
          {isLoading ? (
            <div className="space-y-2 px-2 py-1">
              <SkeletonBlock className="h-8 w-full" />
              <SkeletonBlock className="h-8 w-5/6" />
            </div>
          ) : isError ? (
            <div className="rounded border border-red-900/40 bg-red-950/10 px-2 py-2 text-xs text-red-300">
              Couldn't load projects for this workshop.
            </div>
          ) : workbenches && workbenches.filter(wb => !wb.name.includes("[ARCHIVED]")).length > 0 ? (
            workbenches.filter(wb => !wb.name.includes("[ARCHIVED]")).map((wb) => (
              <div key={wb.id} className="group relative flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleOpenWorkbench(wb.id)}
                  className={cn(
                    "flex min-w-0 flex-1 items-center rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-[var(--ui-surface-2)]",
                    activeWorkbenchId === wb.id ? "bg-[var(--ui-accent-soft)] font-medium text-[var(--ui-accent)]" : "text-[var(--ui-text-2)]"
                  )}
                  data-testid={`workbench-item-${wb.id}`}
                >
                  <LayoutGrid size={14} className="mr-2 shrink-0 opacity-70" />
                  <span className="truncate">{wb.name}</span>
                </button>

                <div className="relative shrink-0">
                  <AnimatedButton
                    type="button"
                    onClick={() => setOpenWorkbenchMenuId((current) => current === wb.id ? null : wb.id)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                    aria-label="Project actions"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </AnimatedButton>

                  {openWorkbenchMenuId === wb.id && (
                    <SidebarMenu>
                      <SidebarMenuButton onClick={() => handleOpenWorkbench(wb.id)}>
                        <LayoutGrid className="h-4 w-4" />
                        Open Project
                      </SidebarMenuButton>
                      <SidebarMenuButton onClick={() => void handleRenameWorkbench(wb.id, wb.name)}>
                        <Pencil className="h-4 w-4" />
                        Rename Project
                      </SidebarMenuButton>
                      <SidebarMenuButton onClick={() => void handleArchiveWorkbench(wb.id)}>
                        <Archive className="h-4 w-4" />
                        Archive Project
                      </SidebarMenuButton>
                      <SidebarMenuButton onClick={() => void handleDeleteWorkbench(wb.id, wb.name)} tone="danger">
                        <Trash2 className="h-4 w-4" />
                        Delete Project
                      </SidebarMenuButton>
                    </SidebarMenu>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="px-2 py-1 text-xs italic text-[var(--ui-text-3)]">No projects in this workshop yet.</div>
          )}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { data: shops, isLoading, isError } = useShops();
  const { data: preferencesSetting } = useAppSetting("preferences");
  const openModal = useUiStore((s) => s.openModal);
  const setActiveShop = useUiStore((s) => s.setActiveShop);
  const setActiveWorkbench = useUiStore((s) => s.setActiveWorkbench);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const { data: allWorkbenches = [] } = useAllWorkbenches();
  const { data: allItems = [] } = useAllItems();
  const { isTabletLayout } = useResponsiveLayout();
  const preferences = useMemo(
    () => parsePreferences(preferencesSetting?.value),
    [preferencesSetting?.value]
  );

  const recentItems = useMemo(() => {
    const workbenchLookup = new Map(allWorkbenches.map((workbench) => [workbench.id, workbench]));

    return allItems
      .slice()
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .filter((item) => workbenchLookup.has(item.workbenchId))
      .slice(0, 5)
      .map((item) => {
        const structured = decodeStructuredItemContent(item);
        return {
          item,
          label: structured?.title
            ? `${structured.title}: ${structured.content}`.trim()
            : structured?.content ?? item.content,
          workbench: workbenchLookup.get(item.workbenchId),
        };
      });
  }, [allItems, allWorkbenches]);

  return (
    <div className="flex h-full flex-col bg-transparent select-none" data-testid="sidebar">
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--ui-border-muted)] p-4">
        <div>
          <h2 className="font-serif text-2xl leading-none text-[var(--ui-text-1)]">Tinker</h2>
          <p className="mt-2 text-[11px] text-[var(--ui-text-3)]">Workshops, projects, and the latest activity.</p>
        </div>
        <div className="flex items-center gap-1">
          <SmartTooltip content="Create workshop">
            <AnimatedButton
              onClick={() => openModal({ type: "createShop" })}
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-[var(--ui-text-2)] hover:text-[var(--ui-accent)]"
              data-testid="btn-create-shop"
              aria-label="Create workshop"
            >
              <Plus size={18} />
            </AnimatedButton>
          </SmartTooltip>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2" data-testid="shop-list">
        {isLoading ? (
          <div className="space-y-3 p-2">
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
        ) : shops?.length === 0 ? (
          <EmptyState
            title="No workshops yet"
            description="Create one to start mapping projects on the canvas."
            className="m-2"
          />
        ) : (
          shops?.map((shop) => (
            <ShopAccordion
              key={shop.id}
              shop={shop}
            />
          ))
        )}
      </div>

      <div className="border-t border-[var(--ui-border-muted)] p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase text-[var(--ui-text-3)]">Recent Items</h3>
        <div className="space-y-2">
          {recentItems.length === 0 ? (
            <div className="rounded-[var(--ui-radius-sm)] border border-dashed border-[var(--ui-border)] px-3 py-4 text-xs text-[var(--ui-text-3)]">
              New work will show up here once items start landing in projects.
            </div>
          ) : (
            recentItems.map(({ item, label, workbench }) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (!workbench) return;
                  setActiveShop(workbench.shopId);
                  setActiveWorkbench(workbench.id);
                  if (isTabletLayout) {
                    setSidebarOpen(false);
                  }
                }}
                className="block w-full rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-1)] px-3 py-2 text-left transition-colors hover:border-[var(--ui-border-strong)] hover:bg-[var(--ui-surface-2)]"
                data-testid={`sidebar-recent-item-${item.id}`}
              >
                <div className="line-clamp-2 text-sm text-[var(--ui-text-1)]">{label || "Untitled item"}</div>
                <div className="mt-1 truncate text-[11px] uppercase text-[var(--ui-text-3)]">
                  {workbench?.name ?? "Unknown project"}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
