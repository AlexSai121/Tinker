import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUiStore } from "../../stores/uiStore";
import { Sidebar } from "./Sidebar";
import { Toolbar } from "./Toolbar";
import { ModalRoot } from "../modals/ModalRoot";
import { OnboardingTooltip } from "../shared/OnboardingTooltip";
import { TourOverlay } from "../onboarding/TourOverlay";
import { ViewErrorBoundary } from "../shared/ViewErrorBoundary";
import { cn } from "../../utils/cn";
import { useGlobalShortcuts } from "../../hooks/useGlobalShortcuts";
import { useThemeSync } from "../../hooks/useThemeSync";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";

interface AppShellProps {
  children?: React.ReactNode;
}

const SIDEBAR_WIDTH = 240;

export function AppShell({ children }: AppShellProps) {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const sidebarWidth = useUiStore((s) => s.sidebarWidth);
  const setSidebarWidth = useUiStore((s) => s.setSidebarWidth);
  const viewMode = useUiStore((s) => s.viewMode);
  const activeShopId = useUiStore((s) => s.activeShopId);
  const activeWorkbenchId = useUiStore((s) => s.activeWorkbenchId);
  const { isTabletLayout } = useResponsiveLayout();

  const [isResizing, setIsResizing] = React.useState(false);

  useGlobalShortcuts();
  const resolvedTheme = useThemeSync();
  const setResolvedTheme = useUiStore((s) => s.setResolvedTheme);

  React.useEffect(() => {
    setResolvedTheme(resolvedTheme);
  }, [resolvedTheme, setResolvedTheme]);

  const startResizing = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        setSidebarWidth(e.clientX);
      }
    },
    [isResizing, setSidebarWidth]
  );

  React.useEffect(() => {
    if (isResizing) {
      document.body.style.cursor = "col-resize";
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    } else {
      document.body.style.cursor = "";
    }
    return () => {
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  return (
    <div
      className="app-frame flex h-screen w-screen overflow-hidden"
      style={{ "--sidebar-width": `${sidebarOpen && !isTabletLayout ? sidebarWidth : 0}px` } as React.CSSProperties}
      data-testid="app-shell"
    >
      <AnimatePresence>
        {isTabletLayout && sidebarOpen && (
          <motion.button
            key="sidebar-backdrop"
            type="button"
            className="absolute inset-0 z-20 bg-black/45"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
      <aside
        className={cn(
          "studio-rail border-r",
          !isResizing && "transition-all duration-300",
          isTabletLayout
            ? cn(
                "absolute inset-y-0 left-0 z-50 w-[20rem] max-w-[88vw] shadow-[var(--ui-shadow-2)]",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              )
            : cn("relative flex shrink-0 flex-col", sidebarOpen ? "overflow-visible" : "w-0 overflow-hidden border-none")
        )}
        style={!isTabletLayout && sidebarOpen ? { width: sidebarWidth } : undefined}
        data-testid="sidebar-container"
      >
        <ViewErrorBoundary title="Sidebar unavailable" resetKey={`${activeShopId ?? "none"}:${sidebarOpen ? "open" : "closed"}`}>
          <Sidebar />
        </ViewErrorBoundary>
      </aside>

      {!isTabletLayout && sidebarOpen && (
        <div
          className={cn(
            "group relative z-50 w-[2px] cursor-col-resize bg-transparent transition-colors hover:bg-[var(--ui-accent)]",
            isResizing && "bg-[var(--ui-accent)]"
          )}
          onMouseDown={startResizing}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>
      )}

      <main className="flex-1 flex min-w-0 flex-col bg-[var(--ui-surface-0)]">
        <Toolbar />
        <div
          className={cn("relative flex-1 overflow-hidden", isTabletLayout && sidebarOpen && "pointer-events-none")}
          data-testid="main-content"
        >
          <OnboardingTooltip />
          <ViewErrorBoundary
            title="Main view unavailable"
            resetKey={`${viewMode}:${activeShopId ?? "none"}:${activeWorkbenchId ?? "none"}`}
          >
            {children}
          </ViewErrorBoundary>
        </div>
      </main>
      <ModalRoot />
      <TourOverlay />
    </div>
  );
}
