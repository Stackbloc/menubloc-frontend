/**
 * Operator My Account — tabbed account hub.
 * Route: /operator/my-account?tab=profile|menu|settings|password
 * Menu sub: ?tab=menu&menuPanel=view|edit
 *
 * Profile Editor — public restaurant listing fields
 * Menu — view public menu + Edit menu content (Menu Worksheet)
 * Settings — account type, open date, next billing, change, cancel
 * Password — operator password
 */
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";
import { getSubscriptionStatusLabel, formatMoney } from "../../components/payments/paymentHelpers.js";
import PrimaryQrCard from "../../components/qr/PrimaryQrCard.jsx";
import { operatorPublicProfilePath } from "../../lib/canonicalUrl.js";
import { OperatorRestaurantProfileForm } from "./OperatorProfileEditor.jsx";

const TABS = [
  { id: "profile", label: "Profile Editor" },
  { id: "menu", label: "Menu" },
  { id: "settings", label: "Settings" },
  { id: "password", label: "Password" },
];

const MENU_PANELS = [
  { id: "view", label: "View menu" },
  { id: "edit", label: "Edit menu content" },
];

function normalizeTab(raw) {
  const id = String(raw || "").toLowerCase();
  return TABS.some((t) => t.id === id) ? id : "profile";
}

function normalizeMenuPanel(raw) {
  const id = String(raw || "").toLowerCase();
  return MENU_PANELS.some((p) => p.id === id) ? id : "view";
}

/** Build My Account tab / panel hrefs — real links so tabs work without setSearchParams quirks. */
export function myAccountHref(tabId, menuPanelId = "view") {
  const tab = normalizeTab(tabId);
  if (tab === "menu") {
    return `/operator/my-account?tab=menu&menuPanel=${encodeURIComponent(normalizeMenuPanel(menuPanelId))}`;
  }
  return `/operator/my-account?tab=${encodeURIComponent(tab)}`;
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
  const { selectedRestaurant, subscription: contextSubscription } = useOperator();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const urlTab = normalizeTab(searchParams.get("tab"));
  const urlMenuPanel = normalizeMenuPanel(searchParams.get("menuPanel"));
  // Local state is source of truth for which panel is shown (URL can lag / fail to sync).
  const [tab, setTab] = useState(urlTab);
  const [menuPanel, setMenuPanel] = useState(urlMenuPanel);

  useEffect(() => {
    setTab(urlTab);
    setMenuPanel(urlMenuPanel);
  }, [urlTab, urlMenuPanel]);

  function selectTab(nextTab) {
    const normalized = normalizeTab(nextTab);
    setTab(normalized);
    if (normalized !== "menu") setMenuPanel("view");
    navigate(myAccountHref(normalized), { replace: true });
  }

  function selectMenuPanel(nextPanel) {
    const normalized = normalizeMenuPanel(nextPanel);
    setTab("menu");
    setMenuPanel(normalized);
    navigate(myAccountHref("menu", normalized), { replace: true });
  }

  const [subscription, setSubscription] = useState(null);
  const [billingOverview, setBillingOverview] = useState(null);
  const [primaryQr, setPrimaryQr] = useState(null);
  const [accountOpenedAt, setAccountOpenedAt] = useState(null);
  const [menus, setMenus] = useState([]);
  const [menusLoading, setMenusLoading] = useState(false);
  const [menusError, setMenusError] = useState("");
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

  async function loadMenus(rid) {
    setMenusLoading(true);
    setMenusError("");
    try {
      const data = await api.getMenus(rid);
      setMenus(Array.isArray(data?.menus) ? data.menus : []);
    } catch (err) {
      setMenus([]);
      setMenusError(err.message || "Unable to load menus.");
    } finally {
      setMenusLoading(false);
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
      setMenus([]);
    }
  }, [selectedRestaurant?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedRestaurant?.id && tab === "menu") {
      loadMenus(selectedRestaurant.id);
    }
  }, [selectedRestaurant?.id, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const planCode = subscription?.plan_code || contextSubscription?.plan_slug || null;
  const planDisplayOverride =
    !subscription?.plan_code && contextSubscription?.plan_name ? contextSubscription.plan_name : null;
  const tier = getPlanTier(planCode);
  const isFreeTier = tier === "published";
  const normalizedStatus = String(subscription?.status || "").toLowerCase();

  const canCancel =
    Boolean(subscription?.stripe_subscription_id && subscription?.current_period_end) &&
    ["active", "trialing", "past_due"].includes(normalizedStatus) &&
    !subscription?.cancel_at_period_end;

  const nextBillingDate = isFreeTier
    ? "—"
    : formatLongDate(subscription?.current_period_end);

  const publicProfileHref = selectedRestaurant ? operatorPublicProfilePath(selectedRestaurant) : null;
  const publicMenuHref = selectedRestaurant?.id
    ? `/restaurants/${selectedRestaurant.id}/menu`
    : null;

  const primaryMenu = useMemo(() => {
    if (!menus.length) return null;
    return menus.find((m) => m.is_primary || m.is_active) || menus[0];
  }, [menus]);

  function worksheetPath(menuId) {
    return `/operator/restaurants/${selectedRestaurant.id}/menus/${menuId}/worksheet`;
  }

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

        {tab === "profile" && selectedRestaurant?.id ? (
          <SectionCard title="Public restaurant profile" data-testid="my-account-panel-profile">
            <p style={{ margin: "-4px 0 16px", fontSize: 13, color: "#78716c", lineHeight: 1.5 }}>
              These fields appear on your public Menuply listing. Save a draft, then publish to go live.
            </p>
            {publicProfileHref ? (
              <div style={{ marginBottom: 14 }}>
                <QuietLink href={publicProfileHref}>View public profile ↗</QuietLink>
              </div>
            ) : null}
            <OperatorRestaurantProfileForm embedded />
          </SectionCard>
        ) : null}

        {tab === "menu" && selectedRestaurant?.id ? (
          <SectionCard title="Menu" data-testid="my-account-panel-menu">
            <SubNav panels={MENU_PANELS} activeId={menuPanel} onSelect={selectMenuPanel} />

            {menuPanel === "view" ? (
              <>
                <p style={{ margin: "0 0 14px", fontSize: 13, color: "#78716c", lineHeight: 1.5 }}>
                  Open the live diner menu your guests see on Menuply.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
                  <button
                    type="button"
                    style={BTN_PRIMARY}
                    disabled={!publicMenuHref}
                    onClick={() => window.open(publicMenuHref, "_blank", "noopener,noreferrer")}
                  >
                    View public menu ↗
                  </button>
                  <button
                    type="button"
                    style={BTN_SECONDARY}
                    onClick={() => selectMenuPanel("edit")}
                  >
                    Edit menu content →
                  </button>
                </div>
                {menusLoading ? (
                  <p style={{ margin: 0, fontSize: 13, color: "#78716c" }}>Loading menus…</p>
                ) : menusError ? (
                  <p style={{ margin: 0, fontSize: 13, color: "#92400e" }}>{menusError}</p>
                ) : menus.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 13, color: "#78716c", lineHeight: 1.5 }}>
                    No menus yet. Upload a PDF or photo from Menu Lab, then return here to edit content.
                  </p>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {menus.map((menu) => (
                      <div
                        key={menu.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 12px",
                          border: "1px solid #e7e5e4",
                          borderRadius: 10,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f1720" }}>
                            {menu.name || menu.title || `Menu ${menu.id}`}
                          </div>
                          <div style={{ fontSize: 12, color: "#78716c", marginTop: 2 }}>
                            {[menu.status, menu.is_primary ? "Primary" : null].filter(Boolean).join(" · ") ||
                              "Menu"}
                          </div>
                        </div>
                        <QuietLink href={publicMenuHref}>View ↗</QuietLink>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <p style={{ margin: "0 0 14px", fontSize: 13, color: "#78716c", lineHeight: 1.5 }}>
                  Edit dish names, sections, descriptions, and Menuply prices in the Menu Worksheet — content
                  only (not layout or photos).
                </p>
                {menusLoading ? (
                  <p style={{ margin: 0, fontSize: 13, color: "#78716c" }}>Loading menus…</p>
                ) : menusError ? (
                  <p style={{ margin: 0, fontSize: 13, color: "#92400e" }}>{menusError}</p>
                ) : menus.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 13, color: "#78716c", lineHeight: 1.5 }}>
                    No menus to edit yet. After a PDF or photo upload finishes, open the worksheet from here.
                  </p>
                ) : (
                  <>
                    {primaryMenu ? (
                      <div style={{ marginBottom: 14 }}>
                        <button
                          type="button"
                          style={BTN_PRIMARY}
                          onClick={() => navigate(worksheetPath(primaryMenu.id))}
                        >
                          Open Menu Worksheet
                        </button>
                      </div>
                    ) : null}
                    <div style={{ display: "grid", gap: 8 }}>
                      {menus.map((menu) => (
                        <div
                          key={menu.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 12,
                            padding: "10px 12px",
                            border: "1px solid #e7e5e4",
                            borderRadius: 10,
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f1720" }}>
                              {menu.name || menu.title || `Menu ${menu.id}`}
                            </div>
                            <div style={{ fontSize: 12, color: "#78716c", marginTop: 2 }}>
                              Content editor · names, prices, sections
                            </div>
                          </div>
                          <button
                            type="button"
                            style={{ ...BTN_SECONDARY, padding: "8px 12px" }}
                            onClick={() => navigate(worksheetPath(menu.id))}
                          >
                            Edit content
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </SectionCard>
        ) : null}

        {tab === "settings" && selectedRestaurant?.id ? (
          <>
            <SectionCard title="Account settings" data-testid="my-account-panel-settings">
              {loading ? (
                <p style={{ margin: 0, fontSize: 13, color: "#78716c" }}>Loading…</p>
              ) : error ? (
                <p style={{ margin: 0, fontSize: 13, color: "#92400e" }}>{error}</p>
              ) : (
                <>
                  <Row
                    label="Account type"
                    value={planDisplayOverride || getPlanDisplayName(planCode)}
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

            <SectionCard title="Primary QR">
              <PrimaryQrCard qr={primaryQr} restaurantId={selectedRestaurant?.id} />
              <div style={{ marginTop: 10 }}>
                <QuietLink onClick={() => navigate("/operator/qr-kits/order")}>QR tools →</QuietLink>
              </div>
            </SectionCard>
          </>
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
