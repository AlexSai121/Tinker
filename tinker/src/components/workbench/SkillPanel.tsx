import React, { useState } from "react";
import { nanoid } from "nanoid";
import { CheckCircle2, Circle, Clock3, Flame, Target } from "lucide-react";
import { useCreateSkill, useSkills, useSkillsDueForReview } from "../../hooks/useSkills";
import { useUiStore } from "../../stores/uiStore";
import { cn } from "../../utils/cn";
import { getSkillReviewCountdown } from "../../utils/skillLifecycle";
import { EmptyState } from "../shared/EmptyState";
import { SkeletonBlock } from "../shared/Skeleton";
import { EvidencePreview } from "../shared/EvidencePreview";

const STATUS_ICONS: Record<string, React.ReactNode> = {
  exposed: <Circle className="h-4 w-4 text-[var(--ui-text-3)]" />,
  attempted: <Target className="h-4 w-4 text-[var(--ui-accent)]" />,
  practiced: <Flame className="h-4 w-4 text-[var(--ui-warning)]" />,
  owned: <CheckCircle2 className="h-4 w-4 text-[var(--ui-success)]" />,
};

export function SkillPanel({ workbenchId }: { workbenchId: string }) {
  const { data: skills = [], isLoading, isError } = useSkills(workbenchId);
  const { data: dueSkills = [] } = useSkillsDueForReview();
  const createSkill = useCreateSkill();
  const openModal = useUiStore((s) => s.openModal);
  const [newSkillName, setNewSkillName] = useState("");

  const dueForThisWorkbench = dueSkills.filter((skill) => skill.workbenchId === workbenchId);

  const handleAddSkill = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newSkillName.trim()) return;

    await createSkill.mutateAsync({
      id: nanoid(),
      workbenchId,
      name: newSkillName.trim(),
      status: "exposed",
      evidence: null,
      evidenceMediaPath: null,
      evidenceWorkbenchId: workbenchId,
      lastEvidenceAt: null,
      reviewDueAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    setNewSkillName("");
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-col space-y-3 overflow-hidden rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-1)] p-4">
        <SkeletonBlock className="h-6 w-40" />
        <SkeletonBlock className="h-28 w-full rounded-lg" />
        <SkeletonBlock className="h-28 w-full rounded-lg" />
        <SkeletonBlock className="h-10 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col overflow-hidden rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-1)] p-4">
        <EmptyState title="Couldn't load skills" description="Try reopening this project view." className="h-full border-none bg-transparent px-2" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-1)]">
      <div className="border-b border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-4 py-3">
        <h3 className="font-semibold text-[var(--ui-text-1)]">Skills Developed</h3>
        <p className="mt-1 text-xs text-[var(--ui-text-2)]">Track what this project is teaching, then prove it with evidence.</p>
      </div>

      {dueForThisWorkbench.length > 0 && (
        <div className="border-b border-[rgba(204,120,92,0.28)] bg-[var(--ui-accent-soft)] px-4 py-3 text-xs text-[var(--ui-accent)]">
          {dueForThisWorkbench.length} skill{dueForThisWorkbench.length === 1 ? "" : "s"} ready for the 30-day check.
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {skills.length === 0 ? (
          <EmptyState
            title="No skills tracked yet"
            description="Add the first technique, habit, or capability this project is teaching you."
            className="border-none bg-transparent px-2 py-4"
          />
        ) : (
          skills.map((skill) => {
            const countdown = getSkillReviewCountdown(skill);
            const evidenceLabel = skill.evidence
              ? skill.evidence
              : skill.status === "exposed"
                ? "No evidence yet. Start by noting the first real attempt."
                : "Evidence still needed.";

            return (
              <div key={skill.id} className="rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-2)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-sm font-medium text-[var(--ui-text-1)]">{skill.name}</span>
                    {countdown && (
                    <p className={cn("mt-1 text-xs", countdown.isDue ? "text-[var(--ui-accent)]" : "text-[var(--ui-text-3)]")}>
                        {countdown.label}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => openModal({ type: "skillEvidence", payload: { skillId: skill.id } })}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded text-xs capitalize transition-colors",
                      skill.status === "exposed" && "bg-[var(--ui-surface-3)] text-[var(--ui-text-2)] hover:bg-[var(--ui-surface-4)]",
                      skill.status === "attempted" && "bg-[var(--ui-accent-soft)] text-[var(--ui-accent)] hover:bg-[var(--ui-accent-soft)]",
                      skill.status === "practiced" && "bg-[var(--ui-warning-soft)] text-[var(--ui-warning)] hover:bg-[var(--ui-warning-soft)]",
                      skill.status === "owned" && "bg-[var(--ui-success-soft)] text-[var(--ui-success)] hover:bg-[var(--ui-success-soft)]"
                    )}
                    title="Open skill evidence"
                    data-testid={`skill-status-${skill.id}`}
                  >
                    {STATUS_ICONS[skill.status]}
                    {skill.status}
                  </button>
                </div>

                {skill.evidenceMediaPath && (
                  <div className="mt-3">
                    <EvidencePreview path={skill.evidenceMediaPath} compact />
                  </div>
                )}

                <div className="mt-3 space-y-2">
                  <label className="block text-[11px] font-medium uppercase text-[var(--ui-text-3)]">Evidence</label>
                  <p className="text-sm text-[var(--ui-text-2)]">{evidenceLabel}</p>
                  {skill.reviewDueAt && skill.status === "practiced" && (
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-1)] px-2 py-1 text-[11px] text-[var(--ui-text-2)]">
                      <Clock3 className="h-3 w-3" />
                      {countdown?.shortLabel ?? "Review scheduled"}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => openModal({ type: "skillEvidence", payload: { skillId: skill.id } })}
                    className="btn btn-ghost px-0 text-sm text-[var(--ui-accent)]"
                    data-testid={`skill-evidence-${skill.id}`}
                  >
                    {skill.evidenceMediaPath || skill.evidence ? "Add Evidence" : "Start Evidence"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-[var(--ui-border)] bg-[var(--ui-surface-2)] p-4">
        <form onSubmit={handleAddSkill} className="flex gap-2">
          <input
            type="text"
            value={newSkillName}
            onChange={(event) => setNewSkillName(event.target.value)}
            placeholder="E.g., Jig setup..."
            className="input text-sm py-1.5 flex-1"
          />
          <button
            type="submit"
            disabled={!newSkillName.trim() || createSkill.isPending}
            className="btn btn-primary text-sm py-1.5 px-3"
            data-testid="btn-add-skill"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
