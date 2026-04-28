import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateItem } from "../../hooks/useItems";
import { useCreateItemMedia } from "../../hooks/useItemMedia";
import { nanoid } from "nanoid";
import { CREATABLE_ITEM_TYPES } from "../../utils/constants";
import { WhyThisMatters } from "../shared/WhyThisMatters";
import { TypeBadge } from "../shared/TypeBadge";
import { MediaUploader, type UploadedMediaValue } from "../shared/MediaUploader";
import { encodeStructuredItemContent } from "../../utils/itemContent";
import { mediaLabelFromPath } from "../../utils/media";
import { triggerHapticFeedback } from "../../utils/haptics";

const formSchema = z.object({
  type: z.enum(CREATABLE_ITEM_TYPES),
  content: z.string().min(1, "Content cannot be empty"),
  sourceUrl: z.string().optional(),
  whyThisMatters: z.string().optional(),
  attemptWhat: z.string().optional(),
  attemptResult: z.string().optional(),
  attemptTools: z.string().optional(),
  mediaCount: z.number().default(0),
}).refine((data) => {
  if (data.type === "reference") {
    return !!data.whyThisMatters && data.whyThisMatters.length >= 10;
  }
  return true;
}, {
  message: "Why This Matters is required for references (min 10 chars)",
  path: ["whyThisMatters"]
}).refine((data) => {
  if (data.type === "attempt") {
    return !!data.attemptWhat?.trim() && !!data.attemptResult?.trim();
  }
  return true;
}, {
  message: "Attempt items need both what you tried and the result",
  path: ["attemptWhat"]
}).refine((data) => {
  if (data.type === "breakthrough") {
    return data.mediaCount > 0;
  }
  return true;
}, {
  message: "Breakthrough items require at least one piece of media",
  path: ["mediaCount"]
});

type FormData = z.infer<typeof formSchema>;

export function ItemCreator({ workbenchId, onComplete }: { workbenchId: string, onComplete?: () => void }) {
  const createItem = useCreateItem();
  const createItemMedia = useCreateItemMedia();
  const [pendingMedia, setPendingMedia] = useState<UploadedMediaValue[]>([]);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "observation",
      content: "",
      sourceUrl: "",
      whyThisMatters: "",
      attemptWhat: "",
      attemptResult: "",
      attemptTools: "",
      mediaCount: 0,
    },
  });

  const itemType = watch("type");
  const mediaError = errors.mediaCount?.message;
  const contentLabel = useMemo(() => {
    if (itemType === "question") return "Question";
    if (itemType === "breakthrough") return "Breakthrough Summary";
    return "Content";
  }, [itemType]);

  const onSubmit = async (data: FormData) => {
    let finalContent = data.content;
    if (data.type === "reference") {
      finalContent = encodeStructuredItemContent({
        version: 1,
        content: data.content,
        sourceUrl: data.sourceUrl?.trim() || undefined,
        whyThisMatters: data.whyThisMatters?.trim() || undefined,
      });
    }

    if (data.type === "attempt") {
      finalContent = encodeStructuredItemContent({
        version: 1,
        content: data.content,
        attemptWhat: data.attemptWhat?.trim() || "",
        attemptResult: data.attemptResult?.trim() || "",
        attemptTools: data.attemptTools
          ?.split(",")
          .map((tool) => tool.trim())
          .filter(Boolean),
      });
    }

    const itemId = nanoid();

    await createItem.mutateAsync({
      id: itemId,
      workbenchId,
      type: data.type,
      content: finalContent,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    for (const media of pendingMedia) {
      await createItemMedia.mutateAsync({
        id: nanoid(),
        itemId,
        type: media.type,
        path: media.path,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    reset();
    setPendingMedia([]);
    triggerHapticFeedback("success");
    onComplete?.();
  };

  const handleQuickCapture = async (media: UploadedMediaValue) => {
    const itemId = nanoid();
    const now = new Date();

    await createItem.mutateAsync({
      id: itemId,
      workbenchId,
      type: "observation",
      content: `Quick capture: ${media.name}`,
      createdAt: now,
      updatedAt: now,
    });

    await createItemMedia.mutateAsync({
      id: nanoid(),
      itemId,
      type: media.type,
      path: media.path,
      createdAt: now,
      updatedAt: now,
    });

    triggerHapticFeedback("success");
    onComplete?.();
  };

  const handleMediaUpload = (media: UploadedMediaValue) => {
    setPendingMedia((current) => {
      const next = [...current, media];
      setValue("mediaCount", next.length, { shouldValidate: true });
      return next;
    });
  };

  const removePendingMedia = (index: number) => {
    setPendingMedia((current) => {
      const next = current.filter((_, mediaIndex) => mediaIndex !== index);
      setValue("mediaCount", next.length, { shouldValidate: true });
      return next;
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-1)] p-4">
      <div className="rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-2)] p-3">
        <div className="mb-3">
          <h3 className="font-semibold text-[var(--ui-text-1)]">Quick Capture</h3>
          <p className="mt-1 text-sm text-[var(--ui-text-2)]">Take a photo or attach a file and save it straight into this project as an observation.</p>
        </div>
        <MediaUploader
          onUploadSuccess={(media) => void handleQuickCapture(media)}
          buttonText="Attach from device"
          showCameraCapture
          cameraButtonText="Capture Photo"
        />
      </div>

      <h3 className="font-semibold text-[var(--ui-text-1)]">Create New Item</h3>
      
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">Type</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {CREATABLE_ITEM_TYPES.map(type => (
            <label key={type} className="cursor-pointer" data-testid={`item-type-card-${type}`}>
              <input 
                type="radio" 
                value={type} 
                {...register("type")} 
                className="sr-only peer" 
                data-testid={`item-type-${type}`}
              />
              <div className="rounded p-1 opacity-70 transition-all peer-checked:opacity-100 peer-checked:ring-2 peer-checked:ring-[var(--ui-accent)]">
                <TypeBadge type={type} />
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">{contentLabel}</label>
        <textarea 
          {...register("content")} 
          className="input min-h-[100px] w-full resize-y" 
          placeholder="What's on your mind?"
          data-testid="input-item-content"
        />
        {errors.content && (
          <p className="text-red-400 text-sm mt-1">{errors.content.message}</p>
        )}
      </div>

      {itemType === "reference" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">Source URL</label>
          <input
            {...register("sourceUrl")}
            className="input w-full"
            placeholder="https://example.com/reference"
            data-testid="input-reference-url"
          />
        </div>
      )}

      {itemType === "reference" && (
        <WhyThisMatters 
          registration={register("whyThisMatters")} 
          error={errors.whyThisMatters} 
        />
      )}

      {itemType === "attempt" && (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">What You Tried</label>
            <textarea
              {...register("attemptWhat")}
              className="input min-h-[80px] w-full resize-y"
              placeholder="What did you actually try?"
              data-testid="input-attempt-what"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">Result</label>
            <textarea
              {...register("attemptResult")}
              className="input min-h-[80px] w-full resize-y"
              placeholder="What happened?"
              data-testid="input-attempt-result"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">Tools Used</label>
            <input
              {...register("attemptTools")}
              className="input w-full"
              placeholder="Comma-separated tools or materials"
              data-testid="input-attempt-tools"
            />
          </div>
        </>
      )}

      {(itemType === "breakthrough" || itemType === "reference") && (
        <div className="space-y-3">
          <MediaUploader
            onUploadSuccess={handleMediaUpload}
            buttonText={itemType === "breakthrough" ? "Attach proof of the breakthrough" : "Attach supporting media"}
            className="w-full"
            showCameraCapture
            cameraButtonText="Capture with Camera"
          />
          {pendingMedia.length > 0 && (
            <div className="space-y-2" data-testid="pending-media-list">
              {pendingMedia.map((media, index) => (
                <div
                  key={`${media.path}-${index}`}
                  className="flex items-center justify-between rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-3 py-2 text-sm text-[var(--ui-text-2)]"
                >
                  <span className="truncate">{mediaLabelFromPath(media.path)}</span>
                  <button
                    type="button"
                    onClick={() => removePendingMedia(index)}
                    className="text-[var(--ui-text-3)] hover:text-[var(--ui-text-1)]"
                    data-testid={`btn-remove-media-${index}`}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          {mediaError && (
            <p className="text-red-400 text-sm" data-testid="error-item-media">
              {mediaError}
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting || createItem.isPending}
            className="btn btn-primary"
            data-testid="btn-create-item"
          >
            {createItem.isPending ? "Saving..." : "Add Item"}
          </button>
      </div>
    </form>
  );
}
