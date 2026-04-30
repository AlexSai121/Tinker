export function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function toHexChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0");
}

function mixWith(hex: string, target: "#000000" | "#ffffff", amount: number) {
  const source = hexToRgb(hex);
  const dest = hexToRgb(target);
  return `#${toHexChannel(source.r + (dest.r - source.r) * amount)}${toHexChannel(source.g + (dest.g - source.g) * amount)}${toHexChannel(source.b + (dest.b - source.b) * amount)}`;
}

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const channels = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground: string, background: string) {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

function getReadableTextColor(background: string) {
  return contrastRatio("#0b0c0e", background) >= contrastRatio("#ffffff", background) ? "#0b0c0e" : "#ffffff";
}

export function getAccentTheme(accent: string) {
  const isDarkAccent = luminance(accent) < 0.45;
  const accentStrong = mixWith(accent, isDarkAccent ? "#ffffff" : "#000000", 0.22);
  const { r, g, b } = hexToRgb(accent);

  return {
    accent,
    onAccent: getReadableTextColor(accent),
    accentStrong,
    accentSoftDark: `rgba(${r}, ${g}, ${b}, 0.18)`,
    accentSoftLight: `rgba(${r}, ${g}, ${b}, 0.12)`,
    focusRing: `0 0 0 3px rgba(${r}, ${g}, ${b}, 0.28)`,
  };
}
