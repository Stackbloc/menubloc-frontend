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

function asBool(value) {
  if (value === true) return true;
  if (value === false || value === 0 || value === "0") return false;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "yes" || normalized === "1";
  }
  return false;
}

function formatPreviewNumber(value) {
  const numeric = asNum(value);
  if (numeric === null) return null;
  const rounded = Math.round(numeric * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatDistancePart(value) {
  const miles = asNum(value);
  if (miles === null || miles <= 0) return null;
  return `${miles.toFixed(1)} mi away`;
}

function getNutritionChip(row) {
  if (row?.chips && typeof row.chips === "object") return row.chips?.nutrition_chip || {};
  if (row?.item?.chips && typeof row.item.chips === "object") return row.item.chips?.nutrition_chip || {};
  return {};
}

function resolveItemFlag(row, key) {
  return row?.[key] ?? row?.item?.[key] ?? false;
}

function resolvePriceValue(row) {
  const direct = asNum(row?.price ?? row?.item?.price);
  if (direct !== null) return direct;

  const minorUnits = asNum(row?.price_minor_units ?? row?.item?.price_minor_units);
  if (minorUnits !== null) return minorUnits / 100;

  const cents = asNum(row?.price_cents ?? row?.item?.price_cents);
  if (cents !== null) return cents / 100;

  return null;
}

function extractIngredientReasonParts(row) {
  const reasons = Array.isArray(row?.match_reasons)
    ? row.match_reasons
    : Array.isArray(row?.item?.match_reasons)
      ? row.item.match_reasons
      : [];

  const tokens = [];
  for (const reason of reasons) {
    const text = String(reason || "").trim();
    let raw = "";
    if (text.startsWith("Ingredient match:")) {
      raw = text.slice("Ingredient match:".length);
    } else if (text.startsWith("Inferred ingredient text match:")) {
      raw = text.slice("Inferred ingredient text match:".length);
    } else {
      continue;
    }
    raw
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean)
      .forEach((token) => tokens.push(token));
  }

  return Array.from(new Set(tokens)).slice(0, 3);
}

export function buildMatchPreview(row, queryMeta, matchContext) {
  const parsed = queryMeta && typeof queryMeta === "object" ? queryMeta : {};
  const nutritionIntent = parsed?.nutrition_intent || {};
  const constraints = parsed?.nutrient_constraints || {};
  const diet = parsed?.diet || {};
  const nutritionChip = getNutritionChip(row);
  const activeGoal = asStr(matchContext?.activeGoal || parsed?.goal || "").toLowerCase();

  const protein = asNum(row?.protein_g ?? row?.item?.protein_g ?? nutritionChip?.protein_g);
  const fat = asNum(row?.fat_g ?? row?.item?.fat_g ?? nutritionChip?.fat_g);
  const carbs = asNum(row?.carbs_g ?? row?.item?.carbs_g ?? nutritionChip?.carbs_g);
  const fiber = asNum(row?.fiber_g ?? row?.item?.fiber_g ?? nutritionChip?.fiber_g);
  const sodium = asNum(row?.sodium_mg ?? row?.item?.sodium_mg ?? nutritionChip?.sodium_mg);
  const vitaminC = asNum(row?.vitamin_c_mg ?? row?.item?.vitamin_c_mg ?? nutritionChip?.vitamin_c_mg);
  const dataSourceTier = asStr(
    row?.data_source_tier ??
    row?.item?.data_source_tier ??
    nutritionChip?.data_source_tier
  ).toLowerCase();
  const hasMicronutrientData = asBool(
    row?.has_micronutrient_data ??
    row?.item?.has_micronutrient_data ??
    nutritionChip?.has_micronutrient_data
  );
  const priceValue = resolvePriceValue(row);
  const distanceValue = asNum(
    row?.distance_miles ??
    row?.restaurant_distance_miles ??
    row?.item?.distance_miles ??
    row?.item?.restaurant_distance_miles
  );

  const wantsCarbs =
    constraints?.carbs?.direction === "low" ||
    nutritionIntent?.low_carb === true ||
    diet?.low_carb === true ||
    diet?.keto === true;
  const wantsFat =
    constraints?.fat?.direction === "low" ||
    nutritionIntent?.low_fat === true;
  const wantsSodium =
    parsed?.sodium_direction === "low" ||
    parsed?.sodium_direction === "high" ||
    nutritionIntent?.low_sodium === true ||
    nutritionIntent?.high_sodium === true;
  const wantsPrice = parsed?.price?.min != null || parsed?.price?.max != null;
  const wantsVitaminC = activeGoal === "vitamin_c";
  const wantsProtein =
    constraints?.protein?.direction === "high" ||
    nutritionIntent?.high_protein === true ||
    diet?.high_protein === true ||
    parsed?.protein_direction === "high";
  const isUsdaMicronutrientPath =
    dataSourceTier === "usda" &&
    hasMicronutrientData === true;

  if (
    wantsVitaminC &&
    isUsdaMicronutrientPath &&
    vitaminC !== null &&
    vitaminC >= 20
  ) {
    return {
      text: `Match: ${formatPreviewNumber(vitaminC)} mg Vitamin C`,
    };
  }

  if (wantsProtein && protein != null) {
    return {
      text: `Match: ${formatPreviewNumber(protein)} g protein`,
    };
  }

  if (wantsSodium && sodium != null) {
    return {
      text: `Match: ${formatPreviewNumber(sodium)} mg sodium`,
    };
  }

  if (wantsPrice && priceValue != null && priceValue > 0) {
    return {
      text: `Match: $${priceValue.toFixed(2)}`,
    };
  }

  return null;
}

export default buildMatchPreview;
