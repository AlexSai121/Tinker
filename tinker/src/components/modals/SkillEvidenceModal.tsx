import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRightCircle, Clock3, X } from "lucide-react";
import { useUiStore } from "../../stores/uiStore";
import { useAllWorkbenches } from "../../hooks/useWorkbenches";
import { useSaveSkillEvidence, useSkill } from "../../hooks/useSkills";
import { SKILL_STATUSES } from "../../utils/constants";
import { getSkillReviewCountdown } from "../../utils/skillLifecycle";
import { MediaUploader, type UploadedMediaValue } from "../shared/MediaUploader";
import { EvidencePreview } from "../shared/EvidencePreview";

const schema = z.object({
  evidence: z.string().optional(),
  status: z.enum(SKILL_STATUSES),
  evidenceWorkbenchId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function SkillEvidenceModal({ payload }: { payload?: Record<string, unknown> }) {
  const closeModal = useUiStore((state) => state.closeModal);
  const skillId = payload?.skillId as string;
  const { data: skill } = useSkill(skillId);
  const { data: workbenches = [] } = useAllWorkbenches();
  const saveSkillEvidence = useSaveSkillEvidence();
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMediaValue | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      evidence: "",
      status: "exposed",
      evidenceWorkbenchId: "",
    },
  });

  useEffect(() => {
    if (!skill) return;

    reset({
      evidence: skill.evidence ?? "",
      status: skill.status,
      evidenceWorkbenchId: skill.evidenceWorkbenchId ?? skill.workbenchId ?? "",
    });
  }, [reset, skill]);

  const selectedStatus = watch("status");
  const reviewCountdown = skill ? getSkillReviewCountdown(skill) : null;

  const allowedStatuses = useMemo(() => {
    if (!skill) return ["exposed"];

    if (skill.status === "exposed") {
      return ["exposed", "attempted"];
    }

    if (skill.status === "attempted") {
      return ["attempted", "practiced"];
    }

    if (skill.status === "practiced") {
      return reviewCountdown?.isDue ? ["practiced", "owned"] : ["practiced"];
    }

    return ["owned"];
  }, [reviewCountdown?.isDue, skill]);

  const needsEvidenceProject = selectedStatus !== "exposed";

  const onSubmit = async (data: FormData) => {
    if (!skillId) return;

    try {
      await saveSkillEvidence.mutateAsync({
        id: skillId,
        evidence: data.evidence?.trim() ?? null,
        evidenceMediaPath: uploadedMedia?.path ?? skill?.evidenceMediaPath ?? null,
        status: data.status,
        evidenceWorkbenchId: data.evidenceWorkbenchId || skill?.evidenceWorkbenchId || skill?.workbenchId || null,
      });

      closeModal();
    } catch (error) {
      setError("root", {
        message: error instanceof Error ? error.message : "Could not save this skill update.",
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content max-w-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="font-serif text-2xl font-normal text-[var(--ui-text-1)]">Skill Evidence</h2>
            <p className="mt-1 text-sm text-[var(--ui-text-3)]">{skill?.name ?? "Loading skill..."}</p>
          </div>
          <button type="button" onClick={closeModal} className="text-[var(--ui-text-3)] hover:text-[var(--ui-text-1)]" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {skill?.reviewDueAt && skill.status === "practiced" && (
          <div className="mb-4 rounded-[var(--ui-radius-lg)] border border-[rgba(212,160,23,0.3)] bg-[var(--ui-warning-soft)] px-4 py-3 text-sm text-[var(--ui-warning)]">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4" />
              {reviewCountdown?.label ?? "30-day review scheduled"}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">Evidence Note</label>
            <textarea
              {...register("evidence")}
              className="input min-h-32 resize-y"
              placeholder="What artifact, decision, or result shows this skill getting stronger?"
              data-testid="input-skill-evidence"
            />
            <p className="mt-1 text-xs text-[var(--ui-text-3)]">
              Attempted needs a real note. Practiced and Owned need a note plus uploaded evidence.
            </p>
            {errors.evidence && <p className="mt-1 text-sm text-red-400">{errors.evidence.message}</p>}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--ui-text-2)]">Evidence Upload</label>
              <MediaUploader
                onUploadSuccess={setUploadedMedia}
                buttonText="Attach evidence media"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--ui-text-2)]">Current Evidence</label>
              {uploadedMedia?.path || skill?.evidenceMediaPath ? (
                <EvidencePreview path={uploadedMedia?.path ?? skill?.evidenceMediaPath ?? ""} />
              ) : (
                <div className="rounded-[var(--ui-radius-lg)] border border-dashed border-[var(--ui-border)] px-3 py-8 text-center text-sm text-[var(--ui-text-3)]">
                  No file attached yet
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">Status Transition</label>
              <select {...register("status")} className="input" data-testid="select-skill-status">
                {allowedStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">Evidence Project</label>
              <select
                {...register("evidenceWorkbenchId")}
                className="input"
                disabled={!needsEvidenceProject}
                data-testid="select-skill-evidence-project"
              >
                <option value="">Select a project</option>
                {workbenches.map((workbench) => (
                  <option key={workbench.id} value={workbench.id}>
                    {workbench.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-[var(--ui-text-3)]">
                Attempted and Practiced can point to the same project. Owned must be re-proved from a different project after the review window.
              </p>
            </div>
          </div>

          {errors.root?.message && (
            <div className="rounded-[var(--ui-radius-lg)] border border-[rgba(198,69,69,0.3)] bg-[var(--ui-danger-soft)] px-3 py-2 text-sm text-[var(--ui-danger)]">
              {errors.root.message}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn btn-ghost">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || saveSkillEvidence.isPending}
              className="btn btn-primary inline-flex items-center gap-2"
              data-testid="btn-save-skill-evidence"
            >
              <ArrowRightCircle className="h-4 w-4" />
              {saveSkillEvidence.isPending ? "Saving..." : "Save Evidence"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
