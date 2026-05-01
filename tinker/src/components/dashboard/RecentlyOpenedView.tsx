import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { useAllItems } from "../../hooks/useItems";
import { useAllWorkbenches } from "../../hooks/useWorkbenches";
import { useShops } from "../../hooks/useShops";
import { SkeletonBlock } from "../shared/Skeleton";
import { EmptyState } from "../shared/EmptyState";
import { useUiStore } from "../../stores/uiStore";
import { getWorkbenchDisplayName, isWorkbenchArchived } from "../../data/workbenches";
import { decodeStructuredItemContent } from "../../utils/itemContent";
import { Clock3, LayoutGrid } from "lucide-react";

export function RecentlyOpenedView() {
  const { data: shops = [], isLoading: shopsLoading } = useShops();
  const { data: workbenches = [], isLoading: workbenchesLoading } = useAllWorkbenches();
  const { data: items = [], isLoading: itemsLoading } = useAllItems();
  const setActiveShop = useUiStore((s) => s.setActiveShop);
  const setActiveWorkbench = useUiStore((s) => s.setActiveWorkbench);
  const setViewMode = useUiStore((s) => s.setViewMode);

  const isLoading = shopsLoading || workbenchesLoading || itemsLoading;

  const recentItems = useMemo(() => {
    if (isLoading) return [];
    
    // Combine workbenches and items into a single timeline
    const timeline = [];
    
    const shopLookup = new Map(shops.map(s => [s.id, s.name]));
    const workbenchLookup = new Map(workbenches.map(w => [w.id, w]));

    for (const w of workbenches) {
      if (isWorkbenchArchived(w)) continue;
      timeline.push({
        id: `wb-${w.id}`,
        type: 'project',
        title: getWorkbenchDisplayName(w.name),
        description: `Project in ${shopLookup.get(w.shopId) || 'Unknown workshop'}`,
        updatedAt: new Date(w.updatedAt),
        onClick: () => {
          setActiveShop(w.shopId);
          setActiveWorkbench(w.id);
          setViewMode("project");
        }
      });
    }

    for (const item of items) {
      const wb = workbenchLookup.get(item.workbenchId);
      if (!wb || isWorkbenchArchived(wb)) continue;
      
      const structured = decodeStructuredItemContent(item);
      const title = structured?.title || "Note";
      const desc = structured?.content || item.content;

      timeline.push({
        id: `item-${item.id}`,
        type: 'item',
        title,
        description: desc.substring(0, 100) + (desc.length > 100 ? '...' : ''),
        updatedAt: new Date(item.updatedAt),
        onClick: () => {
          setActiveShop(wb.shopId);
          setActiveWorkbench(wb.id);
          setViewMode("project");
        }
      });
    }

    return timeline.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 50);
  }, [isLoading, shops, workbenches, items, setActiveShop, setActiveWorkbench, setViewMode]);

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto w-full space-y-4">
        <SkeletonBlock className="h-12 w-1/3" />
        <SkeletonBlock className="h-24 w-full" />
        <SkeletonBlock className="h-24 w-full" />
        <SkeletonBlock className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[var(--ui-surface-0)] p-8">
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-full bg-[var(--ui-surface-2)] p-3 text-[var(--ui-text-1)] border border-[var(--ui-border)] shadow-sm">
             <Clock3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-serif text-3xl text-[var(--ui-text-1)]">Recently Opened</h1>
            <p className="text-sm text-[var(--ui-text-3)] mt-1">Jump back into your latest projects and notes.</p>
          </div>
        </div>

        {recentItems.length === 0 ? (
          <EmptyState 
             title="No recent activity"
             description="Open or edit projects to see them appear here."
          />
        ) : (
          <div className="space-y-3">
            {recentItems.map(item => (
              <button 
                key={item.id}
                onClick={item.onClick}
                className="w-full text-left ui-row flex items-start gap-4 p-4 hover:border-[var(--ui-accent)] transition-colors group"
              >
                <div className="mt-1 flex-shrink-0 text-[var(--ui-text-3)] group-hover:text-[var(--ui-accent)] transition-colors">
                  <LayoutGrid className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-2">
                    <h3 className="text-[15px] font-semibold text-[var(--ui-text-1)] truncate">{item.title}</h3>
                    <span className="text-xs text-[var(--ui-text-3)] whitespace-nowrap">
                      {formatDistanceToNow(item.updatedAt, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--ui-text-2)] mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
