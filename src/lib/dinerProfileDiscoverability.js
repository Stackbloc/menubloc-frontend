/**
 * Profile discoverability — product audiences (no "Nobody" in UI).
 * Mirrors backend dinerProfileDiscoverability.js
 */

export const DISCOVERABILITY_UI_OPTIONS = Object.freeze([
  {
    value: "anyone",
    label: "Anyone",
    hint: "Broadest audience for activity surfaces. Find Diners already lets signed-in members search by name, phone, email, hometown, or city.",
  },
  {
    value: "area",
    label: "People in my area",
    hint: "Prefer diners who share your primary city for activity surfaces.",
  },
  {
    value: "connections",
    label: "My connections",
    hint: "Prefer accepted Menuply connections for activity surfaces.",
  },
]);

export function canonicalizeDiscoverability(value) {
  const key = String(value || "")
    .trim()
    .toLowerCase();
  if (key === "members") return "anyone";
  if (key === "anyone" || key === "area" || key === "connections") return key;
  if (key === "nobody" || key === "edu") return key;
  return "anyone";
}

export function discoverabilityLabel(value) {
  const canonical = canonicalizeDiscoverability(value);
  if (canonical === "nobody") return "Legacy hidden — choose an audience";
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
