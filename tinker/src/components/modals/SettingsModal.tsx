import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { nanoid } from "nanoid";
import { Check, ChevronRight, Database, Info, Palette, SlidersHorizontal, Upload, X } from "lucide-react";
import { useUiStore } from "../../stores/uiStore";
import { useAppSetting, useAppSettings, useUpsertAppSetting } from "../../hooks/useAppSettings";
import { defaultPreferences, parsePreferences, REVIEW_DAY_OPTIONS, THEME_OPTIONS } from "../../utils/preferences";
import { SHOP_BACKGROUNDS } from "../../utils/constants";
import { isElectronRuntime } from "../../lib/runtime";
import { electron } from "../../lib/electron";
import { useShops } from "../../hooks/useShops";
import { useAllWorkbenches } from "../../hooks/useWorkbenches";
import { useAllItems } from "../../hooks/useItems";
import { useImportData } from "../../hooks/useDataTransfer";
import { AnimatedButton } from "../shared/AnimatedButton";
import { SmartTooltip } from "../shared/SmartTooltip";
import { cn } from "../../utils/cn";

const schema = z.object({
  appearance: z.object({
    defaultShopTexture: z.enum(SHOP_BACKGROUNDS),
    projectDensity: z.enum(["comfortable", "compact"]),
    theme: z.enum(THEME_OPTIONS),
  }),
  behavior: z.object({
    openProjectOnCreate: z.boolean(),
    showDustOverlay: z.boolean(),
    confirmBeforeExport: z.boolean(),
    lockerStaleDays: z.coerce.number().min(1).max(60),
    dustThresholdDays: z.coerce.number().min(1).max(120),
    reviewDayOfWeek: z.enum(REVIEW_DAY_OPTIONS),
  }),
});

type FormData = z.infer<typeof schema>;
type Section = "data" | "appearance" | "behavior" | "about";

const sections: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "data", label: "Data", icon: <Database className="h-4 w-4" /> },
  { id: "appearance", label: "Appearance", icon: <Palette className="h-4 w-4" /> },
  { id: "behavior", label: "Behavior", icon: <SlidersHorizontal className="h-4 w-4" /> },
  { id: "about", label: "About", icon: <Info className="h-4 w-4" /> },
];

function SettingsStat({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="ui-panel-muted px-4 py-4">
      <p className="ui-kicker">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--ui-text-1)]">{value}</p>
    </div>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="ui-panel-muted p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[var(--ui-text-1)]">{title}</h3>
        <p className="mt-1 text-sm text-[var(--ui-text-2)]">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function SettingsToggleRow({
  title,
  description,
  input,
}: {
  title: string;
  description: string;
  input: React.ReactNode;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-1)] px-4 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-[var(--ui-text-1)]">{title}</span>
        <span className="mt-1 block text-sm text-[var(--ui-text-2)]">{description}</span>
      </span>
      <span className="shrink-0 pt-0.5">{input}</span>
    </label>
  );
}

function SettingsField({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">{label}</label>
      {children}
      {description && <p className="mt-2 text-xs text-[var(--ui-text-3)]">{description}</p>}
    </div>
  );
}

function SettingsNavButton({
  active,
  icon,
  label,
  note,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  note: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("settings-nav-button", active && "is-active glass-button")}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="shrink-0 text-[var(--ui-text-3)]">{icon}</span>
        <span className="min-w-0">
          <span className="block text-sm font-medium">{label}</span>
          <span className="mt-0.5 block truncate text-xs text-[var(--ui-text-3)]">{note}</span>
        </span>
      </span>
      <span className="shrink-0 text-[var(--ui-text-3)]">
        {active ? <Check className="h-4 w-4 text-[var(--ui-accent)]" /> : <ChevronRight className="h-4 w-4" />}
      </span>
    </button>
  );
}

function ThemeModeButton({
  active,
  label,
  description,
  onClick,
  testId,
}: {
  active: boolean;
  label: string;
  description: string;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={cn(
        "rounded-[var(--ui-radius-lg)] border px-4 py-4 text-left transition-all",
        active
          ? "glass-button border-[color-mix(in_srgb,var(--ui-accent)_38%,var(--ui-border-strong))] text-[var(--ui-text-1)]"
          : "border-[var(--ui-border)] bg-[var(--ui-surface-1)] text-[var(--ui-text-2)] hover:border-[var(--ui-border-strong)] hover:bg-[var(--ui-surface-2)] hover:text-[var(--ui-text-1)]"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        {active && <Check className="h-4 w-4 text-[var(--ui-accent)]" />}
      </div>
      <p className="mt-2 text-sm text-[var(--ui-text-3)]">{description}</p>
    </button>
  );
}

export function SettingsModal() {
  const closeModal = useUiStore((s) => s.closeModal);
  const openModal = useUiStore((s) => s.openModal);
  const resetUi = useUiStore((s) => s.resetUi);
  const { data: preferencesSetting } = useAppSetting("preferences");
  const { data: settings = [] } = useAppSettings();
  const { data: shops = [] } = useShops();
  const { data: workbenches = [] } = useAllWorkbenches();
  const { data: items = [] } = useAllItems();
  const upsertAppSetting = useUpsertAppSetting();
  const importData = useImportData();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [section, setSection] = useState<Section>("data");
  const [version, setVersion] = useState("Browser Preview");
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [dataMessage, setDataMessage] = useState("");

  const preferences = useMemo(
    () => parsePreferences(preferencesSetting?.value),
    [preferencesSetting?.value]
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultPreferences,
  });

  const watchedTheme = watch("appearance.theme");
  const watchedDensity = watch("appearance.projectDensity");
  const watchedTexture = watch("appearance.defaultShopTexture");
  const watchedReviewDay = watch("behavior.reviewDayOfWeek");

  useEffect(() => {
    reset(preferences);
  }, [preferences, reset]);

  useEffect(() => {
    let cancelled = false;

    async function loadVersion() {
      if (!isElectronRuntime || !electron.appGetVersion) return;
      const nextVersion = await electron.appGetVersion();
      if (!cancelled) {
        setVersion(nextVersion);
      }
    }

    void loadVersion();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (data: FormData) => {
    await upsertAppSetting.mutateAsync({
      id: preferencesSetting?.id ?? nanoid(),
      key: "preferences",
      value: JSON.stringify(data),
      createdAt: preferencesSetting?.createdAt ?? new Date(),
      updatedAt: new Date(),
    });
    closeModal();
  };

  const handleChooseImport = (mode: "merge" | "replace") => {
    setImportMode(mode);
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const json = await file.text();
      const result = await importData.mutateAsync({ json, mode: importMode });
      if (importMode === "replace") {
        resetUi();
      }
      const warningText = result.warnings.length > 0 ? ` Warnings: ${result.warnings.join(" ")}` : "";
      setDataMessage(`Imported ${result.counts.items} items, ${result.counts.skills} skills, and ${result.counts.lockerItems} locker items.${warningText}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed.";
      setDataMessage(message);
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div
        className="modal-content max-w-6xl p-0"
        onClick={(event) => event.stopPropagation()}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex max-h-[85vh] min-h-[42rem] flex-col overflow-hidden lg:flex-row">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(event) => void handleImportFile(event)}
            data-testid="input-import-json"
          />
          <aside className="border-b border-[var(--ui-border)] bg-[var(--ui-surface-1)] p-5 lg:flex lg:w-[18.5rem] lg:flex-col lg:border-b-0 lg:border-r">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="ui-kicker">Workspace Control</p>
                <h2 className="mt-2 font-serif text-[2rem] leading-none text-[var(--ui-text-1)]">Settings</h2>
                <p className="mt-3 text-sm leading-6 text-[var(--ui-text-2)]">
                  Fine-tune how Tinker looks, behaves, and stores your work.
                </p>
              </div>
              <SmartTooltip content="Close settings">
                <AnimatedButton type="button" onClick={closeModal} variant="ghost" size="icon" aria-label="Close">
                  <X className="h-5 w-5" />
                </AnimatedButton>
              </SmartTooltip>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-1">
              <div className="ui-status ui-status-accent justify-center lg:justify-start">
                {watchedTheme.charAt(0).toUpperCase() + watchedTheme.slice(1)} theme
              </div>
              <div className="ui-status justify-center lg:justify-start">
                {watchedDensity.charAt(0).toUpperCase() + watchedDensity.slice(1)} density
              </div>
              <div className="ui-status justify-center lg:justify-start">
                {watchedReviewDay.charAt(0).toUpperCase() + watchedReviewDay.slice(1)} review
              </div>
            </div>

            <div className="mt-5 settings-nav">
              {sections.map((entry) => (
                <SettingsNavButton
                  key={entry.id}
                  active={section === entry.id}
                  icon={entry.icon}
                  label={entry.label}
                  note={
                    entry.id === "data"
                      ? "Import and export"
                      : entry.id === "appearance"
                        ? "Theme and texture"
                        : entry.id === "behavior"
                          ? "Workflow defaults"
                          : "Runtime details"
                  }
                  onClick={() => setSection(entry.id)}
                />
              ))}
            </div>

            <div className="mt-5 space-y-3 lg:mt-auto">
              <div className="ui-panel-muted px-4 py-4">
                <p className="ui-kicker">Workspace Snapshot</p>
                <div className="mt-3 grid grid-cols-3 gap-3 text-center lg:grid-cols-1 lg:text-left">
                  <div>
                    <p className="text-lg font-semibold text-[var(--ui-text-1)]">{shops.length}</p>
                    <p className="text-xs text-[var(--ui-text-3)]">Workshops</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-[var(--ui-text-1)]">{workbenches.length}</p>
                    <p className="text-xs text-[var(--ui-text-3)]">Projects</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-[var(--ui-text-1)]">{items.length}</p>
                    <p className="text-xs text-[var(--ui-text-3)]">Items</p>
                  </div>
                </div>
              </div>
              <div className="ui-panel-muted px-4 py-4">
                <p className="ui-kicker">Current Defaults</p>
                <p className="mt-2 text-sm text-[var(--ui-text-2)]">
                  Texture: {watchedTexture.replaceAll("_", " ")}
                </p>
                <p className="mt-1 text-sm text-[var(--ui-text-2)]">
                  Storage: {isElectronRuntime ? "Electron database" : "Browser preview"}
                </p>
              </div>
            </div>
          </aside>

          <div className="flex min-h-0 flex-1 flex-col bg-[var(--ui-surface-0)]">
            <div className="border-b border-[var(--ui-border)] px-5 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--ui-text-1)]">
                    {sections.find((entry) => entry.id === section)?.label}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--ui-text-2)]">
                    {section === "data" && "Import, export, and inspect the shape of your workspace data."}
                    {section === "appearance" && "Choose the visual defaults that shape each new session."}
                    {section === "behavior" && "Adjust workflow defaults and timing signals across the app."}
                    {section === "about" && "Check the runtime and version details for this build."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="ui-status">{settings.length} saved setting records</div>
                  <div className="ui-status">{version}</div>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {section === "data" && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <SettingsStat label="Workshops" value={shops.length} />
                  <SettingsStat label="Projects" value={workbenches.length} />
                  <SettingsStat label="Items" value={items.length} />
                </div>

                <SettingsSection
                  title="Storage"
                  description="These counters reflect the workspace currently loaded in this app session."
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-1)] px-4 py-3">
                      <p className="ui-kicker">Mode</p>
                      <p className="mt-2 text-sm text-[var(--ui-text-1)]">
                        {isElectronRuntime ? "Electron database" : "Browser localStorage preview"}
                      </p>
                    </div>
                    <div className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-1)] px-4 py-3">
                      <p className="ui-kicker">Saved Settings</p>
                      <p className="mt-2 text-sm text-[var(--ui-text-1)]">{settings.length} entries currently stored</p>
                    </div>
                  </div>
                </SettingsSection>

                <SettingsSection
                  title="Transfer"
                  description="Export your workspace or import data without leaving the settings sheet."
                >
                  <div className="mt-4 flex flex-wrap gap-3">
                    <AnimatedButton
                      type="button"
                      onClick={() => openModal({ type: "export" })}
                      variant="primary"
                      className="glass-button"
                      data-testid="btn-open-export-from-settings"
                    >
                      Open Export Dialog
                    </AnimatedButton>
                    <AnimatedButton
                      type="button"
                      onClick={() => handleChooseImport("merge")}
                      variant="surface"
                      className="inline-flex items-center gap-2 glass-button"
                      data-testid="btn-import-merge"
                    >
                      <Upload className="h-4 w-4" />
                      Import Merge
                    </AnimatedButton>
                    <AnimatedButton
                      type="button"
                      onClick={() => handleChooseImport("replace")}
                      variant="surface"
                      className="inline-flex items-center gap-2 glass-button"
                      data-testid="btn-import-replace"
                    >
                      <Upload className="h-4 w-4" />
                      Import Replace
                    </AnimatedButton>
                  </div>
                  {dataMessage && (
                    <div className="mt-4 rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-3 py-2 text-sm text-[var(--ui-text-2)]">
                      {dataMessage}
                    </div>
                  )}
                </SettingsSection>
              </div>
            )}

            {section === "appearance" && (
              <div className="space-y-4">
                <SettingsSection
                  title="Theme"
                  description="Choose how the interface should present itself across dark, light, or system-driven sessions."
                >
                  <input type="hidden" {...register("appearance.theme")} />
                  <div className="grid gap-3 md:grid-cols-3">
                    <ThemeModeButton
                      active={watchedTheme === "system"}
                      label="System"
                      description="Follow the device theme automatically."
                      onClick={() => setValue("appearance.theme", "system")}
                      testId="select-theme-system"
                    />
                    <ThemeModeButton
                      active={watchedTheme === "dark"}
                      label="Dark"
                      description="Keep the atelier low-glare and focused."
                      onClick={() => setValue("appearance.theme", "dark")}
                      testId="select-theme-dark"
                    />
                    <ThemeModeButton
                      active={watchedTheme === "light"}
                      label="Light"
                      description="Use the brighter paper-and-clay palette."
                      onClick={() => setValue("appearance.theme", "light")}
                      testId="select-theme-light"
                    />
                  </div>
                </SettingsSection>

                <SettingsSection
                  title="Workspace Defaults"
                  description="Set the materials and density new workshops and projects inherit when you create them."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <SettingsField label="Default Shop Texture">
                      <select {...register("appearance.defaultShopTexture")} className="input" data-testid="select-default-shop-texture">
                        {SHOP_BACKGROUNDS.map((texture) => (
                          <option key={texture} value={texture}>
                            {texture.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                    </SettingsField>
                    <SettingsField label="Project Density">
                      <select {...register("appearance.projectDensity")} className="input">
                        <option value="comfortable">Comfortable</option>
                        <option value="compact">Compact</option>
                      </select>
                    </SettingsField>
                  </div>
                </SettingsSection>
              </div>
            )}

            {section === "behavior" && (
              <div className="space-y-4">
                <SettingsSection
                  title="Workflow"
                  description="Choose how much the app should move you forward automatically as new work appears."
                >
                  <SettingsToggleRow
                    title="Open project immediately after creation"
                    description="If disabled, you stay on the canvas after creating a project."
                    input={
                      <input
                        type="checkbox"
                        {...register("behavior.openProjectOnCreate")}
                        className="mt-1 h-4 w-4"
                        data-testid="toggle-open-project-on-create"
                      />
                    }
                  />
                  <SettingsToggleRow
                    title="Show dust overlay on inactive workbenches"
                    description="Keeps the age signal visible on the canvas."
                    input={<input type="checkbox" {...register("behavior.showDustOverlay")} className="mt-1 h-4 w-4" />}
                  />
                  <SettingsToggleRow
                    title="Ask for confirmation before export"
                    description="Adds a small pause before generating files."
                    input={<input type="checkbox" {...register("behavior.confirmBeforeExport")} className="mt-1 h-4 w-4" />}
                  />
                </SettingsSection>

                <SettingsSection
                  title="Timing"
                  description="Tune the intervals that drive archive nudges, dust signals, and the weekly review ritual."
                >
                  <div className="grid gap-4 md:grid-cols-3">
                    <SettingsField label="Locker stale date (days)">
                      <input type="number" min={1} max={60} {...register("behavior.lockerStaleDays")} className="input" data-testid="input-locker-stale-days" />
                    </SettingsField>
                    <SettingsField label="Dust threshold (days)">
                      <input type="number" min={1} max={120} {...register("behavior.dustThresholdDays")} className="input" data-testid="input-dust-threshold-days" />
                    </SettingsField>
                    <SettingsField label="Weekly review day">
                      <select {...register("behavior.reviewDayOfWeek")} className="input" data-testid="select-review-day">
                        {REVIEW_DAY_OPTIONS.map((day) => (
                          <option key={day} value={day}>
                            {day.charAt(0).toUpperCase() + day.slice(1)}
                          </option>
                        ))}
                      </select>
                    </SettingsField>
                  </div>
                </SettingsSection>
              </div>
            )}

            {section === "about" && (
              <div className="space-y-4">
                <SettingsSection
                  title="Runtime"
                  description="Useful context when checking what environment or build this workspace is running inside."
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-1)] px-4 py-3">
                      <p className="ui-kicker">Environment</p>
                      <p className="mt-2 text-sm text-[var(--ui-text-1)]">{isElectronRuntime ? "Electron desktop app" : "Vite browser preview"}</p>
                    </div>
                    <div className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-1)] px-4 py-3">
                      <p className="ui-kicker">Version</p>
                      <p className="mt-2 text-sm text-[var(--ui-text-1)]">{version}</p>
                    </div>
                  </div>
                </SettingsSection>
              </div>
            )}
          </div>
            <div className="border-t border-[var(--ui-border)] px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-[var(--ui-text-3)]">
                  Changes save to the shared workspace preferences record.
                </p>
                <div className="flex gap-3">
              <AnimatedButton type="button" onClick={closeModal} variant="ghost">
                Cancel
              </AnimatedButton>
              <AnimatedButton type="submit" disabled={isSubmitting || upsertAppSetting.isPending} variant="primary" className="glass-button" data-testid="btn-save-settings">
                {upsertAppSetting.isPending ? "Saving..." : "Save Settings"}
              </AnimatedButton>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
