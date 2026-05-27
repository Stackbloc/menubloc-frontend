/**
 * src/pages/operator/OperatorClaimSearch.jsx
 *
 * Step 1 of onboarding: find and claim a restaurant listing.
 *
 * Route: /operator/claim
 *
 * Flow:
 *   1. Operator types restaurant name (+ optional city)
 *   2. Results show claim status: unclaimed / already yours / taken
 *   3. Click "Claim" → POST /operator/claim/:id
 *   4. On success → reload restaurants in context → go to dashboard
 */

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useOperator } from "../../context/OperatorContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

async function searchListings(q, city) {
  const params = new URLSearchParams();
  if (q)    params.set("q", q);
  if (city) params.set("city", city);
  const res = await fetch(`${API}/operator/claim/search?${params}`, { credentials: "include" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Search failed");
  return json.results || [];
}

async function claimRestaurant(restaurantId) {
  const res = await fetch(`${API}/operator/claim/${restaurantId}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Claim failed");
  return json;
}

const INPUT = {
  padding: "11px 14px",
  fontSize: 14,
  border: "1.5px solid #e4e9f0",
  borderRadius: 10,
  outline: "none",
  color: "#0f1720",
  background: "#fff",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

export default function OperatorClaimSearch() {
  const { refreshRestaurants, operator } = useOperator();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const createListingHref = "/restaurant/onboarding";

  const [query, setQuery]     = useState("");
  const [city, setCity]       = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [claiming, setClaiming] = useState(null); // restaurant id being claimed
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(null);   // claimed restaurant name

  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim() && !city.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setError("");
      try {
        const r = await searchListings(query.trim(), city.trim());
        setResults(r);
        setSearched(true);
      } catch (e) {
        setError(e.message);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, city]);

  async function handleClaim(restaurantId) {
    setClaiming(restaurantId);
    setError("");
    try {
      const data = await claimRestaurant(restaurantId);
      setSuccess(data.restaurant.restaurant_name);
      await refreshRestaurants();
    } catch (e) {
      setError(e.message);
    } finally {
      setClaiming(null);
    }
  }

  if (success) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f4f3ef 0%, #eef5f2 100%)",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: 20,
      }}>
        <div style={{
          maxWidth: 420,
          width: "100%",
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
          padding: "40px 36px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 18 }}>🎉</div>
          <h2 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 800, color: "#1F4E3D" }}>
            {t("operator.claim.successTitle", "You're in!")}
          </h2>
          <p style={{ margin: "0 0 28px", fontSize: 14, color: "#5b6675", lineHeight: 1.6 }}>
            {t(
              "operator.claim.successBody",
              "{name} is now linked to your account. You can start editing your menu and creating deals.",
            ).replace("{name}", success)}
          </p>
          <button
            onClick={() => navigate("/operator", { replace: true })}
            style={{
              background: "#1F4E3D", color: "#fff", border: "none",
              borderRadius: 10, padding: "12px 32px",
              fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {t("operator.claim.goDashboard", "Go to Dashboard →")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      background: "linear-gradient(135deg, #f4f3ef 0%, #eef5f2 100%)",
      fontFamily: "Inter, system-ui, sans-serif",
      padding: "60px 20px 40px",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontWeight: 800, fontSize: 22, color: "#1F4E3D", letterSpacing: "-0.5px", marginBottom: 8 }}>
          Menuply
        </div>
        <h1 style={{ margin: "0 0 10px", fontSize: 26, fontWeight: 800, color: "#0f1720" }}>
          {t("operator.claim.title", "Find your restaurant")}
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "#5b6675", maxWidth: 360 }}>
          {t("operator.claim.subtitle", "Search for your listing. We'll link your account so you can start managing your menu.")}
        </p>
        {operator && (
          <div style={{ marginTop: 12, fontSize: 12, color: "#8a9ab0" }}>
            {t("operator.claim.signedInAs", "Signed in as")}{" "}
            <strong>{operator.email}</strong>
            <button
              onClick={() => navigate("/operator")}
              style={{ marginLeft: 8, background: "none", border: "none", color: "#1F4E3D", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
            >
              {t("operator.claim.skip", "Skip →")}
            </button>
          </div>
        )}
      </div>

      {/* Search card */}
      <div style={{
        width: "100%",
        maxWidth: 540,
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
        padding: "28px 28px 24px",
      }}>
        {/* Search inputs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#5b6675", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {t("operator.claim.restaurantName", "Restaurant name")}
            </label>
            <input
              style={{ ...INPUT, width: "100%" }}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. Joe's Diner"
              autoFocus
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#5b6675", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {t("operator.claim.city", "City")}
            </label>
            <input
              style={{ ...INPUT, width: 130 }}
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="e.g. Austin"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: 8, padding: "9px 12px",
            color: "#b91c1c", fontSize: 13, marginBottom: 14,
          }}>
            {error}
          </div>
        )}

        {/* Loading */}
        {searching && (
          <div style={{ color: "#8a9ab0", fontSize: 13, padding: "8px 0" }}>
            {t("operator.claim.searching", "Searching…")}
          </div>
        )}

        {/* Results */}
        {!searching && searched && results.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#8a9ab0" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>🔍</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#5b6675", marginBottom: 6 }}>
              {t("operator.claim.noResults", "No listings found")}
            </div>
            <div style={{ fontSize: 13 }}>
              {t("operator.claim.tryDifferent", "Try a different name or city. If your restaurant isn't listed yet,")}{" "}
              <button
                type="button"
                onClick={() => navigate(createListingHref)}
                style={{ background: "none", border: "none", padding: 0, color: "#1F4E3D", fontWeight: 600, cursor: "pointer", font: "inherit" }}
              >
                {t("operator.claim.createListing", "create a new listing")}
              </button>.
            </div>
          </div>
        )}

        {!searching && results.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {results.map(r => (
              <div
                key={r.id}
                style={{
                  border: `1.5px solid ${r.already_linked ? "#bbf7d0" : "#e4e9f0"}`,
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  background: r.already_linked ? "#f0fdf4" : "#fff",
                }}
              >
                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0f1720" }}>
                    {r.restaurant_name}
                  </div>
                  <div style={{ fontSize: 12, color: "#8a9ab0", marginTop: 2 }}>
                    {[r.address_line1, r.city, r.state].filter(Boolean).join(", ")}
                  </div>
                  {r.cuisine && (
                    <div style={{ fontSize: 11, color: "#b0bbc8", marginTop: 2 }}>{r.cuisine}</div>
                  )}
                </div>

                {/* Status + action */}
                {r.already_linked ? (
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", background: "#dcfce7", borderRadius: 999, padding: "4px 10px" }}>
                    ✓ {t("operator.claim.linked", "Linked")}
                  </span>
                ) : r.claimed_by_other ? (
                  <span style={{ fontSize: 12, color: "#8a9ab0", background: "#f4f3ef", borderRadius: 999, padding: "4px 10px", fontWeight: 600 }}>
                    {t("operator.claim.claimed", "Claimed")}
                  </span>
                ) : (
                  <button
                    onClick={() => handleClaim(r.id)}
                    disabled={claiming === r.id}
                    style={{
                      background: "#1F4E3D", color: "#fff",
                      border: "none", borderRadius: 8,
                      padding: "8px 16px", fontSize: 13, fontWeight: 700,
                      cursor: claiming === r.id ? "not-allowed" : "pointer",
                      opacity: claiming === r.id ? 0.65 : 1,
                      fontFamily: "inherit",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {claiming === r.id
                      ? t("operator.claim.claiming", "Claiming…")
                      : t("operator.claim.claimButton", "Claim this listing")}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Not listed CTA */}
        {searched && (
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid #f0f0ec", textAlign: "center" }}>
            <span style={{ fontSize: 13, color: "#8a9ab0" }}>
              {t("operator.claim.notListed", "Don't see your restaurant?")}{" "}
              <button
                type="button"
                onClick={() => navigate(createListingHref)}
                style={{ background: "none", border: "none", padding: 0, color: "#1F4E3D", fontWeight: 700, textDecoration: "none", cursor: "pointer", font: "inherit" }}
              >
                {t("operator.claim.createNewListing", "Create a new listing →")}
              </button>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
