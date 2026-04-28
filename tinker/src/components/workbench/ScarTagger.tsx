import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateScar } from "../../hooks/useScars";
import { nanoid } from "nanoid";
import { SCAR_FAILURE_TYPES, SCAR_SEVERITIES } from "../../utils/constants";
import { AlertTriangle, X } from "lucide-react";

const formSchema = z.object({
  failureType: z.enum(SCAR_FAILURE_TYPES),
  severity: z.enum(SCAR_SEVERITIES),
  costTime: z.string().optional(),
  costMaterials: z.string().optional(),
  costMoney: z.string().optional(),
  notes: z.string().min(10, "Add a short note about what happened."),
});

type FormData = z.infer<typeof formSchema>;

export function ScarTagger({ itemId, onComplete }: { itemId: string, onComplete?: () => void }) {
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

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[var(--ui-danger)] transition-colors hover:bg-[var(--ui-danger-soft)]"
        data-testid="btn-add-scar"
      >
        <AlertTriangle className="w-3 h-3" />
        Tag a Scar
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-[var(--ui-radius-md)] border border-[rgba(198,69,69,0.28)] bg-[var(--ui-danger-soft)] p-3">
      <div className="flex justify-between items-center mb-3">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold text-[var(--ui-danger)]">
          <AlertTriangle className="w-4 h-4" /> Tag Scar
        </h4>
        <button onClick={() => setIsOpen(false)} className="text-[var(--ui-text-3)] hover:text-[var(--ui-text-1)]">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--ui-text-3)]">Failure Type</label>
            <select {...register("failureType")} className="input text-xs py-1.5 h-auto" data-testid="select-scar-failure-type">
              {SCAR_FAILURE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--ui-text-3)]">Severity</label>
            <select {...register("severity")} className="input text-xs py-1.5 h-auto" data-testid="select-scar-severity">
              {SCAR_SEVERITIES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--ui-text-3)]">Costs (Optional)</label>
          <div className="grid grid-cols-3 gap-2">
            <input {...register("costTime")} placeholder="Time (e.g. 2h)" className="input text-xs py-1.5 h-auto" />
            <input {...register("costMaterials")} placeholder="Materials" className="input text-xs py-1.5 h-auto" />
            <input {...register("costMoney")} placeholder="Money ($)" className="input text-xs py-1.5 h-auto" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--ui-text-3)]">What actually went wrong?</label>
          <textarea
            {...register("notes")}
            placeholder="Capture the mistake, the moment, or the condition that made this fail."
            className="input min-h-24 resize-y text-xs"
            data-testid="input-scar-notes"
          />
          {errors.notes && <p className="mt-1 text-xs text-red-400">{errors.notes.message}</p>}
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isSubmitting || createScar.isPending}
            className="btn btn-danger text-xs py-1 px-3"
            data-testid="btn-save-scar"
          >
            {createScar.isPending ? "Saving..." : "Save Scar"}
          </button>
        </div>
      </form>
    </div>
  );
}
