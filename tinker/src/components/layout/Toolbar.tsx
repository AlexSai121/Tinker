import React from "react";
import { Search, Settings, Download, PanelLeft, Layout, Box, Map, Share2, Briefcase, Library, CheckSquare, Plus } from "lucide-react";
import { useSkillsDueForReview } from "../../hooks/useSkills";
import { useStaleLockerItems } from "../../hooks/useLocker";
import { useWeeklyReviewMeta } from "../../hooks/useWeeklyReview";
import { useUiStore, ViewMode } from "../../stores/uiStore";
import { AnimatedButton } from "../shared/AnimatedButton";
import { SegmentedTabs, type SegmentedTabOption } from "../shared/SegmentedTabs";
import { SmartTooltip } from "../shared/SmartTooltip";

export function Toolbar() {
  const { toggleSidebar, viewMode, setViewMode, searchQuery, setSearchQuery, openModal } = useUiStore();
  const { data: dueSkills = [] } = useSkillsDueForReview();
  const { data: staleLockerItems = [] } = useStaleLockerItems();
  const { due: reviewDue } = useWeeklyReviewMeta();
  const attentionBadge = (value: number | string) => (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-accent-soft)] px-1 text-[10px] font-semibold text-[var(--ui-accent)]">
      {value}
    </span>
  );

  const viewModes: SegmentedTabOption<ViewMode>[] = [
    { value: "workbench", icon: <Layout size={16} />, label: <span className="hidden xl:inline">Workbench</span>, testId: "btn-view-workbench" },
    { value: "project", icon: <Box size={16} />, label: <span className="hidden xl:inline">Project</span>, testId: "btn-view-project" },
    { value: "scarMap", icon: <Map size={16} />, label: <span className="hidden xl:inline">Scar Map</span>, testId: "btn-view-scarMap" },
    { value: "constellation", icon: <Share2 size={16} />, label: <span className="hidden xl:inline">Constellation</span>, testId: "btn-view-constellation" },
    {
      value: "portfolio",
      icon: <Briefcase size={16} />,
      label: <span className="hidden xl:inline">Portfolio</span>,
      testId: "btn-view-portfolio",
      badge: dueSkills.length > 0 ? attentionBadge(dueSkills.length) : undefined,
    },
    {
      value: "locker",
      icon: <Library size={16} />,
      label: <span className="hidden xl:inline">Locker</span>,
      testId: "btn-view-locker",
      badge: staleLockerItems.length > 0 ? attentionBadge(staleLockerItems.length) : undefined,
    },
    {
      value: "review",
      icon: <CheckSquare size={16} />,
      label: <span className="hidden xl:inline">Review</span>,
      testId: "btn-view-review",
      badge: reviewDue ? attentionBadge(1) : undefined,
    },
  ];

  return (
    <header className="command-bar flex shrink-0 items-center justify-between border-b px-3 select-none sm:px-4" data-testid="toolbar">
      <div className="flex min-w-0 items-center gap-2">
        <SmartTooltip content="Toggle sidebar">
          <AnimatedButton
            onClick={toggleSidebar}
            variant="ghost"
            size="icon"
            data-testid="btn-toggle-sidebar"
            aria-label="Toggle Sidebar"
          >
            <PanelLeft size={20} />
          </AnimatedButton>
        </SmartTooltip>
        <div className="ml-1 min-w-0 sm:ml-3" data-testid="view-mode-toggle">
          <SegmentedTabs
            value={viewMode}
            onChange={setViewMode}
            options={viewModes}
            className="min-w-0"
          />
        </div>
      </div>

      <div className="ml-4 hidden items-center gap-3 md:flex">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-3)]" />
          <input
            id="global-search-input"
            type="text"
            placeholder="Search Tinker"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input h-10 w-64 rounded-full border-[var(--ui-border-muted)] bg-[var(--ui-surface-0)] pl-9 text-sm"
            data-testid="input-search"
          />
        </div>
        <div className="flex items-center gap-1 border-l border-[var(--ui-border-muted)] pl-3">
          <SmartTooltip content="Save to locker">
            <AnimatedButton
              onClick={() => openModal({ type: "createLocker" })}
              variant="ghost"
              size="icon"
              data-testid="btn-create-locker"
              aria-label="Save to Locker"
            >
              <Plus size={18} />
            </AnimatedButton>
          </SmartTooltip>
          <SmartTooltip content="Export data">
            <AnimatedButton
              onClick={() => openModal({ type: "export" })}
              variant="ghost"
              size="icon"
              data-testid="btn-export"
              aria-label="Export Data"
            >
              <Download size={18} />
            </AnimatedButton>
          </SmartTooltip>
          <SmartTooltip content="Settings">
            <AnimatedButton
              onClick={() => openModal({ type: 'settings' })}
              variant="ghost"
              size="icon"
              data-testid="btn-settings"
              aria-label="Settings"
            >
              <Settings size={18} />
            </AnimatedButton>
          </SmartTooltip>
        </div>
      </div>
    </header>
  );
}
