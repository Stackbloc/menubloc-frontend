import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";

const VITE_ENV = import.meta.env || {};
const DEFAULT_PROD_API_BASE = "https://menubloc-backend-production.up.railway.app";
const API = (
  VITE_ENV.VITE_API_BASE_URL ||
  (VITE_ENV.DEV ? "http://localhost:3001" : DEFAULT_PROD_API_BASE)
).replace(/\/$/, "");

const CUISINE_OPTIONS = [
  "American", "Mexican", "Italian", "Chinese", "Japanese", "Thai",
  "Indian", "Mediterranean", "BBQ", "Seafood", "Pizza", "Burgers",
  "Vegan", "Vegetarian", "Sushi", "Korean", "Vietnamese",
];

const DIETARY_OPTIONS = [
  { key: "vegetarian", label: "Vegetarian" },
  { key: "vegan", label: "Vegan" },
  { key: "gluten_free", label: "Gluten-Free" },
  { key: "dairy_free", label: "Dairy-Free" },
  { key: "low_carb", label: "Low-Carb" },
  { key: "high_protein", label: "High-Protein" },
  { key: "low_sodium", label: "Low-Sodium" },
  { key: "diabetic_friendly", label: "Diabetic-Friendly" },
  { key: "keto", label: "Keto" },
  { key: "paleo", label: "Paleo" },
];

export default function AccountWelcome() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.redirectTo || "/";

  const [zip, setZip] = useState("");
  const [zipError, setZipError] = useState("");
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [selectedDietary, setSelectedDietary] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function toggleCuisine(cuisine) {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
    );
  }

  function toggleDietary(key) {
    setSelectedDietary((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function validateZip(value) {
    const trimmed = String(value || "").trim();
    if (!trimmed) return "ZIP code is required";
    if (!/^\d{5}(-\d{4})?$/.test(trimmed)) return "Enter a valid 5-digit ZIP code";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const zipErr = validateZip(zip);
    if (zipErr) {
      setZipError(zipErr);
      return;
    }
    setZipError("");
    setFormError("");
    setSaving(true);

    try {
      // Save ZIP
      const zipRes = await fetch(`${API}/api/consumer/profile/zip`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zip: zip.trim() }),
      });
      if (!zipRes.ok) {
        const data = await zipRes.json().catch(() => ({}));
        throw new Error(data.error || "Could not save ZIP code");
      }

      // Save dietary preferences (best-effort)
      if (selectedDietary.length > 0) {
        await fetch(`${API}/api/consumer/profile/preferences`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dietary_preferences: selectedDietary.map((key) => ({ key, is_enabled: true })),
          }),
        }).catch(() => {});
      }

      navigate(redirectTo, { replace: true });
    } catch (err) {
      setFormError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <StickyPageHeader />
      <div style={{ minHeight: "100vh", background: "#faf9f6", display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: 80 }}>
        <div style={{ width: "100%", maxWidth: 500, padding: "48px 24px 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>Welcome to Menuply</div>
            <p style={{ color: "#5a5a5a", fontSize: 15, lineHeight: 1.6, margin: 0 }}>
              Help us personalize your experience. This only takes a moment.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* ZIP Code — required */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontWeight: 700, marginBottom: 8, fontSize: 14 }}>
                ZIP Code <span style={{ color: "#c0392b" }}>(required)</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter your ZIP code"
                value={zip}
                onChange={(e) => {
                  setZip(e.target.value);
                  if (zipError) setZipError(validateZip(e.target.value));
                }}
                maxLength={10}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: `1.5px solid ${zipError ? "#c0392b" : "#ddd"}`,
                  fontSize: 16,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              {zipError ? (
                <div style={{ color: "#c0392b", fontSize: 13, marginTop: 6 }}>{zipError}</div>
              ) : (
                <div style={{ color: "#888", fontSize: 13, marginTop: 6 }}>
                  Used for local restaurant recommendations and market tracking.
                </div>
              )}
            </div>

            {/* Dietary preferences — optional */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontWeight: 700, marginBottom: 8, fontSize: 14 }}>
                Dietary Preferences <span style={{ color: "#aaa", fontWeight: 400 }}>(optional)</span>
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {DIETARY_OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleDietary(key)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 99,
                      border: `1.5px solid ${selectedDietary.includes(key) ? "#1F4E3D" : "#ddd"}`,
                      background: selectedDietary.includes(key) ? "#1F4E3D" : "#fff",
                      color: selectedDietary.includes(key) ? "#fff" : "#333",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Favorite cuisines — optional */}
            <div style={{ marginBottom: 32 }}>
              <label style={{ display: "block", fontWeight: 700, marginBottom: 8, fontSize: 14 }}>
                Favorite Cuisines <span style={{ color: "#aaa", fontWeight: 400 }}>(optional)</span>
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {CUISINE_OPTIONS.map((cuisine) => (
                  <button
                    key={cuisine}
                    type="button"
                    onClick={() => toggleCuisine(cuisine)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 99,
                      border: `1.5px solid ${selectedCuisines.includes(cuisine) ? "#1F4E3D" : "#ddd"}`,
                      background: selectedCuisines.includes(cuisine) ? "#1F4E3D" : "#fff",
                      color: selectedCuisines.includes(cuisine) ? "#fff" : "#333",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
            </div>

            {formError ? (
              <div style={{ color: "#c0392b", fontSize: 14, marginBottom: 16, padding: "10px 14px", background: "#fff1ef", borderRadius: 8 }}>
                {formError}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 12,
                background: "#1F4E3D",
                color: "#fff",
                fontSize: 16,
                fontWeight: 700,
                border: "none",
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
                marginBottom: 12,
              }}
            >
              {saving ? "Saving..." : "Get Started"}
            </button>

          </form>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
