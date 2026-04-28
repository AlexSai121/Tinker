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

export interface AppPreferences {
  appearance: {
    defaultShopTexture: (typeof SHOP_BACKGROUNDS)[number];
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
    defaultShopTexture: "pegboard",
    projectDensity: "comfortable",
    theme: "system",
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

export function parsePreferences(raw?: string | null): AppPreferences {
  if (!raw) return defaultPreferences;

  try {
    const parsed = JSON.parse(raw) as Partial<AppPreferences>;
    return {
      appearance: {
        defaultShopTexture:
          parsed.appearance?.defaultShopTexture ?? defaultPreferences.appearance.defaultShopTexture,
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
