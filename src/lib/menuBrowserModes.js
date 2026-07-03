/**
 * Yellow Browser modes — Food and Drinks share one catalog reader.
 */

export const MENU_BROWSER_MODES = [
  { id: "food", label: "Food" },
  { id: "drinks", label: "Drinks" },
];

export const MENU_BROWSER_DEFAULT_MODE = "food";

export function normalizeMenuBrowserMode(value) {
  const key = String(value || "").trim().toLowerCase();
  return MENU_BROWSER_MODES.some((entry) => entry.id === key) ? key : MENU_BROWSER_DEFAULT_MODE;
}

export function toMenuBrowserModeTranslationKey(modeId) {
  return `menuBrowser.mode.${String(modeId || "").replace(/-/g, "_")}`;
}
