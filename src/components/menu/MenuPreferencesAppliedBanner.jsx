import { useLanguage } from "../../context/LanguageContext.jsx";

/**
 * Saved preference status for public menus.
 * - First menu view: full list of dietary + allergen preferences applied.
 * - Later views: compact dietary on/off control (allergens only change in profile).
 * - Item counts show filtered vs total so users can see the filter working.
 */
export default function MenuPreferencesAppliedBanner({
  visible = false,
  isFirstMenuView = false,
  dietaryApplied = false,
  filtersActive = false,
  filteredItemCount = null,
  totalMenuItemCount = null,
  dietLabels = [],
  allergenLabels = [],
  onToggleDietary,
}) {
  const { t } = useLanguage();

  if (!visible) return null;

  const combinedLabels = [...dietLabels, ...allergenLabels].filter(Boolean);
  const hasDietLabels = dietLabels.length > 0;
  const hasAllergenLabels = allergenLabels.length > 0;
  const hasCounts =
    Number.isFinite(filteredItemCount) &&
    Number.isFinite(totalMenuItemCount) &&
    totalMenuItemCount >= 0;

  let statusMessage = "";
  let actionControl = null;

  if (isFirstMenuView) {
    const labelText = combinedLabels.length > 0 ? combinedLabels.join(", ") : "";
    statusMessage = labelText
      ? t(
          "publicMenu.preferencesAppliedCombined",
          "Current preferences/allergens applied: {{labels}}",
          { labels: labelText }
        )
      : t(
          "publicMenu.preferencesAppliedCombinedEmpty",
          "Current preferences/allergens applied."
        );
  } else if (dietaryApplied && hasDietLabels) {
    statusMessage = t("publicMenu.dietaryPreferencesOn", "Dietary preferences on");
    actionControl = (
      <button
        type="button"
        onClick={() => onToggleDietary?.(false)}
        style={{
          marginLeft: 6,
          padding: 0,
          border: "none",
          background: "none",
          color: "inherit",
          font: "inherit",
          fontWeight: 700,
          textDecoration: "underline",
          cursor: "pointer",
        }}
      >
        {t("publicMenu.clickToRemoveDietary", "click here to remove")}
      </button>
    );
  } else if (hasDietLabels) {
    statusMessage = t("publicMenu.preferencesOff", "Preferences off");
    actionControl = (
      <button
        type="button"
        onClick={() => onToggleDietary?.(true)}
        style={{
          marginLeft: 6,
          padding: 0,
          border: "none",
          background: "none",
          color: "inherit",
          font: "inherit",
          fontWeight: 700,
          textDecoration: "underline",
          cursor: "pointer",
        }}
      >
        {t("publicMenu.clickToReapplyDietary", "click here to re-apply")}
      </button>
    );
  } else if (hasAllergenLabels) {
    statusMessage = t(
      "publicMenu.allergenPreferencesApplied",
      "Allergen preferences applied: {{labels}}",
      { labels: allergenLabels.join(", ") }
    );
  }

  let countMessage = "";
  if (hasCounts) {
    if (filtersActive) {
      countMessage = t(
        "publicMenu.preferenceFilterCountActive",
        "Showing {{filtered}} out of {{total}} menu items.",
        { filtered: filteredItemCount, total: totalMenuItemCount }
      );
    } else {
      countMessage = t(
        "publicMenu.preferenceFilterCountOff",
        "Showing {{total}} menu items",
        { total: totalMenuItemCount }
      );
    }
  }

  return (
    <div
      style={{
        marginBottom: 12,
        padding: "10px 14px",
        borderRadius: 10,
        background: "rgba(234, 179, 8, 0.08)",
        border: "1px solid rgba(234, 179, 8, 0.22)",
        color: "#92400e",
        fontSize: 12,
        lineHeight: 1.45,
      }}
    >
      <div role="status" style={{ fontWeight: 600 }}>
        {statusMessage}
        {actionControl}
      </div>
      {countMessage ? (
        <div style={{ marginTop: 8, fontWeight: 700 }}>{countMessage}</div>
      ) : null}
      {isFirstMenuView && hasAllergenLabels ? (
        <div style={{ marginTop: 6, fontSize: 11, fontWeight: 600, opacity: 0.92 }}>
          {t(
            "publicMenu.allergenProfileOnly",
            "Allergen preferences can only be changed in your profile."
          )}
        </div>
      ) : null}
      {(dietaryApplied || hasAllergenLabels) && !isFirstMenuView ? (
        <div style={{ marginTop: 6, fontSize: 11, fontWeight: 600, opacity: 0.92 }}>
          {t(
            "publicMenu.preferencesAppliedDisclaimer",
            "Preferences are applied using available menu data."
          )}
        </div>
      ) : null}
    </div>
  );
}
