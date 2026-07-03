import { normalizeMenuStyle } from "./menuPresentationUtils.js";

const BACKGROUND_STYLES = new Set(["dark", "light", "paper", "chalkboard", "charcoal"]);
const IMAGE_DENSITIES = new Set(["all", "section", "thumbnail", "none"]);
const HEADING_STYLES = new Set(["default", "lines", "decorative", "block"]);
const ITEM_IMAGE_STYLES = new Set(["auto", "all", "section", "thumbnail", "none"]);
const PRICE_PLACEMENTS = new Set(["right", "below", "inline", "aligned"]);
const INTELLIGENCE_DISPLAY_STYLES = new Set(["subtle", "standard", "detailed", "street", "functional"]);
const INTELLIGENCE_DENSITIES = new Set(["subtle", "standard", "detailed", "street", "functional", "minimal"]);
const NUTRITION_DISPLAY_STYLES = new Set(["hidden", "compact", "expanded"]);
const ALLERGEN_DISPLAY_STYLES = new Set(["hidden", "icon", "label", "alert"]);
const INSIGHT_DISPLAY_STYLES = new Set(["hidden", "compact", "panel"]);
const INDULGENCE_DISPLAY_STYLES = new Set(["hidden", "compact", "meter"]);
const HEX_RE = /^#[0-9a-fA-F]{3,8}$/;

export const DEFAULT_MENU_THEME_SETTINGS = {
  menu_style: "v1",
  primary_color: null,
  accent_color: null,
  background_style: "dark",
  hero_enabled: true,
  image_density: "none",
  section_heading_style: "default",
  item_image_style: "auto",
  price_placement: "right",
  intelligence_display_style: "subtle",
  intelligence_density: "subtle",
  nutrition_display: "compact",
  allergen_display: "icon",
  insight_display: "compact",
  compare_enabled: true,
  similar_enabled: true,
  indulgence_display: "compact",
};

const INTELLIGENCE_DEFAULTS_BY_STYLE = {
  v1: {
    intelligence_display_style: "subtle",
    intelligence_density: "subtle",
    nutrition_display: "compact",
    allergen_display: "icon",
    insight_display: "compact",
    compare_enabled: true,
    similar_enabled: true,
    indulgence_display: "compact",
  },
  v2: {
    intelligence_display_style: "standard",
    intelligence_density: "standard",
    nutrition_display: "compact",
    allergen_display: "label",
    insight_display: "compact",
    compare_enabled: true,
    similar_enabled: true,
    indulgence_display: "compact",
  },
  v3: {
    intelligence_display_style: "street",
    intelligence_density: "minimal",
    nutrition_display: "hidden",
    allergen_display: "alert",
    insight_display: "hidden",
    compare_enabled: true,
    similar_enabled: true,
    indulgence_display: "hidden",
  },
  v4: {
    intelligence_display_style: "subtle",
    intelligence_density: "subtle",
    nutrition_display: "compact",
    allergen_display: "icon",
    insight_display: "compact",
    compare_enabled: true,
    similar_enabled: true,
    indulgence_display: "compact",
  },
  v5: {
    intelligence_display_style: "functional",
    intelligence_density: "standard",
    nutrition_display: "expanded",
    allergen_display: "label",
    insight_display: "panel",
    compare_enabled: true,
    similar_enabled: true,
    indulgence_display: "meter",
  },
  v6: {
    intelligence_display_style: "subtle",
    intelligence_density: "subtle",
    nutrition_display: "compact",
    allergen_display: "icon",
    insight_display: "compact",
    compare_enabled: true,
    similar_enabled: true,
    indulgence_display: "compact",
  },
  v7: {
    intelligence_display_style: "street",
    intelligence_density: "minimal",
    nutrition_display: "hidden",
    allergen_display: "alert",
    insight_display: "hidden",
    compare_enabled: true,
    similar_enabled: true,
    indulgence_display: "hidden",
  },
  v8: {
    intelligence_display_style: "subtle",
    intelligence_density: "subtle",
    nutrition_display: "compact",
    allergen_display: "icon",
    insight_display: "compact",
    compare_enabled: true,
    similar_enabled: true,
    indulgence_display: "compact",
  },
  v9: {
    intelligence_display_style: "subtle",
    intelligence_density: "subtle",
    nutrition_display: "compact",
    allergen_display: "icon",
    insight_display: "compact",
    compare_enabled: true,
    similar_enabled: true,
    indulgence_display: "compact",
  },
};

export function normalizeHexColor(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  return HEX_RE.test(text) ? text : null;
}

/** Editorial template shell colors — must match ClassicMenuTemplate / Editorial v12–v15 BG constants. */
export const MENU_STYLE_SHELL_BACKGROUND = {
  v1: "#FFFFFF",
  v12: "#000000",
  v13: "#161210",
  v14: "#FFFBF5",
  v15: "#FFF8EF",
};

function inferBackgroundStyleFromPreset(theme) {
  const bg = String(theme?.preset?.colorDefaults?.background || "").trim().toLowerCase();
  if (!bg) return "dark";
  if (bg.startsWith("#fff") || bg.startsWith("#fef") || bg.startsWith("#f7efe3")) return "paper";
  if (bg.startsWith("#f8") || bg.startsWith("#faf") || bg.startsWith("#f6")) return "light";
  if (bg.includes("chalk")) return "chalkboard";
  if (bg.includes("charcoal")) return "charcoal";
  return "dark";
}

function inferBackgroundStyleFromMenuStyle(menuStyle) {
  switch (normalizeMenuStyle(menuStyle)) {
    case "v12":
      return "charcoal";
    case "v13":
      return "dark";
    case "v14":
    case "v15":
      return "paper";
    case "v1":
    default:
      return "light";
  }
}

function backgroundStyleToShellColor(backgroundStyle, menuBrand) {
  if (backgroundStyle === "light") return "#f7f5ef";
  if (backgroundStyle === "paper") return "#f6efe3";
  if (backgroundStyle === "chalkboard") return "#1a2e1c";
  if (backgroundStyle === "charcoal") return "#1c1c1e";
  return menuBrand?.pageBackground ?? "#0B0F0C";
}

export function hasExplicitBackgroundStyle(source = {}) {
  return BACKGROUND_STYLES.has(String(source?.background_style || "").trim());
}

export function resolveMenuPageBackground(source = {}, menuBrand = null) {
  const normalized = normalizeMenuThemeSettings(source);
  if (!hasExplicitBackgroundStyle(source) && MENU_STYLE_SHELL_BACKGROUND[normalized.menu_style]) {
    return MENU_STYLE_SHELL_BACKGROUND[normalized.menu_style];
  }
  return backgroundStyleToShellColor(normalized.background_style, menuBrand);
}

export function resolveMenuShellTextColor(source = {}) {
  const normalized = normalizeMenuThemeSettings(source);
  if (!hasExplicitBackgroundStyle(source) && MENU_STYLE_SHELL_BACKGROUND[normalized.menu_style]) {
    return ["v12", "v13"].includes(normalized.menu_style) ? "#F5F5F7" : "#101828";
  }
  if (normalized.background_style === "light" || normalized.background_style === "paper") {
    return "#101828";
  }
  return "#FFFFFF";
}

function inferImageDensityFromPreset(theme) {
  const itemImages = String(theme?.preset?.imageRules?.itemImages || "").trim().toLowerCase();
  const sectionImages = String(theme?.preset?.imageRules?.sectionImages || "").trim().toLowerCase();
  if (itemImages.includes("none")) return "none";
  if (itemImages.includes("all")) return "all";
  if (itemImages.includes("thumbnail") || itemImages.includes("thumbnails")) return "thumbnail";
  if (sectionImages.includes("edge") || sectionImages.includes("break") || sectionImages.includes("hero")) return "section";
  if (itemImages.includes("optional")) return "thumbnail";
  return "all";
}

function inferSectionHeadingStyleFromPreset(theme) {
  const raw = String(theme?.preset?.sectionHeadingStyle || "").trim().toLowerCase();
  if (!raw) return "default";
  if (raw.includes("line")) return "lines";
  if (raw.includes("decor") || raw.includes("luxury")) return "decorative";
  if (raw.includes("box") || raw.includes("block") || raw.includes("chalk") || raw.includes("upper") || raw.includes("clean") || raw.includes("simple")) {
    return "block";
  }
  return "default";
}

export function buildMenuThemeSettingsFromPreset(theme = {}) {
  const menuStyle = normalizeMenuStyle(theme.style || theme?.preset?.id || "v1");
  const preset = theme.preset || {};
  const imageDensity = inferImageDensityFromPreset(theme);
  const sectionHeadingStyle = inferSectionHeadingStyleFromPreset(theme);
  const intensity = preset.intelligence || {};

  return {
    menu_style: menuStyle,
    primary_color: normalizeHexColor(preset.colorDefaults?.primary || null),
    accent_color: normalizeHexColor(preset.colorDefaults?.accent || preset.colorDefaults?.primary || null),
    background_style: inferBackgroundStyleFromPreset(theme),
    hero_enabled: true,
    image_density: imageDensity,
    section_heading_style: sectionHeadingStyle,
    item_image_style: imageDensity === "all" ? "all" : imageDensity,
    price_placement: PRICE_PLACEMENTS.has(String(preset.pricePlacement || "").trim())
      ? String(preset.pricePlacement).trim()
      : "right",
    intelligence_display_style: INTELLIGENCE_DISPLAY_STYLES.has(String(intensity.intelligenceDisplayStyle || "").trim())
      ? String(intensity.intelligenceDisplayStyle).trim()
      : DEFAULT_MENU_THEME_SETTINGS.intelligence_display_style,
    intelligence_density: INTELLIGENCE_DENSITIES.has(String(intensity.intelligenceDensity || "").trim())
      ? String(intensity.intelligenceDensity).trim()
      : DEFAULT_MENU_THEME_SETTINGS.intelligence_density,
    nutrition_display: NUTRITION_DISPLAY_STYLES.has(String(intensity.nutritionDisplay || "").trim())
      ? String(intensity.nutritionDisplay).trim()
      : DEFAULT_MENU_THEME_SETTINGS.nutrition_display,
    allergen_display: ALLERGEN_DISPLAY_STYLES.has(String(intensity.allergenDisplay || "").trim())
      ? String(intensity.allergenDisplay).trim()
      : DEFAULT_MENU_THEME_SETTINGS.allergen_display,
    insight_display: INSIGHT_DISPLAY_STYLES.has(String(intensity.insightDisplay || "").trim())
      ? String(intensity.insightDisplay).trim()
      : DEFAULT_MENU_THEME_SETTINGS.insight_display,
    compare_enabled: intensity.compareEnabled !== false,
    similar_enabled: intensity.similarEnabled !== false,
    indulgence_display: INDULGENCE_DISPLAY_STYLES.has(String(intensity.indulgenceDisplay || "").trim())
      ? String(intensity.indulgenceDisplay).trim()
      : DEFAULT_MENU_THEME_SETTINGS.indulgence_display,
  };
}

export function normalizeMenuThemeSettings(source = {}) {
  const raw = source || {};
  const menuStyle = normalizeMenuStyle(raw.menu_style || raw.theme_preset || "v1");
  const primaryColor = normalizeHexColor(raw.primary_color || raw.accent_color || null);
  const accentColor = normalizeHexColor(raw.accent_color || raw.secondary_color || raw.primary_color || null);
  const intelligenceDefaults = INTELLIGENCE_DEFAULTS_BY_STYLE[menuStyle] || INTELLIGENCE_DEFAULTS_BY_STYLE.v1;
  const backgroundStyle = BACKGROUND_STYLES.has(String(raw.background_style || "").trim())
    ? String(raw.background_style).trim()
    : inferBackgroundStyleFromMenuStyle(menuStyle);
  const heroEnabled = raw.hero_enabled !== undefined
    ? Boolean(raw.hero_enabled)
    : raw.hero_image_enabled !== undefined
      ? Boolean(raw.hero_image_enabled)
      : true;
  const imageDensity = IMAGE_DENSITIES.has(String(raw.image_density || "").trim())
    ? String(raw.image_density).trim()
    : "all";
  const sectionHeadingStyle = HEADING_STYLES.has(String(raw.section_heading_style || "").trim())
    ? String(raw.section_heading_style).trim()
    : "default";
  const itemImageStyle = ITEM_IMAGE_STYLES.has(String(raw.item_image_style || "").trim())
    ? String(raw.item_image_style).trim()
    : imageDensity;
  const pricePlacement = PRICE_PLACEMENTS.has(String(raw.price_placement || "").trim())
    ? String(raw.price_placement).trim()
    : "right";
  const intelligenceDisplayStyle = INTELLIGENCE_DISPLAY_STYLES.has(String(raw.intelligence_display_style || raw.intelligence?.display_style || "").trim())
    ? String(raw.intelligence_display_style || raw.intelligence?.display_style).trim()
    : intelligenceDefaults.intelligence_display_style;
  const intelligenceDensityRaw = String(raw.intelligence_density || raw.intelligence?.density || intelligenceDefaults.intelligence_density).trim();
  const intelligenceDensity = INTELLIGENCE_DENSITIES.has(intelligenceDensityRaw)
    ? intelligenceDensityRaw
    : intelligenceDefaults.intelligence_density;
  const nutritionDisplay = NUTRITION_DISPLAY_STYLES.has(String(raw.nutrition_display || raw.intelligence?.nutrition_display || "").trim())
    ? String(raw.nutrition_display || raw.intelligence?.nutrition_display).trim()
    : intelligenceDefaults.nutrition_display;
  const allergenDisplay = ALLERGEN_DISPLAY_STYLES.has(String(raw.allergen_display || raw.intelligence?.allergen_display || "").trim())
    ? String(raw.allergen_display || raw.intelligence?.allergen_display).trim()
    : intelligenceDefaults.allergen_display;
  const insightDisplay = INSIGHT_DISPLAY_STYLES.has(String(raw.insight_display || raw.intelligence?.insight_display || "").trim())
    ? String(raw.insight_display || raw.intelligence?.insight_display).trim()
    : intelligenceDefaults.insight_display;
  const compareEnabled = raw.compare_enabled !== undefined
    ? Boolean(raw.compare_enabled)
    : raw.intelligence?.compare_enabled !== undefined
      ? Boolean(raw.intelligence.compare_enabled)
      : intelligenceDefaults.compare_enabled;
  const similarEnabled = raw.similar_enabled !== undefined
    ? Boolean(raw.similar_enabled)
    : raw.intelligence?.similar_enabled !== undefined
      ? Boolean(raw.intelligence.similar_enabled)
      : intelligenceDefaults.similar_enabled;
  const indulgenceDisplay = INDULGENCE_DISPLAY_STYLES.has(String(raw.indulgence_display || raw.intelligence?.indulgence_display || "").trim())
    ? String(raw.indulgence_display || raw.intelligence?.indulgence_display).trim()
    : intelligenceDefaults.indulgence_display;

  return {
    menu_style: menuStyle,
    primary_color: primaryColor,
    accent_color: accentColor,
    background_style: backgroundStyle,
    hero_enabled: heroEnabled,
    image_density: imageDensity,
    section_heading_style: sectionHeadingStyle,
    item_image_style: itemImageStyle,
    price_placement: pricePlacement,
    intelligence_display_style: intelligenceDisplayStyle,
    intelligence_density: intelligenceDensity,
    nutrition_display: nutritionDisplay,
    allergen_display: allergenDisplay,
    insight_display: insightDisplay,
    compare_enabled: compareEnabled,
    similar_enabled: similarEnabled,
    indulgence_display: indulgenceDisplay,
  };
}

export function shouldShowHeroImage(settings) {
  return normalizeMenuThemeSettings(settings).hero_enabled !== false;
}

export function shouldShowSectionImages(settings) {
  const normalized = normalizeMenuThemeSettings(settings);
  return normalized.image_density === "all" || normalized.image_density === "section" || normalized.item_image_style === "section";
}

export function shouldShowItemImages(settings) {
  const normalized = normalizeMenuThemeSettings(settings);
  if (normalized.item_image_style === "none") return false;
  if (normalized.item_image_style === "all" || normalized.item_image_style === "thumbnail") return true;
  if (normalized.item_image_style === "section") return false;
  if (normalized.item_image_style === "auto") {
    return normalized.image_density === "all" || normalized.image_density === "thumbnail";
  }
  return normalized.image_density === "all" || normalized.image_density === "thumbnail";
}
