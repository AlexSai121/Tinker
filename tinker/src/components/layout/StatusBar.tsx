import React from "react";
import { ZoomIn, ZoomOut, Save, Layers } from "lucide-react";
import { useCanvasStore } from "../../stores/canvasStore";
import { useUiStore } from "../../stores/uiStore";
import { useItems } from "../../hooks/useItems";
import { useWeeklyReviewMeta } from "../../hooks/useWeeklyReview";

export function StatusBar() {
  const { scale, zoom, resetCamera } = useCanvasStore();
  const viewMode = useUiStore((s) => s.viewMode);
  const activeWorkbenchId = useUiStore((s) => s.activeWorkbenchId);
  const selectedItemId = useUiStore((s) => s.selectedItemId);
  const visibleWorkbenchId = viewMode === "project" ? activeWorkbenchId : null;
  const { data: items, isLoading } = useItems(visibleWorkbenchId || "");
  const { due, nextScheduledDate } = useWeeklyReviewMeta();

  const zoomPercent = Math.round(scale * 100);
  const isWorkbenchView = viewMode === "workbench";
  const isProjectView = viewMode === "project";

  return (
    <footer className="flex h-8 shrink-0 items-center justify-between border-t border-[var(--ui-border-muted)] bg-[var(--ui-surface-1)] px-4 text-xs text-[var(--ui-text-3)]" data-testid="status-bar">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5" data-testid="status-item-count">
          <Layers size={14} />
          <span>
            {visibleWorkbenchId
              ? isLoading
                ? "Loading bench..."
                : selectedItemId
                  ? `1 item selected · ${items?.length || 0} items on bench`
                  : `${items?.length || 0} items on bench`
              : viewMode === "workbench"
                ? "Canvas ready"
                : "No bench selected"}
          </span>
        </div>
        {due ? (
          <div className="ui-status ui-status-warning px-2 py-0.5 text-xs font-medium">
            Weekly review due
          </div>
        ) : (
          <div className="rounded-full px-2 py-0.5 text-xs text-[var(--ui-text-muted)]">
            Next review {nextScheduledDate.toLocaleDateString()}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-1.5" data-testid="status-saved">
          <Save size={14} />
          <span>All changes saved locally</span>
        </div>

        {isWorkbenchView && (
          <div className="flex items-center space-x-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-0)] px-1.5 py-0.5" data-testid="status-zoom-controls">
            <button
              onClick={() => zoom(0.9, window.innerWidth / 2, window.innerHeight / 2)}
              className="rounded-full p-1 transition-colors hover:bg-[var(--ui-surface-4)] hover:text-[var(--ui-text-1)]"
              data-testid="btn-zoom-out"
              aria-label="Zoom Out"
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <button
              onClick={resetCamera}
              className="w-12 text-center font-mono transition-colors hover:text-[var(--ui-text-1)]"
              data-testid="status-zoom-level"
              title="Reset zoom"
            >
              {zoomPercent}%
            </button>
            <button
              onClick={() => zoom(1.1, window.innerWidth / 2, window.innerHeight / 2)}
              className="rounded-full p-1 transition-colors hover:bg-[var(--ui-surface-4)] hover:text-[var(--ui-text-1)]"
              data-testid="btn-zoom-in"
              aria-label="Zoom In"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
          </div>
        )}

        {isProjectView && (
          <div className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-2 py-1 text-[11px] text-[var(--ui-text-2)]">
            Project view pans on drag and zooms with the wheel.
          </div>
        )}
      </div>
    </footer>
  );
}
