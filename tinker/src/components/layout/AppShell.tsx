import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUiStore } from "../../stores/uiStore";
import { Sidebar } from "./Sidebar";
import { Toolbar } from "./Toolbar";
import { StatusBar } from "./StatusBar";
import { ModalRoot } from "../modals/ModalRoot";
import { OnboardingTooltip } from "../shared/OnboardingTooltip";
import { ViewErrorBoundary } from "../shared/ViewErrorBoundary";
import { cn } from "../../utils/cn";
import { useGlobalShortcuts } from "../../hooks/useGlobalShortcuts";
import { useThemeSync } from "../../hooks/useThemeSync";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";

interface AppShellProps {
  children?: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const sidebarWidth = useUiStore((s) => s.sidebarWidth);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const setSidebarWidth = useUiStore((s) => s.setSidebarWidth);
  const viewMode = useUiStore((s) => s.viewMode);
  const activeShopId = useUiStore((s) => s.activeShopId);
  const activeWorkbenchId = useUiStore((s) => s.activeWorkbenchId);
  const { isTabletLayout } = useResponsiveLayout();

  useGlobalShortcuts();
  const resolvedTheme = useThemeSync();
  const setResolvedTheme = useUiStore((s) => s.setResolvedTheme);

  React.useEffect(() => {
    setResolvedTheme(resolvedTheme);
  }, [resolvedTheme, setResolvedTheme]);

  const handleResizePointerDown = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (isTabletLayout) {
      return;
    }

    event.preventDefault();
    const startX = event.clientX;
    const startWidth = sidebarWidth;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      setSidebarWidth(startWidth + (moveEvent.clientX - startX));
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }, [isTabletLayout, setSidebarWidth, sidebarWidth]);

  return (
    <div className="app-frame flex h-screen w-screen overflow-hidden" data-testid="app-shell">
      <AnimatePresence>
        {isTabletLayout && sidebarOpen && (
          <motion.button
            key="sidebar-backdrop"
            type="button"
            className="absolute inset-0 z-20 bg-black/55 backdrop-blur-md"
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
          "studio-rail border-r transition-all duration-300",
          isTabletLayout
            ? cn(
                "absolute inset-y-0 left-0 z-30 w-[20rem] max-w-[88vw] shadow-[var(--ui-shadow-2)]",
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
        {!isTabletLayout && sidebarOpen && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
            className="absolute inset-y-0 right-0 z-40 w-2 cursor-col-resize bg-transparent"
            onPointerDown={handleResizePointerDown}
          >
            <div className="absolute inset-y-6 left-1/2 w-px -translate-x-1/2 rounded-full bg-[var(--ui-border-strong)]" />
          </div>
        )}
      </aside>
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
        <StatusBar />
      </main>
      <ModalRoot />
    </div>
  );
}
