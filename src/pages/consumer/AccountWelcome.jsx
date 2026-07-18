import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BrandLogo } from "../../components/BrandLogo.jsx";

const VITE_ENV = import.meta.env || {};
const DEFAULT_PROD_API_BASE = "https://menubloc-backend-production.up.railway.app";
const API = (
  VITE_ENV.VITE_API_BASE_URL ||
  (VITE_ENV.DEV ? "http://localhost:3001" : DEFAULT_PROD_API_BASE)
).replace(/\/$/, "");

const FONT = '"Instrument Sans", "Avenir Next", system-ui, sans-serif';

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
  { key: "nut_free", label: "Nut-Free" },
  { key: "keto", label: "Keto" },
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
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: FONT }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px 80px" }}>
        <BrandLogo
          height={44}
          radius={12}
          matchPageBackground={false}
          linkStyle={{ display: "block", marginBottom: 40 }}
        />

        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "#1F4E3D",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Your diner account
        </div>

        <h1
          style={{
            fontSize: "clamp(1.7rem, 4vw, 2.4rem)",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            color: "#0B0F0C",
            lineHeight: 1.1,
            marginBottom: 14,
          }}
        >
          Welcome to Menuply
        </h1>

        <p style={{ fontSize: 16, color: "#374151", lineHeight: 1.65, marginBottom: 12 }}>
          We&apos;re excited to have you. We&apos;re setting up your new account and want to
          customize your experience so you see menus, recommendations, and deals that fit how you eat.
        </p>
        <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.6, marginBottom: 36 }}>
          A few optional preferences help Waiter and discovery feel like they know you — starting with where you are.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: 28 }}>
            <label
              style={{
                display: "block",
                fontWeight: 800,
                marginBottom: 8,
                fontSize: 14,
                color: "#0B0F0C",
              }}
            >
              ZIP code{" "}
              <span style={{ color: "#B91C1C", fontWeight: 700 }}>(required)</span>
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
                padding: "14px 16px",
                borderRadius: 12,
                border: `1.5px solid ${zipError ? "#B91C1C" : "#E5E7EB"}`,
                fontSize: 16,
                outline: "none",
                boxSizing: "border-box",
                fontFamily: FONT,
                background: "#fff",
                color: "#0B0F0C",
              }}
            />
            {zipError ? (
              <div style={{ color: "#B91C1C", fontSize: 13, marginTop: 8, fontWeight: 600 }}>
                {zipError}
              </div>
            ) : (
              <div style={{ color: "#6B7280", fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>
                Used for local restaurant recommendations and market tracking.
              </div>
            )}
          </div>

          <div style={{ marginBottom: 28 }}>
            <label
              style={{
                display: "block",
                fontWeight: 800,
                marginBottom: 8,
                fontSize: 14,
                color: "#0B0F0C",
              }}
            >
              Dietary preferences{" "}
              <span style={{ color: "#9CA3AF", fontWeight: 600 }}>(optional)</span>
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {DIETARY_OPTIONS.map(({ key, label }) => {
                const on = selectedDietary.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleDietary(key)}
                    style={{
                      padding: "9px 14px",
                      borderRadius: 99,
                      border: `1.5px solid ${on ? "#1F4E3D" : "#E5E7EB"}`,
                      background: on ? "#1F4E3D" : "#fff",
                      color: on ? "#fff" : "#374151",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: FONT,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 36 }}>
            <label
              style={{
                display: "block",
                fontWeight: 800,
                marginBottom: 8,
                fontSize: 14,
                color: "#0B0F0C",
              }}
            >
              Favorite cuisines{" "}
              <span style={{ color: "#9CA3AF", fontWeight: 600 }}>(optional)</span>
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CUISINE_OPTIONS.map((cuisine) => {
                const on = selectedCuisines.includes(cuisine);
                return (
                  <button
                    key={cuisine}
                    type="button"
                    onClick={() => toggleCuisine(cuisine)}
                    style={{
                      padding: "9px 14px",
                      borderRadius: 99,
                      border: `1.5px solid ${on ? "#1F4E3D" : "#E5E7EB"}`,
                      background: on ? "#1F4E3D" : "#fff",
                      color: on ? "#fff" : "#374151",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: FONT,
                    }}
                  >
                    {cuisine}
                  </button>
                );
              })}
            </div>
          </div>

          {formError ? (
            <div
              style={{
                color: "#B91C1C",
                fontSize: 14,
                marginBottom: 16,
                padding: "12px 14px",
                background: "#FEF2F2",
                borderRadius: 12,
                fontWeight: 600,
              }}
            >
              {formError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            style={{
              width: "100%",
              height: 52,
              borderRadius: 14,
              border: 0,
              background: "#1F4E3D",
              color: "#fff",
              fontSize: 16,
              fontWeight: 900,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              fontFamily: FONT,
              letterSpacing: "-0.01em",
            }}
          >
            {saving ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
