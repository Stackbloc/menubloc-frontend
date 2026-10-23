/**
 * Helpers for owner menu tabs + section order (menus.section_layout).
 * Mirrors backend src/services/menus/menuSectionLayout.js matching rules.
 */

const DRINK_WORDS = [
  "drink", "beverage", "tea", "coffee", "latte", "espresso", "cappuccino", "mocha",
  "milk", "boba", "slush", "smoothie", "shake", "juice", "soda", "lemonade", "water",
  "frappe", "cold brew", "matcha", "chai", "agua", "horchata", "beer", "wine",
  "cocktail", "sake", "soju", "refresher", "kombucha",
];

function sectionKey(name) {
  return String(name ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

export function looksLikeDrinkSection(name) {
  const key = sectionKey(name);
  return DRINK_WORDS.some((word) => new RegExp(`\\b${word}s?\\b`).test(key));
}

/** Build editable tabs from the stored layout + the menu's real sections. */
export function buildDraftTabs(storedLayout, sectionNames) {
  const names = Array.isArray(sectionNames) ? sectionNames : [];
  const byKey = new Map(names.map((n) => [sectionKey(n), n]));
  const storedTabs = Array.isArray(storedLayout?.tabs) ? storedLayout.tabs : [];
  const placed = new Set();
  const tabs = storedTabs.map((tab) => ({
    label: String(tab?.label || ""),
    sections: (Array.isArray(tab?.sections) ? tab.sections : [])
      .map((s) => byKey.get(sectionKey(s)))
      .filter((n) => n && !placed.has(n) && placed.add(n)),
  }));
  if (tabs.length === 0) tabs.push({ label: "", sections: [] });
  for (const n of names) if (!placed.has(n)) tabs[0].sections.push(n);
  return tabs;
}

/** Editor sections in the saved owner order (tab by tab). */
export function orderSectionsByLayout(sections, storedLayout) {
  const list = Array.isArray(sections) ? sections : [];
  if (!Array.isArray(storedLayout?.tabs) || storedLayout.tabs.length === 0) return list;
  const order = buildDraftTabs(storedLayout, list.map((s) => s.name)).flatMap((t) => t.sections);
  const rank = new Map(order.map((n, i) => [n, i]));
  return [...list].sort((a, b) => (rank.get(a.name) ?? 1e9) - (rank.get(b.name) ?? 1e9));
}

/** Food first, drinks second — keeps each group's current order. */
export function suggestFoodDrinkTabs(sectionNames) {
  const food = [];
  const drinks = [];
  for (const n of sectionNames) (looksLikeDrinkSection(n) ? drinks : food).push(n);
  if (food.length === 0 || drinks.length === 0) return null;
  return [
    { label: "Food", sections: food },
    { label: "Drinks", sections: drinks },
  ];
}
