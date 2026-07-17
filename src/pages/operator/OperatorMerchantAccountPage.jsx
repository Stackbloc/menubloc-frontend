/**
 * Operator Merchant Account — Stripe Connect onboarding and Stripe Dashboard access.
 * Route: /operator/merchant
 * Stripe is the source of truth; status is always re-fetched from the backend.
 */
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import {
  createStripeConnectDashboardLink,
  getStripeConnectStatus,
  startStripeConnectOnboarding,
} from "../../lib/operatorApi.js";

function maskStripeAccountId(accountId) {
  const id = String(accountId || "").trim();
  if (!id || id.length < 8) return id || "—";
  return `acct_••••${id.slice(-4)}`;
}

function statusLabel(state) {
  switch (state) {
    case "not_connected":
      return "Not connected";
    case "incomplete":
      return "Setup incomplete";
    case "under_review":
      return "Stripe review in progress";
    case "restricted":
      return "Account restricted";
    case "connected":
      return "Connected";
    default:
      return "Unknown";
  }
}

function statusExplanation(state, status) {
  if (state === "not_connected") {
    return "This restaurant does not have a Stripe connected account yet. Set one up to receive marketplace payouts.";
  }
  if (state === "incomplete") {
    return "Stripe still requires information before this account can fully process marketplace payments.";
  }
  if (state === "under_review") {
    return "Stripe is reviewing this account. Additional information may still be required.";
  }
  if (state === "restricted") {
    return status?.disabled_reason
      ? `Stripe has restricted this account (${status.disabled_reason}). Resolve the issue in Stripe to restore capabilities.`
      : "Stripe has restricted this account. Resolve outstanding requirements in Stripe.";
  }
  if (state === "connected") {
    return "This restaurant’s Stripe account is connected. Sensitive banking details are managed in Stripe, not Menuply.";
  }
  return "Connect status could not be determined. Refresh or try again.";
}

function yesNo(value) {
  return value ? "Yes" : "No";
}

function Row({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        padding: "14px 0",
        borderBottom: "1px solid #f0f4f8",
      }}
    >
      <span style={{ fontSize: 13, color: "#8a9ab0", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#0f1720", fontWeight: 700, textAlign: "right" }}>{value}</span>
    </div>
  );
}

const primaryButtonStyle = {
  background: "linear-gradient(135deg, #1F4E3D 0%, #2d6a4f 100%)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "12px 18px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

const secondaryNoteStyle = {
  margin: "12px 0 0",
  fontSize: 12,
  color: "#8a9ab0",
  lineHeight: 1.45,
};

export default function OperatorMerchantAccountPage() {
  const { selectedRestaurant } = useOperator();
  const [searchParams, setSearchParams] = useSearchParams();
  const rid = selectedRestaurant?.id;

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState("");

  const connectParam = searchParams.get("connect");

  const loadStatus = useCallback(async () => {
    if (!rid) {
      setStatus(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await getStripeConnectStatus(rid);
      setStatus(data);
    } catch (err) {
      setError(err.message || "Failed to load Stripe Connect status.");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [rid]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (!connectParam) return;
    if (connectParam === "return") {
      setBanner("Returned from Stripe. Status below is refreshed from Stripe — arrival here does not mean onboarding is complete.");
    } else if (connectParam === "refresh") {
      setBanner("Your previous Stripe setup link expired. Continue setup to generate a fresh link.");
    }
    // Strip query after acknowledging so refresh does not re-flash forever.
    const next = new URLSearchParams(searchParams);
    next.delete("connect");
    setSearchParams(next, { replace: true });
  }, [connectParam, searchParams, setSearchParams]);

  async function handleStartOrContinue() {
    if (!rid || actionBusy) return;
    setActionBusy(true);
    setError("");
    try {
      const result = await startStripeConnectOnboarding(rid);
      if (result?.onboarding_url) {
        window.location.assign(result.onboarding_url);
        return;
      }
      setError("Stripe did not return an onboarding URL.");
    } catch (err) {
      setError(err.message || "Failed to start Stripe onboarding.");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleOpenDashboard() {
    if (!rid || actionBusy) return;
    setActionBusy(true);
    setError("");
    try {
      const result = await createStripeConnectDashboardLink(rid);
      if (result?.url) {
        window.location.assign(result.url);
        return;
      }
      setError("Stripe did not return a dashboard URL.");
    } catch (err) {
      setError(err.message || "Failed to open Stripe dashboard.");
    } finally {
      setActionBusy(false);
    }
  }

  const state = status?.onboarding_state || (status?.account_exists ? "incomplete" : "not_connected");
  const needsResolve =
    state === "incomplete" || state === "under_review" || state === "restricted";

  let primaryLabel = "Set Up Stripe Account";
  let primaryAction = handleStartOrContinue;
  if (state === "incomplete") {
    primaryLabel = "Continue Stripe Setup";
  } else if (state === "under_review" || state === "restricted") {
    primaryLabel = "Resolve in Stripe";
  } else if (state === "connected") {
    primaryLabel = "Open Stripe Account";
    primaryAction = handleOpenDashboard;
  }

  // Additional information still due on a connected account — prefer Account Link.
  if (state === "connected" && Number(status?.currently_due_count || 0) > 0) {
    primaryLabel = "Resolve in Stripe";
    primaryAction = handleStartOrContinue;
  }

  return (
    <OperatorLayout title="Merchant Account">
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f1720", margin: 0 }}>
            Merchant Account
          </h1>
          <p style={{ margin: "10px 0 0", fontSize: 14, color: "#344054", lineHeight: 1.5 }}>
            Connect and manage the Stripe account Menuply uses for restaurant payouts and marketplace
            transactions.
          </p>
          {(selectedRestaurant?.restaurant_name || selectedRestaurant?.name) && (
            <p style={{ margin: "8px 0 0", fontSize: 13, color: "#aab4c0" }}>
              {selectedRestaurant.restaurant_name || selectedRestaurant.name}
            </p>
          )}
        </div>

        {!rid ? (
          <p style={{ fontSize: 14, color: "#8a9ab0" }}>
            Select a restaurant to manage its Stripe merchant account.
          </p>
        ) : (
          <>
            {banner ? (
              <div
                style={{
                  padding: "12px 16px",
                  background: "#f0f7ff",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#1e40af",
                  marginBottom: 16,
                  lineHeight: 1.45,
                }}
              >
                {banner}
              </div>
            ) : null}

            {loading ? (
              <div style={{ padding: "24px 0", color: "#8a9ab0", fontSize: 14 }}>Loading…</div>
            ) : error ? (
              <div
                style={{
                  padding: "12px 16px",
                  background: "#fef3c7",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#92400e",
                  marginBottom: 16,
                }}
              >
                {error}
                <button
                  type="button"
                  onClick={loadStatus}
                  style={{
                    display: "block",
                    marginTop: 10,
                    background: "transparent",
                    border: "none",
                    color: "#1F4E3D",
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: 0,
                    fontFamily: "inherit",
                  }}
                >
                  Retry
                </button>
              </div>
            ) : null}

            {!loading && status ? (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e4e9f0",
                  borderRadius: 12,
                  padding: "16px 18px",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#8a9ab0",
                    marginBottom: 4,
                  }}
                >
                  Stripe Connect
                </div>
                <Row label="Status" value={statusLabel(state)} />
                {status.account_exists ? (
                  <Row label="Account" value={maskStripeAccountId(status.stripe_account_id)} />
                ) : null}
                <Row label="Charges enabled" value={yesNo(status.stripe_charges_enabled)} />
                <Row label="Payouts enabled" value={yesNo(status.stripe_payouts_enabled)} />
                <Row label="Details submitted" value={yesNo(status.stripe_details_submitted)} />
                <Row
                  label="Requirements currently due"
                  value={String(status.currently_due_count ?? 0)}
                />
                <Row
                  label="Requirements eventually due"
                  value={String(status.eventually_due_count ?? 0)}
                />
                {status.disabled_reason ? (
                  <Row label="Disabled reason" value={String(status.disabled_reason)} />
                ) : null}

                <p style={{ ...secondaryNoteStyle, marginTop: 16 }}>
                  {statusExplanation(state, status)}
                </p>

                {state === "connected" &&
                status.stripe_charges_enabled &&
                status.stripe_payouts_enabled ? (
                  <p style={secondaryNoteStyle}>
                    Charges and payouts are enabled according to Stripe.
                  </p>
                ) : state === "connected" ? (
                  <p style={secondaryNoteStyle}>
                    Do not assume payouts are available until Stripe reports both charges and payouts
                    enabled.
                  </p>
                ) : null}

                <div style={{ marginTop: 20 }}>
                  <button
                    type="button"
                    onClick={primaryAction}
                    disabled={actionBusy}
                    style={{
                      ...primaryButtonStyle,
                      opacity: actionBusy ? 0.7 : 1,
                      cursor: actionBusy ? "default" : "pointer",
                    }}
                  >
                    {actionBusy ? "Working…" : primaryLabel}
                  </button>
                </div>

                {state === "connected" && needsResolve === false && Number(status?.currently_due_count || 0) === 0 ? (
                  <p style={secondaryNoteStyle}>
                    Opens Stripe account management for this restaurant. Menuply never stores your
                    bank account details.
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </OperatorLayout>
  );
}
