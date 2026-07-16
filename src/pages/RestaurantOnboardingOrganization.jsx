/**
 * Onboarding Stage — Business Organization / Legal Entity
 * Route: /restaurant/onboarding/organization
 *
 * Collects legal/operating entity identity before Restaurant Information and Payment.
 * Does not collect bank account, tax ID, or payout fields.
 * Private fields must never appear on /restaurants/{slug}.
 */

import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo.jsx";
import { useOperator } from "../context/OperatorContext.jsx";
import {
  completeOwnedBusinessOrganization,
  getOwnedBusinessOrganization,
} from "../lib/operatorApi.js";
import {
  ENTITY_TYPE_OPTIONS,
  RELATIONSHIP_TYPE_OPTIONS,
  buildBusinessOrganizationPayload,
  emptyBusinessOrganizationForm,
  organizationToForm,
  resolvePostOrganizationPath,
  validateBusinessOrganizationForm,
} from "../lib/businessOrganizationSchema.js";
import {
  navigateWithRestaurantOnboardingState,
  persistRestaurantOnboardingState,
  resolveRestaurantOnboardingState,
  syncRestaurantOnboardingProgress,
} from "../lib/restaurantOnboardingState.js";

const FONT = '"Instrument Sans", "Avenir Next", system-ui, sans-serif';

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f7f4ef 0%, #efe8df 100%)",
    fontFamily: FONT,
  },
  main: {
    maxWidth: 720,
    margin: "0 auto",
    padding: "40px 20px 80px",
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 800,
    color: "#1F4E3D",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  title: {
    fontSize: "clamp(1.6rem, 3.5vw, 2.1rem)",
    fontWeight: 900,
    letterSpacing: "-0.03em",
    color: "#0B0F0C",
    margin: "0 0 8px",
  },
  subtitle: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 1.55,
    margin: "0 0 24px",
  },
  card: {
    background: "#fff",
    border: "1px solid #e8e4de",
    borderRadius: 16,
    padding: 22,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    color: "#1f2937",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    height: 44,
    borderRadius: 10,
    border: "1px solid #d6d0c8",
    padding: "0 12px",
    fontSize: 15,
    marginBottom: 14,
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    height: 44,
    borderRadius: 10,
    border: "1px solid #d6d0c8",
    padding: "0 12px",
    fontSize: 15,
    marginBottom: 14,
    background: "#fff",
    boxSizing: "border-box",
  },
  hint: {
    fontSize: 12,
    color: "#6b7280",
    margin: "-8px 0 14px",
  },
  err: {
    marginBottom: 14,
    padding: 12,
    background: "#fff5f5",
    border: "1px solid #ffd2d2",
    borderRadius: 12,
    color: "#7f1d1d",
    fontSize: 14,
  },
  fieldErr: {
    color: "#b91c1c",
    fontSize: 12,
    margin: "-10px 0 12px",
  },
  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    fontSize: 14,
    color: "#374151",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  primary: {
    height: 46,
    padding: "0 18px",
    borderRadius: 12,
    border: 0,
    background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 15,
    cursor: "pointer",
  },
  secondary: {
    height: 46,
    padding: "0 18px",
    borderRadius: 12,
    border: "1px solid #d6d0c8",
    background: "#fff",
    color: "#1f2937",
    fontWeight: 700,
    fontSize: 14,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
  },
  recovery: {
    padding: 20,
    background: "#fff",
    border: "1px solid #e8e4de",
    borderRadius: 16,
  },
};

export default function RestaurantOnboardingOrganization() {
  const navigate = useNavigate();
  const { operator, restaurants, loading: operatorLoading } = useOperator();
  const onboarding = useMemo(() => resolveRestaurantOnboardingState(), []);
  const restaurantId = onboarding?.restaurant_id || restaurants?.[0]?.id || null;

  const [form, setForm] = useState(emptyBusinessOrganizationForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (operatorLoading) return;
    if (!operator) {
      navigate("/operator/login", {
        replace: true,
        state: { nextPath: "/restaurant/onboarding/organization", ...onboarding },
      });
      return;
    }
    if (operator.email_verified !== true) {
      navigate("/operator/verify-email", {
        replace: true,
        state: {
          nextPath: "/restaurant/onboarding/organization",
          ...onboarding,
        },
      });
    }
  }, [operator, operatorLoading, navigate, onboarding]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!restaurantId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const data = await getOwnedBusinessOrganization(restaurantId);
        if (cancelled) return;
        if (data?.organization) {
          setForm(organizationToForm(data.organization, data.relationship || {}));
        } else if (operator?.email) {
          setForm((prev) => ({
            ...prev,
            billing_email: prev.billing_email || operator.email || "",
            primary_contact_name:
              prev.primary_contact_name || operator.full_name || "",
          }));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Unable to load business organization.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [restaurantId, operator?.email, operator?.full_name]);

  function setField(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "is_sole_proprietor" && value === true) {
        next.entity_type = "individual_sole_proprietor";
      }
      if (key === "entity_type") {
        next.is_sole_proprietor = value === "individual_sole_proprietor";
      }
      return next;
    });
  }

  async function handleContinue(e) {
    e.preventDefault();
    setError("");
    const validation = validateBusinessOrganizationForm(form);
    setFieldErrors(validation.errors);
    if (!validation.ok) {
      setError("Please fix the highlighted fields.");
      return;
    }
    if (!restaurantId) {
      setError("Restaurant identity is missing. Complete account creation first.");
      return;
    }

    setSaving(true);
    try {
      const payload = buildBusinessOrganizationPayload(form);
      const result = await completeOwnedBusinessOrganization(restaurantId, payload);
      persistRestaurantOnboardingState({
        ...onboarding,
        restaurant_id: restaurantId,
        organization_id: result?.organization?.organization_id || null,
      });
      await syncRestaurantOnboardingProgress(restaurantId, {
        current_step_key: "restaurant_information",
        completed_step_keys_append: "business_organization",
      });
      navigateWithRestaurantOnboardingState(
        navigate,
        resolvePostOrganizationPath(),
        { restaurant_id: restaurantId }
      );
    } catch (err) {
      setError(err?.message || "Unable to save business organization.");
    } finally {
      setSaving(false);
    }
  }

  if (!restaurantId && !loading) {
    return (
      <div style={styles.page}>
        <BrandLogo />
        <main style={styles.main}>
          <div style={styles.recovery}>
            <h1 style={styles.title}>Restaurant required</h1>
            <p style={styles.subtitle}>
              Create or claim a restaurant before establishing the business organization.
            </p>
            <Link to="/operator/claim" style={styles.secondary}>
              Continue to claim
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <BrandLogo />
      <main style={styles.main}>
        <div style={styles.eyebrow}>Onboarding · Business organization</div>
        <h1 style={styles.title}>Who operates this restaurant?</h1>
        <p style={styles.subtitle}>
          Enter the legal or operating entity that owns or operates the restaurant.
          This is separate from your login account and from each location address.
          We do not collect bank or tax ID details here.
        </p>

        {error ? <div style={styles.err}>{error}</div> : null}

        {loading ? (
          <p style={styles.subtitle}>Loading…</p>
        ) : (
          <form style={styles.card} onSubmit={handleContinue}>
            <label style={styles.label} htmlFor="legal_name">
              Legal entity name
            </label>
            <input
              id="legal_name"
              style={styles.input}
              value={form.legal_name}
              onChange={(e) => setField("legal_name", e.target.value)}
              placeholder="e.g. Jane Smith, sole proprietor"
              autoComplete="organization"
            />
            {fieldErrors.legal_name ? (
              <div style={styles.fieldErr}>{fieldErrors.legal_name}</div>
            ) : null}

            <label style={styles.checkRow}>
              <input
                type="checkbox"
                checked={form.is_sole_proprietor === true}
                onChange={(e) => setField("is_sole_proprietor", e.target.checked)}
              />
              This business is an individual / sole proprietor
            </label>

            <label style={styles.label} htmlFor="entity_type">
              Entity type
            </label>
            <select
              id="entity_type"
              style={styles.select}
              value={form.entity_type}
              disabled={form.is_sole_proprietor === true}
              onChange={(e) => setField("entity_type", e.target.value)}
            >
              {ENTITY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <label style={styles.label} htmlFor="dba_trade_name">
              DBA / trade name (optional)
            </label>
            <input
              id="dba_trade_name"
              style={styles.input}
              value={form.dba_trade_name}
              onChange={(e) => setField("dba_trade_name", e.target.value)}
              placeholder="If different from legal name"
            />
            <p style={styles.hint}>
              Restaurant display name is collected on the next step — do not treat them as the same.
            </p>

            <label style={styles.label} htmlFor="country_code">
              Country
            </label>
            <input
              id="country_code"
              style={styles.input}
              value={form.country_code}
              onChange={(e) => setField("country_code", e.target.value)}
              maxLength={2}
              placeholder="US"
            />

            <label style={styles.label} htmlFor="jurisdiction">
              Jurisdiction (optional)
            </label>
            <input
              id="jurisdiction"
              style={styles.input}
              value={form.jurisdiction}
              onChange={(e) => setField("jurisdiction", e.target.value)}
              placeholder="State / province"
            />

            <label style={styles.label} htmlFor="primary_contact_name">
              Primary business contact
            </label>
            <input
              id="primary_contact_name"
              style={styles.input}
              value={form.primary_contact_name}
              onChange={(e) => setField("primary_contact_name", e.target.value)}
            />

            <label style={styles.label} htmlFor="billing_email">
              Billing email
            </label>
            <input
              id="billing_email"
              type="email"
              style={styles.input}
              value={form.billing_email}
              onChange={(e) => setField("billing_email", e.target.value)}
            />
            {fieldErrors.billing_email ? (
              <div style={styles.fieldErr}>{fieldErrors.billing_email}</div>
            ) : null}

            <label style={styles.label} htmlFor="billing_phone">
              Billing phone
            </label>
            <input
              id="billing_phone"
              style={styles.input}
              value={form.billing_phone}
              onChange={(e) => setField("billing_phone", e.target.value)}
            />

            <label style={styles.label} htmlFor="relationship_to_restaurant">
              Relationship to this restaurant
            </label>
            <select
              id="relationship_to_restaurant"
              style={styles.select}
              value={form.relationship_to_restaurant}
              onChange={(e) => setField("relationship_to_restaurant", e.target.value)}
            >
              {RELATIONSHIP_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <div style={styles.actions}>
              <button type="submit" style={styles.primary} disabled={saving}>
                {saving ? "Saving…" : "Continue to restaurant information"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
