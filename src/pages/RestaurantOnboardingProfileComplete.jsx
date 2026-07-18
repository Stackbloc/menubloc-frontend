/**
 * Post-profile celebration + soft pause.
 * Route: /restaurant/onboarding/profile-complete
 *
 * One recommended next step: set up payments.
 * Continue later → Operator Dashboard (deferred Finish setup).
 */

import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo.jsx";
import { useOperator } from "../context/OperatorContext.jsx";
import {
  resolveRestaurantOnboardingState,
  syncRestaurantOnboardingProgress,
} from "../lib/restaurantOnboardingState.js";

const MENU_LINK_SHOWN_KEY = "menuply.profile_gate.menu_link_shown";

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
    padding: "40px 20px 64px",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  },
  shell: {
    maxWidth: 560,
    margin: "0 auto",
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #e4e9f0",
    padding: "36px 28px 32px",
    boxShadow: "0 8px 28px rgba(15, 23, 42, 0.06)",
  },
  title: { fontSize: 24, fontWeight: 800, color: "#0f1720", margin: "18px 0 8px" },
  body: { fontSize: 15, color: "#475467", lineHeight: 1.55, margin: "0 0 16px" },
  link: { color: "#1F4E3D", fontWeight: 700, wordBreak: "break-all" },
  callout: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 12,
    padding: "12px 14px",
    marginBottom: 20,
    fontSize: 14,
    color: "#166534",
    lineHeight: 1.5,
  },
  primary: {
    display: "block",
    width: "100%",
    textAlign: "center",
    padding: "14px 16px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #1F4E3D 0%, #2d6a4f 100%)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 15,
    cursor: "pointer",
    marginBottom: 10,
  },
  secondary: {
    display: "block",
    width: "100%",
    textAlign: "center",
    padding: "14px 16px",
    borderRadius: 12,
    border: "1px solid #d0d5dd",
    background: "#fff",
    color: "#101828",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
  },
  hint: { fontSize: 12, color: "#98a2b3", marginTop: 16, textAlign: "center", lineHeight: 1.45 },
};

export default function RestaurantOnboardingProfileComplete() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectedRestaurant, restaurants } = useOperator();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const restaurantId =
    Number(searchParams.get("restaurant_id")) ||
    Number(selectedRestaurant?.id) ||
    Number(restaurants?.[0]?.id) ||
    0;

  const slug =
    searchParams.get("slug") ||
    selectedRestaurant?.slug ||
    restaurants?.[0]?.slug ||
    String(restaurantId || "");

  const origin = typeof window !== "undefined" ? window.location.origin : "https://menuply.com";
  const profileUrl = slug
    ? `${origin}/restaurants/${encodeURIComponent(String(slug))}`
    : restaurantId
      ? `${origin}/restaurants/${encodeURIComponent(String(restaurantId))}`
      : null;
  const menuUrl = restaurantId
    ? `${origin}/restaurants/${encodeURIComponent(String(restaurantId))}/menu`
    : slug
      ? `${origin}/restaurants/${encodeURIComponent(String(slug))}/menu`
      : null;

  const showMenuLink = useMemo(() => {
    if (typeof sessionStorage === "undefined") return true;
    const key = `${MENU_LINK_SHOWN_KEY}:${restaurantId || slug}`;
    if (sessionStorage.getItem(key) === "1") return false;
    return true;
  }, [restaurantId, slug]);

  async function recordGate({ continueLater }) {
    if (!restaurantId) return;
    const onboarding = resolveRestaurantOnboardingState({
      search: window.location.search,
    }).state;
    const status = continueLater ? "skipped" : "completed";
    await syncRestaurantOnboardingProgress(
      { restaurant_id: restaurantId, ...(onboarding || {}) },
      {
        current_step_key: continueLater ? "complete" : "merchant_onboarding",
        completed_step_keys: Array.from(
          new Set([
            ...((onboarding && onboarding.completed_step_keys) || []),
            "public_profile_edit",
            "profile_complete_gate",
          ])
        ),
        draft_payload: {
          ...(onboarding?.draft_payload || {}),
          stage_records: {
            ...(onboarding?.draft_payload?.stage_records || {}),
            profile_complete_gate: {
              status,
              skip_reason: continueLater ? "continue_later" : null,
              menu_link_shown: true,
            },
          },
        },
      }
    );
  }

  async function handleContinuePayments() {
    setBusy(true);
    setError("");
    try {
      if (typeof sessionStorage !== "undefined" && (restaurantId || slug)) {
        sessionStorage.setItem(`${MENU_LINK_SHOWN_KEY}:${restaurantId || slug}`, "1");
      }
      await recordGate({ continueLater: false });
      navigate("/operator/merchant", { replace: true });
    } catch (err) {
      setError(err?.message || "Unable to continue.");
      setBusy(false);
    }
  }

  async function handleContinueLater() {
    setBusy(true);
    setError("");
    try {
      if (typeof sessionStorage !== "undefined" && (restaurantId || slug)) {
        sessionStorage.setItem(`${MENU_LINK_SHOWN_KEY}:${restaurantId || slug}`, "1");
      }
      await recordGate({ continueLater: true });
      navigate("/operator", { replace: true });
    } catch (err) {
      setError(err?.message || "Unable to continue.");
      setBusy(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <BrandLogo height={44} radius={12} matchPageBackground={false} />
        <h1 style={styles.title}>Your profile is complete on Menuply</h1>
        <p style={styles.body}>
          Guests can find your restaurant listing
          {profileUrl ? (
            <>
              {" "}
              at{" "}
              <a href={profileUrl} target="_blank" rel="noopener noreferrer" style={styles.link}>
                {profileUrl}
              </a>
            </>
          ) : null}
          .
        </p>

        {showMenuLink && menuUrl ? (
          <div style={styles.callout}>
            Your menu can be seen at{" "}
            <a href={menuUrl} target="_blank" rel="noopener noreferrer" style={styles.link}>
              {menuUrl}
            </a>
            .
          </div>
        ) : null}

        <p style={styles.body}>
          Do you want to move to the next step — <strong>set up payments</strong> — or continue later?
        </p>

        {error ? (
          <div style={{ ...styles.callout, background: "#fef2f2", borderColor: "#fecaca", color: "#b91c1c" }}>
            {error}
          </div>
        ) : null}

        <button type="button" style={styles.primary} disabled={busy} onClick={handleContinuePayments}>
          {busy ? "Saving…" : "Continue: set up payments"}
        </button>
        <button type="button" style={styles.secondary} disabled={busy} onClick={handleContinueLater}>
          Continue later
        </button>

        <p style={styles.hint}>
          Delivery setup and menu design stay available from your dashboard when you are ready — one step at a
          time.{" "}
          <Link to="/operator" style={styles.link}>
            Go to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
