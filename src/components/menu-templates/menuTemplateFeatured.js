/**
 * Helpers to derive featured items from the same section structure as the API.
 */

export function flattenMenuItems(sections) {
  const out = [];
  for (const sec of sections || []) {
    for (const it of sec.items || []) out.push(it);
  }
  return out;
}

/** Prefer deal-linked items first, then fill from menu order. */
export function pickFeaturedMenuItems(sections, dealItems, limit = 8) {
  const dealIds = new Set((dealItems || []).map((d) => d.id).filter(Boolean));
  const flat = flattenMenuItems(sections);
  const dealFirst = flat.filter((it) => it?.id != null && dealIds.has(it.id));
  const rest = flat.filter((it) => it?.id == null || !dealIds.has(it.id));
  const merged = [...dealFirst, ...rest];
  return merged.slice(0, limit);
}
