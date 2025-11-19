// Color palette system for dark/light mode with intelligent conversion

export const DARK_COLORS = {
  color1: "#ef4444", // Bright Red - good on dark
  color2: "#f97316", // Bright Orange - good on dark
  color3: "#fbbf24", // Bright Yellow - good on dark
  color4: "#10b981", // Bright Green - good on dark
  color5: "#3b82f6", // Bright Blue - good on dark
  color6: "#a855f7", // Bright Purple - good on dark
} as const;

export const LIGHT_COLORS = {
  color1: "#dc2626", // Deep Red - good on light
  color2: "#ea580c", // Deep Orange - good on light
  color3: "#ca8a04", // Deep Gold - good on light
  color4: "#059669", // Deep Green - good on light
  color5: "#2563eb", // Deep Blue - good on light
  color6: "#7c3aed", // Deep Purple - good on light
} as const;

// Mapping from dark to light colors
export const DARK_TO_LIGHT_MAP: Record<string, string> = {
  [DARK_COLORS.color1]: LIGHT_COLORS.color1,
  [DARK_COLORS.color2]: LIGHT_COLORS.color2,
  [DARK_COLORS.color3]: LIGHT_COLORS.color3,
  [DARK_COLORS.color4]: LIGHT_COLORS.color4,
  [DARK_COLORS.color5]: LIGHT_COLORS.color5,
  [DARK_COLORS.color6]: LIGHT_COLORS.color6,
};

// Mapping from light to dark colors
export const LIGHT_TO_DARK_MAP: Record<string, string> = {
  [LIGHT_COLORS.color1]: DARK_COLORS.color1,
  [LIGHT_COLORS.color2]: DARK_COLORS.color2,
  [LIGHT_COLORS.color3]: DARK_COLORS.color3,
  [LIGHT_COLORS.color4]: DARK_COLORS.color4,
  [LIGHT_COLORS.color5]: DARK_COLORS.color5,
  [LIGHT_COLORS.color6]: DARK_COLORS.color6,
};

// Get colors for current theme
export function getColorsForTheme(theme: "dark" | "light") {
  return theme === "dark" ? DARK_COLORS : LIGHT_COLORS;
}

// Convert a color from one theme to another
export function convertColor(
  color: string,
  fromTheme: "dark" | "light",
  toTheme: "dark" | "light"
): string {
  if (fromTheme === toTheme) return color;

  const map = fromTheme === "dark" ? DARK_TO_LIGHT_MAP : LIGHT_TO_DARK_MAP;
  return map[color] || color; // Return original if no mapping found
}

// Get all colors as array for color picker
export function getColorPickerColors(theme: "dark" | "light") {
  const colors = getColorsForTheme(theme);
  return Object.values(colors);
}
