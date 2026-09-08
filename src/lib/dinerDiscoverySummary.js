/**
 * Compact diner discovery / activity scan lines.
 * Identity: "BrandyS · 22 · USC"
 * Activity: food-emoji + action, then subject · when
 * Food emoji is derived — never user-picked.
 */

import { dinerSexShort } from "./dinerDateOfBirth.js";
import {
  formatActivityScanParts,
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
 * Single-line activity: "🍔 Wanna Eat · Burgers"
 * Prefer formatActivityScanParts for two-line scan UI.
 */
export function formatDinerActivityLine(row = {}) {
  const parts = formatActivityScanParts(row);
  if (parts.detailLine) return `${parts.actionLine} · ${parts.detailLine.split(" · ")[0]}`;
  return parts.actionLine;
}

/**
 * Own hub: "🍽️ Ate" + detail "Chai Tea · @ Starbucks · Breakfast"
 * Returned as single override string with newline for scan row.
 */
export function formatOwnEatingActivityLine(row = {}, opts = {}) {
  const parts = formatActivityScanParts(
    { ...row, kind: row.kind || "ate" },
    opts
  );
  return parts.detailLine
    ? `${parts.actionLine}\n${parts.detailLine}`
    : parts.actionLine;
}

/**
 * Connect peer activity (no identity prefix — row already has name).
 */
export function formatConnectEatingLine(row = {}, opts = {}) {
  const parts = formatActivityScanParts(
    { ...row, kind: row.kind || row.signal_kind || "ate" },
    opts
  );
  return parts.detailLine
    ? `${parts.actionLine}\n${parts.detailLine}`
    : parts.actionLine;
}

/**
 * Who's Eating discovery — identity already on scan row; activity override only.
 * Kept for callers that still want one prose string.
 */
export function formatWhosEatingDiscoveryLine(row = {}, opts = {}) {
  const identity = formatDinerScanIdentity(row, { includeSex: true });
  const parts = formatActivityScanParts(
    { ...row, kind: row.kind || row.signal_kind || "ate" },
    opts
  );
  const activity = parts.detailLine
    ? `${parts.actionLine} · ${parts.detailLine}`
    : parts.actionLine;
  if (!identity) return activity;
  return `${identity}\n${activity}`;
}

export function formatDinerIdentityBits(diner = {}) {
  return formatDinerScanIdentity(diner, { includeSex: true });
}

export function formatDinerDiscoverySummary(row = {}) {
  const identity = formatDinerIdentityBits(row);
  if (!identity) return "";
  const parts = formatActivityScanParts(row);
  return `${identity} · ${parts.actionLine}`;
}

// Re-exports used by older call sites
export { resolveFoodSubject, formatActivityScanParts };
export { iconForFoodInterest, iconForFoodText, liveFeedCategoryLabel };
