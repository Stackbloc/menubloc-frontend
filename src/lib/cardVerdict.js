const FREQUENT_LABEL = "Suitable for frequent consumption";
const OCCASIONAL_LABEL = "Suitable for occasional consumption";
const INDULGENT_LABEL = "Indulgent";
export const NOT_AVAILABLE_LABEL = "Not Available";

export function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function isKnownNumber(value) {
  return toNullableNumber(value) !== null;
}

function asLower(value) {
  return String(value || "").trim().toLowerCase();
}

function isIndulgentCategory(category) {
  const normalized = asLower(category);
  return normalized === "dessert" || normalized === "pure_bread";
}

function normalizeVerdictLabel(label) {
  const normalized = asLower(label);
  if (!normalized) return "";
  if (normalized.includes("indulgent") || normalized.includes("maximum indulgence")) {
    return INDULGENT_LABEL;
  }
  if (normalized.includes("occasional") || normalized.includes("moderation")) {
    return OCCASIONAL_LABEL;
  }
  if (
    normalized.includes("frequent") ||
    normalized.includes("regular") ||
    normalized.includes("daily-friendly") ||
    normalized.includes("light choice") ||
    normalized.includes("balanced choice") ||
    normalized.includes("solid nutritional profile")
  ) {
    return FREQUENT_LABEL;
  }
  return "";
}

export function resolveCardVerdict(source = {}) {
  const detailSystem = source.detailSystem || source.detail_system || null;
  const chips = source.chips || source.item?.chips || null;
  const presentationModel = detailSystem?.presentation_model || null;
  const itemCategory =
    presentationModel?.item_category ||
    detailSystem?.item_category ||
    chips?.item_category ||
    source.item_category ||
    source.category ||
    source.item?.item_category ||
    source.item?.category ||
    null;

  if (isIndulgentCategory(itemCategory)) return INDULGENT_LABEL;

  const existingLabel =
    detailSystem?.verdict?.label ||
    source.verdict?.label ||
    source.verdict ||
    chips?.verdict?.label ||
    chips?.verdict ||
    chips?.indulgence?.verdict ||
    "";
  const normalizedExisting = normalizeVerdictLabel(existingLabel);
  if (normalizedExisting) return normalizedExisting;

  if (detailSystem?.bread_score || chips?.bread_score) return INDULGENT_LABEL;

  const indulgence = detailSystem?.dessert_indulgence || chips?.indulgence || null;
  const indulgenceLevel = asLower(indulgence?.level);
  if (indulgenceLevel === "indulgent" || indulgenceLevel === "rich" || indulgenceLevel === "very rich") {
    return INDULGENT_LABEL;
  }
  if (indulgenceLevel === "moderate") return OCCASIONAL_LABEL;
  if (indulgenceLevel === "light") return FREQUENT_LABEL;

  const nutrition = chips?.nutrition_chip || detailSystem?.nutrition || source.nutrition_chip || null;
  const calories = toNullableNumber(nutrition?.calories_kcal);
  const sodium = toNullableNumber(nutrition?.sodium_mg);
  const sugar = toNullableNumber(nutrition?.sugar_g);
  const fat = toNullableNumber(nutrition?.fat_g);
  const knownNutritionValues = [calories, sodium, sugar, fat].filter((value) => value !== null);

  if (knownNutritionValues.length >= 2) {
    if (
      (calories !== null && calories >= 700) ||
      (sodium !== null && sodium >= 1200) ||
      (sugar !== null && sugar >= 35) ||
      (fat !== null && fat >= 35)
    ) {
      return INDULGENT_LABEL;
    }
    if (
      (calories !== null && calories >= 450) ||
      (sodium !== null && sodium >= 700) ||
      (sugar !== null && sugar >= 18) ||
      (fat !== null && fat >= 20)
    ) {
      return OCCASIONAL_LABEL;
    }
    return FREQUENT_LABEL;
  }

  return NOT_AVAILABLE_LABEL;
}

export function getCardVerdictTone(label) {
  if (label === NOT_AVAILABLE_LABEL) {
    return {
      background: "rgba(148,163,184,0.10)",
      border: "rgba(148,163,184,0.24)",
      label: "#CBD5E1",
      text: "#E2E8F0",
    };
  }
  if (label === INDULGENT_LABEL) {
    return {
      background: "rgba(249,115,22,0.10)",
      border: "rgba(249,115,22,0.28)",
      label: "#FDBA74",
      text: "#FED7AA",
    };
  }
  if (label === OCCASIONAL_LABEL) {
    return {
      background: "rgba(252,211,77,0.08)",
      border: "rgba(252,211,77,0.24)",
      label: "#FCD34D",
      text: "#FDE68A",
    };
  }
  return {
    background: "rgba(34,197,94,0.09)",
    border: "rgba(34,197,94,0.24)",
    label: "#86EFAC",
    text: "#BBF7D0",
  };
}
