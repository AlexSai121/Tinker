import React from "react";
import { Lightbulb, Plus, X } from "lucide-react";
import { nanoid } from "nanoid";
import { useUiStore } from "../../stores/uiStore";
import { useShops } from "../../hooks/useShops";
import { useAppSetting, useUpsertAppSetting } from "../../hooks/useAppSettings";

export function OnboardingTooltip() {
  const openModal = useUiStore((s) => s.openModal);
  const activeShopId = useUiStore((s) => s.activeShopId);
  const viewMode = useUiStore((s) => s.viewMode);
  const { data: shops = [], isLoading: shopsLoading } = useShops();
  const { data: dismissedSetting, isLoading: settingLoading } = useAppSetting("onboarding.dismissed");
  const upsertAppSetting = useUpsertAppSetting();

  const isDismissed = dismissedSetting?.value === "true";
  const shouldShow = !shopsLoading && !settingLoading && !isDismissed && shops.length === 0;

  if (!shouldShow) {
    return null;
  }

  const title = shops.length === 0
    ? "Start with a workshop"
    : activeShopId && viewMode === "workbench"
      ? "This canvas is your map"
      : "Projects open from the canvas";

  const description = shops.length === 0
    ? "Create your first workshop, then open it to see the spatial canvas."
    : activeShopId && viewMode === "workbench"
      ? "Double-click empty space to create a project where you're looking. Click a project card to open its details."
      : "Select a workshop in the sidebar, then click a project card to move into its item and skill view.";

  const handleDismiss = async () => {
    await upsertAppSetting.mutateAsync({
      id: dismissedSetting?.id ?? nanoid(),
      key: "onboarding.dismissed",
      value: "true",
      createdAt: dismissedSetting?.createdAt ?? new Date(),
      updatedAt: new Date(),
    });
  };

  const handlePrimary = () => {
    if (shops.length === 0) {
      openModal({ type: "createShop" });
      return;
    }

    void handleDismiss();
  };

  return (
    <div className="pointer-events-none absolute right-6 top-4 z-20 max-w-sm" data-testid="onboarding-tooltip">
      <div className="pointer-events-auto rounded-[var(--ui-radius-xl)] border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-4 shadow-[var(--ui-shadow-2)]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-[var(--ui-accent-soft)] p-2 text-[var(--ui-accent)]">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--ui-text-1)]">{title}</p>
                <p className="mt-1 text-sm text-[var(--ui-text-3)]">{description}</p>
              </div>
              <button
                type="button"
                onClick={() => void handleDismiss()}
                className="rounded p-1 text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-surface-2)] hover:text-[var(--ui-text-1)]"
                aria-label="Dismiss onboarding"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button type="button" onClick={handlePrimary} className="btn btn-primary inline-flex items-center gap-2">
                {shops.length === 0 && <Plus className="h-4 w-4" />}
                {shops.length === 0 ? "Create Workshop" : "Got It"}
              </button>
              <button type="button" onClick={() => void handleDismiss()} className="btn btn-ghost">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
