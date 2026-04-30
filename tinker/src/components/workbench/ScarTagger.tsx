import { useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { nanoid } from "nanoid";
import { AlertTriangle, Bandage, X } from "lucide-react";
import { useCreateScar } from "../../hooks/useScars";
import { SCAR_FAILURE_TYPES, SCAR_SEVERITIES } from "../../utils/constants";

const formSchema = z.object({
  failureType: z.enum(SCAR_FAILURE_TYPES),
  severity: z.enum(SCAR_SEVERITIES),
  costTime: z.string().optional(),
  costMaterials: z.string().optional(),
  costMoney: z.string().optional(),
  notes: z.string().min(10, "Add a short note about what happened."),
});

type FormData = z.infer<typeof formSchema>;

export function ScarTagger({ itemId, onComplete }: { itemId: string; onComplete?: () => void }) {
  const createScar = useCreateScar();
  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      failureType: "execution",
      severity: "minor",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createScar.mutateAsync({
        id: nanoid(),
        itemId,
        failureType: data.failureType,
        severity: data.severity,
        costTime: data.costTime || null,
        costMaterials: data.costMaterials || null,
        costMoney: data.costMoney || null,
        notes: data.notes.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      reset();
      setIsOpen(false);
      onComplete?.();
    } catch (error) {
      console.error("Failed to tag scar", error);
    }
  };

  const trigger = (
    <button
      type="button"
      onClick={() => setIsOpen(true)}
      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[var(--ui-danger)] transition-colors hover:bg-[var(--ui-danger-soft)]"
      data-testid="btn-add-scar"
    >
      <AlertTriangle className="h-3 w-3" />
      Tag a Scar
    </button>
  );

  if (!isOpen || typeof document === "undefined") {
    return trigger;
  }

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(34,27,21,0.38)] px-6 py-8">
      <div className="w-full max-w-3xl rounded-[28px] border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-6 shadow-[var(--ui-shadow-2)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--ui-danger-soft)] text-[var(--ui-danger)]">
              <Bandage className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-[var(--ui-font-display)] text-3xl font-medium leading-tight text-[var(--ui-text-1)]">
                Tag this failure
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--ui-text-2)]">
                Scars help you learn from what did not work. Be specific, honest, and useful to your future self.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ui-text-3)] transition-colors hover:bg-[var(--ui-surface-2)] hover:text-[var(--ui-text-1)]"
            aria-label="Close scar tagger"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 md:grid-cols-[1fr_0.9fr]">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--ui-text-1)]">What went wrong?</label>
              <textarea
                {...register("notes")}
                placeholder="Capture the mistake, the moment, or the condition that made this fail."
                className="input min-h-32 resize-y"
                data-testid="input-scar-notes"
              />
              {errors.notes && <p className="mt-1 text-xs text-[var(--ui-danger)]">{errors.notes.message}</p>}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--ui-text-1)]">Root cause</label>
                <select {...register("failureType")} className="input" data-testid="select-scar-failure-type">
                  {SCAR_FAILURE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--ui-text-1)]">Severity</label>
                <select {...register("severity")} className="input" data-testid="select-scar-severity">
                  {SCAR_SEVERITIES.map((severity) => (
                    <option key={severity} value={severity}>
                      {severity.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--ui-text-1)]">Costs, if useful</label>
              <div className="grid gap-2 sm:grid-cols-3">
                <input {...register("costTime")} placeholder="Time, e.g. 2h" className="input" />
                <input {...register("costMaterials")} placeholder="Materials" className="input" />
                <input {...register("costMoney")} placeholder="Money" className="input" />
              </div>
            </div>
          </div>

          <aside className="flex flex-col justify-between rounded-[20px] border border-[var(--ui-border)] bg-[var(--ui-surface-2)] p-5">
            <div>
              <p className="text-sm font-semibold text-[var(--ui-text-1)]">Reflection prompts</p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--ui-text-2)]">
                <p>What condition made the failure more likely?</p>
                <p>What would you try first next time?</p>
                <p>Is this a one-off mistake or a pattern worth watching?</p>
              </div>
            </div>
            <div className="mt-6 rounded-[16px] bg-[var(--ui-bg-card)] p-4 text-sm leading-6 text-[var(--ui-text-2)]">
              Every scar is saved locally and can later surface on the Scar Map.
            </div>
          </aside>

          <div className="flex justify-end gap-3 md:col-span-2">
            <button type="button" onClick={() => setIsOpen(false)} className="btn btn-ghost">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || createScar.isPending}
              className="btn btn-danger"
              data-testid="btn-save-scar"
            >
              {createScar.isPending ? "Saving..." : "Save Scar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
