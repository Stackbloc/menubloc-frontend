/**
 * Place Food list excerpt — fill the name/price gap with a short
 * decision-helper line when CK description exists.
 */

/**
 * @param {string|null|undefined} clusterSlug
 * @returns {boolean}
 */
export function clusterShowsDishExcerpt(clusterSlug) {
  return Boolean(String(clusterSlug || "").trim());
}

/**
 * @param {object|string|null|undefined} itemOrText
 * @param {{ maxLength?: number }} [opts]
 * @returns {string|null}
 */
export function formatClusterDishExcerpt(itemOrText, { maxLength = 110 } = {}) {
  const raw =
    typeof itemOrText === "string"
      ? itemOrText
      : itemOrText?.description || itemOrText?.item_description || itemOrText?.short_description || "";
  let text = String(raw || "").replace(/\s+/g, " ").trim();
  if (!text) return null;

  // Seed/PoC disclaimer — keep the edible part for diner decisions.
  text = text.replace(/\s*Reference item\s*[—–-].*$/i, "").trim();
  if (!text) return null;

  const limit = Math.max(40, Number(maxLength) || 110);
  if (text.length <= limit) return text;
  const sliced = text.slice(0, limit - 1);
  const cut = Math.max(sliced.lastIndexOf(" "), Math.floor(limit * 0.6));
  return `${sliced.slice(0, cut).trimEnd()}…`;
}
