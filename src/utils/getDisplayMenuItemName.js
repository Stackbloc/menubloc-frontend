import { getLocalizedField } from "./getLocalizedField.js";
import { formatMenuItemName } from "./formatMenuItemName.js";

const MENU_ITEM_NAME_FIELDS = [
  "search_display_name",
  "menu_item_name",
  "menuItemName",
  "item_name",
  "item_title",
  "title",
  "name",
  "dish",
];

/**
 * Resolve a localized menu item name and apply display formatting.
 * @param {object|string|null|undefined} source
 * @param {string} [language]
 * @param {string} [fallback]
 */
export function getDisplayMenuItemName(source, language = "en", fallback = "") {
  if (source == null) return formatMenuItemName(fallback);
  if (typeof source === "string") return formatMenuItemName(source || fallback);

  const record = source?.item && typeof source.item === "object" ? source.item : source;

  for (const field of MENU_ITEM_NAME_FIELDS) {
    const value = getLocalizedField(record, field, language, "");
    if (value) return formatMenuItemName(value);
  }

  return formatMenuItemName(fallback);
}
