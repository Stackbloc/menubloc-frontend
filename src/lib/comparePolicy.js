/**
 * Side-by-side compare policy (consumer app).
 *
 * Similar Items are pre-vetted by the backend pipeline; anything returned in `similar`
 * is intended to be comparable. Rows include `compare_eligible: true` by contract.
 *
 * - Elsewhere (deep links), call `fetchCompareEligibility` from api.js before offering Compare;
 *   it enforces the same market alignment as GET /menu-items/compare.
 * - `fetchCompareItems` runs an eligibility preflight unless you pass
 *   `{ skipEligibilityCheck: true }` after server-backed `compare_eligible === true`.
 */

/** @param {Record<string, unknown> | null | undefined} entry */
export function isSimilarRowCompareEligible(entry) {
  return entry?.compare_eligible === true;
}
