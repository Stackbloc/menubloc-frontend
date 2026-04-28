import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

function Toggle({ label, active, onToggle }) {
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
  filters, setFilters,
  excludedAllergens = new Set(),
  onAllergenToggle,
}) {
  const { isAuthenticated: loggedIn } = useConsumer();
  const { language, setLanguage } = useLanguage();

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
          <button type="button" onClick={onClose} aria-label="Close" style={{
            border: "none", background: "transparent",
            fontSize: 20, color: "#667085", cursor: "pointer", padding: 4, lineHeight: 1,
          }}>✕</button>
        </div>

        <div style={{ padding: "0 20px 48px", flex: 1 }}>

          <Section label="Account" />
          {loggedIn ? (
            <Link to="/account" onClick={onClose} style={{
              display: "block", padding: "12px 0",
              fontSize: 15, fontWeight: 700, color: "#1F4E3D", textDecoration: "none",
            }}>My Account</Link>
          ) : (
            <div style={{ paddingTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
              <Link to="/account/login" onClick={onClose} style={{
                fontSize: 15, fontWeight: 700, color: "#1F4E3D", textDecoration: "none",
              }}>Sign In</Link>
              <Link to="/account/signup" onClick={onClose} style={{
                display: "block", textAlign: "center",
                fontSize: 14, fontWeight: 800, color: "#fff",
                background: "#1F4E3D", borderRadius: 10,
                padding: "10px 16px", textDecoration: "none",
              }}>Create Account</Link>
            </div>
          )}

          <Section label="Dietary Preferences" />
          <Toggle label="Vegan" active={!!filters.vegan} onToggle={() => setFilters((p) => ({ ...p, vegan: !p.vegan }))} />
          <Toggle label="Vegetarian" active={!!filters.vegetarian} onToggle={() => setFilters((p) => ({ ...p, vegetarian: !p.vegetarian }))} />
          <Toggle label="Gluten-Free" active={!!filters.gluten_free} onToggle={() => setFilters((p) => ({ ...p, gluten_free: !p.gluten_free }))} />
          <Toggle label="Diabetic Friendly" active={!!filters.diabetic_friendly} onToggle={() => setFilters((p) => ({ ...p, diabetic_friendly: !p.diabetic_friendly }))} />
          <Toggle label="Low Carb / Keto" active={!!filters.keto} onToggle={() => setFilters((p) => ({ ...p, keto: !p.keto }))} />
          <Toggle label="Dairy-Free" active={!!filters.dairy_free} onToggle={() => setFilters((p) => ({ ...p, dairy_free: !p.dairy_free }))} />
          <Toggle label="Low Fat" active={!!filters.low_fat} onToggle={() => setFilters((p) => ({ ...p, low_fat: !p.low_fat }))} />
          <Toggle label="Low Sodium" active={!!filters.low_sodium} onToggle={() => setFilters((p) => ({ ...p, low_sodium: !p.low_sodium }))} />

          <Section label="Exclude Allergens" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 8, paddingBottom: 4 }}>
            {[
              { id: "nuts",      label: "Nuts" },
              { id: "dairy",     label: "Dairy" },
              { id: "shellfish", label: "Shellfish" },
              { id: "gluten",    label: "Gluten" },
              { id: "soy",       label: "Soy" },
              { id: "eggs",      label: "Eggs" },
              { id: "fish",      label: "Fish" },
            ].map(({ id, label }) => {
              const active = excludedAllergens.has(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onAllergenToggle?.(id)}
                  style={{
                    height: 32, padding: "0 12px", borderRadius: 999,
                    cursor: "pointer", whiteSpace: "nowrap",
                    border: active ? "none" : "1.5px solid #fca5a5",
                    background: active ? "#dc2626" : "#fff5f5",
                    color: active ? "#fff" : "#dc2626",
                    fontSize: 13, fontWeight: 700,
                    transition: "background 160ms ease, color 160ms ease",
                  }}
                >
                  {active ? `✕ ${label}` : label}
                </button>
              );
            })}
          </div>

          <Section label="Language" />
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
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="zh">中文</option>
          </select>

        </div>
      </div>
    </>
  );
}
