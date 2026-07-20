/**
 * Operator My Account — Settings (default) + My QR Code.
 * Route: /operator/my-account?tab=settings|qr|password
 *
 * Profile Editor and Menu moved to Operations / Menu sidebar sections.
 * Settings includes: Account Settings, Merchant Account, Delivery Portal, Owner PIN.
 * Legacy ?tab=profile|menu|delivery redirect to new homes.
 */
import { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";
import { getSubscriptionStatusLabel, formatMoney } from "../../components/payments/paymentHelpers.js";
import PrimaryQrCard from "../../components/qr/PrimaryQrCard.jsx";
import OperatorDeliveryPortalPanel from "./OperatorDeliveryPortalPanel.jsx";
import {
  FREE_PLAN_CODE,
  getMarketplaceCommissionDisclosure,
} from "../../lib/menuplyCheckoutPlans.js";

const TABS = [
  { id: "settings", label: "Settings" },
  { id: "qr", label: "My QR Code" },
  { id: "password", label: "Password" },
];

const SETTINGS_SUBNAV = [
  { id: "account", label: "Account Settings" },
  { id: "merchant", label: "Merchant Account" },
  { id: "delivery", label: "Delivery Portal" },
  { id: "pin", label: "Owner PIN Settings" },
];

function normalizeTab(raw) {
  const id = String(raw || "").toLowerCase();
  if (id === "profile") return "profile_redirect";
  if (id === "menu") return "menu_redirect";
  if (id === "delivery") return "settings";
  return TABS.some((t) => t.id === id) ? id : "settings";
}

function normalizeSettingsPanel(raw) {
  const id = String(raw || "").toLowerCase();
  if (id === "delivery") return "delivery";
  return SETTINGS_SUBNAV.some((p) => p.id === id) ? id : "account";
}

/** Build My Account tab hrefs. */
export function myAccountHref(tabId, settingsPanelId = "account") {
  const tab = normalizeTab(tabId);
  if (tab === "profile_redirect") return "/operator/profile-editor";
  if (tab === "menu_redirect") return "/operator/menu-worksheet";
  if (tab === "settings") {
    const panel = normalizeSettingsPanel(settingsPanelId);
    if (panel !== "account") {
      return `/operator/my-account?tab=settings&panel=${encodeURIComponent(panel)}`;
    }
  }
  return `/operator/my-account?tab=${encodeURIComponent(tab === "profile_redirect" || tab === "menu_redirect" ? "settings" : tab)}`;
}

function getPlanTier(planCode) {
  if (!planCode) return "published";
  if (planCode === "published_free" || planCode === "verified") return "published";
  if (planCode === "founders_annual" || planCode === "founders_monthly") return "founders";
  if (planCode?.startsWith("starter")) return "starter";
  if (planCode?.startsWith("pro")) return "pro";
  if (planCode === "foodtruck_verified_annual" || planCode === "food_truck_annual") {
    return "food_truck";
  }
  return "published";
}

function getPlanDisplayName(planCode) {
  if (!planCode || planCode === "verified" || planCode === "published_free") return "Starter";
  if (planCode === "starter_monthly") return "Pro — Monthly";
  if (planCode === "starter_annual") return "Pro — Annual";
  if (planCode === "pro_monthly") return "Pro Partner — Monthly";
  if (planCode === "pro_annual") return "Pro Partner — Annual";
  if (planCode === "founders_monthly") return "Founders — Monthly";
  if (planCode === "founders_annual") return "Founders — Annual";
  if (planCode === "foodtruck_verified_annual" || planCode === "food_truck_annual") {
    return "Food Truck Annual";
  }
  return planCode;
}

function formatLongDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function Row({ label, value, last }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
        borderBottom: last ? "none" : "1px solid #f0f4f8",
      }}
    >
      <span style={{ fontSize: 13, color: "#78716c", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#0f1720", fontWeight: 650, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();
  const colors = {
    active: { bg: "#f0faf6", color: "#1F4E3D" },
    trialing: { bg: "#f0f7ff", color: "#1e40af" },
    past_due: { bg: "#fff7ed", color: "#92400e" },
    canceling: { bg: "#fef3c7", color: "#92400e" },
    cancelled: { bg: "#f3f4f6", color: "#6b7280" },
    canceled: { bg: "#f3f4f6", color: "#6b7280" },
  };
  const style = colors[normalized] || { bg: "#f3f4f6", color: "#6b7280" };
  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        fontWeight: 700,
        fontSize: 12,
        padding: "3px 10px",
        borderRadius: 20,
        display: "inline-block",
      }}
    >
      {getSubscriptionStatusLabel(status) || status || "—"}
    </span>
  );
}

function QuietLink({ onClick, href, children }) {
  const style = {
    fontSize: 13,
    fontWeight: 650,
    color: "#1F4E3D",
    textDecoration: "none",
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    fontFamily: "inherit",
  };
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" style={style}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} style={style}>
      {children}
    </button>
  );
}

function SectionCard({ title, children, style, "data-testid": testId }) {
  return (
    <section
      data-testid={testId}
      style={{
        background: "#fff",
        border: "1px solid #e7e5e4",
        borderRadius: 12,
        padding: "18px 20px",
        marginBottom: 16,
        ...style,
      }}
    >
      {title ? (
        <h2
          style={{
            margin: "0 0 14px",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#78716c",
          }}
        >
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

function TabBar({ tabs, activeId, onSelect }) {
  return (
    <div
      role="tablist"
      aria-label="My Account sections"
      data-testid="my-account-tabs"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 4,
        marginBottom: 20,
        borderBottom: "1px solid #e7e5e4",
        paddingBottom: 0,
      }}
    >
      {tabs.map((tab) => {
        const on = tab.id === activeId;
        const href = myAccountHref(tab.id);
        return (
          <Link
            key={tab.id}
            role="tab"
            aria-selected={on}
            data-testid={`my-account-tab-${tab.id}`}
            to={href}
            replace
            onClick={(event) => {
              // Drive UI from local state immediately; keep URL in sync via Link.
              event.preventDefault();
              onSelect(tab.id);
            }}
            style={{
              background: "none",
              border: "none",
              borderBottom: on ? "2px solid #1F4E3D" : "2px solid transparent",
              marginBottom: -1,
              padding: "10px 14px",
              fontSize: 13,
              fontWeight: on ? 750 : 600,
              color: on ? "#1F4E3D" : "#78716c",
              cursor: "pointer",
              fontFamily: "inherit",
              textDecoration: "none",
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

function SubNav({ panels, activeId, onSelect }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }} data-testid="my-account-menu-panels">
      {panels.map((panel) => {
        const on = panel.id === activeId;
        return (
          <Link
            key={panel.id}
            data-testid={`my-account-menu-panel-${panel.id}`}
            to={myAccountHref("menu", panel.id)}
            replace
            onClick={(event) => {
              event.preventDefault();
              onSelect(panel.id);
            }}
            style={{
              background: on ? "#1c1917" : "#fff",
              color: on ? "#fff" : "#44403c",
              border: on ? "1px solid #1c1917" : "1px solid #d6d3d1",
              borderRadius: 999,
              padding: "7px 14px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              textDecoration: "none",
            }}
          >
            {panel.label}
          </Link>
        );
      })}
    </div>
  );
}

const BTN_PRIMARY = {
  background: "#1c1917",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "10px 16px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

const BTN_SECONDARY = {
  background: "#fff",
  color: "#1c1917",
  border: "1px solid #d6d3d1",
  borderRadius: 8,
  padding: "10px 16px",
  fontSize: 13,
  fontWeight: 650,
  cursor: "pointer",
  fontFamily: "inherit",
};

export default function OperatorMyAccount() {
  const { t } = useLanguage();
  const { selectedRestaurant, subscription: contextSubscription, operator } = useOperator();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const rawTab = String(searchParams.get("tab") || "").toLowerCase();
  useEffect(() => {
    if (rawTab === "profile") {
      navigate("/operator/profile-editor", { replace: true });
      return;
    }
    if (rawTab === "menu") {
      navigate("/operator/menu-worksheet", { replace: true });
    }
  }, [rawTab, navigate]);

  const urlTab = normalizeTab(searchParams.get("tab"));
  const urlSettingsPanel = normalizeSettingsPanel(
    searchParams.get("panel") || (rawTab === "delivery" ? "delivery" : "account")
  );
  const [tab, setTab] = useState(urlTab === "profile_redirect" || urlTab === "menu_redirect" ? "settings" : urlTab);
  const [settingsPanel, setSettingsPanel] = useState(urlSettingsPanel);
  const [pinDigits, setPinDigits] = useState("");
  const [pinBusy, setPinBusy] = useState(false);
  const [pinMessage, setPinMessage] = useState("");

  useEffect(() => {
    if (urlTab === "profile_redirect" || urlTab === "menu_redirect") return;
    setTab(urlTab);
    setSettingsPanel(urlSettingsPanel);
  }, [urlTab, urlSettingsPanel]);

  function selectTab(nextTab) {
    const normalized = normalizeTab(nextTab);
    if (normalized === "profile_redirect") {
      navigate("/operator/profile-editor");
      return;
    }
    if (normalized === "menu_redirect") {
      navigate("/operator/menu-worksheet");
      return;
    }
    setTab(normalized);
    navigate(myAccountHref(normalized, settingsPanel), { replace: true });
  }

  function selectSettingsPanel(nextPanel) {
    const normalized = normalizeSettingsPanel(nextPanel);
    setTab("settings");
    setSettingsPanel(normalized);
    navigate(myAccountHref("settings", normalized), { replace: true });
  }

  const [subscription, setSubscription] = useState(null);
  const [billingOverview, setBillingOverview] = useState(null);
  const [primaryQr, setPrimaryQr] = useState(null);
  const [accountOpenedAt, setAccountOpenedAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelMessage, setCancelMessage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  async function loadAccountData(rid) {
    setLoading(true);
    setError("");
    try {
      const [subData, billingData, qrData, profileData] = await Promise.allSettled([
        api.getPlatformSubscriptionStatus(rid),
        api.getBillingOverview(rid),
        api.getPrimaryQr(rid),
        api.getProfile(rid),
      ]);
      setSubscription(subData.status === "fulfilled" ? subData.value : null);
      setBillingOverview(billingData.status === "fulfilled" ? billingData.value : null);
      setPrimaryQr(qrData.status === "fulfilled" ? qrData.value?.qr || null : null);
      const profile = profileData.status === "fulfilled" ? profileData.value?.profile : null;
      setAccountOpenedAt(profile?.created_at || selectedRestaurant?.created_at || null);
      if (subData.status === "rejected") setError("Unable to load subscription details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedRestaurant?.id) {
      loadAccountData(selectedRestaurant.id);
    } else {
      setSubscription(null);
      setBillingOverview(null);
      setPrimaryQr(null);
      setAccountOpenedAt(null);
    }
  }, [selectedRestaurant?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSetupPin() {
    if (!selectedRestaurant?.id) return;
    const pin = String(pinDigits || "").replace(/\D/g, "");
    if (pin.length !== 4) {
      setPinMessage("Enter a 4-digit Owner PIN.");
      return;
    }
    setPinBusy(true);
    setPinMessage("");
    try {
      await api.setupOwnerPin(selectedRestaurant.id, pin);
      setPinMessage("Owner PIN saved.");
      setPinDigits("");
    } catch (err) {
      setPinMessage(err.message || "Unable to save Owner PIN.");
    } finally {
      setPinBusy(false);
    }
  }

  async function handleResetPin() {
    if (!selectedRestaurant?.id) return;
    setPinBusy(true);
    setPinMessage("");
    try {
      await api.resetOwnerPin(selectedRestaurant.id);
      setPinMessage("Owner PIN reset. Set a new 4-digit PIN above.");
      setPinDigits("");
    } catch (err) {
      setPinMessage(err.message || "Unable to reset Owner PIN.");
    } finally {
      setPinBusy(false);
    }
  }

  const planCode = subscription?.plan_code || contextSubscription?.plan_slug || null;
  const planDisplayOverride =
    !subscription?.plan_code && contextSubscription?.plan_name ? contextSubscription.plan_name : null;
  const tier = getPlanTier(planCode);
  const marketplaceCommissionLabel = getMarketplaceCommissionDisclosure(
    subscription?.commission_rate_bps != null
      ? {
          code: planCode || FREE_PLAN_CODE,
          commission_rate_bps: subscription.commission_rate_bps,
          commission_lock_months: subscription.commission_lock_months,
        }
      : planCode || FREE_PLAN_CODE
  );
  const isFreeTier = tier === "published";
  const normalizedStatus = String(subscription?.status || "").toLowerCase();

  const canCancel =
    Boolean(subscription?.stripe_subscription_id && subscription?.current_period_end) &&
    ["active", "trialing", "past_due"].includes(normalizedStatus) &&
    !subscription?.cancel_at_period_end;

  const nextBillingDate = isFreeTier
    ? "—"
    : formatLongDate(subscription?.current_period_end);

  async function handleCancel() {
    if (!selectedRestaurant?.id) return;
    setCancelBusy(true);
    try {
      await api.cancelPlatformSubscription({ restaurantId: selectedRestaurant.id, atPeriodEnd: true });
      setCancelMessage("Cancellation scheduled. Your plan remains active until the end of the billing period.");
      setCancelConfirm(false);
      await loadAccountData(selectedRestaurant.id);
    } catch {
      setCancelMessage("Unable to process cancellation. Please try again.");
    } finally {
      setCancelBusy(false);
    }
  }

  async function handleChangePassword() {
    setPasswordError("");
    setPasswordMessage("");
    if (!(newPassword.length >= 8 && /\d/.test(newPassword) && /[A-Z]/.test(newPassword))) {
      setPasswordError("Password must be at least 8 characters and include 1 uppercase letter and 1 number");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    setPasswordSaving(true);
    try {
      await api.changeOperatorPassword(currentPassword, newPassword);
      setPasswordMessage("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setPasswordError(err.message || "Failed to update password");
    } finally {
      setPasswordSaving(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    fontSize: 13,
    border: "1px solid #e7e5e4",
    borderRadius: 8,
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  return (
    <OperatorLayout title="My Account">
      <div style={{ maxWidth: 960, paddingBottom: 48 }}>
        <TabBar tabs={TABS} activeId={tab} onSelect={selectTab} />

        {!selectedRestaurant?.id && tab !== "password" ? (
          <p style={{ fontSize: 14, color: "#78716c", marginBottom: 16 }}>
            {t("operator.selectRestaurantProfile", "Select a restaurant to edit its profile.")}
          </p>
        ) : null}

        {tab === "settings" && selectedRestaurant?.id ? (
          <>
            <SubNav panels={SETTINGS_SUBNAV} activeId={settingsPanel} onSelect={selectSettingsPanel} />

            {settingsPanel === "account" ? (
            <SectionCard title="Account Settings" data-testid="my-account-panel-settings">
              {loading ? (
                <p style={{ margin: 0, fontSize: 13, color: "#78716c" }}>Loading…</p>
              ) : error ? (
                <p style={{ margin: 0, fontSize: 13, color: "#92400e" }}>{error}</p>
              ) : (
                <>
                  <Row
                    label="Account type"
                    value={
                      <div>
                        <div>{planDisplayOverride || getPlanDisplayName(planCode)}</div>
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#1F4E3D",
                            lineHeight: 1.35,
                          }}
                          data-testid="my-account-marketplace-commission"
                        >
                          {marketplaceCommissionLabel}
                        </div>
                      </div>
                    }
                  />
                  <Row label="Account opened" value={formatLongDate(accountOpenedAt)} />
                  <Row
                    label="Status"
                    value={
                      <StatusBadge
                        status={
                          subscription?.status ||
                          contextSubscription?.status ||
                          (isFreeTier ? "active" : null)
                        }
                      />
                    }
                  />
                  <Row label="Next billing date" value={nextBillingDate} last={!billingOverview} />

                  {billingOverview ? (
                    <>
                      {billingOverview.subscription?.subscription_fee_amount_cents != null ? (
                        <Row
                          label="Subscription fee"
                          value={formatMoney(billingOverview.subscription.subscription_fee_amount_cents)}
                        />
                      ) : null}
                      {billingOverview.payment_method?.present ? (
                        <Row
                          label="Payment method"
                          value={
                            billingOverview.payment_method.brand
                              ? `${billingOverview.payment_method.brand.charAt(0).toUpperCase()}${billingOverview.payment_method.brand.slice(1)} ···· ${billingOverview.payment_method.last4}`
                              : "On file"
                          }
                          last
                        />
                      ) : (
                        <div style={{ height: 0 }} />
                      )}
                    </>
                  ) : null}

                  {!isFreeTier && subscription?.cancel_at_period_end && !cancelMessage ? (
                    <p style={{ margin: "12px 0 0", fontSize: 13, color: "#92400e" }}>
                      Your plan will not renew. Access continues until {nextBillingDate}.
                    </p>
                  ) : null}
                  {cancelMessage ? (
                    <p style={{ margin: "12px 0 0", fontSize: 13, color: "#1F4E3D" }}>{cancelMessage}</p>
                  ) : null}

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
                    <button
                      type="button"
                      onClick={() => navigate("/operator/subscription")}
                      style={BTN_PRIMARY}
                    >
                      Change account type
                    </button>
                    {canCancel && !cancelConfirm ? (
                      <button
                        type="button"
                        onClick={() => setCancelConfirm(true)}
                        style={{
                          background: "none",
                          color: "#78716c",
                          border: "none",
                          padding: "10px 8px",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>

                  {cancelConfirm ? (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f0f4f8" }}>
                      <p style={{ margin: "0 0 12px", fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
                        Your plan stays active until <strong>{nextBillingDate}</strong>, then switches to
                        Starter (free).
                      </p>
                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          type="button"
                          onClick={handleCancel}
                          disabled={cancelBusy}
                          style={{
                            background: "#7f1d1d",
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            padding: "9px 14px",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: cancelBusy ? "default" : "pointer",
                            opacity: cancelBusy ? 0.7 : 1,
                            fontFamily: "inherit",
                          }}
                        >
                          {cancelBusy ? "Processing…" : "Confirm cancellation"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCancelConfirm(false)}
                          disabled={cancelBusy}
                          style={BTN_SECONDARY}
                        >
                          Keep plan
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </SectionCard>
            ) : null}

            {settingsPanel === "merchant" ? (
              <SectionCard title="Merchant Account" data-testid="my-account-panel-merchant">
                <p style={{ margin: "0 0 14px", fontSize: 13, color: "#78716c", lineHeight: 1.5 }}>
                  Connect payouts and review merchant account status for this restaurant.
                </p>
                <button type="button" style={BTN_PRIMARY} onClick={() => navigate("/operator/merchant")}>
                  Open Merchant Account →
                </button>
              </SectionCard>
            ) : null}

            {settingsPanel === "delivery" ? (
              <SectionCard title="Delivery Portal" data-testid="my-account-panel-delivery">
                <OperatorDeliveryPortalPanel embedded />
              </SectionCard>
            ) : null}

            {settingsPanel === "pin" ? (
              <SectionCard title="Owner PIN Settings" data-testid="my-account-panel-pin">
                <p style={{ margin: "0 0 14px", fontSize: 13, color: "#78716c", lineHeight: 1.5 }}>
                  Your 4-digit Owner PIN unlocks sensitive business actions. Signed in as{" "}
                  {operator?.email || "owner"}.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pinDigits}
                    onChange={(e) => setPinDigits(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="4-digit PIN"
                    style={{
                      ...inputStyle,
                      width: 140,
                      letterSpacing: "0.2em",
                      fontWeight: 700,
                    }}
                  />
                  <button type="button" style={BTN_PRIMARY} disabled={pinBusy} onClick={handleSetupPin}>
                    {pinBusy ? "Saving…" : "Save PIN"}
                  </button>
                  <button type="button" style={BTN_SECONDARY} disabled={pinBusy} onClick={handleResetPin}>
                    Reset PIN
                  </button>
                </div>
                {pinMessage ? (
                  <p style={{ margin: "12px 0 0", fontSize: 13, color: "#1F4E3D", fontWeight: 600 }}>
                    {pinMessage}
                  </p>
                ) : null}
              </SectionCard>
            ) : null}
          </>
        ) : null}

        {tab === "qr" && selectedRestaurant?.id ? (
          <SectionCard title="My QR Code" data-testid="my-account-panel-qr">
            {loading ? (
              <p style={{ margin: 0, fontSize: 13, color: "#78716c" }}>Loading…</p>
            ) : primaryQr ? (
              <PrimaryQrCard
                qr={primaryQr}
                restaurantId={selectedRestaurant.id}
                restaurantName={selectedRestaurant.restaurant_name}
              />
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: "#78716c", lineHeight: 1.5 }}>
                No primary menu QR is available yet. Once your restaurant is claimed and on an eligible plan,
                Menuply creates one automatically. Physical stickers and decals are in{" "}
                <QuietLink onClick={() => navigate("/operator/qr-kits/order")}>Marketplace →</QuietLink>
              </p>
            )}
          </SectionCard>
        ) : null}

        {tab === "password" ? (
          <SectionCard title="Password" data-testid="my-account-panel-password">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                autoComplete="current-password"
                style={inputStyle}
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                autoComplete="new-password"
                style={inputStyle}
              />
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
                style={inputStyle}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={passwordSaving}
                  style={{
                    ...BTN_PRIMARY,
                    opacity: passwordSaving ? 0.7 : 1,
                    cursor: passwordSaving ? "default" : "pointer",
                  }}
                >
                  {passwordSaving ? "Updating…" : "Update password"}
                </button>
                {(passwordError || passwordMessage) && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: passwordError ? "#dc2626" : "#16a34a",
                    }}
                  >
                    {passwordError || passwordMessage}
                  </span>
                )}
              </div>
            </div>
          </SectionCard>
        ) : null}
      </div>
    </OperatorLayout>
  );
}
