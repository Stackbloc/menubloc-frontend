/**
 * Canonical user-visible food identity labels (primary_family → consumer copy).
 * Internal ontology tokens, similarity tiers, and retrieval mechanics must not
 * surface as labels — use {@link isLeakyOntologyLabel} to filter backend strings.
 *
 * When template assignment confidence is low, prefer {@link PRIMARY_FAMILY_BROAD_LOW_CONFIDENCE}
 * so users see natural categories (“Chicken”, “Side”) instead of fine-grained ontology.
 */

"use strict";

function asStr(v) {
  return v === undefined || v === null ? "" : String(v).trim();
}

/** Below this (0–1), identity labels use broader consumer buckets. */
export const IDENTITY_CONFIDENCE_LOW_THRESHOLD = 0.45;

/**
 * Maps backend PRIMARY_FAMILY → broader label when confidence is low.
 * Avoids implying fine ontology distinctions were reliably assigned.
 */
export const PRIMARY_FAMILY_BROAD_LOW_CONFIDENCE = Object.freeze({
  breaded_chicken: "Chicken",
  chicken_sandwich: "Chicken",
  handheld_steak: "Sandwich",
  sandwich: "Sandwich",
  fried_side: "Side",
  snack_misc: "Snack",
  protein_plate: "Entrée",
  rice_bowl: "Bowl",
  seafood_entree: "Seafood",
  unknown: "Dish",
});

/** Broad strict_type labels when template confidence is low. */
export const STRICT_TYPE_BROAD_LOW_CONFIDENCE = Object.freeze({
  breaded_chicken: "Chicken",
  grilled_chicken_sandwich: "Chicken",
  fried_chicken_sandwich: "Chicken",
  spicy_chicken_sandwich: "Chicken",
  chicken_sandwich: "Chicken",
  french_fries: "Side",
  onion_rings: "Side",
});

/** Authoritative display strings for backend PRIMARY_FAMILY slugs. */
export const PRIMARY_FAMILY_DISPLAY = Object.freeze({
  unknown: null,
  salad: "Salad",
  fried_side: "Fried Side",
  burger: "Burger",
  chicken_sandwich: "Chicken Sandwich",
  sandwich: "Sandwich",
  pizza: "Pizza",
  taco: "Taco",
  burrito: "Burrito",
  pasta: "Pasta",
  soup: "Soup",
  dessert: "Dessert",
  beverage: "Beverage",
  breakfast: "Breakfast",
  seafood_entree: "Seafood",
  steak: "Steak",
  handheld_steak: "Steak Sandwich",
  rice_bowl: "Rice Bowl",
  protein_plate: "Entrée",
  breaded_chicken: "Breaded Chicken",
  snack_misc: null,
});

/** Safe labels for common strict_type slugs when primary_family is absent. */
export const STRICT_TYPE_DISPLAY = Object.freeze({
  burger: "Burger",
  cheeseburger: "Cheeseburger",
  chicken_sandwich: "Chicken Sandwich",
  grilled_chicken_sandwich: "Chicken Sandwich",
  fried_chicken_sandwich: "Chicken Sandwich",
  spicy_chicken_sandwich: "Chicken Sandwich",
  breaded_chicken: "Breaded Chicken",
  french_fries: "Fried Side",
  onion_rings: "Fried Side",
  salad: "Salad",
  caesar_salad: "Salad",
  ribeye_steak: "Steak",
  t_bone_steak: "Steak",
  taco: "Taco",
  pizza: "Pizza",
});

/**
 * Strings that must not appear on user-facing identity / match lines.
 * (Serving/prep may appear elsewhere; this guards the primary Match strip.)
 */
export function isLeakyOntologyLabel(text) {
  const s = asStr(text);
  if (!s) return true;
  const lower = s.toLowerCase();
  if (
    /\b(adjacent|compatible|heuristic|ontology|fallback|similarity|expansion|inference|semantic\s+retrieve)\b/i.test(
      lower
    )
  ) {
    return true;
  }
  if (/-style\b|style\s+prep|sandwich-style|handheld-style|burger-adjacent|sandwich-compatible/i.test(lower)) {
    return true;
  }
  if (/\b(structural|compatibility|tier\s*\d|sparse\s+fallback|uncertain|low\s+confidence)\b/i.test(lower)) return true;
  return false;
}

/**
 * Template / family confidence on search rows (0–1). When present and low, UI uses broader labels.
 * @param {Record<string, unknown>|null|undefined} row
 * @returns {number|null}
 */
export function pickIdentityConfidence(row) {
  const r = row?.item && typeof row.item === "object" ? row.item : row;
  if (!r || typeof r !== "object") return null;
  const raw = r.template_confidence_score ?? r.family_confidence ?? r.dish_template_confidence;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.min(1, Math.max(0, n));
}

/** @param {Record<string, unknown>|null|undefined} row */
export function hasLowIdentityConfidence(row) {
  const c = pickIdentityConfidence(row);
  if (c == null) return false;
  return c < IDENTITY_CONFIDENCE_LOW_THRESHOLD;
}

/**
 * @param {string|null|undefined} slug
 * @param {{ lowConfidence?: boolean }} [options]
 * @returns {string|null}
 */
export function labelFromPrimaryFamily(slug, options = {}) {
  const low = options.lowConfidence === true;
  const k = asStr(slug).toLowerCase().replace(/\s+/g, "_");
  if (!k || k === "unknown") {
    return low ? PRIMARY_FAMILY_BROAD_LOW_CONFIDENCE.unknown || "Dish" : null;
  }
  if (low && Object.prototype.hasOwnProperty.call(PRIMARY_FAMILY_BROAD_LOW_CONFIDENCE, k)) {
    return PRIMARY_FAMILY_BROAD_LOW_CONFIDENCE[k];
  }
  if (!Object.prototype.hasOwnProperty.call(PRIMARY_FAMILY_DISPLAY, k)) return null;
  const hit = PRIMARY_FAMILY_DISPLAY[k];
  return hit == null || hit === "" ? null : hit;
}

/**
 * @param {string|null|undefined} strictType
 * @param {{ lowConfidence?: boolean }} [options]
 * @returns {string|null}
 */
export function labelFromStrictType(strictType, options = {}) {
  const low = options.lowConfidence === true;
  const k = asStr(strictType).toLowerCase();
  if (!k) return null;
  if (low && Object.prototype.hasOwnProperty.call(STRICT_TYPE_BROAD_LOW_CONFIDENCE, k)) {
    return STRICT_TYPE_BROAD_LOW_CONFIDENCE[k];
  }
  return STRICT_TYPE_DISPLAY[k] ?? null;
}
