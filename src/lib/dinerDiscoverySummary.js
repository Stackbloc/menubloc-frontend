/**
 * Compact diner discovery lines for Who's Eating / Find Diners.
 * Example: "SusyQ · F · 25 · USC wants 🍔"
 */

import { dinerSexShort } from "./dinerDateOfBirth.js";
import { iconForFoodInterest, iconForFoodText } from "./foodInterestIcons.js";

/**
 * @param {{
 *   display_name?: string|null,
 *   diner_sex?: string|null,
 *   diner_sex_short?: string|null,
 *   age_years?: number|null,
 *   school_affiliation?: string|null,
 *   edu_institution_short?: string|null,
 *   edu_institution_name?: string|null,
 *   edu_verified?: boolean,
 * }} diner
 */
export function formatDinerIdentityBits(diner = {}) {
  const name = String(diner.display_name || "").trim();
  if (!name) return "";
  const bits = [name];
  const sex =
    diner.diner_sex_short ||
    dinerSexShort(diner.diner_sex) ||
    null;
  if (sex) bits.push(sex);
  const age = Number(diner.age_years);
  if (Number.isFinite(age) && age > 0) bits.push(String(Math.trunc(age)));
  const school =
    String(
      diner.school_affiliation ||
        diner.edu_institution_short ||
        (diner.edu_verified === true ? diner.edu_institution_name : "") ||
        ""
    ).trim() || null;
  if (school) bits.push(school);
  return bits.join(" · ");
}

/**
 * @param {{
 *   display_name?: string|null,
 *   diner_sex?: string|null,
 *   diner_sex_short?: string|null,
 *   age_years?: number|null,
 *   school_affiliation?: string|null,
 *   kind?: string|null,
 *   signal_kind?: string|null,
 *   food_name?: string|null,
 *   food_interest_key?: string|null,
 *   icon?: string|null,
 * }} row
 */
export function formatDinerDiscoverySummary(row = {}) {
  const identity = formatDinerIdentityBits(row);
  if (!identity) return "";
  const kind = String(row.kind || row.signal_kind || "ate").toLowerCase();
  const verb = kind === "want" ? "wants" : "is eating";
  const icon =
    row.icon ||
    iconForFoodInterest(row.food_interest_key) ||
    iconForFoodText(row.food_name);
  return `${identity} ${verb} ${icon}`;
}
