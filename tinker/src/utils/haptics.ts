type HapticKind = "light" | "success" | "warning";

const HAPTIC_PATTERNS: Record<HapticKind, number | number[]> = {
  light: 8,
  success: [10, 24, 12],
  warning: [14, 40, 18],
};

export function triggerHapticFeedback(kind: HapticKind = "light") {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }

  navigator.vibrate(HAPTIC_PATTERNS[kind]);
}
