import { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import {
  readMenuPreferenceDetailedBannerSeen,
  writeMenuPreferenceDetailedBannerSeen,
} from "../../lib/menuCatalogBrowsePreferences.js";

const TOAST_DISMISS_MS = 5500;

/**
 * Saved preference notice for public menus.
 * - First menu view in a session: brief fixed toast (like sign-in) then auto-dismisses.
 * - Compact checkbox toggles dietary prefs on/off (allergens stay profile-only).
 */
export default function MenuPreferencesAppliedBanner({
  visible = false,
  dietaryApplied = false,
  dietLabels = [],
  allergenLabels = [],
  onToggleDietary,
}) {
  const { t } = useLanguage();
  const [toastVisible, setToastVisible] = useState(
    () => typeof window !== "undefined" && !readMenuPreferenceDetailedBannerSeen()
  );

  const combinedLabels = [...dietLabels, ...allergenLabels].filter(Boolean);
  const hasDietLabels = dietLabels.length > 0;
  const hasAllergenLabels = allergenLabels.length > 0;

  useEffect(() => {
    if (!visible || !toastVisible) return;

    writeMenuPreferenceDetailedBannerSeen();

    const timer = window.setTimeout(() => setToastVisible(false), TOAST_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [visible, toastVisible]);

  if (!visible) return null;

  const labelText = combinedLabels.length > 0 ? combinedLabels.join(", ") : "";
  const toastMessage = labelText
    ? t(
        "publicMenu.preferencesAppliedCombined",
        "Current preferences/allergens applied: {{labels}}",
        { labels: labelText }
      )
    : t(
        "publicMenu.preferencesAppliedCombinedEmpty",
        "Current preferences/allergens applied."
      );

  const dismissToast = () => setToastVisible(false);

  const handleRemoveDietary = () => {
    onToggleDietary?.(false);
    dismissToast();
  };

  return (
    <>
      {toastVisible ? (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            right: 18,
            bottom: 18,
            zIndex: 1500,
            maxWidth: "min(360px, calc(100vw - 36px))",
            borderRadius: 14,
            background: "#121A14",
            color: "#FFFFFF",
            padding: "12px 14px",
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.45,
            border: "1px solid #1F2937",
            boxShadow: "0 18px 40px rgba(15,23,42,0.24)",
          }}
        >
          <div>{toastMessage}</div>
          {hasDietLabels ? (
            <button
              type="button"
              onClick={handleRemoveDietary}
              style={{
                marginTop: 6,
                padding: 0,
                border: "none",
                background: "none",
                color: "#FCD34D",
                font: "inherit",
                fontWeight: 700,
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              {t("publicMenu.clickToRemoveDietary", "click here to remove")}
            </button>
          ) : null}
          {hasAllergenLabels ? (
            <div style={{ marginTop: 6, fontSize: 11, fontWeight: 500, opacity: 0.85 }}>
              {t(
                "publicMenu.allergenProfileOnly",
                "Allergen preferences can only be changed in your profile."
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {hasDietLabels && !toastVisible ? (
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
            fontSize: 12,
            fontWeight: 600,
            color: "inherit",
            opacity: 0.82,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            checked={dietaryApplied}
            onChange={(event) => onToggleDietary?.(event.target.checked)}
            style={{ width: 15, height: 15, margin: 0, cursor: "pointer" }}
          />
          {t("publicMenu.applyDietaryPreferences", "Apply my dietary preferences")}
        </label>
      ) : null}
    </>
  );
}
