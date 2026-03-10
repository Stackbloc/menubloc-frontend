/**
 * Global design tokens for Grubbid / Menubloc.
 * Import this wherever you need consistent colors, spacing, or radius.
 *
 * Usage:
 *   import { theme } from "../styles/theme";
 *   style={{ background: theme.colors.background }}
 */

export const theme = {
  colors: {
    background:    "#F5F4EF",
    surface:       "#FFFFFF",
    surfaceMuted:  "rgba(255,255,255,0.68)",
    primary:       "#1F4E3D",
    primaryDark:   "#11211a",
    accent:        "#CDAA7D",
    textPrimary:   "#111111",
    textSecondary: "#5F5F5F",
    textMuted:     "#5a7064",
    border:        "#E5E5E5",
    borderSubtle:  "rgba(18,34,28,0.08)",
    error:         "#9f1239",
    errorBg:       "#fff1f2",
  },

  radius: {
    card:   "16px",
    panel:  "24px",
    button: "999px",
    input:  "14px",
  },

  spacing: {
    pagePadding: "28px 20px 56px",
    cardPad:     "18px",
  },

  font: {
    family: "Inter, system-ui, -apple-system, sans-serif",
    sizes: {
      h1:   "44px",
      h2:   "28px",
      h3:   "20px",
      body: "16px",
      meta: "13px",
      tiny: "11px",
    },
    weights: {
      regular: 400,
      medium:  600,
      bold:    700,
      black:   900,
    },
  },
};
