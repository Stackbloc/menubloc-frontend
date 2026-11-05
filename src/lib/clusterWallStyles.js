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

// Surfaces (Andre 2026-11-05: "the bricks should have different textures"). Same keys + texture files
// as the backend (src/services/clusterWall/wallStyles.js), which draws the share pictures on them.
export const WALL_THEMES = Object.freeze({
  brick: { label: "Red brick", ink: "#FFF4E6", shadow: "#2A0A04", paper: "#9B3A2A", texture: "brick.jpg" },
  whitebrick: { label: "White brick", ink: "#1B1B1B", shadow: "#FFFFFF", paper: "#ECEAE5", texture: "whitebrick.jpg" },
  slate: { label: "Slate", ink: "#F8FAFC", shadow: "#000000", paper: "#2C2F31", texture: "slate.jpg" },
  marble: { label: "Marble", ink: "#1B1B1B", shadow: "#FFFFFF", paper: "#F4F2EE", texture: "marble.jpg" },
  gold: { label: "Gold", ink: "#2A1A00", shadow: "#FFF1B8", paper: "#E2B94A", texture: "gold.jpg" },
  teal: { label: "Worn teal", ink: "#0E2420", shadow: "#CFEFE9", paper: "#4FA99C", texture: "teal.jpg" },
  wood: { label: "Wood", ink: "#FFF1DC", shadow: "#1A0C04", paper: "#5B3520", texture: "wood.jpg" },
  concrete: { label: "Concrete", ink: "#1B1B1B", shadow: "#FFFFFF", paper: "#CBC8C1", texture: "concrete.jpg" },
});

/** CSS for a surface: the texture over its flat colour (shows while the picture loads). */
export function wallSurfaceStyle(themeKey) {
  const t = WALL_THEMES[themeKey] || WALL_THEMES.brick;
  return {
    backgroundColor: t.paper,
    backgroundImage: `url(/cluster-wall/textures/${t.texture})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

/** Soft copy under the letters so they read on busy surfaces. */
export function wallInkShadow(themeKey) {
  const t = WALL_THEMES[themeKey] || WALL_THEMES.brick;
  return `1px 1px 0 ${t.shadow}99, 0 0 6px ${t.shadow}66`;
}

export const WALL_SIZES = Object.freeze([
  { key: "small", label: "Small", limit: 80 },
  { key: "medium", label: "Medium", limit: 160 },
  { key: "large", label: "Large", limit: 280 },
]);

export const WALL_CAPTION_LIMIT = 80;
export const WALL_CLIP_MAX_SECONDS = 20;
export const WALL_CLIP_MAX_BYTES = 60 * 1024 * 1024;

export const DEFAULT_WALL_STYLE = Object.freeze({ font: "clean", theme: "brick", align: "center" });

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

