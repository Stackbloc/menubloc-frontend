/**
 * Search result card enrichment — pure helpers over existing API fields only.
 * No ranking, parsing, or schema changes.
 *
 * Match-line identity: consumer-safe labels only — never ontology fallbacks,
 * similarity tiers, or structural compatibility jargon ({@link foodIdentityDisplay.js}).
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
 * Up to 3 compact nutrition / intent chips; omit missing data (no "unavailable").
 * Returns [{ label: string, primary: boolean }]. The primary chip is the one matching
 * the user's search intent — rendered first and highlighted in green.
 */
export function buildNutritionPreviewChips(row, queryMeta) {
  const parsed = queryMeta && typeof queryMeta === "object" ? queryMeta : {};
  const nutritionIntent = parsed.nutrition_intent || {};
  const constraints = parsed.nutrient_constraints || {};
  const diet = parsed.diet || {};

  const chip = getNutritionChip(row);
  const cal = asNum(chip.calories_kcal ?? chip.calories ?? row?.calories);
  const pro = asNum(chip.protein_g ?? row?.protein_g);
  const fat = asNum(chip.fat_g ?? row?.fat_g);
  const carbs = asNum(chip.carbs_g ?? row?.carbs_g);
  const sodium = asNum(chip.sodium_mg ?? row?.sodium_mg);
  const fiber = asNum(chip.fiber_g ?? row?.fiber_g);

  const wantsProtein =
    constraints?.protein?.direction === "high" ||
    nutritionIntent.high_protein === true ||
    diet.high_protein === true;
  const wantsSodium =
    constraints?.sodium?.direction === "low" ||
    nutritionIntent.low_sodium === true ||
    diet.low_sodium === true;
  const wantsFat =
    constraints?.fat?.direction === "low" ||
    nutritionIntent.low_fat === true ||
    diet.low_fat === true;
  const wantsCarbs =
    constraints?.carbs?.direction === "low" ||
    nutritionIntent.low_carb === true ||
    diet.low_carb === true ||
    diet.keto === true;
  const wantsFiber =
    constraints?.fiber?.direction === "high" ||
    nutritionIntent.high_fiber === true ||
    diet.high_fiber === true;

  const backendScores = row?.chips?.insights?.scores || row?.item?.chips?.insights?.scores;

  const out = [];
  const push = (label, primary = false) => {
    if (!label || out.length >= 3) return;
    out.push({ label, primary });
  };

  // Intent chips go first so the matched attribute is prominent
  if (wantsProtein) {
    const ok = proteinPass(backendScores, pro);
    if (pro != null) push(`${Math.round(pro)}g protein`, true);
    else push(ok ? "High protein ✓" : "High protein —", true);
  }

  if (wantsSodium) {
    if (sodium != null) push(`${Math.round(sodium)}mg sodium`, true);
    else push(sodiumPass(backendScores, sodium) ? "Low sodium ✓" : "Sodium —", true);
  }

  if (wantsFat) {
    if (fat != null) push(`${Math.round(fat)}g fat`, true);
    else push(fatPass(backendScores, fat) ? "Low fat ✓" : "Low fat —", true);
  }

  if (wantsCarbs && carbs != null) {
    const net =
      fiber != null ? Math.max(0, Math.round((carbs - fiber) * 10) / 10) : Math.round(carbs * 10) / 10;
    push(`${net}g net carbs`, true);
  }

  if (wantsFiber) {
    if (fiber != null) push(`${Math.round(fiber)}g fiber`, true);
    else push("Fiber —", true);
  }

  // Fill remaining slots with cal / protein (if not already shown)
  const alreadyHasProtein = out.some((c) => c.label.includes("protein"));
  if (cal != null) push(`${Math.round(cal)} cal`);
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
