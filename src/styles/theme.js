/**
 * ============================================================
 * Grubbid Canonical Design System Lock
 * This file is a thin JavaScript mirror of the canonical CSS
 * variables in src/index.css for inline-style consumers that
 * still need semantic token names.
 *
 * Do not introduce literal font families or parallel token sets
 * here without explicit approval from Andre.
 * ============================================================
 */

export const theme = {
  colors: {
    background: "var(--gb-color-page)",
    surface: "var(--gb-color-surface-strong)",
    surfaceMuted: "var(--gb-color-surface-muted)",
    primary: "var(--gb-color-accent)",
    primaryDark: "var(--gb-color-ink-strong)",
    accent: "var(--gb-color-accent)",
    textPrimary: "var(--gb-color-ink)",
    textSecondary: "var(--gb-color-ink-soft)",
    textMuted: "var(--gb-color-ink-muted)",
    border: "var(--gb-color-border)",
    borderStrong: "var(--gb-color-border-strong)",
    successBg: "var(--gb-color-success-bg)",
    successBorder: "var(--gb-color-success-border)",
    warningBg: "var(--gb-color-warning-bg)",
    warningBorder: "var(--gb-color-warning-border)",
  },

  radius: {
    card: "var(--gb-radius-card)",
    cardTight: "var(--gb-radius-card-tight)",
    button: "var(--gb-radius-pill)",
    input: "var(--gb-radius-input)",
  },

  spacing: {
    pageDesktop: "var(--gb-space-page-desktop)",
    pageMobile: "var(--gb-space-page-mobile)",
    cardPad: "18px",
  },

  font: {
    family: "var(--gb-font-ui)",
    sizes: {
      eyebrow: "12px",
      body: "var(--gb-text-3)",
      meta: "var(--gb-text-1)",
      h2: "var(--gb-text-5)",
      h1: "var(--gb-text-6)",
    },
    weights: {
      regular: 400,
      medium: 600,
      bold: 700,
      black: 900,
    },
  },
};
