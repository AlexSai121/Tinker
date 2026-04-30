import { SHOP_BACKGROUNDS } from "./constants";

export const THEME_OPTIONS = ["system", "dark", "light"] as const;
export const REVIEW_DAY_OPTIONS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

const LEGACY_ACCENT_COLORS: Record<string, string> = {
  orange: "#e85002",
  blue: "#3b82f6",
  green: "#22c55e",
  rose: "#f43f5e",
  violet: "#8b5cf6",
};

export const DEFAULT_ACCENT_COLOR = "#9b7a4f";
export const DEFAULT_GUI_SCALE = 15;
export const MIN_GUI_SCALE = 12;
export const MAX_GUI_SCALE = 19;
export const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export interface AppPreferences {
  appearance: {
    accentColor: string;
    defaultShopTexture: (typeof SHOP_BACKGROUNDS)[number];
    guiScale: number;
    projectDensity: "comfortable" | "compact";
    theme: (typeof THEME_OPTIONS)[number];
  };
  behavior: {
    openProjectOnCreate: boolean;
    showDustOverlay: boolean;
    confirmBeforeExport: boolean;
    lockerStaleDays: number;
    dustThresholdDays: number;
    reviewDayOfWeek: (typeof REVIEW_DAY_OPTIONS)[number];
  };
}

export const defaultPreferences: AppPreferences = {
  appearance: {
    accentColor: DEFAULT_ACCENT_COLOR,
    defaultShopTexture: "pegboard",
    guiScale: DEFAULT_GUI_SCALE,
    projectDensity: "comfortable",
    theme: "light",
  },
  behavior: {
    openProjectOnCreate: true,
    showDustOverlay: true,
    confirmBeforeExport: false,
    lockerStaleDays: 14,
    dustThresholdDays: 30,
    reviewDayOfWeek: "saturday",
  },
};

function normalizeAccentColor(value: unknown): string {
  if (typeof value !== "string") {
    return defaultPreferences.appearance.accentColor;
  }

  const legacyColor = LEGACY_ACCENT_COLORS[value];
  if (legacyColor) {
    return legacyColor;
  }

  return HEX_COLOR_PATTERN.test(value) ? value.toLowerCase() : defaultPreferences.appearance.accentColor;
}

function normalizeGuiScale(value: unknown): number {
  const legacyScales: Record<string, number> = {
    compact: 13,
    default: DEFAULT_GUI_SCALE,
    large: 17,
  };
  const nextValue = typeof value === "string" && value in legacyScales ? legacyScales[value] : Number(value);

  if (!Number.isFinite(nextValue)) {
    return defaultPreferences.appearance.guiScale;
  }

  return Math.max(MIN_GUI_SCALE, Math.min(MAX_GUI_SCALE, Math.round(nextValue)));
}

export function parsePreferences(raw?: string | null): AppPreferences {
  if (!raw) return defaultPreferences;

  try {
    const parsed = JSON.parse(raw) as Partial<AppPreferences>;
    return {
      appearance: {
        accentColor: normalizeAccentColor(parsed.appearance?.accentColor),
        defaultShopTexture:
          parsed.appearance?.defaultShopTexture ?? defaultPreferences.appearance.defaultShopTexture,
        guiScale: normalizeGuiScale(parsed.appearance?.guiScale),
        projectDensity:
          parsed.appearance?.projectDensity ?? defaultPreferences.appearance.projectDensity,
        theme:
          parsed.appearance?.theme ?? defaultPreferences.appearance.theme,
      },
      behavior: {
        openProjectOnCreate:
          parsed.behavior?.openProjectOnCreate ?? defaultPreferences.behavior.openProjectOnCreate,
        showDustOverlay:
          parsed.behavior?.showDustOverlay ?? defaultPreferences.behavior.showDustOverlay,
        confirmBeforeExport:
          parsed.behavior?.confirmBeforeExport ?? defaultPreferences.behavior.confirmBeforeExport,
        lockerStaleDays:
          Math.max(1, Math.min(60, parsed.behavior?.lockerStaleDays ?? defaultPreferences.behavior.lockerStaleDays)),
        dustThresholdDays:
          Math.max(1, Math.min(120, parsed.behavior?.dustThresholdDays ?? defaultPreferences.behavior.dustThresholdDays)),
        reviewDayOfWeek:
          parsed.behavior?.reviewDayOfWeek ?? defaultPreferences.behavior.reviewDayOfWeek,
      },
    };
  } catch {
    return defaultPreferences;
  }
}
