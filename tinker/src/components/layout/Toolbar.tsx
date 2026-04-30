import { ChevronRight, PanelLeft, Search, Settings } from "lucide-react";
import { useWorkbench } from "../../hooks/useWorkbenches";
import { useUiStore, type ProjectViewMode } from "../../stores/uiStore";
import { cn } from "../../utils/cn";
import { AnimatedButton } from "../shared/AnimatedButton";

const projectTabs: Array<{ value: ProjectViewMode; label: string }> = [
  { value: "board", label: "Board" },
  { value: "timeline", label: "Timeline" },
  { value: "gallery", label: "Gallery" },
];

function getSearchPlaceholder(viewMode: string, projectView: ProjectViewMode) {
  if (viewMode === "project") {
    return projectView === "timeline"
      ? "Search timeline..."
      : projectView === "gallery"
        ? "Search gallery..."
        : "Search project...";
  }

  if (viewMode === "locker") {
    return "Search references...";
  }

  if (viewMode === "constellation") {
    return "Search constellations...";
  }

  return "Search projects...";
}

export function Toolbar() {
  const {
    activeWorkbenchId,
    projectView,
    searchQuery,
    setProjectView,
    setSearchQuery,
    setViewMode,
    toggleSidebar,
    viewMode,
    openModal,
  } = useUiStore();
  const { data: activeWorkbench } = useWorkbench(activeWorkbenchId ?? "");

  return (
    <header
      className="grid h-16 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 border-b border-[var(--ui-border-muted)] px-3 select-none sm:px-5"
      data-testid="toolbar"
    >
      <div className="flex min-w-0 items-center gap-3 text-[15px] font-medium text-[var(--ui-text-2)]">
        <AnimatedButton
          type="button"
          onClick={toggleSidebar}
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          data-testid="btn-toggle-sidebar"
          aria-label="Toggle sidebar"
        >
          <PanelLeft size={18} />
        </AnimatedButton>

        <button
          type="button"
          onClick={() => setViewMode("workbench")}
          className="hidden transition-colors hover:text-[var(--ui-accent)] sm:inline"
        >
          Workshop
        </button>

        {viewMode === "project" && activeWorkbench && (
          <>
            <ChevronRight size={14} className="text-[var(--ui-text-3)]" />
            <span className="truncate text-[var(--ui-text-1)]">{activeWorkbench.name}</span>
          </>
        )}
      </div>

      {viewMode === "project" && (
        <div className="hidden max-w-full items-center overflow-x-auto rounded-[14px] border border-[var(--ui-border)] bg-[var(--ui-surface-2)] p-1 md:flex">
          {projectTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setProjectView(tab.value)}
              className={cn(
                "rounded-[11px] px-3 py-2 text-sm font-medium transition-colors duration-150 lg:px-5",
                projectView === tab.value
                  ? "bg-[var(--ui-surface-1)] text-[var(--ui-text-1)] shadow-[var(--ui-shadow-1)]"
                  : "text-[var(--ui-text-2)] hover:text-[var(--ui-text-1)]"
              )}
              data-testid={`project-tab-${tab.value}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex min-w-0 items-center justify-end gap-3">
        <label className="relative hidden w-[min(24vw,320px)] min-w-48 lg:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ui-text-3)]" />
          <input
            id="global-search-input"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={getSearchPlaceholder(viewMode, projectView)}
            className="input h-10 rounded-[14px] border-[var(--ui-border)] bg-[var(--ui-surface-1)] pl-9 pr-12 text-sm"
            aria-label="Search"
            data-testid="input-global-search"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-[var(--ui-surface-2)] px-2 py-1 text-[10px] font-medium text-[var(--ui-text-3)]">
            Ctrl K
          </span>
        </label>

        <AnimatedButton
          type="button"
          onClick={() => openModal({ type: "settings" })}
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          data-testid="btn-settings"
          aria-label="Settings"
        >
          <Settings size={18} />
        </AnimatedButton>
      </div>
    </header>
  );
}
