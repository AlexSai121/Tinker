import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Download, X } from "lucide-react";
import { useUiStore } from "../../stores/uiStore";
import { useShops } from "../../hooks/useShops";
import { buildExportPayload } from "../../data/export";

const schema = z
  .object({
    scope: z.enum(["full", "shop"]),
    shopId: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  })
  .refine((data) => (data.scope === "shop" ? !!data.shopId : true), {
    message: "Choose a shop for a scoped export",
    path: ["shopId"],
  });

type FormData = z.infer<typeof schema>;

export function ExportModal() {
  const closeModal = useUiStore((s) => s.closeModal);
  const { data: shops = [] } = useShops();
  const [lastExportMessage, setLastExportMessage] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      scope: "full",
      shopId: "",
      from: "",
      to: "",
    },
  });

  const scope = watch("scope");

  const onSubmit = async (data: FormData) => {
    const payload = await buildExportPayload({
      scope: data.scope,
      shopId: data.scope === "shop" ? data.shopId : undefined,
      from: data.from ? new Date(`${data.from}T00:00:00`) : null,
      to: data.to ? new Date(`${data.to}T23:59:59`) : null,
    });

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tinker-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setLastExportMessage(`Exported ${json.length.toLocaleString()} bytes of valid JSON.`);
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content max-w-xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="font-serif text-2xl font-normal text-[var(--ui-text-1)]">Export Data</h2>
            <p className="mt-1 text-sm text-[var(--ui-text-3)]">Choose a scope, optionally narrow by date, and download JSON.</p>
          </div>
          <button type="button" onClick={closeModal} className="text-[var(--ui-text-3)] hover:text-[var(--ui-text-1)]" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--ui-text-2)]">Scope</label>
            <div className="grid grid-cols-2 gap-2">
              <label className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-1)] p-3">
                <input type="radio" value="full" {...register("scope")} className="sr-only" />
                <span className="text-sm text-[var(--ui-text-2)]">Full export</span>
              </label>
              <label className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-1)] p-3">
                <input type="radio" value="shop" {...register("scope")} className="sr-only" />
                <span className="text-sm text-[var(--ui-text-2)]">Single shop</span>
              </label>
            </div>
          </div>

          {scope === "shop" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">Shop</label>
              <select {...register("shopId")} className="input" data-testid="select-export-shop">
                <option value="">Choose a shop</option>
                {shops.map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name}
                  </option>
                ))}
              </select>
              {errors.shopId && <p className="mt-1 text-sm text-red-400">{errors.shopId.message}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">From</label>
              <input type="date" {...register("from")} className="input" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">To</label>
              <input type="date" {...register("to")} className="input" />
            </div>
          </div>

          {lastExportMessage && (
            <div className="rounded-[var(--ui-radius-lg)] border border-[rgba(93,184,114,0.3)] bg-[var(--ui-success-soft)] px-3 py-2 text-sm text-[var(--ui-success)]">
              {lastExportMessage}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn btn-ghost">
              Close
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary inline-flex items-center gap-2"
              data-testid="btn-run-export"
            >
              <Download className="h-4 w-4" />
              {isSubmitting ? "Preparing..." : "Export JSON"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
