import React, { memo, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { List, type RowComponentProps } from "react-window";
import { useItems } from "../../hooks/useItems";
import { useItemMedia } from "../../hooks/useItemMedia";
import { useScars } from "../../hooks/useScars";
import { ITEM_TYPES } from "../../utils/constants";
import { ItemCard } from "./ItemCard";
import { EmptyState } from "../shared/EmptyState";
import { SkeletonBlock } from "../shared/Skeleton";
import { useElementSize } from "../../hooks/useElementSize";
import type { Item } from "../../types";
import { SegmentedTabs } from "../shared/SegmentedTabs";

const CARD_GAP = 16;
const CARD_ROW_HEIGHT = 340;
const VIRTUALIZATION_THRESHOLD = 18;

const ItemCardContainer = memo(function ItemCardContainer({ item }: { item: Item }) {
  const { data: scars = [], isLoading: scarsLoading, isError: scarsError } = useScars(item.id);
  const { data: media = [], isLoading: mediaLoading, isError: mediaError } = useItemMedia(item.id);

  if (scarsLoading || mediaLoading) {
    return <SkeletonBlock className="h-64 w-full rounded-lg" />;
  }

  return <ItemCard item={item} media={mediaError ? [] : media} scars={scarsError ? [] : scars} />;
});

interface VirtualRowData {
  items: Item[];
  columnCount: number;
  cellWidth: number;
}

function VirtualizedRow({ index, style, items, columnCount, cellWidth }: RowComponentProps<VirtualRowData>) {
  const startIndex = index * columnCount;
  const rowItems = items.slice(startIndex, startIndex + columnCount);

  return (
    <div style={style}>
      <div className="flex gap-4 pb-4">
        {rowItems.map((item) => (
          <div key={item.id} style={{ width: cellWidth, minWidth: cellWidth }}>
            <ItemCardContainer item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ItemGrid({ workbenchId }: { workbenchId: string }) {
  const { data: items = [], isLoading, isError } = useItems(workbenchId);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const { ref: gridViewportRef, size: gridViewportSize } = useElementSize<HTMLDivElement>();

  const filteredItems = useMemo(() => {
    let result = [...items];
    if (activeFilter !== "all") {
      result = result.filter(item => item.type === activeFilter);
    }
    
    result.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });
    
    return result;
  }, [items, activeFilter, sortOrder]);
  const columnCount = useMemo(() => {
    if (gridViewportSize.width >= 1200) return 3;
    if (gridViewportSize.width >= 720) return 2;
    return 1;
  }, [gridViewportSize.width]);
  const cellWidth = useMemo(() => {
    if (gridViewportSize.width === 0) {
      return 320;
    }
    return Math.max(260, (gridViewportSize.width - CARD_GAP * (columnCount - 1)) / columnCount);
  }, [columnCount, gridViewportSize.width]);
  const rowCount = Math.ceil(filteredItems.length / columnCount);
  const shouldVirtualize =
    filteredItems.length >= VIRTUALIZATION_THRESHOLD &&
    gridViewportSize.height > 0 &&
    gridViewportSize.width > 0;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 h-full">
        <SkeletonBlock className="h-14 w-full rounded-lg" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SkeletonBlock className="h-64 w-full rounded-lg" />
          <SkeletonBlock className="h-72 w-full rounded-lg" />
          <SkeletonBlock className="h-60 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Couldn't load items"
        description="The project is open, but its item list didn't load cleanly."
        className="h-full"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex flex-col items-center justify-between gap-3 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-1)] p-3 sm:flex-row">
        <SegmentedTabs
          value={activeFilter}
          onChange={setActiveFilter}
          options={[
            { value: "all", label: "All", testId: "filter-all" },
            ...ITEM_TYPES.map((type) => ({
              value: type,
              label: `${type}s`,
              testId: `filter-${type}`,
            })),
          ]}
          size="sm"
          className="w-full sm:w-auto"
        />
        
        <select 
          value={sortOrder} 
          onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
          className="input py-1 text-xs h-auto w-auto min-w-[120px]"
          data-testid="sort-items"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <EmptyState
            title={activeFilter === "all" ? "No items yet" : "No items match this filter"}
            description={
              activeFilter === "all"
                ? "Use the composer on the right to add the first observation, reference, or attempt."
                : "Try a different filter or add a new item of this type."
            }
            className="h-full"
          />
        ) : (
          <div ref={gridViewportRef} className="h-full">
            {shouldVirtualize ? (
              <List
                defaultHeight={gridViewportSize.height}
                overscanCount={2}
                rowComponent={VirtualizedRow}
                rowCount={rowCount}
                rowHeight={CARD_ROW_HEIGHT}
                rowProps={{ items: filteredItems, columnCount, cellWidth }}
                style={{ height: gridViewportSize.height, width: gridViewportSize.width }}
              >
                <div className="pb-4" />
              </List>
            ) : (
              <motion.div
                className="grid auto-rows-max grid-cols-1 gap-4 pb-8 md:grid-cols-2 xl:grid-cols-3"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
                }}
              >
                <AnimatePresence mode="popLayout">
                  {filteredItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      variants={{
                        hidden: { opacity: 0, y: 16, scale: 0.97 },
                        show: { opacity: 1, y: 0, scale: 1 },
                      }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                      <ItemCardContainer item={item} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
