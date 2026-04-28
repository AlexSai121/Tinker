import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { nanoid } from "nanoid";
import { Link2, Search, X } from "lucide-react";
import { useUiStore } from "../../stores/uiStore";
import { useCreateBridge } from "../../hooks/useBridges";
import { useItem, useAllItems } from "../../hooks/useItems";
import { useAllWorkbenches } from "../../hooks/useWorkbenches";
import { AnimatedButton } from "../shared/AnimatedButton";
import { SmartTooltip } from "../shared/SmartTooltip";

const schema = z.object({
  targetItemId: z.string().min(1, "Choose an item to connect"),
  note: z.string().min(50, "Bridge note must be at least 50 characters"),
});

type FormData = z.infer<typeof schema>;

export function CreateBridgeModal({ payload }: { payload?: Record<string, unknown> }) {
  const closeModal = useUiStore((s) => s.closeModal);
  const sourceItemId = payload?.sourceItemId as string;
  const createBridge = useCreateBridge();
  const { data: sourceItem } = useItem(sourceItemId);
  const { data: items = [] } = useAllItems();
  const { data: workbenches = [] } = useAllWorkbenches();
  const [searchQuery, setSearchQuery] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      targetItemId: "",
      note: "",
    },
  });

  const selectedTargetId = watch("targetItemId");

  const targetOptions = useMemo(() => {
    if (!sourceItem) return [];

    const lowerQuery = searchQuery.trim().toLowerCase();
    const workbenchNames = new Map(workbenches.map((workbench) => [workbench.id, workbench.name]));

    return items
      .filter((item) => item.id !== sourceItem.id && item.workbenchId !== sourceItem.workbenchId)
      .filter((item) => {
        if (!lowerQuery) return true;
        const workbenchName = workbenchNames.get(item.workbenchId)?.toLowerCase() ?? "";
        return item.content.toLowerCase().includes(lowerQuery) || workbenchName.includes(lowerQuery);
      })
      .slice(0, 12)
      .map((item) => ({
        item,
        workbenchName: workbenchNames.get(item.workbenchId) ?? "Untitled Project",
      }));
  }, [items, searchQuery, sourceItem, workbenches]);

  const onSubmit = async (data: FormData) => {
    if (!sourceItemId) return;

    await createBridge.mutateAsync({
      id: nanoid(),
      sourceItemId,
      targetItemId: data.targetItemId,
      note: data.note.trim(),
      strength: 1,
      lastReinforcedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    closeModal();
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content max-w-3xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="font-serif text-2xl font-normal text-[var(--ui-text-1)]">Create Bridge</h2>
            <p className="mt-1 text-sm text-[var(--ui-text-3)]">Connect this item to something meaningful in another project.</p>
          </div>
          <SmartTooltip content="Close bridge modal">
            <AnimatedButton type="button" onClick={closeModal} variant="ghost" size="icon" aria-label="Close">
              <X className="h-5 w-5" />
            </AnimatedButton>
          </SmartTooltip>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-1)] p-3">
            <p className="ui-kicker">Source Item</p>
            <p className="mt-2 text-sm text-[var(--ui-text-2)]">{sourceItem?.content ?? "Loading item..."}</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">Search Other Projects</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ui-text-3)]" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="input pl-9"
                placeholder="Search item text or project name"
                data-testid="input-bridge-search"
              />
            </div>
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-1)] p-3">
            {targetOptions.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--ui-text-3)]">No cross-project items match that search yet.</div>
            ) : (
              targetOptions.map(({ item, workbenchName }) => {
                const isSelected = selectedTargetId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setValue("targetItemId", item.id, { shouldValidate: true })}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      isSelected
                  ? "border-[var(--ui-accent)] bg-[var(--ui-accent-soft)]"
                  : "border-[var(--ui-border)] bg-[var(--ui-surface-2)] hover:border-[var(--ui-border-strong)]"
                    }`}
                    data-testid={`bridge-target-${item.id}`}
                  >
                    <p className="ui-kicker">{workbenchName}</p>
                    <p className="mt-2 text-sm text-[var(--ui-text-2)]">{item.content}</p>
                  </button>
                );
              })
            )}
          </div>
          {errors.targetItemId && <p className="text-sm text-red-400">{errors.targetItemId.message}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">Bridge Note</label>
            <textarea
              {...register("note")}
              className="input min-h-32 resize-y"
              placeholder="Explain why these two items belong in conversation with each other."
              data-testid="input-bridge-note"
            />
            <p className="mt-1 text-xs text-[var(--ui-text-3)]">Minimum 50 characters so future-you gets a real breadcrumb.</p>
            {errors.note && <p className="mt-1 text-sm text-red-400">{errors.note.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <AnimatedButton type="button" onClick={closeModal} variant="ghost">
              Cancel
            </AnimatedButton>
            <AnimatedButton
              type="submit"
              disabled={isSubmitting || createBridge.isPending}
              variant="primary"
              className="inline-flex items-center gap-2"
              data-testid="btn-create-bridge"
            >
              <Link2 className="h-4 w-4" />
              {createBridge.isPending ? "Creating..." : "Create Bridge"}
            </AnimatedButton>
          </div>
        </form>
      </div>
    </div>
  );
}
