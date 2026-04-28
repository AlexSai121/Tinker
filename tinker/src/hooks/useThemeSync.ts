import { useEffect, useMemo, useState } from "react";
import { useAppSetting } from "./useAppSettings";
import { parsePreferences } from "../utils/preferences";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function useThemeSync() {
  const { data: preferencesSetting } = useAppSetting("preferences");
  const preferences = useMemo(() => parsePreferences(preferencesSetting?.value), [preferencesSetting?.value]);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(getSystemTheme);
  const themePreference = preferences.appearance.theme;
  const resolvedTheme = themePreference === "system" ? systemTheme : themePreference;

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = () => {
      setSystemTheme(mediaQuery.matches ? "light" : "dark");
    };

    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark");
    root.classList.add(`theme-${resolvedTheme}`);
    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  return resolvedTheme;
}
