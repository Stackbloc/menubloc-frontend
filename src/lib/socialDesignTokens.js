/** Menuply social UI — shared visual language (image-forward, minimal boxes). */

export const social = {
  ink: "#0f172a",
  muted: "#64748b",
  border: "#e5e7eb",
  surface: "#ffffff",
  accent: "#15803d",
  accentGradient: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
  radiusLg: 16,
  radiusMd: 12,
  radiusPill: 999,
  heroMediaHeight: 280,
  thumbSize: 96,
  fontFamily: "Inter, Arial, sans-serif",
};

export const socialType = {
  sectionTitle: {
    margin: "0 0 4px",
    fontSize: 17,
    fontWeight: 800,
    color: social.ink,
    letterSpacing: "-0.02em",
    fontFamily: social.fontFamily,
  },
  foodTitle: {
    margin: "0 0 4px",
    fontSize: 17,
    fontWeight: 800,
    color: social.ink,
    letterSpacing: "-0.02em",
    lineHeight: 1.25,
    fontFamily: social.fontFamily,
  },
  meta: {
    margin: 0,
    fontSize: 13,
    color: social.muted,
    lineHeight: 1.45,
    fontFamily: social.fontFamily,
  },
  caption: {
    margin: "6px 0 0",
    fontSize: 14,
    color: social.ink,
    lineHeight: 1.5,
    fontFamily: social.fontFamily,
  },
};

export const socialBtn = {
  primary: {
    appearance: "none",
    minHeight: 44,
    padding: "0 18px",
    borderRadius: social.radiusMd,
    border: "none",
    background: social.accentGradient,
    color: "#0B0F0C",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: social.fontFamily,
    flexShrink: 0,
  },
  secondary: {
    appearance: "none",
    minHeight: 40,
    padding: "0 14px",
    borderRadius: social.radiusMd,
    border: `1px solid ${social.border}`,
    background: social.surface,
    color: social.ink,
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: social.fontFamily,
  },
  icon: {
    appearance: "none",
    width: 44,
    height: 44,
    borderRadius: social.radiusMd,
    border: `1px solid ${social.border}`,
    background: social.surface,
    color: social.ink,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
    flexShrink: 0,
    fontFamily: social.fontFamily,
  },
};

export const socialPost = {
  shell: {
    borderRadius: social.radiusLg,
    overflow: "hidden",
    background: social.surface,
    border: `1px solid ${social.border}`,
  },
  media: {
    width: "100%",
    height: social.heroMediaHeight,
    objectFit: "cover",
    display: "block",
    background: "#f1f5f9",
  },
  body: {
    padding: "14px 16px 16px",
  },
};
