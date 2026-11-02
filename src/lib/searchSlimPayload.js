/**
 * Slim search payload helpers (2026-10-23).
 *
 * /search?slim=1&defer_similar=1 answers without checking similar items, and hidden
 * dishes come trimmed (full detail loads when a dish's Nutrition tab opens).
 * The page then asks POST /menu-items/similar-availability/batch for the dishes
 * on screen; "Show more" already asks for newly revealed ones.
 */

function isKnownAvailability(row) {
  if (row?.has_similar_items === true || row?.has_similar_items === false) return true;
  return row?.similar_availability === "available" || row?.similar_availability === "none";
}

function numericMenuItemId(row) {
  const raw = row?.menu_item_id ?? row?.item_id ?? row?.id;
  const text = raw == null ? "" : String(raw).trim();
  return /^\d+$/.test(text) && Number(text) > 0 ? text : null;
}

function visibleDishesOf(row) {
  if (Array.isArray(row?.qualified_matches) || Array.isArray(row?.matches)) {
    const qualified = Array.isArray(row.qualified_matches) ? row.qualified_matches : [];
    const visibleCount = Number(row.visible_count ?? row.matches?.length ?? 0) || 0;
    return [...(Array.isArray(row.matches) ? row.matches : []), ...qualified.slice(0, visibleCount)];
  }
  return row?.row_type === "restaurant" ? [] : [row];
}

/** Numeric menu item ids on screen whose similar availability is still unknown. */
export function collectVisibleSimilarUnknownIds(rows) {
  const ids = new Set();
  for (const row of Array.isArray(rows) ? rows : []) {
    for (const dish of visibleDishesOf(row)) {
      if (!dish || isKnownAvailability(dish)) continue;
      const id = numericMenuItemId(dish);
      if (id) ids.add(id);
    }
  }
  return [...ids];
}

/** Apply a batch answer to cards (visible + hidden dishes) and plain dish rows. */
export function applySimilarAvailabilityToSearchRows(rows, availability, applyToRows) {
  if (!Array.isArray(rows)) return rows;
  return rows.map((row) => {
    if (Array.isArray(row?.qualified_matches) || Array.isArray(row?.matches)) {
      return {
        ...row,
        ...(Array.isArray(row.qualified_matches)
          ? { qualified_matches: applyToRows(row.qualified_matches, availability) }
          : {}),
        ...(Array.isArray(row.matches) ? { matches: applyToRows(row.matches, availability) } : {}),
      };
    }
    if (row?.row_type === "restaurant") return row;
    return applyToRows([row], availability)[0];
  });
}
