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
 *
 * UI: AuthPageFrame (same chrome as operator login / signup / verify-email).
 */

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useOperator } from "../../context/OperatorContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { buildLegalConsentPayload } from "../../lib/legalConsent.js";
import { API_BASE } from "../../lib/operatorApi.js";
import {
  AuthPageFrame,
  FormError,
  styles,
} from "../../components/consumer/ConsumerAuthShared.jsx";

async function searchListings(q, city) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (city) params.set("city", city);
  const res = await fetch(`${API_BASE}/operator/claim/search?${params}`, { credentials: "include" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Search failed");
  return json.results || [];
}

async function claimRestaurant(restaurantId, consent) {
  const res = await fetch(`${API_BASE}/operator/claim/${restaurantId}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(consent),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Claim failed");
  return json;
}

const resultRowBase = {
  borderRadius: 12,
  padding: "14px 16px",
  display: "flex",
  alignItems: "center",
  gap: 14,
};

export default function OperatorClaimSearch() {
  const { refreshRestaurants, operator } = useOperator();
  const { t } = useLanguage();
  const navigate = useNavigate();
  // Manual new listing: plan select → restaurant details (not philosophy/onboarding).
  // Authenticated operators attach the new restaurant to their existing account on /restaurant/signup/account.
  const createListingHref = "/restaurant/signup";
  const createListingState = { from: "operator_claim", create_listing: true };

  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [claiming, setClaiming] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [legalConsent, setLegalConsent] = useState(false);

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
    if (!legalConsent) {
      setError(
        "Agree to the Terms of Use and Privacy Policy and consent to electronic communications before claiming a listing.",
      );
      return;
    }
    setClaiming(restaurantId);
    setError("");
    try {
      const data = await claimRestaurant(restaurantId, buildLegalConsentPayload());
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
      <AuthPageFrame
        title={t("operator.claim.successTitle", "You're in!")}
        subtitle={t(
          "operator.claim.successBody",
          "{name} is now linked to your account. You can start editing your menu and creating deals.",
        ).replace("{name}", success)}
      >
        <button
          type="button"
          onClick={() => navigate("/operator", { replace: true })}
          style={styles.submitButton}
        >
          {t("operator.claim.goDashboard", "Go to Dashboard →")}
        </button>
      </AuthPageFrame>
    );
  }

  return (
    <AuthPageFrame
      title={t("operator.claim.title", "Find your restaurant")}
      subtitle={t(
        "operator.claim.subtitle",
        "Search for your listing. We'll link your account so you can start managing your menu.",
      )}
      footer={(
        <>
          {operator ? (
            <p style={{ ...styles.footer, marginBottom: 12 }}>
              {t("operator.claim.signedInAs", "Signed in as")}{" "}
              <strong style={{ color: "#D1D5DB" }}>{operator.email}</strong>
              {" · "}
              <button
                type="button"
                onClick={() => navigate("/operator")}
                style={{
                  ...styles.link,
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  font: "inherit",
                }}
              >
                {t("operator.claim.skip", "Skip →")}
              </button>
            </p>
          ) : null}
          <p style={styles.footer}>
            {t("operator.claim.notListed", "Don't see your restaurant?")}{" "}
            <button
              type="button"
              onClick={() => navigate(createListingHref, { state: createListingState })}
              style={{
                ...styles.link,
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                font: "inherit",
              }}
            >
              {t("operator.claim.createNewListing", "Create a new listing →")}
            </button>
          </p>
        </>
      )}
    >
      <div style={styles.form}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr minmax(110px, 140px)",
            gap: 12,
          }}
        >
          <div style={styles.fieldGroup}>
            <label htmlFor="operator-claim-name" style={styles.label}>
              {t("operator.claim.restaurantName", "Restaurant name")}
            </label>
            <input
              id="operator-claim-name"
              style={styles.input}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Joe's Diner"
              autoFocus
            />
          </div>
          <div style={styles.fieldGroup}>
            <label htmlFor="operator-claim-city" style={styles.label}>
              {t("operator.claim.city", "City")}
            </label>
            <input
              id="operator-claim-city"
              style={styles.input}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Austin"
            />
          </div>
        </div>

        <FormError error={error} />

        <label style={{ ...styles.checkboxRow, color: "#9CA3AF" }}>
          <input
            type="checkbox"
            checked={legalConsent}
            onChange={(event) => {
              setLegalConsent(event.target.checked);
              setError("");
            }}
            style={styles.checkbox}
          />
          <span style={{ ...styles.checkboxLabel, color: "#9CA3AF" }}>
            I agree to the{" "}
            <a href="/terms" target="_blank" rel="noreferrer" style={styles.link}>
              Terms of Use
            </a>
            {" "}and{" "}
            <a href="/privacy" target="_blank" rel="noreferrer" style={styles.link}>
              Privacy Policy
            </a>
            {" "}and consent to receive electronic communications from Menuply regarding my account, orders, services, and important updates.
          </span>
        </label>

        {searching ? (
          <div style={{ ...styles.fieldHint, color: "#9CA3AF" }}>
            {t("operator.claim.searching", "Searching…")}
          </div>
        ) : null}

        {!searching && searched && results.length === 0 ? (
          <div style={{ textAlign: "center", padding: "8px 0", color: "#9CA3AF" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#D1D5DB", marginBottom: 6 }}>
              {t("operator.claim.noResults", "No listings found")}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              {t(
                "operator.claim.tryDifferent",
                "Try a different name or city. If your restaurant isn't listed yet,",
              )}{" "}
              <button
                type="button"
                onClick={() => navigate(createListingHref, { state: createListingState })}
                style={{
                  ...styles.link,
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  font: "inherit",
                }}
              >
                {t("operator.claim.createListing", "create a new listing")}
              </button>
              .
            </div>
          </div>
        ) : null}

        {!searching && results.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {results.map((r) => (
              <div
                key={r.id}
                style={{
                  ...resultRowBase,
                  border: `1.5px solid ${r.already_linked ? "rgba(34,197,94,0.35)" : "#1F2937"}`,
                  background: r.already_linked ? "rgba(34,197,94,0.08)" : "#0B0F0C",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#F9FAFB" }}>
                    {r.restaurant_name}
                  </div>
                  <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                    {[r.address_line1, r.city, r.state].filter(Boolean).join(", ")}
                  </div>
                  {r.cuisine ? (
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{r.cuisine}</div>
                  ) : null}
                </div>

                {r.already_linked ? (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#22C55E",
                      background: "rgba(34,197,94,0.15)",
                      borderRadius: 999,
                      padding: "4px 10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ✓ {t("operator.claim.linked", "Linked")}
                  </span>
                ) : r.claimed_by_other ? (
                  <span
                    style={{
                      fontSize: 12,
                      color: "#9CA3AF",
                      background: "#121A14",
                      border: "1px solid #1F2937",
                      borderRadius: 999,
                      padding: "4px 10px",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t("operator.claim.claimed", "Claimed")}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleClaim(r.id)}
                    disabled={claiming === r.id || !legalConsent}
                    style={{
                      ...styles.submitButton,
                      minHeight: 40,
                      padding: "8px 14px",
                      fontSize: 13,
                      whiteSpace: "nowrap",
                      width: "auto",
                      opacity: claiming === r.id || !legalConsent ? 0.65 : 1,
                      cursor: claiming === r.id || !legalConsent ? "not-allowed" : "pointer",
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
        ) : null}
      </div>
    </AuthPageFrame>
  );
}
