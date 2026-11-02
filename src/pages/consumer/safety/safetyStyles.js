// Shared look for the Play Store safety screens (2026-11-02): app-profile colors, compact pill buttons (no full-width bars).
export const C = {
  text: "#111613",
  muted: "#5c665f",
  border: "#e1e6e1",
  surface: "#f5f7f4",
  background: "#ffffff",
  accent: "#0f7a24",
  danger: "#b42318",
};

export const s = {
  page: { background: C.surface, color: C.text, minHeight: "100vh", padding: "16px 16px 48px", boxSizing: "border-box" },
  stack: { maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 },
  back: { color: C.accent, textDecoration: "none", fontSize: 15, background: "none", border: 0, padding: 0, cursor: "pointer", alignSelf: "flex-start" },
  h1: { fontSize: 24, fontWeight: 700, margin: 0 },
  card: { background: C.background, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 },
  p: { margin: 0, fontSize: 15, lineHeight: 1.45 },
  muted: { margin: 0, fontSize: 14, color: C.muted, lineHeight: 1.4 },
  input: { fontSize: 16, padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, boxSizing: "border-box", width: "100%" },
  pill: { alignSelf: "flex-start", borderRadius: 999, padding: "9px 18px", fontSize: 15, fontWeight: 600, cursor: "pointer", border: `1px solid ${C.border}`, background: C.background, color: C.text },
  dangerPill: { alignSelf: "flex-start", borderRadius: 999, padding: "9px 18px", fontSize: 15, fontWeight: 600, cursor: "pointer", border: 0, background: C.danger, color: "#fff" },
  error: { margin: 0, color: C.danger, fontSize: 14 },
  row: { display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" },
  link: { color: C.accent, background: "none", border: 0, padding: 0, fontSize: 15, cursor: "pointer" },
};
