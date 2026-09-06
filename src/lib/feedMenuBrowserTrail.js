/**
 * Menu Browser trail — restaurants discussed from open clip through current Feed index.
 * Unique by restaurant_id, order of first appearance. Feed may advance independently;
 * trail only grows; Browse index moves only via explicit swipe / switch.
 */

/**
 * @param {object|null|undefined} ref
 * @returns {{ restaurant_id: string, restaurant_name: string, slug: string, city: string, state: string }|null}
 */
export function normalizeBrowseTrailRef(ref) {
  if (!ref?.restaurant_id && ref?.restaurant_id !== 0) return null;
  const id = String(ref.restaurant_id).trim();
  if (!id) return null;
  return {
    restaurant_id: id,
    restaurant_name: String(ref.restaurant_name || "").trim() || "Restaurant",
    slug: String(ref.slug || "").trim(),
    city: String(ref.city || "").trim(),
    state: String(ref.state || "").trim(),
  };
}

/**
 * Build unique restaurant trail from feed items[fromIndex..toIndex] inclusive.
 * @param {object[]} items
 * @param {number} fromIndex
 * @param {number} toIndex
 * @param {(item: object) => object|null} refFromItem
 */
export function buildBrowseMenuTrail(items, fromIndex, toIndex, refFromItem) {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0 || typeof refFromItem !== "function") return [];
  const start = Math.max(0, Math.min(Number(fromIndex) || 0, list.length - 1));
  const endRaw = Math.max(0, Math.min(Number(toIndex) || 0, list.length - 1));
  const lo = Math.min(start, endRaw);
  const hi = Math.max(start, endRaw);
  const seen = new Set();
  const trail = [];
  for (let i = lo; i <= hi; i += 1) {
    const normalized = normalizeBrowseTrailRef(refFromItem(list[i]));
    if (!normalized) continue;
    if (seen.has(normalized.restaurant_id)) continue;
    seen.add(normalized.restaurant_id);
    trail.push(normalized);
  }
  return trail;
}

/**
 * Clamp trail index into [0, trail.length-1]; empty trail → 0.
 * @param {number} index
 * @param {number} length
 */
export function clampBrowseTrailIndex(index, length) {
  const len = Math.max(0, Number(length) || 0);
  if (len <= 0) return 0;
  const i = Number(index);
  if (!Number.isFinite(i)) return 0;
  return Math.max(0, Math.min(Math.trunc(i), len - 1));
}
