/** Post sheet colors, doodle wallpaper and "I Paid $" helpers (Andre 2026-11-14; shared with postArt.jsx). */

export const POST_COLORS = {
  card: "#e9f7e6",
  cardEdge: "#fbf8ef",
  logoInk: "#0c3b17",
  burst: "#f5c518",
  camGreen: "#16a934",
  record: "#e0261b",
  ink: "#111613",
  muted: "#5c665f",
  accent: "#0f7a24",
};

// Food line drawings (the app's FoodDoodleBackdrop), tiled faintly behind the card.
const DOODLES = [
  ["M6 32a18 18 0 0 1 36 0z", "M12 19c2-3 4-2 6-4 2 2 5 0 7 0 2 1 5 0 6 3 2 0 4 2 5 4"],
  ["M12 16h22l-2 26H14z", "M10 16h26", "M26 16l3-11 6-1"],
  ["M6 12c11-6 25-6 36 0L24 44z", "M18 18a3 3 0 1 0 .01 0", "M29 20a3 3 0 1 0 .01 0"],
  ["M16 4v12a6 6 0 0 0 12 0V4", "M22 4v40"],
  ["M8 20a16 12 0 0 1 32 0z", "M6 26c3 3 6 3 9 0s6 3 9 0 6 3 9 0 6 3 9 0", "M8 32h32v3a5 5 0 0 1-5 5H13a5 5 0 0 1-5-5z"],
  ["M6 24h36a18 18 0 0 1-36 0z", "M18 16c-3-4 3-6 0-10", "M30 16c-3-4 3-6 0-10"],
];
const SPOTS = [
  [8, 10, -14, 0],
  [130, 40, 10, 1],
  [40, 120, 16, 2],
  [160, 150, -10, 3],
  [10, 230, -6, 4],
  [120, 260, 12, 5],
];
const doodleSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='320' viewBox='0 0 220 320'>${SPOTS.map(
  ([x, y, r, i]) =>
    `<g transform='translate(${x} ${y}) rotate(${r} 24 24)' fill='none' stroke='%2377c517' stroke-opacity='0.28' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>${DOODLES[i]
      .map((d) => `<path d='${d}'/>`)
      .join("")}</g>`
).join("")}</svg>`;
export const DOODLE_BG = `url("data:image/svg+xml;utf8,${doodleSvg.replace(/#/g, "%23")}")`;

/** "I Paid $" text → whole cents ($0–$1,000), null when blank, undefined when it isn't a price. */
export function priceToCents(text) {
  const t = String(text ?? "").replace(/[$,\s]/g, "");
  if (!t) return null;
  if (!/^\d{1,4}(\.\d{0,2})?$/.test(t)) return undefined;
  const cents = Math.round(Number(t) * 100);
  return cents <= 100000 ? cents : undefined;
}

/** "Paid $12.50" / "Paid $12" for a shown price; null when there is none. */
export function paidLabel(cents) {
  const n = Number(cents);
  if (cents == null || cents === "" || !Number.isFinite(n) || n < 0) return null;
  const dollars = n / 100;
  return `Paid $${Number.isInteger(dollars) ? dollars : dollars.toFixed(2)}`;
}
