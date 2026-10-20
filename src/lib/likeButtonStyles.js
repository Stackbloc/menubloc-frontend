export const LIKE_ACCENT = "#22C55E";
/** Fav (restaurants → My Favs) — the heart turns this red when selected. */
export const FAV_ACCENT = "#E11D48";

const SELECTED_TINTS = {
  [LIKE_ACCENT]: { bg: "rgba(34,197,94,0.14)", ring: "0 0 0 1px rgba(34,197,94,0.18)" },
  [FAV_ACCENT]: { bg: "rgba(225,29,72,0.12)", ring: "0 0 0 1px rgba(225,29,72,0.18)" },
};

export function likeButtonVisualStyle({
  selected = false,
  inline = false,
  ghost = false,
  dark = false,
  loading = false,
  accent = LIKE_ACCENT,
}) {
  const tint = SELECTED_TINTS[accent] || SELECTED_TINTS[LIKE_ACCENT];
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    lineHeight: 0,
    flexShrink: 0,
    cursor: loading ? "wait" : "pointer",
    opacity: loading ? 0.65 : 1,
    borderRadius: "50%",
    border: selected
      ? `1px solid ${accent}`
      : inline
        ? "none"
        : ghost
          ? "1px solid rgba(55,65,81,0.22)"
          : dark
            ? "1px solid rgba(255,255,255,0.16)"
            : "1px solid rgba(15,23,42,0.16)",
    background: inline
      ? "transparent"
      : selected
        ? tint.bg
        : ghost
          ? "rgba(255,255,255,0.96)"
          : dark
            ? "rgba(255,255,255,0.04)"
            : "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(241,245,249,0.96) 100%)",
    color: selected
      ? accent
      : inline
        ? "inherit"
        : ghost
          ? "#0f172a"
          : dark
            ? "#f8fafc"
            : "#0f172a",
    boxShadow: inline
      ? "none"
      : selected
        ? tint.ring
        : ghost
          ? "0 2px 8px rgba(15, 23, 42, 0.12)"
          : "0 8px 18px rgba(15, 23, 42, 0.12)",
  };
}
