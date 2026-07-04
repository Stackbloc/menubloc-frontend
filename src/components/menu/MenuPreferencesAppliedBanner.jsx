import { useLanguage } from "../../context/LanguageContext.jsx";

/**
 * Toggle + status for locally applied saved dietary preferences.
 * Allergen preferences apply automatically elsewhere — not surfaced here.
 */
export default function MenuPreferencesAppliedBanner({
  visible = false,
  applySavedPreferences = false,
  onToggle,
  browseSessionScope = false,
}) {
  const { t } = useLanguage();

  if (!visible) return null;

  const appliedMessage = browseSessionScope
    ? t(
        "publicMenu.preferencesAppliedDietBrowseSession",
        "Your saved dietary preferences are applied for this browse session."
      )
    : t(
        "publicMenu.preferencesAppliedDiet",
        "Your saved dietary preferences are applied to this menu."
      );

  const statusMessage = applySavedPreferences
    ? appliedMessage
    : t("publicMenu.showingCompleteMenu", "Showing the complete menu.");

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
      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        <input
          type="checkbox"
          checked={applySavedPreferences}
          onChange={(event) => onToggle?.(event.target.checked)}
          style={{ marginTop: 2, flexShrink: 0 }}
        />
        <span>
          {applySavedPreferences
            ? t("publicMenu.removeDietaryPreferences", "Remove dietary preferences")
            : t("publicMenu.applyDietaryPreferences", "Apply Dietary Preferences")}
        </span>
      </label>
      <div role="status" style={{ marginTop: 8, fontWeight: 600 }}>
        {statusMessage}
      </div>
      {applySavedPreferences ? (
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
