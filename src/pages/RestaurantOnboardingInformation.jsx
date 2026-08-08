/**
 * Onboarding Stage — Restaurant Information
 * Route: /restaurant/onboarding/information
 *
 * Loads the operator-owned restaurant and PATCHes via authenticated ownership-safe API.
 * Never creates a restaurant. Never uses legacy /restaurants POST/PATCH.
 */

import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo.jsx";
import RestaurantInformationForm from "../components/restaurant/RestaurantInformationForm.jsx";
import { useOperator } from "../context/OperatorContext.jsx";
import {
  getOwnedRestaurantInformation,
  getRestaurantDistributorUsage,
  putRestaurantDistributorUsage,
  updateOwnedRestaurantInformation,
} from "../lib/operatorApi.js";
import {
  buildRestaurantInformationPayload,
  emptyRestaurantInformationForm,
  restaurantToInformationForm,
  resolvePostInformationPath,
  validateRestaurantInformationForm,
} from "../lib/restaurantInformationSchema.js";
import {
  navigateWithRestaurantOnboardingState,
  persistRestaurantOnboardingState,
  resolveRestaurantOnboardingState,
  syncRestaurantOnboardingProgress,
} from "../lib/restaurantOnboardingState.js";

/**
 * Chrome must match `/restaurant/onboarding/organization` and locations:
 * pure white page, BrandLogo height 48 / radius 14 / matchPageBackground false,
 * max-width 640. Do not reintroduce cream shells.
 */
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#ffffff",
    color: "#0B0F0C",
    fontFamily: FONT,
    fontSize: 17,
    lineHeight: 1.65,
    WebkitFontSmoothing: "antialiased",
  },
  main: {
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
  eyebrow: {
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
  title: {
    fontSize: "clamp(28px, 6vw, 36px)",
    fontWeight: 700,
    lineHeight: 1.25,
    letterSpacing: "-0.35px",
    color: "#0B0F0C",
    margin: "0 0 12px",
  },
  subtitle: {
    fontSize: 17,
    color: "#374151",
    lineHeight: 1.65,
    margin: "0 0 8px",
  },
  hint: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 1.55,
    margin: "0 0 24px",
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
  ok: {
    marginBottom: 14,
    padding: 12,
    background: "#f3fff6",
    border: "1px solid #c6f3d1",
    borderRadius: 12,
    color: "#14532d",
    fontSize: 14,
  },
  recovery: {
    padding: 22,
    background: "#F9FAFB",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 12,
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
    background: "#1F4E3D",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: FONT,
  },
  secondary: {
    height: 46,
    padding: "0 18px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111",
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: FONT,
  },
  linkish: {
    height: 46,
    padding: "0 14px",
    borderRadius: 12,
    border: 0,
    background: "transparent",
    color: "#374151",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: FONT,
    textDecoration: "underline",
  },
};

function resolveOwnedRestaurantId({ onboarding, restaurants }) {
  const fromOnboarding = Number(onboarding?.restaurant_id);
  if (Number.isInteger(fromOnboarding) && fromOnboarding > 0) return fromOnboarding;
  const first = restaurants?.[0];
  const fromSession = Number(first?.id || first?.restaurant_id);
  if (Number.isInteger(fromSession) && fromSession > 0) return fromSession;
  return null;
}

export default function RestaurantOnboardingInformation() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    operator,
    restaurants,
    isAuthenticated,
    isEmailVerified,
    loading: sessionLoading,
  } = useOperator();

  const onboarding = useMemo(
    () =>
      resolveRestaurantOnboardingState({
        routeState: location.state,
        search: location.search,
      }).state,
    [location.state, location.search]
  );

  const restaurantId = useMemo(
    () => resolveOwnedRestaurantId({ onboarding, restaurants }),
    [onboarding, restaurants]
  );

  const [form, setForm] = useState(emptyRestaurantInformationForm());
  const [loadState, setLoadState] = useState("idle"); // idle | loading | ready | missing | error
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sessionLoading) return;
    if (!isAuthenticated) {
      navigate("/operator/login", {
        replace: true,
        state: { nextPath: "/restaurant/onboarding/information", ...onboarding },
      });
      return;
    }
    if (!isEmailVerified) {
      navigate("/operator/verify-email", {
        replace: true,
        state: {
          email: operator?.email || onboarding?.email,
          nextPath: "/restaurant/onboarding/information",
          autoSend: true,
          ...onboarding,
        },
      });
    }
  }, [
    sessionLoading,
    isAuthenticated,
    isEmailVerified,
    navigate,
    operator?.email,
    onboarding,
  ]);

  useEffect(() => {
    if (sessionLoading || !isAuthenticated || !isEmailVerified) return;

    if (!restaurantId) {
      setLoadState("missing");
      setLoadError(
        "We could not find a restaurant linked to your account. Onboarding cannot continue until a restaurant exists from account creation."
      );
      return;
    }

    let cancelled = false;
    setLoadState("loading");
    setLoadError("");

    (async () => {
      try {
        const [data, distributorData] = await Promise.all([
          getOwnedRestaurantInformation(restaurantId),
          getRestaurantDistributorUsage(restaurantId).catch(() => ({ relationships: [] })),
        ]);
        if (cancelled) return;
        const restaurant = data?.restaurant;
        if (!restaurant) {
          setLoadState("missing");
          setLoadError(
            "Your restaurant record could not be loaded. Contact support if this continues."
          );
          return;
        }
        const distributorIds = (distributorData?.relationships || [])
          .map((rel) => rel?.distributor_id || rel?.distributor?.id)
          .filter(Boolean)
          .map(String)
          .slice(0, 3);
        setForm(
          restaurantToInformationForm(
            { ...restaurant, distributor_ids: distributorIds },
            operator?.email || onboarding?.email || ""
          )
        );
        setLoadState("ready");
        persistRestaurantOnboardingState({
          ...onboarding,
          restaurant_id: restaurant.id,
          restaurant_name: restaurant.restaurant_name || onboarding?.restaurant_name,
          email: operator?.email || onboarding?.email,
          city: restaurant.city || onboarding?.city,
          state: restaurant.state || onboarding?.state,
          phone: restaurant.phone || onboarding?.phone,
        });
        syncRestaurantOnboardingProgress(
          {
            ...onboarding,
            restaurant_id: restaurant.id,
            email: operator?.email || onboarding?.email,
          },
          { current_step_key: "restaurant_information" }
        ).catch(() => {});
      } catch (err) {
        if (cancelled) return;
        if (err?.status === 403) {
          setLoadState("missing");
          setLoadError(
            "You do not have access to this restaurant. Sign in with the account that created it, or contact support."
          );
          return;
        }
        if (err?.status === 404) {
          setLoadState("missing");
          setLoadError(
            "Restaurant not found for your account. Onboarding cannot continue automatically — a restaurant will not be created here."
          );
          return;
        }
        setLoadState("error");
        setLoadError(err?.message || "Unable to load restaurant information.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    sessionLoading,
    isAuthenticated,
    isEmailVerified,
    restaurantId,
    operator?.email,
    onboarding,
  ]);

  async function handleContinue() {
    setSaveError("");
    const validation = validateRestaurantInformationForm(form, { complete: true });
    if (!validation.ok) {
      setSaveError(validation.message);
      return;
    }
    if (!restaurantId) {
      setSaveError("No restaurant is linked to this account.");
      return;
    }

    setSaving(true);
    try {
      const payload = buildRestaurantInformationPayload(form, { complete: true });
      const result = await updateOwnedRestaurantInformation(restaurantId, payload);
      await putRestaurantDistributorUsage(
        restaurantId,
        Array.isArray(form.distributor_ids) ? form.distributor_ids : []
      ).catch(() => {
        // Distributor usage is optional; do not block onboarding continue.
      });
      const restaurant = result?.restaurant || {};
      const nextOnboarding = persistRestaurantOnboardingState({
        ...onboarding,
        restaurant_id: restaurant.id || restaurantId,
        restaurant_name: restaurant.restaurant_name || form.restaurant_name,
        email: operator?.email || onboarding?.email,
        city: restaurant.city || form.city,
        state: restaurant.state || form.state,
        phone: restaurant.phone || form.phone,
        current_step_key: "locations",
        completed_step_keys: Array.from(
          new Set([
            ...(onboarding?.completed_step_keys || []),
            "account_created",
            "email_verified",
            "restaurant_information",
          ])
        ),
      });

      // Checkpoint confirmed by server — advance automatically (no manual save/exit).
      navigateWithRestaurantOnboardingState(
        navigate,
        resolvePostInformationPath(nextOnboarding),
        nextOnboarding
      );
    } catch (err) {
      const fields = err?.payload?.fields;
      const detail =
        Array.isArray(fields) && fields.length
          ? ` (${fields.join(", ")})`
          : "";
      setSaveError((err?.message || "Unable to continue. Please fix the highlighted fields.") + detail);
    } finally {
      setSaving(false);
    }
  }

  if (sessionLoading || loadState === "idle" || loadState === "loading") {
    return (
      <div style={styles.page}>
        <div style={styles.main}>
          <div style={styles.logo}>
            <BrandLogo height={48} radius={14} matchPageBackground={false} />
          </div>
          <p style={{ marginTop: 28, color: "#6b7280" }}>Loading restaurant information…</p>
        </div>
      </div>
    );
  }

  if (loadState === "missing" || loadState === "error") {
    return (
      <div style={styles.page}>
        <div style={styles.main}>
          <div style={styles.logo}>
            <BrandLogo height={48} radius={14} matchPageBackground={false} />
          </div>
          <div style={styles.eyebrow}>Restaurant information</div>
          <h1 style={styles.title}>We need to pause onboarding</h1>
          <div style={styles.recovery}>
            <p style={{ marginTop: 0, lineHeight: 1.55, color: "#374151" }}>{loadError}</p>
            <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.5 }}>
              Menuply will not create another restaurant from this screen. If you just signed up,
              return to account creation or contact support with your signup email.
            </p>
            <div style={styles.actions}>
              <Link to="/restaurant/signup" style={{ ...styles.primary, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
                Return to signup
              </Link>
              <Link to="/operator/help" style={{ ...styles.secondary, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
                Help center
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.main}>
        <div style={styles.logo}>
          <BrandLogo height={48} radius={14} matchPageBackground={false} />
        </div>
        <div style={styles.eyebrow}>Onboarding · Step after verify email</div>
        <h1 style={styles.title}>Restaurant information</h1>
        <p style={styles.subtitle}>
          Confirm the details for your restaurant. This updates your existing listing — it never
          creates a duplicate.
        </p>
        <p style={styles.hint}>
          Your progress is saved automatically when you continue.
        </p>

        {saveError ? <div style={styles.err}>{saveError}</div> : null}

        <RestaurantInformationForm
          form={form}
          onChange={setForm}
          disabled={saving}
          emailReadOnly
        />

        <div style={styles.actions}>
          <button
            type="button"
            style={styles.primary}
            disabled={saving}
            onClick={handleContinue}
          >
            {saving ? "Saving…" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
