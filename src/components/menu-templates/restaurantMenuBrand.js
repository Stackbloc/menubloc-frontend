/**
 * Restaurant-led menu visuals: accent from API colors when present,
 * otherwise a deterministic hue from the restaurant name (avoids product green).
 */

const PAGE_BASE = { r: 11, g: 15, b: 12 };

function normalizeHex(input) {
  if (input == null || typeof input !== "string") return null;
  let s = input.trim();
  if (s.startsWith("#")) s = s.slice(1);
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
  return `#${s.toLowerCase()}`;
}

function hexToRgb(hex) {
  const h = normalizeHex(hex);
  if (!h) return null;
  const n = h.slice(1);
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
  };
}

function rgbCss({ r, g, b }) {
  return `rgb(${r},${g},${b})`;
}

function rgbaCss({ r, g, b }, a) {
  return `rgba(${r},${g},${b},${a})`;
}

function mixRgb(a, b, t) {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

function relativeLuminance({ r, g, b }) {
  const lin = [r, g, b].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function pickAccentHexFromPayload(payload) {
  if (!payload || typeof payload !== "object") return null;
  const keys = [
    "accent_color",
    "brand_accent_color",
    "primary_brand_color",
    "theme_primary_color",
    "brand_color",
  ];
  for (const k of keys) {
    const hex = normalizeHex(payload[k]);
    if (hex) return hex;
  }
  return null;
}

/** Avoid hues that read as Menuply / product green (~85–165°). */
export function hueFromRestaurantName(name) {
  const s = String(name || "Restaurant");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  let hue = h % 360;
  if (hue >= 85 && hue <= 165) hue = (hue + 130) % 360;
  return hue;
}

function hslToRgb(h, s, l) {
  const S = s / 100;
  const L = l / 100;
  const c = (1 - Math.abs(2 * L - 1)) * S;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = L - c / 2;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (h < 60) [rp, gp, bp] = [c, x, 0];
  else if (h < 120) [rp, gp, bp] = [x, c, 0];
  else if (h < 180) [rp, gp, bp] = [0, c, x];
  else if (h < 240) [rp, gp, bp] = [0, x, c];
  else if (h < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];
  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255),
  };
}

function hslCss(h, s, l) {
  return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`;
}

/**
 * @returns {{
 *   accent: string,
 *   accentStrong: string,
 *   accentSoftBg: string,
 *   accentBorder: string,
 *   accentBorderStrong: string,
 *   accentBold: string,
 *   pageBackground: string,
 *   onAccent: string,
 *   heroBackdrop: string,
 *   tagline: string|null,
 *   fontPreset: string,
 * }}
 */
export function buildRestaurantMenuBrand(menuPayload, restaurantName) {
  const apiHex = pickAccentHexFromPayload(menuPayload);
  let accentRgb;
  let accentCss;

  if (apiHex) {
    accentRgb = hexToRgb(apiHex);
    accentCss = normalizeHex(apiHex);
  } else {
    const hue = hueFromRestaurantName(restaurantName);
    accentRgb = hslToRgb(hue, 62, 54);
    accentCss = hslCss(hue, 62, 54);
  }

  if (!accentRgb) {
    accentRgb = { r: 196, g: 113, b: 61 };
    accentCss = rgbCss(accentRgb);
  }

  const lum = relativeLuminance(accentRgb);
  const onAccent = lum > 0.55 ? "#0B0F0C" : "#F8FAFC";

  const strong = mixRgb(accentRgb, { r: 0, g: 0, b: 0 }, 0.25);
  const pageBg = rgbCss(mixRgb(PAGE_BASE, accentRgb, 0.09));
  const heroHue = hueFromRestaurantName(restaurantName);
  const heroBackdrop = `linear-gradient(135deg, hsl(${Math.round(heroHue)} 40% 10%) 0%, hsl(${(heroHue + 55) % 360} 34% 7%) 100%)`;

  return {
    accent: accentCss,
    accentStrong: rgbCss(strong),
    accentSoftBg: rgbaCss(accentRgb, 0.14),
    accentBorder: rgbaCss(accentRgb, 0.35),
    accentBorderStrong: rgbaCss(accentRgb, 0.5),
    accentBold: rgbaCss(accentRgb, 0.22),
    pageBackground: pageBg,
    onAccent,
    heroBackdrop,
    tagline: menuPayload?.tagline || null,
    fontPreset: menuPayload?.font_preset || "default",
  };
}

const FONT_STACKS = {
  default: "ui-sans-serif, system-ui, -apple-system, sans-serif",
  modern:  '"Inter", ui-sans-serif, sans-serif',
  classic: '"Georgia", ui-serif, serif',
  bold:    '"Impact", ui-sans-serif, sans-serif',
  serif:   '"Palatino Linotype", Georgia, serif',
  script:  '"Segoe Print", "Bradley Hand", cursive',
};

export function fontStackForPreset(preset) {
  return FONT_STACKS[preset] || FONT_STACKS.default;
}
