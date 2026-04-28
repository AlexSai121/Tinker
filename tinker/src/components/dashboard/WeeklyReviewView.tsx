import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Library, Link2, Move, Sparkles, TriangleAlert } from "lucide-react";
import { useScarMap } from "../../hooks/useScarsMap";
import { useDecayingBridges } from "../../hooks/useBridges";
import { useSkillsDueForReview } from "../../hooks/useSkills";
import { useStaleLockerItems } from "../../hooks/useLocker";
import { useAllItems } from "../../hooks/useItems";
import { useAllWorkbenches } from "../../hooks/useWorkbenches";
import { useCompleteWeeklyReview, useWeeklyReviewMeta } from "../../hooks/useWeeklyReview";
import { useUiStore } from "../../stores/uiStore";
import { EmptyState } from "../shared/EmptyState";
import { SkeletonBlock } from "../shared/Skeleton";
import { Page, PageHeader, Panel } from "../shared/Layout";

const REVIEW_STEPS = [
  { id: "scar-map", title: "Scar Map Check", icon: TriangleAlert },
  { id: "bridges", title: "Bridge Reinforcement", icon: Link2 },
  { id: "mastery", title: "Mastery Audit", icon: Sparkles },
  { id: "locker", title: "Locker Cleanup", icon: Library },
  { id: "reorg", title: "Shop Reorganization", icon: Move },
] as const;

function getWeeklyWindowStart() {
  const start = new Date();
  start.setDate(start.getDate() - 7);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function WeeklyReviewView() {
  const [stepIndex, setStepIndex] = useState(0);
  const setViewMode = useUiStore((state) => state.setViewMode);
  const { data: scarMap, isLoading: scarLoading } = useScarMap({ failureType: "all", from: getWeeklyWindowStart(), to: new Date() });
  const { data: decayingBridges = [], isLoading: bridgesLoading } = useDecayingBridges();
  const { data: dueSkills = [], isLoading: skillsLoading } = useSkillsDueForReview();
  const { data: staleLockerItems = [], isLoading: lockerLoading } = useStaleLockerItems();
  const { data: workbenches = [], isLoading: benchesLoading } = useAllWorkbenches();
  const { data: allItems = [], isLoading: itemsLoading } = useAllItems();
  const { due, meta, nextScheduledDate } = useWeeklyReviewMeta();
  const completeReview = useCompleteWeeklyReview();

  const overgrownProjects = useMemo(() => {
    const counts = allItems.reduce<Record<string, number>>((map, item) => {
      map[item.workbenchId] = (map[item.workbenchId] ?? 0) + 1;
      return map;
    }, {});

    return workbenches
      .map((workbench) => ({ workbench, count: counts[workbench.id] ?? 0 }))
      .filter((entry) => entry.count >= 20)
      .sort((left, right) => right.count - left.count);
  }, [allItems, workbenches]);

  const steps = [
    {
      summary: scarLoading ? null : `${scarMap?.summary.totalScars ?? 0} scars across ${scarMap?.summary.totalAttempts ?? 0} attempts this week.`,
      actionLabel: "Open Scar Map",
      onAction: () => setViewMode("scarMap"),
      content: scarLoading ? (
        <SkeletonBlock className="h-40 w-full rounded-lg" />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[var(--ui-text-2)]">Look for repeated failure patterns before they harden into habits.</p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="ui-panel-muted px-4 py-3">
              <div className="ui-kicker">Scars</div>
              <div className="mt-2 text-2xl font-semibold text-[var(--ui-text-1)]">{scarMap?.summary.totalScars ?? 0}</div>
            </div>
            <div className="ui-panel-muted px-4 py-3">
              <div className="ui-kicker">Attempts</div>
              <div className="mt-2 text-2xl font-semibold text-[var(--ui-text-1)]">{scarMap?.summary.totalAttempts ?? 0}</div>
            </div>
            <div className="ui-panel-muted px-4 py-3">
              <div className="ui-kicker">Rate</div>
              <div className="mt-2 text-2xl font-semibold text-[var(--ui-text-1)]">{Math.round((scarMap?.summary.failureRate ?? 0) * 100)}%</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      summary: bridgesLoading ? null : `${decayingBridges.length} bridge${decayingBridges.length === 1 ? "" : "s"} need a still-true check.`,
      actionLabel: "Open Constellation",
      onAction: () => setViewMode("constellation"),
      content: bridgesLoading ? (
        <SkeletonBlock className="h-40 w-full rounded-lg" />
      ) : decayingBridges.length === 0 ? (
        <EmptyState title="No fading bridges" description="Nothing has drifted into the dormant zone yet." className="min-h-48" />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[var(--ui-text-2)]">Reinforce the connections worth keeping before the graph gets stale.</p>
          <div className="grid gap-3">
            {decayingBridges.slice(0, 4).map((bridge) => (
              <div key={bridge.id} className="ui-panel-muted px-4 py-3 text-sm text-[var(--ui-text-2)]">
                {bridge.note}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      summary: skillsLoading ? null : `${dueSkills.length} skill${dueSkills.length === 1 ? "" : "s"} are up for review.`,
      actionLabel: "Open Portfolio",
      onAction: () => setViewMode("portfolio"),
      content: skillsLoading ? (
        <SkeletonBlock className="h-40 w-full rounded-lg" />
      ) : dueSkills.length === 0 ? (
        <EmptyState title="No reviews due" description="Your skill evidence is caught up for now." className="min-h-48" />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[var(--ui-text-2)]">Check the skills that need fresh proof before they slide backward.</p>
          <div className="grid gap-3">
            {dueSkills.slice(0, 5).map((skill) => (
              <div key={skill.id} className="ui-panel-muted px-4 py-3">
                <div className="text-sm font-medium text-[var(--ui-text-1)]">{skill.name}</div>
                <div className="mt-1 text-xs uppercase text-[var(--ui-accent)]">{skill.status}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      summary: lockerLoading ? null : `${staleLockerItems.length} locker item${staleLockerItems.length === 1 ? "" : "s"} are stale or due.`,
      actionLabel: "Open Locker",
      onAction: () => setViewMode("locker"),
      content: lockerLoading ? (
        <SkeletonBlock className="h-40 w-full rounded-lg" />
      ) : staleLockerItems.length === 0 ? (
        <EmptyState title="Locker looks clean" description="Nothing urgent is waiting in the staging area." className="min-h-48" />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[var(--ui-text-2)]">Decide what gets rescued into real work and what should leave the active queue.</p>
          <div className="grid gap-3">
            {staleLockerItems.slice(0, 5).map((item) => (
              <div key={item.id} className="ui-panel-muted px-4 py-3">
                <div className="text-sm font-medium text-[var(--ui-text-1)]">{item.title}</div>
                <div className="mt-1 text-xs uppercase text-[var(--ui-danger)]">{item.type}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      summary: benchesLoading || itemsLoading ? null : `${overgrownProjects.length} project${overgrownProjects.length === 1 ? "" : "s"} could use reorganization.`,
      actionLabel: "Return to Canvas",
      onAction: () => setViewMode("workbench"),
      content: benchesLoading || itemsLoading ? (
        <SkeletonBlock className="h-40 w-full rounded-lg" />
      ) : overgrownProjects.length === 0 ? (
        <EmptyState title="Workbench sprawl is under control" description="Nothing looks overgrown right now." className="min-h-48" />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[var(--ui-text-2)]">These projects have enough surface area that they may want a split or a cleanup pass.</p>
          <div className="grid gap-3">
            {overgrownProjects.slice(0, 5).map(({ workbench, count }) => (
              <div key={workbench.id} className="ui-panel-muted px-4 py-3">
                <div className="text-sm font-medium text-[var(--ui-text-1)]">{workbench.name}</div>
                <div className="mt-1 text-xs uppercase text-[var(--ui-text-3)]">{count} items</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  const currentStep = REVIEW_STEPS[stepIndex];
  const currentContent = steps[stepIndex];

  return (
    <Page>
      <PageHeader
        title="Weekly Review"
        description="A five-step pass to keep failures, bridges, mastery, and clutter moving in the right direction."
        actions={
        <div className={`shrink-0 rounded-[var(--ui-radius-md)] border px-4 py-3 text-sm ${due ? "border-[rgba(204,120,92,0.3)] bg-[var(--ui-accent-soft)] text-[var(--ui-accent)]" : "border-[var(--ui-border)] bg-[var(--ui-surface-1)] text-[var(--ui-text-2)]"}`}>
          {due
            ? `Review due now. Last completed ${meta.lastCompletedAt ? new Date(meta.lastCompletedAt).toLocaleDateString() : "never"}.`
            : `Next review on ${nextScheduledDate.toLocaleDateString()}.`}
        </div>
        }
      />

      <div className="mb-6 grid gap-3 md:grid-cols-5">
        {REVIEW_STEPS.map((step, index) => {
          const Icon = step.icon;
          const active = index === stepIndex;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setStepIndex(index)}
              className={`rounded-[var(--ui-radius-lg)] border px-4 py-4 text-left transition-colors ${active ? "border-[rgba(204,120,92,0.45)] bg-[var(--ui-accent-soft)] text-[var(--ui-accent)]" : "border-[var(--ui-border)] bg-[var(--ui-surface-1)] text-[var(--ui-text-2)] hover:border-[var(--ui-border-strong)] hover:text-[var(--ui-text-1)]"}`}
              data-testid={`review-step-${step.id}`}
            >
              <Icon className="h-4 w-4" />
              <div className="mt-3 text-sm font-medium">{index + 1}. {step.title}</div>
            </button>
          );
        })}
      </div>

      <Panel bodyClassName="p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--ui-text-1)]">{currentStep.title}</h2>
            {currentContent.summary && <p className="mt-1 text-sm text-[var(--ui-text-2)]">{currentContent.summary}</p>}
          </div>
          <button type="button" onClick={currentContent.onAction} className="btn btn-ghost self-start">
            {currentContent.actionLabel}
          </button>
        </div>

        <div className="mt-5">{currentContent.content}</div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
            disabled={stepIndex === 0}
            className="btn btn-ghost inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex gap-3">
            {stepIndex < REVIEW_STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStepIndex((current) => Math.min(REVIEW_STEPS.length - 1, current + 1))}
                className="btn btn-primary inline-flex items-center gap-2"
                data-testid="btn-review-next"
              >
                Next Step
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void completeReview.mutateAsync()}
                disabled={completeReview.isPending}
                className="btn btn-primary inline-flex items-center gap-2"
                data-testid="btn-complete-weekly-review"
              >
                <CheckCircle2 className="h-4 w-4" />
                {completeReview.isPending ? "Completing..." : "Mark Review Complete"}
              </button>
            )}
          </div>
        </div>
      </Panel>
    </Page>
  );
}
