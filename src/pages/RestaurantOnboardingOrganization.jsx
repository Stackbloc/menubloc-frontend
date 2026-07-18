/**
 * Onboarding Stage — Business Organization / Legal Entity
 * Route: /restaurant/onboarding/organization
 *
 * Collects legal/operating entity identity before Restaurant Information and Payment.
 * Does not collect bank account, tax ID, or payout fields.
 * Private fields must never appear on /restaurants/{slug}.
 */

import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo.jsx";
import { useOperator } from "../context/OperatorContext.jsx";
import {
  completeOwnedBusinessOrganization,
  getOwnedBusinessOrganization,
} from "../lib/operatorApi.js";
import {
  ENTITY_TYPE_OPTIONS,
  JURISDICTION_STATE_OPTIONS,
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

/**
 * Chrome must match `/restaurant/onboarding` (RestaurantOnboardingApproved):
 * pure white page, BrandLogo height 48 / radius 14 / matchPageBackground false,
 * max-width 640, logo block margin-bottom 20. Do not invent cream shells.
 */
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

const styles = {
  pageWrap: {
    minHeight: "100vh",
    backgroundColor: "#ffffff",
    color: "#0B0F0C",
    fontFamily: FONT,
    fontSize: 17,
    lineHeight: 1.65,
    WebkitFontSmoothing: "antialiased",
  },
  pageMain: {
    maxWidth: 640,
    margin: "0 auto",
    padding: "28px 24px calc(var(--bottom-nav-h, 72px) + 8px)",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  sectionLabel: {
    display: "inline-block",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#6B7280",
    background: "rgba(0,0,0,0.05)",
    border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: 4,
    padding: "3px 10px",
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: "clamp(28px, 6vw, 36px)",
    fontWeight: 700,
    lineHeight: 1.25,
    letterSpacing: "-0.35px",
    color: "#0B0F0C",
    margin: "0 0 12px",
  },
  pageSubtitle: {
    fontSize: 17,
    color: "#374151",
    lineHeight: 1.65,
    margin: "0 0 28px",
  },
  card: {
    background: "#F9FAFB",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 12,
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
    border: "1px solid #d1d5db",
    padding: "0 12px",
    fontSize: 15,
    marginBottom: 14,
    background: "#fff",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    height: 44,
    borderRadius: 10,
    border: "1px solid #d1d5db",
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
  welcomeCard: {
    background: "#F0FDF4",
    border: "1.5px solid #86EFAC",
    borderRadius: 12,
    padding: "22px 22px 20px",
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: "clamp(26px, 5.5vw, 32px)",
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: "-0.3px",
    color: "#0B0F0C",
    margin: "0 0 12px",
  },
  welcomeBody: {
    fontSize: 17,
    color: "#374151",
    lineHeight: 1.65,
    margin: "0 0 20px",
  },
  claimedName: {
    fontWeight: 700,
    color: "#0B0F0C",
  },
  linkedBanner: {
    background: "#F0FDF4",
    border: "1px solid #BBF7D0",
    borderRadius: 10,
    padding: "12px 14px",
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 1.55,
    color: "#166534",
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
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  primary: {
    height: 48,
    padding: "0 20px",
    borderRadius: 10,
    border: 0,
    background: "#4caf50",
    color: "#fff",
    fontWeight: 700,
    fontSize: 16,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  secondary: {
    height: 48,
    padding: "0 20px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
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
    background: "#F9FAFB",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 12,
  },
};

export default function RestaurantOnboardingOrganization() {
  const navigate = useNavigate();
  const location = useLocation();
  const { operator, restaurants, loading: operatorLoading } = useOperator();
  const onboarding = useMemo(
    () =>
      resolveRestaurantOnboardingState({
        routeState: location.state,
        search: location.search,
      }).state,
    [location.state, location.search]
  );
  const restaurantId = onboarding?.restaurant_id || restaurants?.[0]?.id || null;
  const linkedRestaurant = useMemo(() => {
    if (!restaurants?.length) return null;
    if (restaurantId) {
      return restaurants.find((r) => Number(r.id) === Number(restaurantId)) || null;
    }
    return restaurants[0] || null;
  }, [restaurants, restaurantId]);

  const restaurantDisplayName =
    onboarding?.restaurant_name ||
    linkedRestaurant?.restaurant_name ||
    linkedRestaurant?.name ||
    "";
  const restaurantCity = onboarding?.city || linkedRestaurant?.city || "";
  const restaurantState = onboarding?.state || linkedRestaurant?.state || "";
  const restaurantAddress =
    onboarding?.address_line1 ||
    linkedRestaurant?.address_line1 ||
    linkedRestaurant?.address ||
    "";
  const restaurantLocationLabel = [
    restaurantAddress,
    [restaurantCity, restaurantState].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join(", ");
  const isClaimedProfile = Boolean(restaurantDisplayName);

  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const showWelcome = Boolean(restaurantDisplayName) && !welcomeDismissed;
  const [form, setForm] = useState(() => emptyBusinessOrganizationForm());
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (operatorLoading) return;
    if (!operator) {
      navigate("/operator/login", {
        replace: true,
        state: { nextPath: "/restaurant/onboarding/organization", ...(onboarding || {}) },
      });
      return;
    }
    if (operator.email_verified !== true) {
      navigate("/operator/verify-email", {
        replace: true,
        state: {
          nextPath: "/restaurant/onboarding/organization",
          email: operator?.email || onboarding?.email,
          autoSend: true,
          ...(onboarding || {}),
        },
      });
    }
  }, [operator, operatorLoading, navigate, onboarding]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (operatorLoading) return;
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
          setForm(
            organizationToForm(data.organization, data.relationship || {}, {
              restaurantDisplayName,
            })
          );
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
  }, [
    restaurantId,
    restaurantDisplayName,
    operator?.email,
    operator?.full_name,
    operatorLoading,
  ]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
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
      const nextPath =
        result?.next_path ||
        resolvePostOrganizationPath(onboarding || {});
      const nextStepKey =
        nextPath.includes("/subscription") ? "payment" : "restaurant_information";
      const completedKeys = Array.from(
        new Set([
          ...((onboarding && onboarding.completed_step_keys) || []),
          "business_organization",
          ...(result?.payment_bypass?.recorded ? ["payment"] : []),
        ])
      );
      const nextOnboarding = persistRestaurantOnboardingState({
        ...(onboarding || {}),
        restaurant_id: restaurantId,
        organization_id: result?.organization?.organization_id || null,
        current_step_key: nextStepKey,
        completed_step_keys: completedKeys,
      });
      await syncRestaurantOnboardingProgress(nextOnboarding || { restaurant_id: restaurantId }, {
        current_step_key: nextStepKey,
        completed_step_keys: completedKeys,
      });
      navigateWithRestaurantOnboardingState(navigate, nextPath, {
        restaurant_id: restaurantId,
        ...(nextOnboarding || {}),
      });
    } catch (err) {
      setError(err?.message || "Unable to save business organization.");
    } finally {
      setSaving(false);
    }
  }

  if (!restaurantId && !loading) {
    return (
      <div style={styles.pageWrap}>
        <main style={styles.pageMain}>
          <div style={styles.logo}>
            <BrandLogo height={48} radius={14} matchPageBackground={false} />
          </div>
          <div style={styles.sectionLabel}>Onboarding · Business organization</div>
          <h1 style={styles.pageTitle}>Restaurant required</h1>
          <p style={styles.pageSubtitle}>
            Create or claim a restaurant before establishing the business organization.
          </p>
          <div style={styles.recovery}>
            <Link to="/operator/claim" style={styles.secondary}>
              Continue to claim
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.pageWrap}>
      <main style={styles.pageMain}>
        <div style={styles.logo}>
          <BrandLogo height={48} radius={14} matchPageBackground={false} />
        </div>
        <div style={styles.sectionLabel}>Onboarding · Business organization</div>

        {showWelcome ? (
          <div style={styles.welcomeCard}>
            <h1 style={styles.welcomeTitle}>
              {isClaimedProfile ? "Profile claimed" : "Restaurant linked"}
            </h1>
            <p style={styles.welcomeBody}>
              {isClaimedProfile ? (
                <>
                  You have claimed the profile for{" "}
                  <span style={styles.claimedName}>{restaurantDisplayName}</span>
                  {restaurantLocationLabel ? (
                    <>
                      {" "}
                      located at{" "}
                      <span style={styles.claimedName}>{restaurantLocationLabel}</span>
                    </>
                  ) : null}
                  . Let&apos;s get your restaurant set up on Menuply.
                </>
              ) : (
                <>
                  You&apos;re setting up{" "}
                  <span style={styles.claimedName}>{restaurantDisplayName}</span>
                  {restaurantLocationLabel ? (
                    <>
                      {" "}
                      located at{" "}
                      <span style={styles.claimedName}>{restaurantLocationLabel}</span>
                    </>
                  ) : null}
                  . Let&apos;s get your restaurant set up on Menuply.
                </>
              )}
            </p>
            <button
              type="button"
              style={styles.primary}
              onClick={() => setWelcomeDismissed(true)}
            >
              Continue
            </button>
          </div>
        ) : (
          <>
            <h1 style={styles.pageTitle}>Who operates this restaurant?</h1>
            <p style={styles.pageSubtitle}>
              Enter the <strong>legal or operating entity</strong> that owns or operates
              this restaurant — for example an LLC or a corporation. This is{" "}
              <strong>not</strong> the public restaurant brand name, city, or state
              (those are already linked). We do not collect bank or tax ID details here.
            </p>

            {restaurantDisplayName ? (
              <div style={styles.linkedBanner}>
                Linked listing: <strong>{restaurantDisplayName}</strong>
                {restaurantLocationLabel ? ` · ${restaurantLocationLabel}` : ""}. Restaurant
                display name stays on the next steps — do not re-enter it as the legal entity
                name.
              </div>
            ) : null}

            {error ? <div style={styles.err}>{error}</div> : null}

            {loading ? (
              <p style={styles.pageSubtitle}>Loading…</p>
            ) : (
          <form style={styles.card} onSubmit={handleContinue}>
            <label style={styles.label} htmlFor="legal_name">
              Legal entity name
            </label>
            <input
              id="legal_name"
              name="legal_entity_name"
              style={styles.input}
              value={form.legal_name}
              onChange={(e) => setField("legal_name", e.target.value)}
              placeholder="e.g. Jane Smith or Acme Holdings LLC"
              autoComplete="off"
            />
            {fieldErrors.legal_name ? (
              <div style={styles.fieldErr}>{fieldErrors.legal_name}</div>
            ) : null}

            <label style={styles.label} htmlFor="entity_type">
              Entity type
            </label>
            <select
              id="entity_type"
              style={styles.select}
              value={form.entity_type}
              onChange={(e) => setField("entity_type", e.target.value)}
            >
              {ENTITY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {fieldErrors.entity_type ? (
              <div style={styles.fieldErr}>{fieldErrors.entity_type}</div>
            ) : null}

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
              Optional assumed business name for this legal entity — not the Menuply restaurant
              listing name ({restaurantDisplayName || "already linked"}).
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
              State of formation (optional)
            </label>
            <select
              id="jurisdiction"
              style={styles.select}
              value={form.jurisdiction || ""}
              onChange={(e) => setField("jurisdiction", e.target.value)}
            >
              <option value="">Not specified</option>
              {JURISDICTION_STATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {fieldErrors.jurisdiction ? (
              <div style={styles.fieldErr}>{fieldErrors.jurisdiction}</div>
            ) : null}
            <p style={styles.hint}>
              The state where this legal entity was formed or registered — not the
              restaurant&apos;s city.
            </p>

            <label style={styles.label} htmlFor="primary_contact_name">
              Primary business contact
            </label>
            <input
              id="primary_contact_name"
              style={styles.input}
              value={form.primary_contact_name || ""}
              onChange={(e) => setField("primary_contact_name", e.target.value)}
            />

            <label style={styles.label} htmlFor="billing_email">
              Billing email
            </label>
            <input
              id="billing_email"
              type="email"
              style={styles.input}
              value={form.billing_email || ""}
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
              value={form.billing_phone || ""}
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
                {saving ? "Saving…" : "Continue"}
              </button>
            </div>
          </form>
            )}
          </>
        )}
      </main>
    </div>
  );
}
