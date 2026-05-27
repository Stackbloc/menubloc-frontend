import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

function Toggle({ label, active, onToggle, testId = null }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "11px 0", borderBottom: "1px solid #f2f4f7",
    }}>
      <span style={{ fontSize: 15, fontWeight: 600, color: "#101828" }}>{label}</span>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={active}
        data-testid={testId}
        style={{
          width: 44, height: 26, borderRadius: 13, border: "none",
          background: active ? "#1F4E3D" : "#e4e7ec",
          cursor: "pointer", position: "relative",
          transition: "background 200ms ease", flexShrink: 0,
        }}
      >
        <span style={{
          position: "absolute", top: 3,
          left: active ? 21 : 3,
          width: 20, height: 20, borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          transition: "left 200ms ease",
        }} />
      </button>
    </div>
  );
}

function Section({ label }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 900, color: "#9ca3af",
      letterSpacing: 1.1, textTransform: "uppercase",
      marginTop: 26, marginBottom: 4,
    }}>
      {label}
    </div>
  );
}

export default function DiscoveryDrawer({
  open, onClose,
  filters = null, setFilters = null,
  excludedAllergens = new Set(),
  allergenNoneSelected = false,
  onAllergenToggle = null,
}) {
  const { isAuthenticated: loggedIn } = useConsumer();
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {open && (
        <div onClick={onClose} style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.35)", zIndex: 300,
        }} />
      )}

      <div style={{
        position: "fixed", top: 0, left: 0, bottom: 0,
        width: 300, maxWidth: "85vw",
        background: "#fff", zIndex: 301,
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 260ms cubic-bezier(.22,.68,0,1.1)",
        display: "flex", flexDirection: "column",
        overflowY: "auto",
        boxShadow: open ? "8px 0 40px rgba(0,0,0,0.16)" : "none",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 20px 14px",
          borderBottom: "1px solid #f2f4f7",
          position: "sticky", top: 0, background: "#fff", zIndex: 1,
        }}>
          <span style={{ fontSize: 17, fontWeight: 900, color: "#101828" }}>Menuply</span>
          <button type="button" onClick={onClose} aria-label={t("drawer.close", "Close")} style={{
            border: "none", background: "transparent",
            fontSize: 20, color: "#667085", cursor: "pointer", padding: 4, lineHeight: 1,
          }}>✕</button>
        </div>

        <div style={{ padding: "0 20px 48px", flex: 1 }}>

          <Section label={t("drawer.account", "Account")} />
          {loggedIn ? (
            <Link to="/account" onClick={onClose} style={{
              display: "block", padding: "12px 0",
              fontSize: 15, fontWeight: 700, color: "#1F4E3D", textDecoration: "none",
            }}>{t("nav.myAccount", "My account")}</Link>
          ) : (
            <div style={{ paddingTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
              <Link to="/account/login" onClick={onClose} style={{
                fontSize: 15, fontWeight: 700, color: "#1F4E3D", textDecoration: "none",
              }}>{t("auth.signIn", "Sign in")}</Link>
              <Link to="/account/signup" onClick={onClose} style={{
                display: "block", textAlign: "center",
                fontSize: 14, fontWeight: 800, color: "#fff",
                background: "#1F4E3D", borderRadius: 10,
                padding: "10px 16px", textDecoration: "none",
              }}>{t("auth.createAccount", "Create account")}</Link>
            </div>
          )}

          {filters !== null && (
            <>
              <Section label={t("drawer.dietaryPreferences", "Dietary preferences")} />
              <Toggle label={t("diet.vegan", "Vegan")} active={!!filters.vegan} testId="discovery-filter-vegan" onToggle={() => setFilters((p) => ({ ...p, vegan: !p.vegan }))} />
              <Toggle label={t("diet.vegetarian", "Vegetarian")} active={!!filters.vegetarian} testId="discovery-filter-vegetarian" onToggle={() => setFilters((p) => ({ ...p, vegetarian: !p.vegetarian }))} />
              <Toggle label={t("diet.gluten_free", "Gluten Free")} active={!!filters.gluten_free} testId="discovery-filter-gluten_free" onToggle={() => setFilters((p) => ({ ...p, gluten_free: !p.gluten_free }))} />
              <Toggle label={t("diet.diabetic_friendly", "Diabetic Friendly")} active={!!filters.diabetic_friendly} testId="discovery-filter-diabetic_friendly" onToggle={() => setFilters((p) => ({ ...p, diabetic_friendly: !p.diabetic_friendly }))} />
              <Toggle label={t("diet.keto", "Keto")} active={!!filters.keto} testId="discovery-filter-keto" onToggle={() => setFilters((p) => ({ ...p, keto: !p.keto }))} />
              <Toggle label={t("diet.dairy_free", "Dairy Free")} active={!!filters.dairy_free} testId="discovery-filter-dairy_free" onToggle={() => setFilters((p) => ({ ...p, dairy_free: !p.dairy_free }))} />
              <Toggle label={t("diet.low_fat", "Low Fat")} active={!!filters.low_fat} testId="discovery-filter-low_fat" onToggle={() => setFilters((p) => ({ ...p, low_fat: !p.low_fat }))} />
              <Toggle label={t("diet.low_sodium", "Low Sodium")} active={!!filters.low_sodium} testId="discovery-filter-low_sodium" onToggle={() => setFilters((p) => ({ ...p, low_sodium: !p.low_sodium }))} />
            </>
          )}

          {onAllergenToggle !== null && (
            <>
              <Section label={t("drawer.excludeAllergens", "Exclude allergens")} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 8, paddingBottom: 4 }}>
                <button
                  type="button"
                  onClick={() => onAllergenToggle("none")}
                  style={{
                    height: 32, padding: "0 12px", borderRadius: 999,
                    cursor: "pointer", whiteSpace: "nowrap",
                    border: allergenNoneSelected ? "none" : "1.5px solid #d0d5dd",
                    background: allergenNoneSelected ? "#667085" : "#f8fafc",
                    color: allergenNoneSelected ? "#fff" : "#475467",
                    fontSize: 13, fontWeight: 700,
                    transition: "background 160ms ease, color 160ms ease",
                  }}
                >
                  {allergenNoneSelected
                    ? t("drawer.allergen.noneSelected", "✓ None")
                    : t("drawer.allergen.none", "None")}
                </button>
                {[
                  { id: "nuts", labelKey: "allergen.nuts" },
                  { id: "dairy", labelKey: "allergen.dairy" },
                  { id: "shellfish", labelKey: "allergen.shellfish" },
                  { id: "gluten", labelKey: "allergen.gluten" },
                  { id: "soy", labelKey: "allergen.soy" },
                  { id: "eggs", labelKey: "allergen.eggs" },
                  { id: "fish", labelKey: "allergen.fish" },
                ].map(({ id, labelKey }) => {
                  const label = t(labelKey, id);
                  const active = excludedAllergens.has(id);
                  const disabled = allergenNoneSelected;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => { if (!disabled) onAllergenToggle(id); }}
                      disabled={disabled}
                      style={{
                        height: 32, padding: "0 12px", borderRadius: 999,
                        cursor: disabled ? "not-allowed" : "pointer", whiteSpace: "nowrap",
                        border: disabled ? "1.5px solid #e5e7eb" : active ? "none" : "1.5px solid #fca5a5",
                        background: disabled ? "#f3f4f6" : active ? "#dc2626" : "#fff5f5",
                        color: disabled ? "#98a2b3" : active ? "#fff" : "#dc2626",
                        fontSize: 13, fontWeight: 700,
                        transition: "background 160ms ease, color 160ms ease",
                        opacity: disabled ? 0.72 : 1,
                      }}
                    >
                      {active ? `✕ ${label}` : label}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <Section label={t("drawer.language", "Language")} />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              marginTop: 8, height: 36, borderRadius: 10,
              border: "1px solid #e4e7ec", background: "#fff",
              color: "#101828", fontSize: 14, fontWeight: 700,
              padding: "0 10px", cursor: "pointer", width: "100%",
            }}
          >
            <option value="en">{t("language.english", "English")}</option>
            <option value="es">{t("language.spanish", "Español")}</option>
            <option value="zh">{t("language.chinese", "中文")}</option>
          </select>

        </div>
      </div>
    </>
  );
}
