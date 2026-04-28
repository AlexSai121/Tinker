import { useMemo } from "react";
import { Library, Sparkles, Wrench } from "lucide-react";
import { useAllItems } from "../../hooks/useItems";
import { useLockerItems } from "../../hooks/useLocker";
import { useAllSkills } from "../../hooks/useSkills";
import { useAllWorkbenches } from "../../hooks/useWorkbenches";
import { useShops } from "../../hooks/useShops";
import { useUiStore } from "../../stores/uiStore";
import { decodeStructuredItemContent } from "../../utils/itemContent";
import { EmptyState } from "../shared/EmptyState";
import { SkeletonBlock } from "../shared/Skeleton";
import { Page, PageHeader, Panel } from "../shared/Layout";
import type { Item, LockerItem } from "../../types";

function getItemSearchText(item: Item) {
  const structured = decodeStructuredItemContent(item);
  const parts = [structured?.content ?? item.content];
  if (structured?.whyThisMatters) parts.push(structured.whyThisMatters);
  if (structured?.sourceUrl) parts.push(structured.sourceUrl);
  if (structured?.attemptWhat) parts.push(structured.attemptWhat);
  if (structured?.attemptResult) parts.push(structured.attemptResult);
  if (structured?.attemptTools?.length) parts.push(structured.attemptTools.join(" "));
  return parts.join(" ");
}

function getItemDisplayText(item: Item) {
  const structured = decodeStructuredItemContent(item);
  return structured?.content ?? item.content;
}

function matchesQuery(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

export function SearchResultsView({ query }: { query: string }) {
  const trimmedQuery = query.trim();
  const { data: items = [], isLoading: itemsLoading } = useAllItems();
  const { data: skills = [], isLoading: skillsLoading } = useAllSkills();
  const { data: lockerItems = [], isLoading: lockerLoading } = useLockerItems();
  const { data: workbenches = [], isLoading: workbenchesLoading } = useAllWorkbenches();
  const { data: shops = [], isLoading: shopsLoading } = useShops();
  const setActiveShop = useUiStore((state) => state.setActiveShop);
  const setActiveWorkbench = useUiStore((state) => state.setActiveWorkbench);
  const setViewMode = useUiStore((state) => state.setViewMode);
  const setSearchQuery = useUiStore((state) => state.setSearchQuery);

  const workbenchLookup = useMemo(() => new Map(workbenches.map((workbench) => [workbench.id, workbench])), [workbenches]);
  const shopLookup = useMemo(() => new Map(shops.map((shop) => [shop.id, shop])), [shops]);

  const groupedResults = useMemo(() => {
    if (trimmedQuery.length < 2) {
      return { items: [], skills: [], locker: [] as LockerItem[] };
    }

    return {
      items: items.filter((item) => matchesQuery(getItemSearchText(item), trimmedQuery)),
      skills: skills.filter((skill) => matchesQuery([skill.name, skill.evidence ?? ""].join(" "), trimmedQuery)),
      locker: lockerItems.filter((item) =>
        matchesQuery([item.title, item.url ?? "", item.whyThisMatters ?? ""].join(" "), trimmedQuery)
      ),
    };
  }, [items, lockerItems, skills, trimmedQuery]);

  const isLoading = itemsLoading || skillsLoading || lockerLoading || workbenchesLoading || shopsLoading;
  const totalResults = groupedResults.items.length + groupedResults.skills.length + groupedResults.locker.length;

  const openWorkbench = (workbenchId: string) => {
    const workbench = workbenchLookup.get(workbenchId);
    if (!workbench) return;
    setActiveShop(workbench.shopId);
    setActiveWorkbench(workbenchId);
    setSearchQuery("");
  };

  if (isLoading) {
    return (
      <div className="grid h-full gap-4 p-6 lg:grid-cols-3">
        <SkeletonBlock className="h-48 w-full rounded-lg" />
        <SkeletonBlock className="h-48 w-full rounded-lg" />
        <SkeletonBlock className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (trimmedQuery.length < 2) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          title="Type at least two characters"
          description="Search looks across project items, skills, and the reference locker."
          className="w-full max-w-xl"
        />
      </div>
    );
  }

  if (totalResults === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          title={`No results for "${trimmedQuery}"`}
          description="Try a different term or clear the search to go back to your current view."
          className="w-full max-w-xl"
        />
      </div>
    );
  }

  return (
    <Page>
      <PageHeader
        title="Search Results"
        description={`${totalResults} result${totalResults === 1 ? "" : "s"} across items, skills, and locker references.`}
        actions={
          <button type="button" onClick={() => setSearchQuery("")} className="btn btn-ghost">
            Clear Search
          </button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel>
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--ui-text-1)]">
            <Wrench className="h-4 w-4 text-[var(--ui-accent)]" />
            Items ({groupedResults.items.length})
          </div>
          <div className="space-y-3">
            {groupedResults.items.length === 0 ? (
              <p className="text-sm text-[var(--ui-text-3)]">No matching items.</p>
            ) : (
              groupedResults.items.map((item) => {
                const workbench = workbenchLookup.get(item.workbenchId);
                const shop = workbench ? shopLookup.get(workbench.shopId) : undefined;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openWorkbench(item.workbenchId)}
                    className="w-full rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-4 py-3 text-left transition-colors hover:border-[var(--ui-border-strong)]"
                    data-testid={`search-result-item-${item.id}`}
                  >
                    <div className="ui-kicker">{shop?.name ?? "Unknown workshop"} · {workbench?.name ?? "Unknown project"}</div>
                    <div className="mt-2 text-sm text-[var(--ui-text-1)]">{getItemDisplayText(item)}</div>
                  </button>
                );
              })
            )}
          </div>
        </Panel>

        <Panel>
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--ui-text-1)]">
            <Sparkles className="h-4 w-4 text-[var(--ui-accent)]" />
            Skills ({groupedResults.skills.length})
          </div>
          <div className="space-y-3">
            {groupedResults.skills.length === 0 ? (
              <p className="text-sm text-[var(--ui-text-3)]">No matching skills.</p>
            ) : (
              groupedResults.skills.map((skill) => {
                const workbench = skill.workbenchId ? workbenchLookup.get(skill.workbenchId) : undefined;
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => skill.workbenchId && openWorkbench(skill.workbenchId)}
                    className="w-full rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-4 py-3 text-left transition-colors hover:border-[var(--ui-border-strong)]"
                    data-testid={`search-result-skill-${skill.id}`}
                  >
                    <div className="ui-kicker">{workbench?.name ?? "Unattached skill"}</div>
                    <div className="mt-2 text-sm font-medium text-[var(--ui-text-1)]">{skill.name}</div>
                    <div className="mt-1 text-xs uppercase text-[var(--ui-accent)]">{skill.status}</div>
                    {skill.evidence && <div className="mt-2 text-sm text-[var(--ui-text-2)]">{skill.evidence}</div>}
                  </button>
                );
              })
            )}
          </div>
        </Panel>

        <Panel>
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--ui-text-1)]">
            <Library className="h-4 w-4 text-[var(--ui-accent)]" />
            Locker ({groupedResults.locker.length})
          </div>
          <div className="space-y-3">
            {groupedResults.locker.length === 0 ? (
              <p className="text-sm text-[var(--ui-text-3)]">No matching locker references.</p>
            ) : (
              groupedResults.locker.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setViewMode("locker");
                    setSearchQuery("");
                  }}
                  className="w-full rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-4 py-3 text-left transition-colors hover:border-[var(--ui-border-strong)]"
                  data-testid={`search-result-locker-${item.id}`}
                >
                  <div className="ui-kicker">{item.type}</div>
                  <div className="mt-2 text-sm font-medium text-[var(--ui-text-1)]">{item.title}</div>
                  {item.whyThisMatters && <div className="mt-2 text-sm text-[var(--ui-text-2)]">{item.whyThisMatters}</div>}
                </button>
              ))
            )}
          </div>
        </Panel>
      </div>
    </Page>
  );
}
