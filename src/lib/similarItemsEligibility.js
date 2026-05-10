/**
 * Mirror of backend similarItemsEligibility — filters cross-restaurant search rows only.
 */

const NAME_PREFIX_RES = [
  /^add-on\b/i,
  /^add\b/i,
  /^extra\b/i,
  /^side\s+of\b/i,
  /^substitute\b/i,
  /^upgrade\b/i,
  /^make\s+it\b/i,
  /^combo\b/i,
  /^meal\s+add-on\b/i,
  /^meal\s+addon\b/i,
];

const SECTION_EXCLUDE_RES = /\b(add[\s-]?ons?|modifiers?|customizations?|toppings?\s*&\s*sauces?|sauce\s+options?|extras?\s+upcharge)\b/i;

function primaryName(row) {
  const n =
    row?.name ??
    row?.item_name ??
    row?.menu_item_name ??
    row?.search_display_name ??
    "";
  return String(n || "").trim();
}

function primarySection(row) {
  return String(row?.category ?? row?.section_name ?? row?.section ?? "").trim();
}

function normalizedItemType(row) {
  return String(row?.item_type ?? row?.menu_item_type ?? "").trim().toLowerCase();
}

function normalizedKind(row) {
  return String(row?.menu_item_kind ?? row?.item_kind ?? "").trim().toLowerCase();
}

export function isExcludedModifierOrAddOnMenuItem(row) {
  if (!row || typeof row !== "object") return true;

  const name = primaryName(row);
  const nameLower = name.toLowerCase();
  if (name) {
    for (const re of NAME_PREFIX_RES) {
      if (re.test(nameLower)) return true;
    }
  }

  const it = normalizedItemType(row);
  if (
    it &&
    /^(modifier|add-?on|addon|option|topping|sauce|extra|customization|custom|side_item|side-item)$/.test(it)
  ) {
    return true;
  }

  const kind = normalizedKind(row);
  if (
    kind &&
    /(modifier|add_?on|addon|option|topping|sauce|extra|customization|custom|side_upcharge)/.test(kind)
  ) {
    return true;
  }

  const role = String(row?.item_role ?? row?.menu_row_role ?? "").trim().toLowerCase();
  if (role && /^(modifier|addon|add_on|option|topping)$/.test(role)) return true;

  const sel = String(row?.selection_type ?? "").trim().toLowerCase();
  if (sel && /^(modifier|optional|add-?on)$/.test(sel)) return true;

  const section = primarySection(row).toLowerCase();
  if (section && SECTION_EXCLUDE_RES.test(section)) return true;

  return false;
}

export function filterEligibleSimilarMenuItems(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.filter((r) => !isExcludedModifierOrAddOnMenuItem(r));
}
