/**
 * Coachella Food list excerpt trial — fill the name/price gap with a short
 * decision-helper line when CK description exists.
 */

export const CLUSTER_DISH_EXCERPT_TRIAL_SLUGS = Object.freeze(["coachella-2027"]);

export function clusterShowsDishExcerpt(clusterSlug) {
  return CLUSTER_DISH_EXCERPT_TRIAL_SLUGS.includes(String(clusterSlug || "").trim().toLowerCase());
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
