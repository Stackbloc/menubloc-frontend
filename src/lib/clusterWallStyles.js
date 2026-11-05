/**
 * Cluster Wall looks — same keys as the backend (menubloc-backend src/services/clusterWall/wallStyles.js),
 * which also draws the share pictures. Fonts are generic families + weight / case / italic.
 */

export const WALL_FONTS = Object.freeze({
  clean: { label: "Clean", family: "Arial, Helvetica, sans-serif", weight: 700, italic: false, upper: false },
  loud: { label: "Loud", family: "'Arial Black', Arial, Helvetica, sans-serif", weight: 900, italic: false, upper: true },
  classic: { label: "Classic", family: "Georgia, 'Times New Roman', serif", weight: 700, italic: false, upper: false },
  note: { label: "Note", family: "Georgia, 'Times New Roman', serif", weight: 400, italic: true, upper: false },
  typewriter: { label: "Typewriter", family: "'Courier New', Courier, monospace", weight: 700, italic: false, upper: false },
});

export const WALL_THEMES = Object.freeze({
  chalk: { label: "Chalkboard", ink: "#F4F1E8", paper: "#1F3A2E" },
  paper: { label: "Paper", ink: "#1B1B1B", paper: "#F7F2E7" },
  cardinal: { label: "Cardinal", ink: "#FFCC00", paper: "#990000" },
  night: { label: "Night", ink: "#F8FAFC", paper: "#111827" },
  sky: { label: "Sky", ink: "#0B2545", paper: "#CFE8FF" },
  sun: { label: "Sun", ink: "#111111", paper: "#FFD23F" },
  mint: { label: "Mint", ink: "#0F3D2E", paper: "#C8F2DC" },
  rose: { label: "Rose", ink: "#4A0D24", paper: "#FFD6E3" },
});

export const WALL_SIZES = Object.freeze([
  { key: "small", label: "Small", limit: 80 },
  { key: "medium", label: "Medium", limit: 160 },
  { key: "large", label: "Large", limit: 280 },
]);

export const WALL_CAPTION_LIMIT = 80;
export const WALL_CLIP_MAX_SECONDS = 20;
export const WALL_CLIP_MAX_BYTES = 60 * 1024 * 1024;

export const DEFAULT_WALL_STYLE = Object.freeze({ font: "clean", theme: "chalk", align: "center" });

export function wallStyle(style) {
  const s = style && typeof style === "object" ? style : {};
  return {
    font: Object.prototype.hasOwnProperty.call(WALL_FONTS, s.font) ? s.font : DEFAULT_WALL_STYLE.font,
    theme: Object.prototype.hasOwnProperty.call(WALL_THEMES, s.theme) ? s.theme : DEFAULT_WALL_STYLE.theme,
    align: s.align === "left" ? "left" : "center",
  };
}

export function wallLimitFor(size) {
  return WALL_SIZES.find((s) => s.key === size)?.limit || 80;
}

/** Clusters with a Wall on the website. VITE_CLUSTER_WALL_SLUGS="usc,ucla"; default USC. */
export function isClusterWallSlug(slug) {
  const raw = import.meta.env?.VITE_CLUSTER_WALL_SLUGS;
  const list = (raw == null ? "usc" : String(raw))
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(String(slug || "").trim().toLowerCase());
}

/** "Week of Nov 2" from "2026-11-02". */
export function wallWeekLabel(weekStart) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(weekStart || ""));
  if (!m) return "";
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return `Week of ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`;
}

/** Font size for an inscription: bigger tiles, shorter text → bigger letters. */
export function wallTextFontSize(size, length, { scale = 1 } = {}) {
  const base = size === "large" ? 24 : size === "medium" ? 17 : 14;
  const n = Math.max(1, Number(length) || 1);
  const shrink = size === "large" ? (n > 180 ? 0.62 : n > 110 ? 0.72 : n > 60 ? 0.84 : 1) : n > 110 ? 0.74 : n > 60 ? 0.84 : 1;
  return Math.round(base * shrink * scale);
}

