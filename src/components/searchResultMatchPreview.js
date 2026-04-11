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

export function buildMatchPreview(row, queryMeta, matchContext) {
  const parsed = queryMeta && typeof queryMeta === "object" ? queryMeta : {};
  const nutritionIntent = parsed?.nutrition_intent || {};
  const constraints = parsed?.nutrient_constraints || {};
  const diet = parsed?.diet || {};
  const nutritionChip = getNutritionChip(row);

  const protein = asNum(row?.protein_g ?? row?.item?.protein_g ?? nutritionChip?.protein_g);
  const fat = asNum(row?.fat_g ?? row?.item?.fat_g ?? nutritionChip?.fat_g);
  const carbs = asNum(row?.carbs_g ?? row?.item?.carbs_g ?? nutritionChip?.carbs_g);
  const fiber = asNum(row?.fiber_g ?? row?.item?.fiber_g ?? nutritionChip?.fiber_g);
  const sodium = asNum(row?.sodium_mg ?? row?.item?.sodium_mg ?? nutritionChip?.sodium_mg);
  const priceValue = resolvePriceValue(row);
  const distanceValue = asNum(
    row?.distance_miles ??
    row?.restaurant_distance_miles ??
    row?.item?.distance_miles ??
    row?.item?.restaurant_distance_miles
  );

  const wantsProtein =
    constraints?.protein?.direction === "high" ||
    nutritionIntent?.high_protein === true ||
    diet?.high_protein === true;
  const wantsCarbs =
    constraints?.carbs?.direction === "low" ||
    nutritionIntent?.low_carb === true ||
    diet?.low_carb === true ||
    diet?.keto === true;
  const wantsFat =
    constraints?.fat?.direction === "low" ||
    nutritionIntent?.low_fat === true;
  const wantsSodium =
    constraints?.sodium?.direction === "low" ||
    nutritionIntent?.low_sodium === true ||
    diet?.low_sodium === true;
  const wantsPrice = parsed?.price?.min != null || parsed?.price?.max != null;
  const wantsDiet = diet?.vegan || diet?.vegetarian || diet?.gluten_free;

  const dietPart = (() => {
    if (diet?.vegan && asBool(resolveItemFlag(row, "is_vegan"))) return "Vegan";
    if (diet?.gluten_free && asBool(resolveItemFlag(row, "is_gluten_free"))) return "Gluten-free";
    if (diet?.vegetarian && (asBool(resolveItemFlag(row, "is_vegetarian")) || asBool(resolveItemFlag(row, "is_vegan")))) {
      return "Vegetarian";
    }
    return null;
  })();

  const candidateParts = {
    protein: wantsProtein && protein != null ? `${formatPreviewNumber(protein)} g protein` : null,
    carbs:
      wantsCarbs && carbs != null
        ? fiber != null
          ? `${formatPreviewNumber(Math.max(0, carbs - fiber))} g net carbs`
          : `${formatPreviewNumber(carbs)} g carbs`
        : null,
    fat: wantsFat && fat != null ? `${formatPreviewNumber(fat)} g fat` : null,
    sodium: wantsSodium && sodium != null ? `${formatPreviewNumber(sodium)} mg sodium` : null,
    price: wantsPrice && priceValue != null && priceValue > 0 ? `$${priceValue.toFixed(2)}` : null,
    diet: wantsDiet ? dietPart : null,
  };

  const priorityOrder = ["protein", "carbs", "fat", "sodium", "price", "diet"];
  const parts = [];
  const used = new Set();
  const orderedCandidates = priorityOrder
    .map((key) => ({ key, active: Boolean(candidateParts[key]), text: candidateParts[key] }))
    .filter((part) => part.active && part.text);

  const primary = orderedCandidates.find((part) => part.active && part.text);

  // PRIMARY
  if (primary) {
    parts.push(primary.text);
    used.add(primary.key);
  }

  // SECONDARY (only if different + valid)
  const secondary = orderedCandidates.find(
    (part) => part.active && part.text && !used.has(part.key)
  );

  if (secondary && parts.length < 2) {
    parts.push(secondary.text);
    used.add(secondary.key);
  }

  // DISTANCE (ONLY if location-driven)
  const shouldShowDistance =
    matchContext?.wantsNearby === true ||
    matchContext?.coordinateSearchActive === true;

  if (shouldShowDistance) {
    const distanceText = formatDistancePart(distanceValue);
    if (distanceText && parts.length < 3) {
      parts.push(distanceText);
    }
  }

  // FINAL OUTPUT
  if (!parts.length) return null;

  return {
    parts,
    text: parts.join(" • "),
  };
}

export default buildMatchPreview;
