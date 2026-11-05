/**
 * Cluster Wall looks — same keys as the backend (menubloc-backend src/services/clusterWall/wallStyles.js),
 * which also draws the share pictures.
 */

// Handwriting first (Andre 2026-11-05: "a few handwriting fonts", like the mockup), then two print looks.
// Font files live in public/cluster-wall/fonts (@font-face in clusterWall.css); the backend draws the
// same files in share pictures.
export const WALL_FONTS = Object.freeze({
  marker: { label: "Marker", family: "'Permanent Marker', 'Comic Sans MS', cursive", weight: 400, italic: false, upper: false },
  brush: { label: "Brush", family: "'Caveat Brush', 'Comic Sans MS', cursive", weight: 400, italic: false, upper: false },
  neat: { label: "Neat", family: "'Kalam', 'Comic Sans MS', cursive", weight: 700, italic: false, upper: false },
  bouncy: { label: "Bouncy", family: "'Gochi Hand', 'Comic Sans MS', cursive", weight: 400, italic: false, upper: false },
  spray: { label: "Spray paint", family: "'Rubik Spray Paint', Impact, sans-serif", weight: 400, italic: false, upper: false, spray: true },
  print: { label: "Hand print", family: "'Patrick Hand', 'Comic Sans MS', cursive", weight: 400, italic: false, upper: false },
  clean: { label: "Clean", family: "Arial, Helvetica, sans-serif", weight: 700, italic: false, upper: false },
  loud: { label: "Loud", family: "'Arial Black', Arial, Helvetica, sans-serif", weight: 900, italic: false, upper: true },
});

// Print fonts from the first build → the nearest handwriting (same as the backend's LEGACY_FONTS).
const LEGACY_FONTS = Object.freeze({ classic: "neat", note: "brush", typewriter: "print" });

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

// Paint colours (Andre 2026-11-05: "a spray paint font, with color pick?"). Same keys as the backend.
// "auto" = the surface's own ink. The spray font adds a soft overspray halo in the paint colour.
export const WALL_INKS = Object.freeze({
  auto: { label: "Surface", color: null, shadow: null },
  white: { label: "White", color: "#FFFFFF", shadow: "#000000" },
  black: { label: "Black", color: "#111111", shadow: "#FFFFFF" },
  red: { label: "Red", color: "#E5202E", shadow: "#000000" },
  cardinal: { label: "Cardinal", color: "#990000", shadow: "#FFFFFF" },
  gold: { label: "Gold", color: "#FFCC00", shadow: "#000000" },
  orange: { label: "Orange", color: "#FF7A00", shadow: "#000000" },
  pink: { label: "Pink", color: "#FF3EA5", shadow: "#000000" },
  lime: { label: "Lime", color: "#7CFF3A", shadow: "#000000" },
  cyan: { label: "Cyan", color: "#22D3EE", shadow: "#000000" },
  purple: { label: "Purple", color: "#8B5CF6", shadow: "#FFFFFF" },
});

// Orientation (Andre 2026-11-05: "so they are not all presented squarely"). Degrees clockwise.
export const WALL_ANGLES = Object.freeze([
  { key: 0, label: "Straight" },
  { key: -10, label: "Tilt left" },
  { key: 10, label: "Tilt right" },
  { key: -90, label: "Up" },
  { key: 90, label: "Down" },
]);

/** Letter colour + shadow for a style (paint colour wins over the surface ink). */
export function wallInk(style) {
  const s = wallStyle(style);
  const theme = WALL_THEMES[s.theme];
  const paint = WALL_INKS[s.ink];
  const color = paint.color || theme.ink;
  const shadow = paint.shadow || theme.shadow;
  const halo = WALL_FONTS[s.font].spray ? `, 0 0 0.16em ${color}99, 0 0 0.4em ${color}55` : "";
  return { color, textShadow: `1px 1px 0 ${shadow}99, 0 0 6px ${shadow}66${halo}` };
}

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

export const DEFAULT_WALL_STYLE = Object.freeze({ font: "marker", theme: "brick", align: "center", ink: "auto", angle: 0 });

export function wallStyle(style) {
  const s = style && typeof style === "object" ? style : {};
  return {
    font: Object.prototype.hasOwnProperty.call(WALL_FONTS, s.font)
      ? s.font
      : Object.prototype.hasOwnProperty.call(LEGACY_FONTS, s.font)
        ? LEGACY_FONTS[s.font]
        : DEFAULT_WALL_STYLE.font,
    theme: Object.prototype.hasOwnProperty.call(WALL_THEMES, s.theme) ? s.theme : DEFAULT_WALL_STYLE.theme,
    align: s.align === "left" ? "left" : "center",
    ink: Object.prototype.hasOwnProperty.call(WALL_INKS, s.ink) ? s.ink : "auto",
    angle: WALL_ANGLES.some((a) => a.key === Number(s.angle)) ? Number(s.angle) : 0,
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

