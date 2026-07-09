/**
 * Search result card enrichment — pure helpers over existing API fields only.
 * No ranking, parsing, or schema changes.
 *
 * Match-line identity: consumer-safe labels only — never ontology fallbacks,
 * similarity tiers, or structural compatibility jargon ({@link foodIdentityDisplay.js}).
 *
 * Intent-aware nutrition display contract:
 * - Nutrition-intent queries (e.g. "low sodium", "high protein", "keto") show
 *   ONLY the matching macro on the initial search card preview strip.
 * - Unrelated macros must not appear until the user opens the Nutrition panel.
 * - Backend may trim search payloads to intent fields; these helpers mirror that
 *   contract on the client for preview chips and macro presence checks.
 */

import {
  hasLowIdentityConfidence,
  isLeakyOntologyLabel,
  labelFromPrimaryFamily,
  labelFromStrictType,
} from "./foodIdentityDisplay.js";

function asNum(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asStr(v) {
  return v === undefined || v === null ? "" : String(v).trim();
}

function pick(obj, keys, fallback = "") {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && asStr(v) !== "") return v;
  }
  return fallback;
}

function toTitleWords(s) {
  return asStr(s)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Query-aligned match reasons — OK on the Match strip before canonical identity. */
const USER_QUERY_MATCH_TYPES = new Set(["nutrient", "dietary", "ingredient", "price"]);

const MACRO_FIELD_GROUPS = Object.freeze({
  low_sodium: ["sodium_mg"],
  high_protein: ["protein_g"],
  low_carb: ["carbs_g", "net_carbs"],
  low_calorie: ["calories_kcal", "calories"],
  low_sugar: ["sugar_g"],
  low_fat: ["fat_g"],
  high_fiber: ["fiber_g"],
});

function sanitizeIdentityCandidate(raw) {
  const t = asStr(raw);
  if (!t || isLeakyOntologyLabel(t)) return null;
  return t.length > 120 ? t.slice(0, 120) : t;
}

function getNutritionChip(row) {
  if (row?.chips?.nutrition_chip) return row.chips.nutrition_chip;
  if (row?.item?.chips?.nutrition_chip) return row.item.chips.nutrition_chip;
  return {};
}

function readMacroValue(row, chip, field) {
  if (field === "calories_kcal" || field === "calories") {
    return asNum(chip.calories_kcal ?? chip.calories ?? row?.calories_kcal ?? row?.calories);
  }
  if (field === "net_carbs") {
    const carbs = asNum(chip.carbs_g ?? row?.carbs_g);
    const fiber = asNum(chip.fiber_g ?? row?.fiber_g);
    if (chip.net_carbs != null) return asNum(chip.net_carbs);
    if (carbs == null) return null;
    return fiber != null ? Math.max(0, Math.round((carbs - fiber) * 10) / 10) : carbs;
  }
  return asNum(chip[field] ?? row?.[field]);
}

/** Active nutrition-intent keys for the current query (e.g. low_sodium, low_carb). */
export function resolveNutritionIntentDisplayKeys(queryMeta) {
  const parsed = queryMeta && typeof queryMeta === "object" ? queryMeta : {};
  const nutritionIntent = parsed.nutrition_intent || {};
  const constraints = parsed.nutrient_constraints || {};
  const diet = parsed.diet || {};
  const smartNc = parsed.smart?.nutrition_constraints || {};
  const active = [];

  if (
    nutritionIntent.low_sodium === true ||
    diet.low_sodium === true ||
    constraints?.sodium?.direction === "low" ||
    smartNc.sodium_max != null
  ) {
    active.push("low_sodium");
  }
  if (
    nutritionIntent.high_protein === true ||
    diet.high_protein === true ||
    constraints?.protein?.direction === "high" ||
    smartNc.protein_min != null
  ) {
    active.push("high_protein");
  }
  if (
    nutritionIntent.low_carb === true ||
    diet.keto === true ||
    diet.low_carb === true ||
    constraints?.carbs?.direction === "low" ||
    smartNc.carbs_max != null ||
    smartNc.net_carbs_max != null
  ) {
    active.push("low_carb");
  }
  if (
    nutritionIntent.low_calorie === true ||
    diet.low_calorie === true ||
    constraints?.calories?.direction === "low" ||
    constraints?.calories?.explicit === true ||
    smartNc.calories_max != null
  ) {
    active.push("low_calorie");
  }
  if (
    nutritionIntent.low_sugar === true ||
    constraints?.sugar?.direction === "low" ||
    smartNc.sugar_max != null
  ) {
    active.push("low_sugar");
  }
  if (
    nutritionIntent.low_fat === true ||
    diet.low_fat === true ||
    constraints?.fat?.direction === "low" ||
    smartNc.fat_max != null
  ) {
    active.push("low_fat");
  }
  if (
    nutritionIntent.high_fiber === true ||
    diet.high_fiber === true ||
    constraints?.fiber?.direction === "high" ||
    smartNc.fiber_min != null
  ) {
    active.push("high_fiber");
  }

  return active;
}

export function isNutritionIntentDisplayActive(queryMeta) {
  return resolveNutritionIntentDisplayKeys(queryMeta).length > 0;
}

/** True when the search query expects calories/macros on the first results screen. */
export function queryRequiresNutritionDisplay(queryMeta) {
  if (isNutritionIntentDisplayActive(queryMeta)) return true;

  const parsed = queryMeta && typeof queryMeta === "object" ? queryMeta : {};
  const nutritionIntent = parsed.nutrition_intent || {};
  if (Object.values(nutritionIntent).some(Boolean)) return true;

  const constraints = parsed.nutrient_constraints || {};
  for (const entry of Object.values(constraints)) {
    if (!entry || typeof entry !== "object") continue;
    if (entry.explicit || entry.mentioned || entry.direction) return true;
  }

  const smartNc = parsed.smart?.nutrition_constraints || {};
  if (Object.keys(smartNc).length > 0) return true;

  return false;
}

export function rowHasNutritionMacros(row, queryMeta = null) {
  const chip = getNutritionChip(row);
  const intentKeys = resolveNutritionIntentDisplayKeys(queryMeta);

  if (intentKeys.length > 0) {
    for (const intentKey of intentKeys) {
      for (const field of MACRO_FIELD_GROUPS[intentKey] || []) {
        if (readMacroValue(row, chip, field) !== null) return true;
      }
    }
    return false;
  }

  return (
    asNum(chip.calories_kcal ?? chip.calories ?? row?.calories) !== null ||
    asNum(chip.protein_g ?? row?.protein_g) !== null ||
    asNum(chip.sodium_mg ?? row?.sodium_mg) !== null ||
    asNum(chip.carbs_g ?? row?.carbs_g) !== null ||
    asNum(chip.sugar_g ?? row?.sugar_g) !== null ||
    asNum(chip.fat_g ?? row?.fat_g) !== null
  );
}

function getPairingsChip(row) {
  if (row?.chips?.pairings_chip) return row.chips.pairings_chip;
  if (row?.item?.chips?.pairings_chip) return row.item.chips.pairings_chip;
  return {};
}

/**
 * Best single "why matched" label for the intelligence strip.
 * Prefers query-aligned reasons (nutrition, diet, ingredient, price), then
 * canonical identity from primary_family — never ontology canonical noise.
 */
export function buildWhyMatchLabel(row, queryMeta) {
  const v1 = Array.isArray(row?.match_reasons_v1)
    ? row.match_reasons_v1
    : Array.isArray(row?.item?.match_reasons_v1)
      ? row.item.match_reasons_v1
      : [];
  if (v1.length) {
    const sorted = [...v1].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
    for (const r of sorted) {
      const typ = asStr(r?.type).toLowerCase();
      const lab = sanitizeIdentityCandidate(r?.label);
      if (!lab) continue;
      if (USER_QUERY_MATCH_TYPES.has(typ)) return lab;
    }
  }

  const identityOpts = { lowConfidence: hasLowIdentityConfidence(row) };
  const identityFromFamily = labelFromPrimaryFamily(pick(row, ["primary_family"], ""), identityOpts);
  if (identityFromFamily) return identityFromFamily;

  const structured = Array.isArray(row?.match_reasons_structured)
    ? row.match_reasons_structured
    : Array.isArray(row?.item?.match_reasons_structured)
      ? row.item.match_reasons_structured
      : [];
  for (const s of structured) {
    const token = s?.token ?? s?.label ?? s?.term;
    if (!token) continue;
    const candidate = toTitleWords(token);
    if (!isLeakyOntologyLabel(candidate)) return candidate;
  }

  const legacy = Array.isArray(row?.match_reasons)
    ? row.match_reasons
    : Array.isArray(row?.item?.match_reasons)
      ? row.item.match_reasons
      : [];
  for (const r of legacy) {
    const t = asStr(r);
    if (!t) continue;
    if (/^ingredient match:/i.test(t)) continue;
    if (/^inferred ingredient/i.test(t)) continue;
    const shortened = t.replace(/^[^:]+:\s*/, "").trim();
    const cand = (shortened || t).slice(0, 120);
    if (!isLeakyOntologyLabel(cand)) return cand;
  }

  const templateName = pick(row, ["template_name", "menu_template_name"], "");
  if (templateName) {
    const titled = toTitleWords(templateName);
    if (!isLeakyOntologyLabel(titled)) return titled;
  }

  const strictMapped = labelFromStrictType(pick(row, ["strict_type"], ""), identityOpts);
  if (strictMapped) return strictMapped;

  const strictRaw = pick(row, ["strict_type"], "");
  if (strictRaw) {
    const titled = toTitleWords(strictRaw);
    if (!isLeakyOntologyLabel(titled)) return titled;
  }

  return null;
}

function insightLevelKey(level) {
  return asStr(level).toLowerCase();
}

function proteinPass(backendScores, proteinG) {
  const bs = backendScores?.protein_strength;
  if (bs && bs.score != null && Number.isFinite(bs.score)) {
    const lvl = insightLevelKey(bs.level);
    if (lvl && (lvl.includes("excellent") || lvl.includes("good") || lvl.includes("high"))) return true;
    return bs.score >= 6;
  }
  if (proteinG != null && proteinG >= 25) return true;
  return false;
}

function sodiumPass(backendScores, sodiumMg) {
  const bs = backendScores?.sodium_risk;
  if (bs && bs.score != null && Number.isFinite(bs.score)) {
    const lvl = insightLevelKey(bs.level);
    if (lvl.includes("low")) return true;
    return bs.score <= 4;
  }
  if (sodiumMg != null && sodiumMg <= 600) return true;
  return false;
}

function fatPass(backendScores, fatG) {
  const bs = backendScores?.fat_risk ?? backendScores?.saturated_fat_risk;
  if (bs && bs.score != null && Number.isFinite(bs.score)) {
    const lvl = insightLevelKey(bs.level);
    if (lvl.includes("low")) return true;
    return bs.score <= 4;
  }
  if (fatG != null && fatG <= 15) return true;
  return false;
}

/**
 * Compact nutrition preview chips for the initial search card.
 * Intent-aware mode: one chip per active nutrition intent only — no unrelated fillers.
 * Returns [{ label: string, primary: boolean }].
 */
export function buildNutritionPreviewChips(row, queryMeta) {
  const parsed = queryMeta && typeof queryMeta === "object" ? queryMeta : {};
  const nutritionIntent = parsed.nutrition_intent || {};
  const constraints = parsed.nutrient_constraints || {};
  const diet = parsed.diet || {};
  const intentKeys = resolveNutritionIntentDisplayKeys(queryMeta);
  const intentDisplayActive = intentKeys.length > 0;

  const chip = getNutritionChip(row);
  const cal = readMacroValue(row, chip, "calories_kcal");
  const pro = readMacroValue(row, chip, "protein_g");
  const fat = readMacroValue(row, chip, "fat_g");
  const carbs = readMacroValue(row, chip, "carbs_g");
  const netCarbs = readMacroValue(row, chip, "net_carbs");
  const sodium = readMacroValue(row, chip, "sodium_mg");
  const fiber = readMacroValue(row, chip, "fiber_g");
  const sugar = readMacroValue(row, chip, "sugar_g");

  const backendScores = row?.chips?.insights?.scores || row?.item?.chips?.insights?.scores;

  const out = [];
  const push = (label, primary = false) => {
    if (!label || out.length >= 3) return;
    out.push({ label, primary });
  };

  const wantsProtein =
    intentKeys.includes("high_protein") ||
    constraints?.protein?.direction === "high" ||
    nutritionIntent.high_protein === true ||
    diet.high_protein === true;
  const wantsSodium =
    intentKeys.includes("low_sodium") ||
    constraints?.sodium?.direction === "low" ||
    nutritionIntent.low_sodium === true ||
    diet.low_sodium === true;
  const wantsFat =
    intentKeys.includes("low_fat") ||
    constraints?.fat?.direction === "low" ||
    nutritionIntent.low_fat === true ||
    diet.low_fat === true;
  const wantsCarbs =
    intentKeys.includes("low_carb") ||
    constraints?.carbs?.direction === "low" ||
    nutritionIntent.low_carb === true ||
    diet.low_carb === true ||
    diet.keto === true;
  const wantsFiber =
    intentKeys.includes("high_fiber") ||
    constraints?.fiber?.direction === "high" ||
    nutritionIntent.high_fiber === true ||
    diet.high_fiber === true;
  const wantsCalories =
    intentKeys.includes("low_calorie") ||
    constraints?.calories?.direction === "low" ||
    constraints?.calories?.explicit === true ||
    nutritionIntent.low_calorie === true ||
    diet.low_calorie === true ||
    parsed.smart?.nutrition_constraints?.calories_max != null;
  const wantsSugar =
    intentKeys.includes("low_sugar") ||
    constraints?.sugar?.direction === "low" ||
    nutritionIntent.low_sugar === true;

  if (wantsProtein) {
    if (pro != null) push(`${Math.round(pro)}g protein`, true);
    else push(proteinPass(backendScores, pro) ? "High protein ✓" : "High protein —", true);
  }

  if (wantsSodium) {
    if (sodium != null) push(`${Math.round(sodium)}mg sodium`, true);
    else push(sodiumPass(backendScores, sodium) ? "Low sodium ✓" : "Sodium —", true);
  }

  if (wantsFat) {
    if (fat != null) push(`${Math.round(fat)}g fat`, true);
    else push(fatPass(backendScores, fat) ? "Low fat ✓" : "Low fat —", true);
  }

  if (wantsCarbs) {
    if (netCarbs != null) push(`${netCarbs}g net carbs`, true);
    else if (carbs != null) push(`${Math.round(carbs)}g carbs`, true);
    else push("Carbs —", true);
  }

  if (wantsSugar) {
    if (sugar != null) push(`${Math.round(sugar * 10) / 10}g sugar`, true);
    else push("Sugar —", true);
  }

  if (wantsFiber) {
    if (fiber != null) push(`${Math.round(fiber)}g fiber`, true);
    else push("Fiber —", true);
  }

  if (wantsCalories) {
    if (cal != null) push(`${Math.round(cal)} cal`, true);
    else push("Calories —", true);
  }

  // Intent-aware contract: never backfill unrelated macros on nutrition-intent searches.
  if (intentDisplayActive) {
    return out.slice(0, 3);
  }

  const alreadyHasProtein = out.some((c) => c.label.includes("protein"));
  const alreadyHasCalories = out.some((c) => c.label.includes(" cal"));
  if (cal != null && !alreadyHasCalories) push(`${Math.round(cal)} cal`);
  if (pro != null && !alreadyHasProtein) push(`${Math.round(pro)}g protein`);

  return out.slice(0, 3);
}

export function formatPairingTeaser(row) {
  const pc = getPairingsChip(row);
  const raw = pc?.suggestions;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const labels = [];
  for (const s of raw) {
    if (labels.length >= 3) break;
    if (typeof s === "string") {
      const t = asStr(s);
      if (t) labels.push(t);
      continue;
    }
    if (s && typeof s === "object") {
      const t = asStr(s.name ?? s.label ?? s.title ?? s.item_name);
      if (t) labels.push(t);
    }
  }
  if (!labels.length) return null;
  return `Pairs with ${labels.join(", ")}`;
}
