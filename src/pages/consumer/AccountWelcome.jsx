import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BrandLogo } from "../../components/BrandLogo.jsx";

const VITE_ENV = import.meta.env || {};
const DEFAULT_PROD_API_BASE = "https://menubloc-backend-production.up.railway.app";
const API = (
  VITE_ENV.VITE_API_BASE_URL ||
  (VITE_ENV.DEV ? "http://localhost:3001" : DEFAULT_PROD_API_BASE)
).replace(/\/$/, "");

const FONT = "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";

/** Match Diner Signup hierarchy: logo → 28px title → 15px body. */
const PAGE_TITLE = {
  fontSize: 28,
  fontWeight: 800,
  marginTop: 16,
  marginBottom: 10,
  letterSpacing: "-0.03em",
  color: "#0B0F0C",
  lineHeight: 1.15,
};
const LEAD_LINE = {
  fontSize: 15,
  color: "#374151",
  lineHeight: 1.65,
  margin: "0 0 12px",
  fontWeight: 600,
};
const BODY_COPY = {
  fontSize: 15,
  color: "#374151",
  lineHeight: 1.65,
  margin: 0,
};

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

const HOME_REDIRECT_MS = 3200;

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
  const [showReady, setShowReady] = useState(false);

  useEffect(() => {
    if (!showReady) return undefined;
    const timer = window.setTimeout(() => {
      navigate(redirectTo, { replace: true });
    }, HOME_REDIRECT_MS);
    return () => window.clearTimeout(timer);
  }, [showReady, navigate, redirectTo]);

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
    if (!trimmed) return "Zip Code is required";
    if (!/^\d{5}(-\d{4})?$/.test(trimmed)) return "Enter a valid 5-digit Zip Code";
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
        throw new Error(data.error || "Could not save Zip Code");
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

      setShowReady(true);
    } catch (err) {
      setFormError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (showReady) {
    return (
      <div style={{ minHeight: "100vh", background: "#fff", fontFamily: FONT, color: "#0B0F0C" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 20px 80px", boxSizing: "border-box" }}>
          <BrandLogo height={48} radius={14} matchPageBackground={false} />
          <h1 style={PAGE_TITLE}>You&apos;re all set</h1>
          <p style={{ ...LEAD_LINE, fontWeight: 400 }}>
            Your account is all set up. You can add additional preferences using the Waiter.
          </p>
          <p style={{ ...BODY_COPY, marginBottom: 28 }}>
            We are taking you to the home screen.
          </p>
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 12,
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              color: "#15803D",
              fontSize: 15,
              fontWeight: 700,
            }}
            role="status"
            aria-live="polite"
          >
            Redirecting…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: FONT, color: "#0B0F0C" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 20px 80px", boxSizing: "border-box" }}>
        <BrandLogo height={48} radius={14} matchPageBackground={false} />

        <h1 style={PAGE_TITLE}>Welcome to Menuply</h1>
        <p style={LEAD_LINE}>Your Diner Account</p>

        <p style={{ ...BODY_COPY, marginBottom: 12 }}>
          We&apos;re excited to have you. We&apos;re setting up your new account and want to
          customize your experience so you see menus, recommendations, and deals that fit how you eat.
        </p>
        <p style={{ ...BODY_COPY, marginBottom: 36 }}>
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
              Zip Code{" "}
              <span style={{ color: "#B91C1C", fontWeight: 700 }}>(required)</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter your Zip Code"
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
