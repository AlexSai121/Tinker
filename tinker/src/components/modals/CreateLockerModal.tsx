import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { nanoid } from "nanoid";
import { Plus, X } from "lucide-react";
import { useCreateLockerItem } from "../../hooks/useLocker";
import { useAppSetting } from "../../hooks/useAppSettings";
import { useUiStore } from "../../stores/uiStore";
import { LOCKER_ITEM_TYPES } from "../../utils/constants";
import { parsePreferences } from "../../utils/preferences";

const schema = z.object({
  type: z.enum(LOCKER_ITEM_TYPES),
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Use a valid URL").optional().or(z.literal("")),
  whyThisMatters: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function CreateLockerModal() {
  const closeModal = useUiStore((state) => state.closeModal);
  const setViewMode = useUiStore((state) => state.setViewMode);
  const createLockerItem = useCreateLockerItem();
  const { data: preferencesSetting } = useAppSetting("preferences");
  const preferences = parsePreferences(preferencesSetting?.value);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "article",
      title: "",
      url: "",
      whyThisMatters: "",
    },
  });

  const onSubmit = useCallback(async (data: FormData) => {
    const now = new Date();
    const staleDate = new Date(now);
    staleDate.setDate(staleDate.getDate() + preferences.behavior.lockerStaleDays);

    await createLockerItem.mutateAsync({
      id: nanoid(),
      type: data.type,
      title: data.title.trim(),
      url: data.url?.trim() || null,
      whyThisMatters: data.whyThisMatters?.trim() || null,
      staleDate,
      isArchived: false,
      archivedAt: null,
      rescuedItemId: null,
      rescuedWorkbenchId: null,
      createdAt: now,
      updatedAt: now,
    });

    closeModal();
    setViewMode("locker");
  }, [closeModal, createLockerItem, preferences.behavior.lockerStaleDays, setViewMode]);

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content max-w-xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="font-serif text-2xl font-normal text-[var(--ui-text-1)]">Save to Locker</h2>
            <p className="mt-1 text-sm text-[var(--ui-text-3)]">
              Park a raw reference here first. It stays active for {preferences.behavior.lockerStaleDays} days before it goes stale.
            </p>
          </div>
          <button type="button" onClick={closeModal} className="text-[var(--ui-text-3)] hover:text-[var(--ui-text-1)]" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">Source Type</label>
            <div className="grid grid-cols-2 gap-2">
              {LOCKER_ITEM_TYPES.map((type) => (
                <label key={type} className="cursor-pointer">
                  <input type="radio" value={type} {...register("type")} className="sr-only peer" />
                  <div className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-3 py-2 text-sm capitalize text-[var(--ui-text-2)] transition-colors peer-checked:border-[var(--ui-accent)] peer-checked:text-[var(--ui-accent)]">
                    {type}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">Title</label>
            <input
              {...register("title")}
              className="input"
              placeholder="The thing you don't want to lose track of"
              autoFocus
              data-testid="input-locker-title"
            />
            {errors.title && <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">URL</label>
            <input
              {...register("url")}
              className="input"
              placeholder="https://example.com"
              data-testid="input-locker-url"
            />
            {errors.url && <p className="mt-1 text-sm text-red-400">{errors.url.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">Why This Matters</label>
            <textarea
              {...register("whyThisMatters")}
              className="input min-h-28 resize-y"
              placeholder="Optional for now, but rescuing to a project will need a real note."
              data-testid="input-locker-why"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn btn-ghost">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || createLockerItem.isPending}
              className="btn btn-primary inline-flex items-center gap-2"
              data-testid="btn-create-locker-item"
            >
              <Plus className="h-4 w-4" />
              {createLockerItem.isPending ? "Saving..." : "Save to Locker"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
