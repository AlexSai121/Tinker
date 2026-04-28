import { useCallback, useMemo, useState } from "react";
import { Archive, ArchiveRestore, Clock3, LibraryBig, Search } from "lucide-react";
import { useAllWorkbenches } from "../../hooks/useWorkbenches";
import {
  useArchiveLockerItem,
  useLockerItems,
  useRescueLockerItem,
  useRestoreLockerItem,
  useStaleLockerItems,
} from "../../hooks/useLocker";
import { useUiStore } from "../../stores/uiStore";
import { LOCKER_ITEM_TYPES } from "../../utils/constants";
import { EmptyState } from "../shared/EmptyState";
import { SkeletonBlock } from "../shared/Skeleton";
import type { LockerItem } from "../../types";
import { useAppSetting } from "../../hooks/useAppSettings";
import { parsePreferences } from "../../utils/preferences";
import { MetricCard, MetricGrid, Page, PageHeader, Panel } from "../shared/Layout";

type LockerTab = "active" | "archived";

function getDaysUntilStale(item: LockerItem, referenceDate: Date = new Date()): number {
  const ms = item.staleDate.getTime() - referenceDate.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function getUrgencyStyles(daysUntilStale: number) {
  if (daysUntilStale <= 2) {
    return {
      border: "border-[rgba(198,69,69,0.34)]",
      background: "bg-[var(--ui-danger-soft)]",
      text: "text-[var(--ui-danger)]",
      label: daysUntilStale <= 0 ? "Stale now" : `${daysUntilStale} day${daysUntilStale === 1 ? "" : "s"} left`,
    };
  }

  if (daysUntilStale <= 5) {
    return {
      border: "border-[rgba(212,160,23,0.34)]",
      background: "bg-[var(--ui-warning-soft)]",
      text: "text-[var(--ui-warning)]",
      label: `${daysUntilStale} days left`,
    };
  }

  return {
    border: "border-[var(--ui-border)]",
    background: "bg-[var(--ui-surface-2)]",
    text: "text-[var(--ui-text-2)]",
    label: `${daysUntilStale} days left`,
  };
}

function matchesLockerSearch(item: LockerItem, query: string): boolean {
  const lowerQuery = query.trim().toLowerCase();
  if (!lowerQuery) {
    return true;
  }

  return [item.title, item.url ?? "", item.whyThisMatters ?? ""].some((value) =>
    value.toLowerCase().includes(lowerQuery)
  );
}

export function LockerView() {
  const [activeTab, setActiveTab] = useState<LockerTab>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | (typeof LOCKER_ITEM_TYPES)[number]>("all");
  const [expandedRescueId, setExpandedRescueId] = useState<string | null>(null);
  const [rescueWorkbenchId, setRescueWorkbenchId] = useState<Record<string, string>>({});
  const [rescueWhy, setRescueWhy] = useState<Record<string, string>>({});
  const [rescueErrors, setRescueErrors] = useState<Record<string, string>>({});
  const { data: lockerItems = [], isLoading, isError } = useLockerItems();
  const { data: staleItems = [] } = useStaleLockerItems();
  const { data: workbenches = [] } = useAllWorkbenches();
  const archiveLockerItem = useArchiveLockerItem();
  const restoreLockerItem = useRestoreLockerItem();
  const rescueLockerItem = useRescueLockerItem();
  const { data: preferencesSetting } = useAppSetting("preferences");
  const preferences = parsePreferences(preferencesSetting?.value);
  const openModal = useUiStore((state) => state.openModal);
  const setActiveWorkbench = useUiStore((state) => state.setActiveWorkbench);
  const setActiveShop = useUiStore((state) => state.setActiveShop);

  const filteredItems = useMemo(() => {
    return lockerItems.filter((item) => {
      const matchesTab = activeTab === "active" ? !item.isArchived : item.isArchived;
      const matchesType = typeFilter === "all" ? true : item.type === typeFilter;
      return matchesTab && matchesType && matchesLockerSearch(item, searchQuery);
    });
  }, [activeTab, lockerItems, searchQuery, typeFilter]);

  const archivedWorkbenches = useMemo(() => workbenches.filter(wb => wb.name.includes("[ARCHIVED]")), [workbenches]);
  const activeItemsCount = useMemo(() => lockerItems.filter((item) => !item.isArchived).length, [lockerItems]);
  const archivedItemsCount = useMemo(() => lockerItems.filter((item) => item.isArchived).length + archivedWorkbenches.length, [lockerItems, archivedWorkbenches]);
  const staleCount = staleItems.length;

  const handleArchive = useCallback(async (itemId: string) => {
    await archiveLockerItem.mutateAsync(itemId);
  }, [archiveLockerItem]);

  const handleRestore = useCallback(async (itemId: string) => {
    await restoreLockerItem.mutateAsync({ id: itemId, staleDays: preferences.behavior.lockerStaleDays });
  }, [preferences.behavior.lockerStaleDays, restoreLockerItem]);

  const handleOpenRescue = useCallback((item: LockerItem) => {
    setExpandedRescueId((current) => (current === item.id ? null : item.id));
    setRescueErrors((current) => ({ ...current, [item.id]: "" }));
    setRescueWhy((current) => ({
      ...current,
      [item.id]: current[item.id] ?? item.whyThisMatters ?? "",
    }));
    setRescueWorkbenchId((current) => ({
      ...current,
      [item.id]: current[item.id] ?? workbenches[0]?.id ?? "",
    }));
  }, [workbenches]);

  const handleRescue = useCallback(async (item: LockerItem) => {
    const workbenchId = rescueWorkbenchId[item.id] ?? "";
    const whyThisMatters = rescueWhy[item.id] ?? item.whyThisMatters ?? "";
    if (!workbenchId) {
      setRescueErrors((current) => ({ ...current, [item.id]: "Choose a project before rescuing this reference." }));
      return;
    }

    try {
      const result = await rescueLockerItem.mutateAsync({
        lockerItemId: item.id,
        workbenchId,
        whyThisMatters,
      });

      const rescuedWorkbench = workbenches.find((workbench) => workbench.id === result.lockerItem.rescuedWorkbenchId);
      if (rescuedWorkbench) {
        setActiveShop(rescuedWorkbench.shopId);
        setActiveWorkbench(rescuedWorkbench.id);
      }
      setRescueErrors((current) => ({ ...current, [item.id]: "" }));
      setExpandedRescueId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "This reference could not be rescued right now.";
      setRescueErrors((current) => ({ ...current, [item.id]: message }));
    }
  }, [rescueLockerItem, rescueWhy, rescueWorkbenchId, setActiveShop, setActiveWorkbench, workbenches]);

  if (isLoading) {
    return (
      <div className="grid h-full gap-4 p-6 lg:grid-cols-3">
        <SkeletonBlock className="h-32 w-full rounded-lg" />
        <SkeletonBlock className="h-32 w-full rounded-lg" />
        <SkeletonBlock className="h-32 w-full rounded-lg" />
        <SkeletonBlock className="h-96 w-full rounded-lg lg:col-span-3" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState title="Locker unavailable" description="The reference locker could not load right now." className="w-full max-w-xl" />
      </div>
    );
  }

  return (
    <Page>
      <PageHeader
        title="Reference Locker"
        description="A holding area for books, videos, articles, and courses that have not earned a project yet."
        actions={
        <button
          type="button"
          onClick={() => openModal({ type: "createLocker" })}
          className="btn btn-primary self-start shrink-0"
          data-testid="btn-open-create-locker"
        >
          Save Reference
        </button>
        }
      />

      <MetricGrid className="mb-6 md:grid-cols-3">
        <MetricCard label="Active" value={activeItemsCount} icon={<LibraryBig className="h-4 w-4 text-[var(--ui-accent)]" />} />
        <MetricCard label="Archived" value={archivedItemsCount} icon={<Archive className="h-4 w-4 text-[var(--ui-text-2)]" />} />
        <MetricCard label="Stale items" value={staleCount} icon={<Clock3 className="h-4 w-4 text-[var(--ui-accent)]" />} />
      </MetricGrid>

      <Panel className="mb-4" bodyClassName="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`btn ${activeTab === "active" ? "btn-primary" : "btn-ghost"}`}
            data-testid="btn-locker-tab-active"
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("archived")}
            className={`btn ${activeTab === "archived" ? "btn-primary" : "btn-ghost"}`}
            data-testid="btn-locker-tab-archived"
          >
            Archived
          </button>
        </div>
        <div className="grid gap-3 xl:grid-cols-[minmax(0,18rem)_12rem]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ui-text-3)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="input pl-9"
              placeholder="Search title, URL, or note"
              data-testid="input-locker-search"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
            className="input"
            data-testid="select-locker-type-filter"
          >
            <option value="all">All source types</option>
            {LOCKER_ITEM_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </Panel>

      {(filteredItems.length === 0 && (activeTab !== "archived" || archivedWorkbenches.length === 0)) ? (
        <EmptyState
          title={activeTab === "active" ? "No active locker items" : "No archived items"}
          description={
            activeTab === "active"
              ? "Save something to the locker from the toolbar and it will land here."
              : "Archived references and projects will show up here."
          }
          className="min-h-[320px]"
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {activeTab === "archived" && archivedWorkbenches.map((wb) => (
            <article key={wb.id} className="ui-panel p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="ui-kicker">Project</div>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--ui-text-1)]">{wb.name.replace("[ARCHIVED]", "").trim()}</h2>
                  {wb.description && <p className="mt-2 text-sm text-[var(--ui-text-2)]">{wb.description}</p>}
                </div>
                <span className="ui-status">Archived</span>
              </div>
              <div className="mt-3 text-xs text-[var(--ui-text-3)]">
                Created {new Date(wb.createdAt).toLocaleDateString()} · Last Opened {new Date(wb.lastOpenedAt ?? wb.createdAt).toLocaleDateString()}
              </div>
            </article>
          ))}
          {filteredItems.map((item) => {
            const daysUntilStale = getDaysUntilStale(item);
            const urgency = getUrgencyStyles(daysUntilStale);
            const isRescueExpanded = expandedRescueId === item.id;

            return (
              <article
                key={item.id}
                className={`ui-panel p-4 ${item.isArchived ? "" : urgency.border}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="ui-kicker">{item.type}</div>
                    <h2 className="mt-1 text-lg font-semibold text-[var(--ui-text-1)]">{item.title}</h2>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noreferrer" className="ui-link mt-2 inline-block text-sm">
                        {item.url}
                      </a>
                    )}
                  </div>
                  {item.isArchived ? (
                    <span className="ui-status">
                      Archived
                    </span>
                  ) : (
                    <span className={`rounded-full border px-2 py-1 text-xs ${urgency.border} ${urgency.background} ${urgency.text}`}>
                      {urgency.label}
                    </span>
                  )}
                </div>

                {item.whyThisMatters && (
                  <div className="mt-3 rounded-[var(--ui-radius-md)] border border-[rgba(93,184,114,0.28)] bg-[var(--ui-success-soft)] px-3 py-3 text-sm text-[var(--ui-text-1)]">
                    <div className="mb-1 text-xs uppercase text-[var(--ui-success)]">Why This Matters</div>
                    {item.whyThisMatters}
                  </div>
                )}

                <div className="mt-3 text-xs text-[var(--ui-text-3)]">
                  Added {new Date(item.createdAt).toLocaleDateString()}
                  {item.isArchived && item.archivedAt ? ` · Archived ${new Date(item.archivedAt).toLocaleDateString()}` : ""}
                </div>

                {activeTab === "active" ? (
                  <div className="mt-4 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenRescue(item)}
                        className="btn btn-primary text-xs"
                        data-testid={`btn-open-rescue-${item.id}`}
                      >
                        Rescue to Project
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleArchive(item.id)}
                        className="btn btn-ghost text-xs"
                        data-testid={`btn-archive-locker-${item.id}`}
                      >
                        Archive Now
                      </button>
                    </div>

                    {isRescueExpanded && (
                      <div className="ui-panel-muted p-3">
                        <div className="grid gap-3">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">Project</label>
                            <select
                              value={rescueWorkbenchId[item.id] ?? ""}
                              onChange={(event) =>
                                setRescueWorkbenchId((current) => ({ ...current, [item.id]: event.target.value }))
                              }
                              className="input"
                              data-testid={`select-rescue-project-${item.id}`}
                            >
                              <option value="">Select a project</option>
                              {workbenches.map((workbench) => (
                                <option key={workbench.id} value={workbench.id}>
                                  {workbench.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">Why This Matters</label>
                            <textarea
                              value={rescueWhy[item.id] ?? ""}
                              onChange={(event) =>
                                setRescueWhy((current) => ({ ...current, [item.id]: event.target.value }))
                              }
                              className="input min-h-24 resize-y"
                              data-testid={`input-rescue-why-${item.id}`}
                            />
                            <p className="mt-1 text-xs text-[var(--ui-text-3)]">At least 10 characters to turn this into a proper reference item.</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => void handleRescue(item)}
                              disabled={rescueLockerItem.isPending || !(rescueWorkbenchId[item.id] ?? "")}
                              className="btn btn-primary text-xs"
                              data-testid={`btn-rescue-locker-${item.id}`}
                            >
                              {rescueLockerItem.isPending ? "Rescuing..." : "Rescue"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpandedRescueId(null)}
                              className="btn btn-ghost text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                          {rescueErrors[item.id] && <p className="text-sm text-red-400">{rescueErrors[item.id]}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {!item.rescuedItemId && (
                      <button
                        type="button"
                        onClick={() => void handleRestore(item.id)}
                        className="btn btn-primary inline-flex items-center gap-2 text-xs"
                        data-testid={`btn-restore-locker-${item.id}`}
                      >
                        <ArchiveRestore className="h-3.5 w-3.5" />
                        Restore
                      </button>
                    )}
                    {item.rescuedWorkbenchId && (
                      <span className="ui-status ui-status-success">
                        Rescued to a project
                      </span>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </Page>
  );
}
