export function isIndulgentCategory(category) {
  return category === "dessert" || category === "pure_bread";
}

export function normalizeIndulgenceLevel(level) {
  const value = String(level || "").trim().toLowerCase();
  if (!value) return "moderate";
  if (value === "very rich") return "indulgent";
  if (value === "mild") return "light";
  if (value === "light" || value === "moderate" || value === "rich" || value === "indulgent") {
    return value;
  }
  return "moderate";
}

export function resolveIndulgencePresentation(source) {
  const detailSystem = source?.detailSystem || source?.detail_system || null;
  const chips = source?.chips || null;
  const presentationModel = detailSystem?.presentation_model || null;
  const itemCategory =
    presentationModel?.item_category ||
    detailSystem?.item_category ||
    chips?.item_category ||
    source?.item_category ||
    null;
  const indulgence = detailSystem?.dessert_indulgence || chips?.indulgence || null;

  if (!isIndulgentCategory(itemCategory) && !indulgence) return null;

  return {
    itemCategory: itemCategory || "dessert",
    verdict: detailSystem?.verdict?.label || indulgence?.verdict || "Indulgent",
    indulgence: indulgence
      ? {
          ...indulgence,
          level: normalizeIndulgenceLevel(indulgence.level),
        }
      : null,
    interpretation:
      indulgence?.interpretation ||
      detailSystem?.nutrition?.interpretation ||
      indulgence?.insight ||
      null,
  };
}
