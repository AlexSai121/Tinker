import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { nanoid } from "nanoid";
import { FolderPlus, X } from "lucide-react";
import { useCreateWorkbench } from "../../hooks/useWorkbenches";
import { useUiStore } from "../../stores/uiStore";
import { useAppSetting } from "../../hooks/useAppSettings";
import { parsePreferences } from "../../utils/preferences";
import { triggerHapticFeedback } from "../../utils/haptics";
import { AnimatedButton } from "../shared/AnimatedButton";
import { SmartTooltip } from "../shared/SmartTooltip";

const schema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().min(10, "Description should give this project a little shape"),
  templateQuestionsText: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function CreateProjectModal({ payload }: { payload?: Record<string, unknown> }) {
  const closeModal = useUiStore((s) => s.closeModal);
  const setActiveWorkbench = useUiStore((s) => s.setActiveWorkbench);
  const setActiveShop = useUiStore((s) => s.setActiveShop);
  const createWorkbench = useCreateWorkbench();
  const { data: preferencesSetting } = useAppSetting("preferences");

  const shopId = payload?.shopId as string;
  const initialX = typeof payload?.posX === "number" ? payload.posX : 0;
  const initialY = typeof payload?.posY === "number" ? payload.posY : 0;
  const preferences = parsePreferences(preferencesSetting?.value);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      templateQuestionsText: "",
    },
  });

  useEffect(() => {
    reset({
      name: "",
      description: "",
      templateQuestionsText: [
        "What are you actually trying to learn here?",
        "What would a useful failed attempt look like?",
        "What evidence would make this feel real?",
      ].join("\n"),
    });
  }, [reset]);

  const onSubmit = async (data: FormData) => {
    if (!shopId) return;

    const templateQuestions = (data.templateQuestionsText ?? "")
      .split("\n")
      .map((question) => question.trim())
      .filter(Boolean);

    const workbench = await createWorkbench.mutateAsync({
      id: nanoid(),
      shopId,
      name: data.name.trim(),
      description: data.description.trim(),
      templateQuestions: templateQuestions.length > 0 ? JSON.stringify(templateQuestions) : null,
      width: 800,
      height: 600,
      posX: initialX,
      posY: initialY,
      posZ: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    closeModal();
    triggerHapticFeedback("success");
    if (preferences.behavior.openProjectOnCreate) {
      setActiveWorkbench(workbench.id);
    } else {
      setActiveShop(shopId);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content max-w-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-normal text-[var(--ui-text-1)]">Create Project</h2>
            <p className="mt-1 text-sm text-[var(--ui-text-3)]">Start a focused workbench with enough context to return later.</p>
          </div>
          <SmartTooltip content="Close project modal">
            <AnimatedButton type="button" onClick={closeModal} variant="ghost" size="icon" aria-label="Close">
              <X className="h-5 w-5" />
            </AnimatedButton>
          </SmartTooltip>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">Project Name</label>
            <input
              {...register("name")}
              className="input"
              placeholder="E.g., Hinge Fit Investigation"
              autoFocus
              data-testid="input-project-name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">Description</label>
            <textarea
              {...register("description")}
              className="input min-h-28 resize-y"
              placeholder="What is this project for, and what kind of work belongs here?"
              data-testid="input-project-description"
            />
            {errors.description && <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">Template Questions</label>
            <textarea
              {...register("templateQuestionsText")}
              className="input min-h-32 resize-y"
              placeholder="One question per line"
              data-testid="input-project-template-questions"
            />
            <p className="mt-1 text-xs text-[var(--ui-text-3)]">These are stored with the project as prompts for future work.</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <AnimatedButton type="button" onClick={closeModal} variant="ghost">
              Cancel
            </AnimatedButton>
            <AnimatedButton
              type="submit"
              disabled={isSubmitting || createWorkbench.isPending}
              variant="primary"
              className="inline-flex items-center gap-2"
              data-testid="btn-create-project"
            >
              <FolderPlus className="h-4 w-4" />
              {createWorkbench.isPending ? "Creating..." : "Create Project"}
            </AnimatedButton>
          </div>
        </form>
      </div>
    </div>
  );
}
