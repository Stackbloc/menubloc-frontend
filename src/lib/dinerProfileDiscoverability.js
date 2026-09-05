/**
 * Profile discoverability — product audiences (no "Nobody" in UI).
 * Mirrors backend dinerProfileDiscoverability.js
 */

export const DISCOVERABILITY_UI_OPTIONS = Object.freeze([
  {
    value: "anyone",
    label: "Anyone",
    hint: "Any signed-in diner can find you by name, phone, or email.",
  },
  {
    value: "area",
    label: "People in my area",
    hint: "Diners who share your primary city can find you.",
  },
  {
    value: "connections",
    label: "My connections",
    hint: "Only your accepted Menuply connections can find you in search.",
  },
]);

export function canonicalizeDiscoverability(value) {
  const key = String(value || "")
    .trim()
    .toLowerCase();
  if (key === "members") return "anyone";
  if (key === "anyone" || key === "area" || key === "connections") return key;
  if (key === "nobody" || key === "edu") return key;
  return "area";
}

export function discoverabilityLabel(value) {
  const canonical = canonicalizeDiscoverability(value);
  if (canonical === "nobody") return "Hidden — choose who can find you";
  if (canonical === "edu") return ".edu users only (coming later)";
  const opt = DISCOVERABILITY_UI_OPTIONS.find((o) => o.value === canonical);
  return opt ? opt.label : canonical;
}

/** UI selection value — legacy nobody stays until diner picks a product option. */
export function discoverabilityForEditor(value) {
  const canonical = canonicalizeDiscoverability(value);
  if (canonical === "nobody" || canonical === "edu") return "";
  return canonical;
}
