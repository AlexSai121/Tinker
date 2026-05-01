import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  FileText,
  ImagePlus,
  Lightbulb,
  Link2,
  Plus,
  Sparkles,
  Target,
  Wrench,
} from "lucide-react";
import { nanoid } from "nanoid";
import { useCreateItem } from "../../hooks/useItems";
import { useCreateItemMedia } from "../../hooks/useItemMedia";
import { CREATABLE_ITEM_TYPES } from "../../utils/constants";
import { TypeBadge } from "../shared/TypeBadge";
import { MediaUploader, type UploadedMediaValue } from "../shared/MediaUploader";
import { encodeStructuredItemContent } from "../../utils/itemContent";
import { mediaLabelFromPath } from "../../utils/media";
import { triggerHapticFeedback } from "../../utils/haptics";
import { cn } from "../../utils/cn";
import type { Item } from "../../types";

const formSchema = z
  .object({
    type: z.enum(CREATABLE_ITEM_TYPES),
    title: z.string().min(1, "Give this item a short title"),
    content: z.string().min(1, "Add a short summary before continuing"),
    sourceUrl: z.string().optional(),
    whyThisMatters: z.string().optional(),
    attemptWhat: z.string().optional(),
    attemptResult: z.string().optional(),
    attemptTools: z.array(z.string()).default([]),
    evidenceNotes: z.string().optional(),
    outcome: z.enum(["success", "partial", "failed"]).default("success"),
    confidence: z.number().min(0).max(100).default(70),
    outcomeNotes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "reference") {
      if (!data.sourceUrl?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sourceUrl"],
          message: "References need a source URL",
        });
      }
      if (!data.whyThisMatters?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["whyThisMatters"],
          message: "Explain why this reference matters",
        });
      }
    }

    if (data.type === "attempt") {
      if (!data.attemptWhat?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["attemptWhat"],
          message: "Describe what you tried",
        });
      }
      if (!data.attemptResult?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["attemptResult"],
          message: "Describe what happened",
        });
      }
    }
  });

type FormData = z.infer<typeof formSchema>;
type FlowStep = "type" | "details" | "evidence" | "outcome" | "review" | "position" | "success";

const FLOW_STEPS: FlowStep[] = ["type", "details", "evidence", "outcome", "review", "position"];
const MINI_BOARD_WIDTH = 520;
const MINI_BOARD_HEIGHT = 280;
const MINI_CARD_WIDTH = 88;
const MINI_CARD_HEIGHT = 88;

const TYPE_META: Record<
  FormData["type"],
  {
    title: string;
    description: string;
    icon: React.ReactNode;
    tint: string;
  }
> = {
  observation: {
    title: "Observation",
    description: "Note something you noticed.",
    icon: <Sparkles className="h-4 w-4" />,
    tint: "bg-[#fcf2d3] text-[#9a6c13]",
  },
  reference: {
    title: "Reference",
    description: "Save a link, file, or external resource.",
    icon: <Link2 className="h-4 w-4" />,
    tint: "bg-[#dde7f2] text-[#56718e]",
  },
  attempt: {
    title: "Attempt",
    description: "Document a try at solving something.",
    icon: <Target className="h-4 w-4" />,
    tint: "bg-[#ece8e1] text-[#62584f]",
  },
  question: {
    title: "Question",
    description: "Ask something you do not know yet.",
    icon: <CircleHelp className="h-4 w-4" />,
    tint: "bg-[#f9dfdb] text-[#b86152]",
  },
  breakthrough: {
    title: "Breakthrough",
    description: "Capture a discovery or solved problem.",
    icon: <Lightbulb className="h-4 w-4" />,
    tint: "bg-[#dfefdc] text-[#5e8a52]",
  },
};

const OUTCOME_COPY: Record<FormData["type"], string> = {
  observation: "What came out of this observation?",
  reference: "How useful does this reference feel right now?",
  attempt: "What was the result of this attempt?",
  question: "How close are you to answering this question?",
  breakthrough: "How solid does this breakthrough feel?",
};

function clampPosition(position: { x: number; y: number }) {
  return {
    x: Math.max(20, Math.min(position.x, MINI_BOARD_WIDTH - MINI_CARD_WIDTH - 20)),
    y: Math.max(20, Math.min(position.y, MINI_BOARD_HEIGHT - MINI_CARD_HEIGHT - 20)),
  };
}

function buildInitialPosition(existingItems: Item[]) {
  const latestItem = [...existingItems]
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .find((item) => item.posX !== 0 || item.posY !== 0);

  if (!latestItem) {
    return { x: 96, y: 148 };
  }

  return clampPosition({
    x: latestItem.posX / 3.2 + 36,
    y: latestItem.posY / 3.2 + 28,
  });
}

function buildMiniPreview(existingItems: Item[]) {
  return existingItems.slice(0, 4).map((item, index) => ({
    id: item.id,
    label: item.type,
    x: item.posX !== 0 ? Math.max(16, Math.min(item.posX / 3.2, 390)) : 18 + index * 108,
    y: item.posY !== 0 ? Math.max(18, Math.min(item.posY / 3.2, 160)) : 18 + (index % 2) * 102,
    tint:
      item.type === "observation"
        ? "bg-[#fcf2d3]"
        : item.type === "reference"
          ? "bg-[#dde7f2]"
          : item.type === "breakthrough"
            ? "bg-[#e5f0df]"
            : item.type === "question"
              ? "bg-[#f8e1dd]"
              : "bg-[#f1ece6]",
  }));
}

function MiniChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[rgba(62,52,42,0.07)] px-3 py-1 text-xs text-[var(--ui-text-2)]">
      {children}
    </span>
  );
}

function StepShell({
  step,
  title,
  description,
  badge,
  children,
}: {
  step: number;
  title: string;
  description: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-5 shadow-[var(--ui-shadow-1)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-black/15 text-sm font-medium text-[var(--ui-text-1)]">
              {step}
            </span>
            <h3 className="text-[1.05rem] font-semibold text-[var(--ui-text-1)]">{title}</h3>
          </div>
          <p className="text-sm text-[var(--ui-text-2)]">{description}</p>
        </div>
        {badge}
      </div>
      {children}
    </section>
  );
}

export function ItemCreator({
  workbenchId,
  existingItems = [],
  initialType = "observation",
  initialStep = "type",
  onCancel,
  onComplete,
  onCreated,
}: {
  workbenchId: string;
  existingItems?: Item[];
  initialType?: FormData["type"];
  initialStep?: "type" | "details";
  onCancel?: () => void;
  onComplete?: () => void;
  onCreated?: (itemId: string) => void;
}) {
  const createItem = useCreateItem();
  const createItemMedia = useCreateItemMedia();
  const initialStepIndex = initialStep === "details" ? 1 : 0;
  const [pendingMedia, setPendingMedia] = useState<UploadedMediaValue[]>([]);
  const [toolInput, setToolInput] = useState("");
  const [stepIndex, setStepIndex] = useState(initialStepIndex);
  const [position, setPosition] = useState(() => buildInitialPosition(existingItems));
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const [mediaRequirementError, setMediaRequirementError] = useState("");
  const miniPreviewItems = useMemo(() => buildMiniPreview(existingItems), [existingItems]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: initialType,
      title: "",
      content: "",
      sourceUrl: "",
      whyThisMatters: "",
      attemptWhat: "",
      attemptResult: "",
      attemptTools: [],
      evidenceNotes: "",
      outcome: "success",
      confidence: 70,
      outcomeNotes: "",
    },
  });

  const itemType = watch("type");
  const attemptTools = watch("attemptTools");
  const confidence = watch("confidence");
  const outcome = watch("outcome");
  const currentStep = FLOW_STEPS[Math.min(stepIndex, FLOW_STEPS.length - 1)];
  const typeMeta = TYPE_META[itemType];

  useEffect(() => {
    reset({
      type: initialType,
      title: "",
      content: "",
      sourceUrl: "",
      whyThisMatters: "",
      attemptWhat: "",
      attemptResult: "",
      attemptTools: [],
      evidenceNotes: "",
      outcome: "success",
      confidence: 70,
      outcomeNotes: "",
    });
    setPendingMedia([]);
    setToolInput("");
    setStepIndex(initialStepIndex);
    setPosition(buildInitialPosition(existingItems));
    setLastCreatedId(null);
    setMediaRequirementError("");
  }, [initialStepIndex, initialType, reset]);

  const nextStep = async () => {
    if (currentStep === "evidence" && itemType === "breakthrough" && pendingMedia.length === 0) {
      setMediaRequirementError("Breakthroughs need at least one evidence upload.");
      return;
    }

    if (currentStep === "details") {
      const fields =
        itemType === "reference"
          ? ["title", "content", "sourceUrl", "whyThisMatters"]
          : itemType === "attempt"
            ? ["title", "content", "attemptWhat", "attemptResult"]
            : ["title", "content"];

      const isValid = await trigger(fields as Array<keyof FormData>);
      if (!isValid) {
        return;
      }
    }

    if (currentStep === "review") {
      const isValid = await trigger();
      if (!isValid) {
        return;
      }
    }

    setStepIndex((current) => Math.min(current + 1, FLOW_STEPS.length - 1));
  };

  const previousStep = () => {
    setStepIndex((current) => Math.max(current - 1, 0));
  };

  const addToolChip = () => {
    const nextTool = toolInput.trim();
    if (!nextTool || attemptTools.includes(nextTool)) {
      setToolInput("");
      return;
    }

    setValue("attemptTools", [...attemptTools, nextTool], { shouldValidate: true });
    setToolInput("");
  };

  const removeToolChip = (tool: string) => {
    setValue(
      "attemptTools",
      attemptTools.filter((currentTool) => currentTool !== tool),
      { shouldValidate: true }
    );
  };

  const handleMediaUpload = (media: UploadedMediaValue) => {
    setPendingMedia((current) => [...current, media]);
    setMediaRequirementError("");
    triggerHapticFeedback("light");
  };

  const removePendingMedia = (index: number) => {
    setPendingMedia((current) => current.filter((_, mediaIndex) => mediaIndex !== index));
  };

  const setPositionFromBoard = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const raw = {
      x: event.clientX - rect.left - MINI_CARD_WIDTH / 2,
      y: event.clientY - rect.top - MINI_CARD_HEIGHT / 2,
    };
    const snapped = snapToGrid
      ? {
          x: Math.round(raw.x / 18) * 18,
          y: Math.round(raw.y / 18) * 18,
        }
      : raw;

    setPosition(clampPosition(snapped));
  };

  const createPosition = useMemo(
    () => ({
      posX: Math.round(position.x * 3.2),
      posY: Math.round(position.y * 3.2),
    }),
    [position]
  );

  const onSubmit = async (data: FormData) => {
    if (data.type === "breakthrough" && pendingMedia.length === 0) {
      setMediaRequirementError("Breakthroughs need at least one evidence upload.");
      setStepIndex(FLOW_STEPS.indexOf("evidence"));
      return;
    }

    const itemId = nanoid();
    const now = new Date();
    const finalContent = encodeStructuredItemContent({
      version: 1,
      title: data.title.trim(),
      content: data.content.trim(),
      sourceUrl: data.sourceUrl?.trim() || undefined,
      whyThisMatters: data.whyThisMatters?.trim() || undefined,
      attemptWhat: data.attemptWhat?.trim() || undefined,
      attemptResult: data.attemptResult?.trim() || undefined,
      attemptTools: data.attemptTools.length > 0 ? data.attemptTools : undefined,
      evidenceNotes: data.evidenceNotes?.trim() || undefined,
      outcome: data.outcome,
      outcomeNotes: data.outcomeNotes?.trim() || undefined,
      confidence: data.confidence,
    });

    await createItem.mutateAsync({
      id: itemId,
      workbenchId,
      type: data.type,
      content: finalContent,
      posX: createPosition.posX,
      posY: createPosition.posY,
      createdAt: now,
      updatedAt: now,
    });

    for (const media of pendingMedia) {
      await createItemMedia.mutateAsync({
        id: nanoid(),
        itemId,
        type: media.type,
        path: media.path,
        createdAt: now,
        updatedAt: now,
      });
    }

    setLastCreatedId(itemId);
    setStepIndex(FLOW_STEPS.length);
    triggerHapticFeedback("success");
    onCreated?.(itemId);
  };

  const handleQuickCreate = async () => {
    if (!watch("title").trim()) {
      setValue("title", watch("content").trim().slice(0, 64) || TYPE_META[itemType].title);
    }

    await handleSubmit(async (data) => {
      await onSubmit(data);
      onComplete?.();
    })();
  };

  const restartFlow = () => {
    reset({
      type: initialType,
      title: "",
      content: "",
      sourceUrl: "",
      whyThisMatters: "",
      attemptWhat: "",
      attemptResult: "",
      attemptTools: [],
      evidenceNotes: "",
      outcome: "success",
      confidence: 70,
      outcomeNotes: "",
    });
    setPendingMedia([]);
    setToolInput("");
    setStepIndex(initialStepIndex);
    setPosition(buildInitialPosition(existingItems));
    setLastCreatedId(null);
    setMediaRequirementError("");
  };

  const titlePlaceholder =
    itemType === "attempt"
      ? "Third dry fit"
      : itemType === "reference"
        ? "Fine Woodworking - Dovetail Basics"
        : itemType === "breakthrough"
          ? "Found a better marking method"
          : "The tails on the front piece are a bit tight";

  return (
    <div className="space-y-5">
      {currentStep === "type" && (
        <StepShell
          step={2}
          title="Choose Item Type"
          description="Select the type of item you want to create."
        >
          <div className="space-y-3">
            {CREATABLE_ITEM_TYPES.map((type) => {
              const meta = TYPE_META[type];
              const isSelected = itemType === type;

              return (
                <label
                  key={type}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-[18px] border border-black/6 bg-white/45 p-4 transition-all",
                    isSelected && "border-black/12 bg-white shadow-sm"
                  )}
                  data-testid={`item-type-card-${type}`}
                >
                  <input
                    type="radio"
                    value={type}
                    {...register("type")}
                    className="sr-only"
                    data-testid={`item-type-${type}`}
                  />
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", meta.tint)}>{meta.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--ui-text-1)]">{meta.title}</span>
                    <span className="mt-1 block text-sm text-[var(--ui-text-2)]">{meta.description}</span>
                  </span>
                </label>
              );
            })}
          </div>

          <div className="mt-6 flex justify-between">
            <button type="button" onClick={onCancel} className="btn btn-ghost">
              Cancel
            </button>
            <button type="button" onClick={() => setStepIndex(1)} className="btn btn-primary">
              Next
            </button>
          </div>
        </StepShell>
      )}

      {currentStep === "details" && (
        <StepShell
          step={3}
          title="Fill in Details"
          description="Add the essential information."
          badge={<TypeBadge type={itemType} className="px-3 py-1 text-[11px]" />}
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">Title</label>
              <input
                {...register("title")}
                className="input w-full"
                placeholder={titlePlaceholder}
                data-testid="input-item-title"
              />
              {errors.title && <p className="mt-1 text-sm text-[var(--ui-danger)]">{errors.title.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">
                {itemType === "attempt"
                  ? "Summary"
                  : itemType === "question"
                    ? "What are you asking?"
                    : "Summary"}
              </label>
              <textarea
                {...register("content")}
                className="input min-h-[96px] w-full resize-y"
                placeholder="Capture the main point while it is still fresh."
                data-testid="input-item-content"
              />
              {errors.content && <p className="mt-1 text-sm text-[var(--ui-danger)]">{errors.content.message}</p>}
            </div>

            {itemType === "attempt" && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">What did you try?</label>
                  <textarea
                    {...register("attemptWhat")}
                    className="input min-h-[80px] w-full resize-y"
                    placeholder="Adjusted the tail pins by paring the shoulders."
                    data-testid="input-attempt-what"
                  />
                  {errors.attemptWhat && <p className="mt-1 text-sm text-[var(--ui-danger)]">{errors.attemptWhat.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">What happened?</label>
                  <textarea
                    {...register("attemptResult")}
                    className="input min-h-[80px] w-full resize-y"
                    placeholder="Much better fit. Pins seat flush with light tapping."
                    data-testid="input-attempt-result"
                  />
                  {errors.attemptResult && (
                    <p className="mt-1 text-sm text-[var(--ui-danger)]">{errors.attemptResult.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--ui-text-2)]">Tools / Materials used</label>
                  <div className="flex gap-2">
                    <input
                      value={toolInput}
                      onChange={(event) => setToolInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addToolChip();
                        }
                      }}
                      className="input w-full"
                      placeholder="Add a tool or material"
                      data-testid="input-attempt-tools"
                    />
                    <button type="button" onClick={addToolChip} className="btn btn-ghost px-3">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {attemptTools.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {attemptTools.map((tool) => (
                        <button
                          key={tool}
                          type="button"
                          onClick={() => removeToolChip(tool)}
                          className="rounded-full bg-[rgba(62,52,42,0.07)] px-3 py-1 text-xs text-[var(--ui-text-2)]"
                        >
                          {tool}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {itemType === "reference" && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">Source URL</label>
                  <input
                    {...register("sourceUrl")}
                    className="input w-full"
                    placeholder="https://example.com/reference"
                    data-testid="input-reference-url"
                  />
                  {errors.sourceUrl && <p className="mt-1 text-sm text-[var(--ui-danger)]">{errors.sourceUrl.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">Why this matters</label>
                  <textarea
                    {...register("whyThisMatters")}
                    className="input min-h-[86px] w-full resize-y"
                    placeholder="Good explanation of cutting angles and tail spacing."
                  />
                  {errors.whyThisMatters && (
                    <p className="mt-1 text-sm text-[var(--ui-danger)]">{errors.whyThisMatters.message}</p>
                  )}
                </div>
              </>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setStepIndex(FLOW_STEPS.indexOf("evidence"))}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-4 py-2.5 text-sm font-medium text-[var(--ui-text-2)] transition-colors hover:border-[var(--ui-border-strong)] hover:bg-[var(--ui-surface-3)] hover:text-[var(--ui-text-1)]"
              >
                <ImagePlus className="h-4 w-4" />
                Attach images or files
                {pendingMedia.length > 0 && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ui-accent)] text-[10px] font-bold text-white">
                    {pendingMedia.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button type="button" onClick={previousStep} className="btn btn-ghost">
              Cancel
            </button>
            <div className="flex gap-2">
              {initialStep === "details" && itemType !== "breakthrough" && (
                <button
                  type="button"
                  onClick={() => void handleQuickCreate()}
                  disabled={isSubmitting || createItem.isPending}
                  className="btn btn-surface"
                  data-testid="btn-create-item"
                >
                  Save now
                </button>
              )}
              <button type="button" onClick={() => void nextStep()} className="btn btn-primary">
                Next
              </button>
            </div>
          </div>
        </StepShell>
      )}

      {currentStep === "evidence" && (
        <StepShell
          step={4}
          title={itemType === "breakthrough" ? "Add Evidence" : "Add Evidence (Optional)"}
          description={itemType === "breakthrough" ? "Attach the proof that makes this breakthrough credible." : "Attach photos, files, or sketches."}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {pendingMedia.map((media, index) => (
                <div
                  key={`${media.path}-${index}`}
                  className="group relative overflow-hidden rounded-[18px] border border-black/8 bg-white/65"
                >
                  <div className="flex h-32 items-center justify-center bg-[rgba(145,120,95,0.10)] text-xs text-[var(--ui-text-2)]">
                    {media.name}
                  </div>
                  <button
                    type="button"
                    onClick={() => removePendingMedia(index)}
                    className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs shadow-sm"
                    data-testid={`btn-remove-media-${index}`}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {pendingMedia.length < 4 && (
                <div className="col-span-2">
                  <MediaUploader
                    onUploadSuccess={handleMediaUpload}
                    buttonText="Add photo, file, or sketch"
                    showCameraCapture
                    cameraButtonText="Capture Photo"
                  />
                </div>
              )}
            </div>
            {mediaRequirementError && (
              <p className="text-sm font-medium text-[var(--ui-danger)]" data-testid="error-breakthrough-media">
                {mediaRequirementError}
              </p>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">Notes about evidence</label>
              <input
                {...register("evidenceNotes")}
                className="input w-full"
                placeholder="Dry fit from top and side."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button type="button" onClick={previousStep} className="btn btn-ghost">
              Back
            </button>
            <button type="button" onClick={() => void nextStep()} className="btn btn-primary">
              Next
            </button>
          </div>
        </StepShell>
      )}

      {currentStep === "outcome" && (
        <StepShell
          step={5}
          title="Outcome"
          description={OUTCOME_COPY[itemType]}
        >
          <div className="space-y-5">
            <div className="space-y-3">
              {[
                { value: "success", label: "Success" },
                { value: "partial", label: "Partial Success" },
                { value: "failed", label: "Failed" },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-3 text-sm text-[var(--ui-text-1)]">
                  <input type="radio" value={option.value} {...register("outcome")} className="h-4 w-4 accent-[#6ea66d]" />
                  {option.label}
                </label>
              ))}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm text-[var(--ui-text-2)]">
                <span>Confidence</span>
                <span>{confidence}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                {...register("confidence", { valueAsNumber: true })}
                className="w-full accent-[#3d352d]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">Outcome note</label>
              <textarea
                {...register("outcomeNotes")}
                className="input min-h-[84px] w-full resize-y"
                placeholder={
                  outcome === "failed"
                    ? "What went wrong, and what should change next time?"
                    : "Capture the confidence behind this result."
                }
              />
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button type="button" onClick={previousStep} className="btn btn-ghost">
              Back
            </button>
            <button type="button" onClick={() => setStepIndex(4)} className="btn btn-primary">
              Next
            </button>
          </div>
        </StepShell>
      )}

      {currentStep === "review" && (
        <StepShell
          step={6}
          title="Review & Save"
          description="Review your item before adding it to the workbench."
        >
          <div className="rounded-[24px] border border-black/8 bg-white/70 p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-black/35">{typeMeta.title}</div>
                <h4 className="text-[1.6rem] font-medium text-[var(--ui-text-1)]">{watch("title") || "Untitled item"}</h4>
              </div>
              <span className="h-3 w-3 rounded-full bg-[#89a7c8]" />
            </div>
            <p className="max-w-[36rem] whitespace-pre-wrap text-sm leading-7 text-[var(--ui-text-2)]">
              {watch("content") || "No summary yet."}
            </p>

            {watch("attemptWhat") && (
              <div className="mt-5 space-y-3 text-sm text-[var(--ui-text-2)]">
                <div>
                  <p className="font-medium text-[var(--ui-text-1)]">What you tried</p>
                  <p>{watch("attemptWhat")}</p>
                </div>
                <div>
                  <p className="font-medium text-[var(--ui-text-1)]">What happened</p>
                  <p>{watch("attemptResult")}</p>
                </div>
              </div>
            )}

            {attemptTools.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {attemptTools.map((tool) => (
                  <MiniChip key={tool}>{tool}</MiniChip>
                ))}
              </div>
            )}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="text-sm text-[var(--ui-text-2)]">
                <p className="font-medium text-[var(--ui-text-1)]">Outcome</p>
                <p className="mt-1 capitalize">{outcome.replace("_", " ")}</p>
              </div>
              <div className="text-sm text-[var(--ui-text-2)]">
                <p className="font-medium text-[var(--ui-text-1)]">Confidence</p>
                <p className="mt-1">{confidence}%</p>
              </div>
            </div>

            {pendingMedia.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-sm font-medium text-[var(--ui-text-1)]">Evidence</p>
                <div className="flex flex-wrap gap-2">
                  {pendingMedia.map((media, index) => (
                    <MiniChip key={`${media.path}-${index}`}>{mediaLabelFromPath(media.path)}</MiniChip>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-between">
            <button type="button" onClick={previousStep} className="btn btn-ghost">
              Back
            </button>
            <button type="button" onClick={() => void nextStep()} className="btn btn-primary">
              Save to Workbench
            </button>
          </div>
        </StepShell>
      )}

      {currentStep === "position" && (
        <StepShell
          step={7}
          title="Choose Position"
          description="Place your item on the workbench."
        >
          <div className="space-y-4">
            <div
              className="relative overflow-hidden rounded-[24px] border border-[var(--ui-border)] bg-[var(--ui-surface-1)] p-4"
            >
              <div
                className="relative overflow-hidden rounded-[20px] border border-[var(--ui-border)] bg-[var(--ui-surface-2)]"
                style={{ height: MINI_BOARD_HEIGHT }}
                onClick={setPositionFromBoard}
              >
                {miniPreviewItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn("absolute flex h-[76px] w-[76px] items-center justify-center rounded-2xl border border-black/6 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/45 shadow-sm", item.tint)}
                    style={{ left: item.x, top: item.y }}
                  >
                    {item.label}
                  </div>
                ))}
                <div
                  className="absolute rounded-[20px] border border-[#7c94b3] bg-[#edf2fb] p-3 shadow-[0_12px_30px_rgba(76,90,118,0.18)]"
                  style={{ left: position.x, top: position.y, width: MINI_CARD_WIDTH, minHeight: MINI_CARD_HEIGHT }}
                >
                  <div className="mb-2 text-[8px] font-bold uppercase tracking-[0.18em] text-black/35">{typeMeta.title}</div>
                  <div className="text-xs font-semibold text-[var(--ui-text-1)] line-clamp-2">{watch("title") || "New item"}</div>
                  <div className="mt-2 text-[11px] leading-4 text-[var(--ui-text-2)] line-clamp-3">{watch("content") || "Place this card where it belongs."}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-3 text-sm text-[var(--ui-text-2)]">
                <span>Snap to grid</span>
                <button
                  type="button"
                  onClick={() => setSnapToGrid((current) => !current)}
                  className={cn(
                    "relative h-7 w-12 rounded-full transition-colors",
                    snapToGrid ? "bg-[#8bc284]" : "bg-black/10"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                      snapToGrid ? "left-6" : "left-1"
                    )}
                  />
                </button>
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button type="button" onClick={previousStep} className="btn btn-ghost">
              Back
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit(onSubmit)()}
              disabled={isSubmitting || createItem.isPending}
              className="btn btn-primary"
              data-testid="btn-create-item"
            >
              {createItem.isPending ? "Saving..." : "Place Item"}
            </button>
          </div>
        </StepShell>
      )}

      {currentStep === "success" && (
        <StepShell
          step={8}
          title="Item Added"
          description="Your item is now on the workbench."
        >
          <div className="rounded-[24px] border border-[var(--ui-border)] bg-[var(--ui-surface-1)] p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {miniPreviewItems.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className={cn("flex h-24 items-center justify-center rounded-[18px] border border-black/6 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45 shadow-sm", item.tint)}
                >
                  {item.label}
                </div>
              ))}
              <div className="flex h-24 items-center justify-center rounded-[18px] border border-[#7c94b3] bg-[#edf2fb] text-sm font-semibold text-[var(--ui-text-1)] shadow-sm">
                {watch("title") || "New item"}
              </div>
            </div>

            <div className="mt-6 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#8bc284] text-white">
                <Check className="h-5 w-5" />
              </div>
              <p className="mt-3 text-lg font-medium text-[var(--ui-text-1)]">Item added successfully!</p>
              <p className="mt-1 text-sm text-[var(--ui-text-2)]">Keep documenting your progress.</p>
            </div>
          </div>

          <div className="mt-6 flex justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                if (lastCreatedId) {
                  onComplete?.();
                }
              }}
              className="btn btn-primary flex-1"
            >
              View Item
            </button>
            <button type="button" onClick={restartFlow} className="btn btn-ghost flex-1">
              Add Another
            </button>
          </div>
        </StepShell>
      )}

      {currentStep !== "success" && (
        <div className="flex items-center justify-between px-1 text-xs text-[var(--ui-text-3)]">
          <span>
            Step {Math.min(stepIndex + 2, 7)} of 7
          </span>
          <div className="flex items-center gap-2">
            {FLOW_STEPS.map((step, index) => (
              <span
                key={step}
                className={cn(
                  "h-2 rounded-full transition-all",
                  index === stepIndex ? "w-6 bg-[#3d352d]" : index < stepIndex ? "w-4 bg-[#8bc284]" : "w-2 bg-black/12"
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
