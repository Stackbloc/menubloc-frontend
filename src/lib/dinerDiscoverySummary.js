/**
 * Compact diner discovery lines for Who's Eating / Find Diners.
 * Legacy: "SusyQ · F · 25 · USC wants 🍔"
 * Scan model: Avatar + "Name, Age, Affiliation" + "🍔 Wanna Eat · Burgers" (+ ▶ if video)
 */

import { dinerSexShort } from "./dinerDateOfBirth.js";
import { iconForFoodInterest, iconForFoodText } from "./foodInterestIcons.js";
import { liveFeedCategoryLabel } from "./liveFeedCategory.js";

/**
 * School / campus affiliation only — never a geographic location label.
 */
export function resolveDinerAffiliation(diner = {}) {
  return (
    String(
      diner.school_affiliation ||
        diner.edu_institution_short ||
        (diner.edu_verified === true ? diner.edu_institution_name : "") ||
        diner.affiliation ||
        ""
    ).trim() || null
  );
}

/**
 * Activity-first identity: "Name, Age, Affiliation" (no sex; affiliation ≠ location).
 */
export function formatDinerScanIdentity(diner = {}, { includeSex = false } = {}) {
  const name = String(diner.display_name || "").trim();
  if (!name) return "";
  const bits = [name];
  if (includeSex) {
    const sex =
      diner.diner_sex_short ||
      dinerSexShort(diner.diner_sex) ||
      null;
    if (sex) bits.push(sex);
  }
  const age = Number(diner.age_years);
  if (Number.isFinite(age) && age > 0) bits.push(String(Math.trunc(age)));
  const affiliation = resolveDinerAffiliation(diner);
  if (affiliation) bits.push(affiliation);
  return bits.join(", ");
}

/**
 * Human-readable activity line: "🍔 Wanna Eat · Burgers"
 */
export function formatDinerActivityLine(row = {}) {
  const kind = String(row.kind || row.signal_kind || "ate")
    .trim()
    .toLowerCase();
  const subject =
    String(row.food_name || row.item_name || row.menu_item_name || "").trim() || "food";
  const fromKey = row.food_interest_key
    ? iconForFoodInterest(row.food_interest_key)
    : null;
  const icon = row.icon || fromKey || iconForFoodText(subject);
  const labelByKind = {
    want: "Wanna Eat",
    ate: "Ate",
    reviews: "Reviews",
    cooking: "I'm Cooking",
    plan: "Plan",
  };
  const label = labelByKind[kind] || liveFeedCategoryLabel(kind) || "Ate";
  return `${icon} ${label} · ${subject}`;
}

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

/**
 * Own hub emoji activity: "Breakfast. Starbucks - Chai Tea"
 */
export function formatOwnEatingActivityLine(row = {}) {
  const meal = mealPeriodLabelSafe(row.meal_period);
  const restaurant = String(row.restaurant_name || "").trim();
  const food = String(row.food_name || row.item_name || "").trim() || "food";
  const icon =
    row.icon ||
    (row.food_interest_key ? iconForFoodInterest(row.food_interest_key) : null) ||
    iconForFoodText(`${restaurant} ${food}`);
  if (restaurant) return `${icon} ${meal}. ${restaurant} - ${food}`;
  return `${icon} ${meal}. ${food}`;
}

function mealPeriodLabelSafe(id) {
  const key = String(id || "")
    .trim()
    .toLowerCase()
    .replace(/[ -]+/g, "_");
  const map = {
    breakfast: "Breakfast",
    brunch: "Brunch",
    lunch: "Lunch",
    dinner: "Dinner",
    snack: "Snack",
    dessert: "Dessert",
    late_night: "Late Night",
    other: "Other",
  };
  return map[key] || "Meal";
}

/**
 * Connect peer: "Becky is having Starbucks Chai Tea for breakfast"
 */
export function formatConnectEatingLine(row = {}) {
  const name = String(row.display_name || "").trim() || "Diner";
  const restaurant = String(row.restaurant_name || "").trim();
  const food = String(row.food_name || row.item_name || "").trim() || "food";
  const meal = mealPeriodLabelSafe(row.meal_period).toLowerCase();
  const subject = restaurant ? `${restaurant} ${food}` : food;
  return `${name} is having ${subject} for ${meal}`;
}

/**
 * Non-connect Who's Eating:
 * "Becky, F, 21, USC is having Starbucks Chai Tea at Starbucks"
 */
export function formatWhosEatingDiscoveryLine(row = {}) {
  const bits = [];
  const name = String(row.display_name || "").trim();
  if (!name) return "";
  bits.push(name);
  const sex = row.diner_sex_short || dinerSexShort(row.diner_sex) || null;
  if (sex) bits.push(sex);
  const age = Number(row.age_years);
  if (Number.isFinite(age) && age > 0) bits.push(String(Math.trunc(age)));
  const affiliation = resolveDinerAffiliation(row);
  if (affiliation) bits.push(affiliation);
  const identity = bits.join(", ");
  const restaurant = String(row.restaurant_name || "").trim();
  const food = String(row.food_name || row.item_name || "").trim() || "food";
  const dishPhrase = restaurant ? `${restaurant} ${food}` : food;
  if (restaurant) return `${identity} is having ${dishPhrase} at ${restaurant}`;
  return `${identity} is having ${food}`;
}

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
  const school = resolveDinerAffiliation(diner);
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
