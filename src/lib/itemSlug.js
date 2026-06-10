/** Convert an item name to a URL-safe slug. */
export function toItemSlug(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Find an item within menu sections by its URL slug.
 * The backend includes a pre-computed `slug` field on each item.
 * Falls back to client-side slug derivation if `slug` is absent.
 */
export function findItemBySlug(sections, targetSlug) {
  for (const section of (sections || [])) {
    for (const item of (section.items || [])) {
      const slug = item.slug || toItemSlug(item.name || item.item_name || "");
      if (slug === targetSlug) return item;
    }
  }
  return null;
}
