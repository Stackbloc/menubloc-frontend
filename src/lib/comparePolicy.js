/**
 * Side-by-side compare policy (consumer app).
 *
 * Eligibility matches GET /menu-items/compare (canonical class + primary food family).
 * - Similar Items responses include `compare_eligible` per row — only show Compare when true.
 * - Elsewhere, call `fetchCompareEligibility` from api.js before offering Compare.
 * - `fetchCompareItems` runs an eligibility preflight unless you pass
 *   `{ skipEligibilityCheck: true }` after server-backed `compare_eligible === true`.
 */

/** @param {Record<string, unknown> | null | undefined} entry */
export function isSimilarRowCompareEligible(entry) {
  return entry?.compare_eligible === true;
}
