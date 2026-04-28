import React, { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppShell } from "./components/layout/AppShell";
import { EmptyState } from "./components/shared/EmptyState";
import { SkeletonBlock } from "./components/shared/Skeleton";
import { ViewTransition } from "./components/shared/ViewTransition";
import { useUiStore } from "./stores/uiStore";

const WorkbenchCanvas = lazy(() => import("./components/canvas/WorkbenchCanvas").then((module) => ({ default: module.WorkbenchCanvas })));
const ProjectView = lazy(() => import("./components/workbench/ProjectView").then((module) => ({ default: module.ProjectView })));
const ScarMapView = lazy(() => import("./components/dashboard/ScarMapView").then((module) => ({ default: module.ScarMapView })));
const ConstellationView = lazy(() => import("./components/dashboard/ConstellationView").then((module) => ({ default: module.ConstellationView })));
const SkillPortfolio = lazy(() => import("./components/dashboard/SkillPortfolio").then((module) => ({ default: module.SkillPortfolio })));
const LockerView = lazy(() => import("./components/dashboard/LockerView").then((module) => ({ default: module.LockerView })));
const WeeklyReviewView = lazy(() => import("./components/dashboard/WeeklyReviewView").then((module) => ({ default: module.WeeklyReviewView })));
const SearchResultsView = lazy(() => import("./components/dashboard/SearchResultsView").then((module) => ({ default: module.SearchResultsView })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

function AppContent() {
  const viewMode = useUiStore((s) => s.viewMode);
  const activeShopId = useUiStore((s) => s.activeShopId);
  const activeWorkbenchId = useUiStore((s) => s.activeWorkbenchId);
  const searchQuery = useUiStore((s) => s.searchQuery);
  const trimmedSearch = searchQuery.trim();
  const dashboardFallback = (
    <div className="grid h-full gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
      <SkeletonBlock className="h-40 w-full rounded-lg" />
      <SkeletonBlock className="h-56 w-full rounded-lg" />
      <SkeletonBlock className="h-48 w-full rounded-lg" />
    </div>
  );

  if (trimmedSearch.length > 0) {
    return (
      <AppShell>
        <ViewTransition viewKey={`search-${trimmedSearch}`}>
          <Suspense fallback={dashboardFallback}>
            <SearchResultsView query={trimmedSearch} />
          </Suspense>
        </ViewTransition>
      </AppShell>
    );
  }

  // Build a stable key for the ViewTransition
  const viewKey = (() => {
    if (viewMode === "workbench") return `workbench-${activeShopId ?? "none"}`;
    if (viewMode === "project") return `project-${activeWorkbenchId ?? "none"}`;
    return viewMode;
  })();

  const content = (() => {
    if (viewMode === "workbench") {
      if (!activeShopId) {
        return (
          <div className="flex h-full items-center justify-center p-6">
            <EmptyState
              title="Select a workshop to open the canvas"
              description="Pick one from the sidebar or create a new workshop to start placing projects."
              className="w-full max-w-xl"
            />
          </div>
        );
      }

      return (
        <Suspense fallback={dashboardFallback}>
          <WorkbenchCanvas shopId={activeShopId} />
        </Suspense>
      );
    }

    if (viewMode === "project") {
      if (!activeWorkbenchId) {
        return (
          <div className="flex h-full items-center justify-center p-6">
            <EmptyState
              title="Choose a project to open"
              description="Click a workbench card on the canvas or select a project from the sidebar."
              className="w-full max-w-xl"
            />
          </div>
        );
      }

      return (
        <Suspense fallback={dashboardFallback}>
          <ProjectView workbenchId={activeWorkbenchId} />
        </Suspense>
      );
    }

    if (viewMode === "scarMap") {
      return (
        <Suspense fallback={dashboardFallback}>
          <ScarMapView />
        </Suspense>
      );
    }

    if (viewMode === "portfolio") {
      return (
        <Suspense fallback={dashboardFallback}>
          <SkillPortfolio />
        </Suspense>
      );
    }

    if (viewMode === "constellation") {
      return (
        <Suspense fallback={dashboardFallback}>
          <ConstellationView />
        </Suspense>
      );
    }

    if (viewMode === "locker") {
      return (
        <Suspense fallback={dashboardFallback}>
          <LockerView />
        </Suspense>
      );
    }

    if (viewMode === "review") {
      return (
        <Suspense fallback={dashboardFallback}>
          <WeeklyReviewView />
        </Suspense>
      );
    }

    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          title={`${viewMode} view is not wired yet`}
          description="This integration pass keeps the workbench and project flow solid while the other views catch up."
          className="w-full max-w-xl"
        />
      </div>
    );
  })();

  return (
    <AppShell>
      <ViewTransition viewKey={viewKey}>
        {content}
      </ViewTransition>
    </AppShell>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
