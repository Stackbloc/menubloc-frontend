/**
 * Compact diner discovery / activity scan lines.
 * Identity: "BrandyS · 22 · USC"
 * Activity: food-emoji + action, then subject · when
 * Food emoji is derived — never user-picked.
 */

import { dinerSexShort } from "./dinerDateOfBirth.js";
import {
  formatActivityScanParts,
  formatActivityProseClause,
  resolveFoodSubject,
} from "./dinerSocialEmojiLanguage.js";
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
 * Who's Eating affiliation: one label only.
 * College / school takes precedence over occupation (e.g. USC over "Software developer").
 */
export function resolveWhosEatingAffiliation(diner = {}) {
  const college = resolveDinerAffiliation(diner);
  if (college) return college;
  const occupation = String(diner.diner_occupation || diner.occupation || "").trim();
  return occupation || null;
}

/**
 * Activity-first identity: "Name · Age · Affiliation" (optional sex).
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
  return bits.join(" · ");
}

/**
 * Who's Eating continuous identity: "ScreenName, Sex, Age, Affiliation".
 * Affiliation = college else occupation. Sex/age/affiliation omitted when unknown.
 */
export function formatWhosEatingScanIdentity(diner = {}) {
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
  const affiliation = resolveWhosEatingAffiliation(diner);
  if (affiliation) bits.push(affiliation);
  return bits.join(", ");
}

/**
 * Full peer/profile sentence:
 * "BeckG, F, 22, USC is eating Double-Double at In-N-Out."
 */
export function formatActivityProseSentence(diner = {}, activity = {}, opts = {}) {
  const identity = formatDinerScanIdentity(diner, {
    includeSex: opts.includeSex !== false,
  }).replace(/ · /g, ", ");
  const clause = formatActivityProseClause(activity);
  if (!identity) return `${clause.charAt(0).toUpperCase()}${clause.slice(1)}.`;
  return `${identity} ${clause}.`;
}

/**
 * Single-line activity prose clause.
 */
export function formatDinerActivityLine(row = {}) {
  return formatActivityProseClause(row);
}

/**
 * Own hub activity override — prose clause only (identity rendered by scan row).
 */
export function formatOwnEatingActivityLine(row = {}, opts = {}) {
  return formatActivityProseClause({ ...row, kind: row.kind || "ate" }, opts);
}

/**
 * Connect peer activity (no identity prefix — row already has name).
 */
export function formatConnectEatingLine(row = {}, opts = {}) {
  return formatActivityProseClause(
    { ...row, kind: row.kind || row.signal_kind || "ate" },
    opts
  );
}

/**
 * Who's Eating dish label — menu item only, never the restaurant brand.
 * Prefer CK/item_name; skip any candidate that matches the restaurant name.
 */
export function resolveWhosEatingFoodLabel(row = {}) {
  const restaurant = String(
    row.restaurant_name ||
      row.referenced_restaurant?.restaurant_name ||
      row.referenced_restaurant?.name ||
      ""
  )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  const candidates = [
    row.item_name,
    row.menu_item_name,
    row.food_name,
    row.food,
  ];
  for (const raw of candidates) {
    const food = String(raw || "").trim();
    if (!food || food === "Food") continue;
    const norm = food.toLowerCase().replace(/\s+/g, " ");
    if (restaurant && norm === restaurant) continue;
    return food;
  }
  return null;
}

/**
 * Who's Eating discovery — continuous:
 * "ScreenName, Sex, Age, Affiliation is eating [menu item] at [restaurant|@home]."
 * Never "is eating Restaurant at Restaurant".
 */
export function formatWhosEatingDiscoveryLine(row = {}, opts = {}) {
  void opts;
  const identity = formatWhosEatingScanIdentity(row);
  const homemade = row.homemade === true || row.cooking === true;
  const restaurant = String(row.restaurant_name || "").trim();
  const food = resolveWhosEatingFoodLabel({ ...row, restaurant_name: restaurant });
  let clause;
  if (homemade) {
    clause = `is eating ${food || "food"} at @home`;
  } else if (food && restaurant) {
    clause = `is eating ${food} at ${restaurant}`;
  } else if (restaurant) {
    clause = `is eating at ${restaurant}`;
  } else if (food) {
    clause = `is eating ${food}`;
  } else {
    clause = "is eating";
  }
  if (!identity) return `${clause.charAt(0).toUpperCase()}${clause.slice(1)}.`;
  return `${identity} ${clause}.`;
}

export function formatDinerIdentityBits(diner = {}) {
  return formatDinerScanIdentity(diner, { includeSex: true });
}

export function formatDinerDiscoverySummary(row = {}) {
  return formatActivityProseSentence(row, row, { includeSex: true });
}

// Re-exports used by older call sites
export {
  resolveFoodSubject,
  formatActivityScanParts,
  formatActivityProseClause,
};
export { iconForFoodInterest, iconForFoodText, liveFeedCategoryLabel };
