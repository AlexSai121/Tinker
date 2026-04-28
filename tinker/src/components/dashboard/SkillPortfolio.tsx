import React from "react";
import { Download, FolderOpen, Sparkles } from "lucide-react";
import { useAllSkills, useSkillsDueForReview } from "../../hooks/useSkills";
import { useAllWorkbenches } from "../../hooks/useWorkbenches";
import { downloadSimplePdf } from "../../utils/pdf";
import { getSkillReviewCountdown } from "../../utils/skillLifecycle";
import { EmptyState } from "../shared/EmptyState";
import { SkeletonBlock } from "../shared/Skeleton";
import { EvidencePreview } from "../shared/EvidencePreview";
import { MetricCard, MetricGrid, Page, PageHeader, Panel } from "../shared/Layout";

export function SkillPortfolio() {
  const { data: skills = [], isLoading: skillsLoading, isError } = useAllSkills();
  const { data: workbenches = [], isLoading: benchesLoading } = useAllWorkbenches();
  const { data: dueSkills = [] } = useSkillsDueForReview();

  const workbenchNames = new Map(workbenches.map((workbench) => [workbench.id, workbench.name]));
  const sortedSkills = skills
    .slice()
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  const ownedSkills = sortedSkills
    .filter((skill) => skill.status === "owned")
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  const practicedOrOwnedSkills = sortedSkills.filter((skill) => skill.status === "practiced" || skill.status === "owned");
  const statusCounts = {
    exposed: sortedSkills.filter((skill) => skill.status === "exposed").length,
    attempted: sortedSkills.filter((skill) => skill.status === "attempted").length,
    practiced: sortedSkills.filter((skill) => skill.status === "practiced").length,
    owned: ownedSkills.length,
  };

  const handlePdfExport = () => {
    const lines = sortedSkills.map((skill) => {
      const projectName = skill.workbenchId ? workbenchNames.get(skill.workbenchId) ?? "Unknown project" : "No project";
      const evidenceProject = skill.evidenceWorkbenchId ? workbenchNames.get(skill.evidenceWorkbenchId) ?? "Unknown project" : projectName;
      return [
        skill.name,
        `Status: ${skill.status}`,
        `Origin project: ${projectName}`,
        `Evidence project: ${evidenceProject}`,
        `Last evidence: ${new Date(skill.lastEvidenceAt ?? skill.updatedAt).toLocaleDateString()}`,
        `Evidence note: ${skill.evidence ?? "No note recorded."}`,
        "",
      ];
    }).flat();

    const pages: string[][] = [];
    for (let index = 0; index < lines.length; index += 32) {
      pages.push(lines.slice(index, index + 32));
    }

    if (pages.length === 0) {
      pages.push(["Tinker Skill Portfolio", "No tracked skills yet."]);
    } else {
      pages[0] = ["Tinker Skill Portfolio", "", ...pages[0]];
    }

    downloadSimplePdf(`tinker-skill-portfolio-${new Date().toISOString().slice(0, 10)}.pdf`, pages);
  };

  if (skillsLoading || benchesLoading) {
    return (
      <div className="grid h-full gap-4 p-6 lg:grid-cols-2 xl:grid-cols-3">
        <SkeletonBlock className="h-48 w-full rounded-lg" />
        <SkeletonBlock className="h-48 w-full rounded-lg" />
        <SkeletonBlock className="h-64 w-full rounded-lg" />
        <SkeletonBlock className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState title="Portfolio unavailable" description="The mastery dashboard could not load right now." className="w-full max-w-xl" />
      </div>
    );
  }

  return (
    <Page>
      <PageHeader
        title="Skill Portfolio"
        description="Proof that practice stuck long enough to become something you can carry forward."
        actions={
        <button type="button" onClick={handlePdfExport} className="btn btn-primary inline-flex items-center gap-2 self-start shrink-0">
          <Download className="h-4 w-4" />
          Export PDF
        </button>
        }
      />

      <MetricGrid className="mb-6 md:grid-cols-3">
        <MetricCard label="Total skills tracked" value={sortedSkills.length} icon={<Sparkles className="h-4 w-4 text-[var(--ui-accent)]" />} />
        <MetricCard label="Practiced or owned" value={practicedOrOwnedSkills.length} icon={<FolderOpen className="h-4 w-4 text-[var(--ui-text-2)]" />} />
        <MetricCard label="Reviews due" value={dueSkills.length} icon={<Download className="h-4 w-4 text-[var(--ui-accent)]" />} />
      </MetricGrid>

      <Panel className="mb-6" title="Status spread">
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="ui-panel-muted p-3">
            <div className="ui-kicker">Exposed</div>
            <div className="mt-2 text-2xl font-semibold text-[var(--ui-text-1)]">{statusCounts.exposed}</div>
          </div>
          <div className="ui-panel-muted p-3">
            <div className="ui-kicker">Attempted</div>
            <div className="mt-2 text-2xl font-semibold text-[var(--ui-text-1)]">{statusCounts.attempted}</div>
          </div>
          <div className="ui-panel-muted p-3">
            <div className="ui-kicker">Practiced</div>
            <div className="mt-2 text-2xl font-semibold text-[var(--ui-text-1)]">{statusCounts.practiced}</div>
          </div>
          <div className="ui-panel-muted p-3">
            <div className="ui-kicker">Owned</div>
            <div className="mt-2 text-2xl font-semibold text-[var(--ui-text-1)]">{statusCounts.owned}</div>
          </div>
        </div>
      </Panel>

      {dueSkills.length > 0 && (
      <Panel className="mb-6 border-[rgba(204,120,92,0.28)] bg-[var(--ui-accent-soft)]" title="30-day reminders">
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {dueSkills.map((skill) => {
              const countdown = getSkillReviewCountdown(skill);
              return (
                <div key={skill.id} className="ui-panel-muted p-3">
                  <div className="text-sm font-medium text-[var(--ui-text-1)]">{skill.name}</div>
                  <div className="mt-1 text-xs text-[var(--ui-text-3)]">{countdown?.label ?? "Review ready"}</div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {sortedSkills.length === 0 ? (
        <EmptyState
          title="No skills tracked yet"
          description="Add skills from project views and this portfolio will start to reflect progress across your workshop."
          className="min-h-[320px]"
        />
      ) : (
        <div className="space-y-6">
          {ownedSkills.length > 0 && (
            <section>
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-[var(--ui-text-1)]">Owned evidence</h2>
                <p className="mt-1 text-xs text-[var(--ui-text-3)]">Skills that have survived practice and the follow-up proof window.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {ownedSkills.map((skill) => {
                  const originProject = skill.workbenchId ? workbenchNames.get(skill.workbenchId) ?? "Unknown project" : "No project";
                  const evidenceProject = skill.evidenceWorkbenchId ? workbenchNames.get(skill.evidenceWorkbenchId) ?? "Unknown project" : originProject;
                  return (
                    <article key={skill.id} className="ui-panel p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-lg font-semibold text-[var(--ui-text-1)]">{skill.name}</h2>
                          <p className="mt-1 text-xs uppercase text-[var(--ui-success)]">Owned</p>
                        </div>
                        <div className="text-right text-xs text-[var(--ui-text-3)]">
                          <div>{originProject}</div>
                          <div>Verified in {evidenceProject}</div>
                        </div>
                      </div>
                      <div className="mt-4 space-y-3">
                        {skill.evidenceMediaPath ? (
                          <EvidencePreview path={skill.evidenceMediaPath} />
                        ) : (
                        <div className="rounded-lg border border-dashed border-[var(--ui-border)] px-3 py-6 text-center text-sm text-[var(--ui-text-3)]">No evidence file attached</div>
                        )}
                        <p className="text-sm text-[var(--ui-text-2)]">{skill.evidence ?? "No evidence note recorded."}</p>
                        <div className="text-xs text-[var(--ui-text-3)]">Last updated {new Date(skill.lastEvidenceAt ?? skill.updatedAt).toLocaleDateString()}</div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          <section>
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-[var(--ui-text-1)]">All tracked skills</h2>
              <p className="mt-1 text-xs text-[var(--ui-text-3)]">A cross-project view of what is emerging, what is practiced, and what still needs proof.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sortedSkills.map((skill) => {
                const originProject = skill.workbenchId ? workbenchNames.get(skill.workbenchId) ?? "Unknown project" : "No project";
                const evidenceProject = skill.evidenceWorkbenchId ? workbenchNames.get(skill.evidenceWorkbenchId) ?? "Unknown project" : originProject;
                const countdown = getSkillReviewCountdown(skill);
                return (
                  <article key={skill.id} className="ui-panel p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-[var(--ui-text-1)]">{skill.name}</h3>
                        <p className="mt-1 text-xs uppercase text-[var(--ui-accent)]">{skill.status}</p>
                      </div>
                      <div className="text-right text-xs text-[var(--ui-text-3)]">
                        <div>{originProject}</div>
                        <div>Evidence in {evidenceProject}</div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {skill.evidenceMediaPath ? (
                        <EvidencePreview path={skill.evidenceMediaPath} compact />
                      ) : (
                        <div className="rounded-lg border border-dashed border-[var(--ui-border)] px-3 py-4 text-center text-xs text-[var(--ui-text-3)]">
                          No evidence file attached
                        </div>
                      )}
                      <p className="text-sm text-[var(--ui-text-2)]">{skill.evidence ?? "No evidence note recorded yet."}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-[var(--ui-text-3)]">
                        <span>Updated {new Date(skill.lastEvidenceAt ?? skill.updatedAt).toLocaleDateString()}</span>
                        {countdown && <span>{countdown.shortLabel}</span>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </Page>
  );
}
