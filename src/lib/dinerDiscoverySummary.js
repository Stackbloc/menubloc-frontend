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
 * Who's Eating discovery — full prose sentence when identity present.
 */
export function formatWhosEatingDiscoveryLine(row = {}, opts = {}) {
  return formatActivityProseSentence(
    row,
    { ...row, kind: row.kind || row.signal_kind || "ate" },
    { includeSex: true, ...opts }
  );
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
