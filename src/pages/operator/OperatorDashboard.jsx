/**
 * src/pages/operator/OperatorDashboard.jsx
 *
 * Lightweight My Account home for restaurant operators.
 * Uses existing operator/session/menu/deal/subscription data only.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";

const GREEN = "#1F4E3D";
const BORDER = "#e4e9f0";
const SOFT = "#f8fafc";

const PLAN_LABELS = {
  verified: "Verified",
  pro_monthly: "Pro",
  pro_annual: "Pro",
  founders_annual: "Founder",
  performance_partner: "Performance Partner",
};

function CopyLinkButton({ url }) {
  const [label, setLabel] = useState("Copy Display Link");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setLabel("Copied!");
    } catch {
      setLabel("Copy failed");
    }
    setTimeout(() => setLabel("Copy Display Link"), 2500);
  }

  return (
    <button type="button" onClick={handleCopy} style={s.secondaryButton}>
      {label}
    </button>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div style={s.statCard}>
      <div style={s.statValue}>{value ?? "—"}</div>
      <div style={s.statLabel}>{label}</div>
      {sub ? <div style={s.statSub}>{sub}</div> : null}
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <section style={s.sectionCard}>
      <h2 style={s.sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

function SummaryRow({ label, value, hint }) {
  return (
    <div style={s.summaryRow}>
      <div style={{ minWidth: 0 }}>
        <div style={s.summaryLabel}>{label}</div>
        {hint ? <div style={s.summaryHint}>{hint}</div> : null}
      </div>
      <div style={s.summaryValue}>{value || "—"}</div>
    </div>
  );
}

function ActionCard({ icon, title, description, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...s.actionCard,
        borderColor: hover ? GREEN : BORDER,
        background: hover ? "#f0f8f4" : "#fff",
      }}
    >
      <div style={s.actionIcon}>{icon}</div>
      <div style={s.actionTitle}>{title}</div>
      <div style={s.actionDescription}>{description}</div>
    </button>
  );
}

function LinkRow({ label, detail, cta, onClick, disabled = false }) {
  return (
    <div style={s.linkRow}>
      <div style={{ minWidth: 0 }}>
        <div style={s.linkTitle}>{label}</div>
        <div style={s.linkDetail}>{detail}</div>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{
          ...s.inlineButton,
          opacity: disabled ? 0.55 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {cta}
      </button>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    published: { bg: "#d1fae5", color: "#065f46", label: "Live" },
    draft: { bg: "#fef9c3", color: "#854d0e", label: "Draft" },
    archived: { bg: "#f1f5f9", color: "#475569", label: "Archived" },
    active: { bg: "#d1fae5", color: "#065f46", label: "Active" },
    paused: { bg: "#fef9c3", color: "#854d0e", label: "Paused" },
    expired: { bg: "#f1f5f9", color: "#475569", label: "Expired" },
  };

  const normalized = String(status || "").toLowerCase();
  const style = map[normalized] || { bg: "#f1f5f9", color: "#475569", label: normalized || "Unknown" };

  return (
    <span style={{ background: style.bg, color: style.color, borderRadius: 999, padding: "3px 9px", fontSize: 11, fontWeight: 700 }}>
      {style.label}
    </span>
  );
}

function formatPlanLabel(platformSubscription, sessionSubscription) {
  const code = String(platformSubscription?.plan_code || "").trim().toLowerCase();
  if (PLAN_LABELS[code]) return PLAN_LABELS[code];
  if (sessionSubscription?.plan_name) return sessionSubscription.plan_name;
  if (sessionSubscription?.plan_slug && PLAN_LABELS[sessionSubscription.plan_slug]) {
    return PLAN_LABELS[sessionSubscription.plan_slug];
  }
  return "Verified";
}

function formatPlanStatus(platformSubscription, sessionSubscription) {
  const status = String(platformSubscription?.status || sessionSubscription?.status || "").trim().toLowerCase();
  if (!status) return "Included";
  if (status === "trialing") return "Trialing";
  if (status === "past_due") return "Past due";
  if (status === "canceling" || status === "canceled") return "Canceling";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatCents(amountCents, currency = "usd") {
  if (amountCents == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}

function formatBillingInterval(interval) {
  if (!interval) return "—";
  if (interval === "month") return "Monthly";
  if (interval === "year") return "Annual";
  return interval;
}

function formatRenewalDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPaymentMethod(pm) {
  if (!pm?.present || !pm.brand) return "None on file";
  const brand = pm.brand.charAt(0).toUpperCase() + pm.brand.slice(1);
  const exp = pm.exp_month && pm.exp_year ? `, exp ${pm.exp_month}/${pm.exp_year}` : "";
  return `${brand} ···· ${pm.last4}${exp}`;
}

function formatSubStatus(status) {
  if (!status) return "—";
  const map = {
    active: "Active",
    trialing: "Trialing",
    past_due: "Past due",
    unpaid: "Unpaid",
    incomplete: "Incomplete",
    inactive: "Inactive",
    canceling: "Canceling",
    canceled: "Canceled",
  };
  return map[status.toLowerCase()] || status;
}

function formatCommissionRate(rate) {
  if (rate == null) return "—";
  return `${rate}%`;
}

function deriveMenuState(menus) {
  const liveCount = menus.filter((menu) => String(menu.status || "").toLowerCase() === "published").length;
  const draftCount = menus.filter((menu) => String(menu.status || "").toLowerCase() === "draft").length;

  if (liveCount > 0) {
    return {
      label: "Menu live",
      detail: `${liveCount} live menu${liveCount === 1 ? "" : "s"} available to customers.`,
    };
  }

  if (draftCount > 0) {
    return {
      label: "Menu in progress",
      detail: `${draftCount} draft menu${draftCount === 1 ? "" : "s"} still need review or publishing.`,
    };
  }

  if (menus.length > 0) {
    return {
      label: "Menu saved",
      detail: "A menu exists, but nothing is live yet.",
    };
  }

  return {
    label: "Menu upload needed",
    detail: "No menu has been uploaded yet for this restaurant.",
  };
}

export default function OperatorDashboard() {
  const { operator, subscription, selectedRestaurant, restaurants, hasBenefit } = useOperator();
  const navigate = useNavigate();

  const [menus, setMenus] = useState([]);
  const [deals, setDeals] = useState([]);
  const [platformSubscription, setPlatformSubscription] = useState(null);
  const [loading, setLoading] = useState(false);

  const [billingOverview, setBillingOverview] = useState(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState(false);
  const [billingPortalLoading, setBillingPortalLoading] = useState(false);

  useEffect(() => {
    if (!selectedRestaurant?.id) {
      setMenus([]);
      setDeals([]);
      setPlatformSubscription(null);
      setBillingOverview(null);
      setBillingError(false);
      return;
    }

    const rid = selectedRestaurant.id;
    setLoading(true);
    setBillingLoading(true);
    setBillingError(false);

    Promise.allSettled([
      api.getMenus(rid),
      api.getDeals(rid),
      api.getPlatformSubscriptionStatus(rid),
      api.getBillingOverview(rid),
    ])
      .then(([menusResult, dealsResult, subscriptionResult, billingResult]) => {
        setMenus(menusResult.status === "fulfilled" ? menusResult.value?.menus || [] : []);
        setDeals(dealsResult.status === "fulfilled" ? dealsResult.value?.deals || [] : []);
        setPlatformSubscription(subscriptionResult.status === "fulfilled" ? subscriptionResult.value || null : null);
        if (billingResult.status === "fulfilled") {
          setBillingOverview(billingResult.value || null);
        } else {
          setBillingError(true);
        }
      })
      .finally(() => {
        setLoading(false);
        setBillingLoading(false);
      });
  }, [selectedRestaurant?.id]);

  async function handleOpenBillingPortal() {
    if (!selectedRestaurant?.id || billingPortalLoading) return;
    setBillingPortalLoading(true);
    try {
      await api.openBillingPortal(selectedRestaurant.id, { returnUrl: window.location.href });
    } catch {
      // openBillingPortal redirects on success; failure means portal is unavailable
    } finally {
      setBillingPortalLoading(false);
    }
  }

  const noRestaurant = restaurants.length === 0;

  const totals = useMemo(() => {
    const totalItems = menus.reduce((sum, menu) => sum + (Number(menu.item_count) || 0), 0);
    const activeDeals = deals.filter((deal) => String(deal.status || "").toLowerCase() === "active").length;
    const liveMenus = menus.filter((menu) => String(menu.status || "").toLowerCase() === "published");
    const draftMenus = menus.filter((menu) => String(menu.status || "").toLowerCase() === "draft");
    const primaryMenu =
      menus.find((menu) => menu.is_primary) ||
      liveMenus[0] ||
      draftMenus[0] ||
      menus[0] ||
      null;

    return {
      totalItems,
      activeDeals,
      liveMenus,
      draftMenus,
      primaryMenu,
    };
  }, [menus, deals]);

  const planLabel = formatPlanLabel(platformSubscription, subscription);
  const planStatus = formatPlanStatus(platformSubscription, subscription);
  const menuState = deriveMenuState(menus);
  const locationLabel = [selectedRestaurant?.city, selectedRestaurant?.state].filter(Boolean).join(", ");

  const bo = billingOverview;
  const canOpenPortal = bo?.actions?.can_open_billing_portal;

  return (
    <OperatorLayout title="My Account">
      {noRestaurant ? (
        <div style={s.emptyCard}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>🍽️</div>
          <h2 style={s.emptyTitle}>No restaurant linked yet</h2>
          <p style={s.emptyBody}>
            To manage menu status, QR access, and restaurant operations, your operator account needs to be linked to a restaurant listing.
          </p>
          <button type="button" onClick={() => navigate("/operator/claim")} style={s.primaryButton}>
            Find and claim my restaurant
          </button>
        </div>
      ) : (
        <div style={s.page}>
          <div style={s.heroCard}>
            <div>
              <div style={s.heroEyebrow}>My Account</div>
              <h1 style={s.heroTitle}>{selectedRestaurant?.restaurant_name || "My restaurant"}</h1>
              <p style={s.heroBody}>
                This is your restaurant operations home. Review plan and menu status, continue setup, and open your existing operator tools from one place.
              </p>
              <div style={s.metaRow}>
                {locationLabel ? <span style={s.metaPill}>{locationLabel}</span> : null}
                <span style={s.metaPill}>{planLabel}</span>
                <span style={s.metaPill}>{planStatus}</span>
                {operator?.email ? <span style={s.metaPill}>{operator.email}</span> : null}
              </div>
            </div>
            <div style={s.heroActions}>
              <button type="button" onClick={() => navigate("/operator/menu")} style={s.primaryButton}>
                Open Menu Editor
              </button>
              <button type="button" onClick={() => navigate("/operator/help")} style={s.secondaryButton}>
                Open Knowledge Base
              </button>
            </div>
          </div>

          <div style={s.statsRow}>
            <StatCard label="Menu items" value={totals.totalItems} sub="across current menus" />
            <StatCard label="Active deals" value={totals.activeDeals} sub="currently active" />
            <StatCard label="Plan" value={planLabel} sub={planStatus} />
            <StatCard label="Menu status" value={menuState.label} sub={loading ? "Refreshing…" : menuState.detail} />
          </div>

          <div style={s.sectionGrid}>
            <SectionCard title="Account status">
              <SummaryRow label="Restaurant" value={selectedRestaurant?.restaurant_name} hint="Current restaurant linked to this operator account" />
              <SummaryRow label="Location" value={locationLabel || "Not set"} hint="Public restaurant location" />
              <SummaryRow label="Operator email" value={operator?.email || "Not available"} hint="Signed-in operator account" />
              <SummaryRow label="Current plan" value={planLabel} hint="Neutral status visibility for Verified and paid restaurants" />
              <SummaryRow label="Plan status" value={planStatus} hint="From existing operator and platform subscription data" />
            </SectionCard>

            <SectionCard title="Menu and setup">
              <SummaryRow label="Menu state" value={menuState.label} hint={menuState.detail} />
              <SummaryRow
                label="Primary menu"
                value={totals.primaryMenu?.name || "No menu uploaded yet"}
                hint={totals.primaryMenu ? `${totals.primaryMenu.item_count || 0} items` : "Continue setup in Menu Editor"}
              />
              <SummaryRow
                label="Review / live state"
                value={
                  totals.liveMenus.length > 0
                    ? `${totals.liveMenus.length} live`
                    : totals.draftMenus.length > 0
                      ? `${totals.draftMenus.length} draft`
                      : "Not started"
                }
                hint="Draft menus still need review or publishing before they are customer-facing"
              />
              <SummaryRow
                label="Deals"
                value={`${totals.activeDeals} active`}
                hint="Launch and seasonal offers from the existing deals system"
              />
            </SectionCard>

            <SectionCard title="Continue setup">
              <div style={s.actionGrid}>
                <ActionCard
                  icon="☰"
                  title="Continue menu setup"
                  description="Open Menu Editor to upload, review, or publish menu items using the existing workflow."
                  onClick={() => navigate("/operator/menu")}
                />
                <ActionCard
                  icon="◷"
                  title="Complete profile"
                  description="Review restaurant bio, customer-facing details, and profile information."
                  onClick={() => navigate("/operator/profile")}
                />
                <ActionCard
                  icon="⏰"
                  title="Review hours"
                  description="Set operating hours and exceptions in the existing hours editor."
                  onClick={() => navigate("/operator/hours")}
                />
                <ActionCard
                  icon="▣"
                  title="Open QR tools"
                  description="Access the current QR starter kit flow and printed QR ordering tools."
                  onClick={() => navigate("/operator/qr-kits/order")}
                />
              </div>
            </SectionCard>

            <SectionCard title="Links">
              <div style={s.linkList}>
                <LinkRow
                  label="Public menu"
                  detail="Open the customer-facing public menu for this restaurant."
                  cta="Open menu"
                  onClick={() => window.open(`/public/restaurants/${selectedRestaurant.id}/menu`, "_blank")}
                />
                <LinkRow
                  label="Restaurant profile"
                  detail="Review the public restaurant profile and customer-facing details."
                  cta="Open profile"
                  onClick={() => window.open(`/restaurant-profile/${selectedRestaurant.id}`, "_blank")}
                />
                <LinkRow
                  label="Knowledge Base"
                  detail="Find onboarding help, operational guidance, and support references."
                  cta="Open Knowledge Base"
                  onClick={() => navigate("/operator/help")}
                />
                <LinkRow
                  label="Delivery settings"
                  detail="Use the existing delivery settings page when your restaurant is ready."
                  cta="Open delivery"
                  onClick={() => navigate("/operator/delivery")}
                />
              </div>
            </SectionCard>
          </div>

          <div style={{ marginTop: 28 }}>
            <SectionCard title="Billing summary">
              {billingLoading ? (
                <div style={s.billingPlaceholder}>Loading billing information…</div>
              ) : billingError ? (
                <div style={s.billingPlaceholder}>Billing details are currently unavailable.</div>
              ) : bo ? (
                <>
                  <SummaryRow
                    label="Plan"
                    value={bo.subscription?.plan_display_name || planLabel}
                  />
                  <SummaryRow
                    label="Status"
                    value={formatSubStatus(bo.subscription?.status)}
                  />
                  <SummaryRow
                    label="Billing interval"
                    value={formatBillingInterval(bo.subscription?.billing_interval)}
                  />
                  <SummaryRow
                    label="Renewal date"
                    value={formatRenewalDate(bo.subscription?.renewal_date)}
                  />
                  <SummaryRow
                    label="Subscription fee"
                    value={formatCents(
                      bo.subscription?.subscription_fee_amount_cents,
                      bo.subscription?.subscription_fee_currency,
                    )}
                  />
                  <SummaryRow
                    label="Commission rate"
                    value={formatCommissionRate(bo.marketplace?.effective_commission_rate_percent)}
                  />
                  <SummaryRow
                    label="Payment method"
                    value={formatPaymentMethod(bo.payment_method)}
                  />
                  <SummaryRow
                    label="Marketplace setup"
                    value={bo.stripe_connect?.onboarding_complete ? "Complete" : "Not complete"}
                  />
                  {canOpenPortal ? (
                    <div style={{ marginTop: 18 }}>
                      <button
                        type="button"
                        onClick={handleOpenBillingPortal}
                        disabled={billingPortalLoading}
                        style={{
                          ...s.primaryButton,
                          opacity: billingPortalLoading ? 0.65 : 1,
                          cursor: billingPortalLoading ? "not-allowed" : "pointer",
                        }}
                      >
                        {billingPortalLoading ? "Opening…" : "Manage Billing"}
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <div style={s.billingPlaceholder}>No billing information on file.</div>
              )}
            </SectionCard>
          </div>

          <div style={{ marginTop: 28 }}>
            <SectionCard title="Quick actions">
              <div style={s.actionGrid}>
                <ActionCard
                  icon="☰"
                  title="Menu Editor"
                  description="Add, edit, review, and publish menu items."
                  onClick={() => navigate("/operator/menu")}
                />
                <ActionCard
                  icon="⊹"
                  title="Deals"
                  description="Create and manage launch or seasonal deals."
                  onClick={() => navigate("/operator/deals")}
                />
                <ActionCard
                  icon="▣"
                  title="QR Starter Kit"
                  description="Open the existing QR starter kit ordering flow."
                  onClick={() => navigate("/operator/qr-kits/order")}
                />
                <ActionCard
                  icon="↗"
                  title="Public Menu"
                  description="Open the customer-facing public menu in a new tab."
                  onClick={() => window.open(`/public/restaurants/${selectedRestaurant.id}/menu`, "_blank")}
                />
              </div>
            </SectionCard>
          </div>

          {hasBenefit("tv_menu_board") && selectedRestaurant ? (
            <div style={{ marginTop: 28 }}>
              <SectionCard title="Live display access">
                <div style={s.displayCard}>
                  <div>
                    <div style={s.displayTitle}>Live digital menu board</div>
                    <div style={s.displayBody}>
                      Open the existing in-store display route or copy the display URL for a TV or menu screen.
                    </div>
                  </div>
                  <div style={s.displayActions}>
                    <button
                      type="button"
                      onClick={() => window.open(`/public/restaurants/${selectedRestaurant.id}/display`, "_blank")}
                      style={s.primaryButton}
                    >
                      Open display
                    </button>
                    <CopyLinkButton url={`${window.location.origin}/public/restaurants/${selectedRestaurant.id}/display`} />
                    <button type="button" onClick={() => navigate("/operator/display-settings")} style={s.secondaryButton}>
                      Settings
                    </button>
                  </div>
                </div>
              </SectionCard>
            </div>
          ) : null}

          {menus.length > 0 ? (
            <div style={{ marginTop: 28 }}>
              <SectionCard title="Current menu list">
                <div style={s.menuList}>
                  {menus.map((menu) => (
                    <div key={menu.id} style={s.menuRow}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={s.menuName}>{menu.name}</span>
                        {menu.menu_type !== "standard" ? (
                          <span style={s.menuTypePill}>{menu.menu_type}</span>
                        ) : null}
                      </div>
                      <span style={s.menuCount}>{menu.item_count} items</span>
                      <StatusBadge status={menu.status} />
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          ) : null}
        </div>
      )}
    </OperatorLayout>
  );
}

const s = {
  page: {
    maxWidth: 1040,
    margin: "0 auto",
  },
  heroCard: {
    display: "flex",
    justifyContent: "space-between",
    gap: 18,
    flexWrap: "wrap",
    background: "linear-gradient(135deg, #f8faf9 0%, #eef5f2 100%)",
    border: `1px solid ${BORDER}`,
    borderRadius: 18,
    padding: "24px 24px",
    marginBottom: 22,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: GREEN,
    marginBottom: 10,
  },
  heroTitle: {
    margin: "0 0 8px",
    fontSize: 28,
    fontWeight: 900,
    color: "#0f1720",
    letterSpacing: "-0.03em",
  },
  heroBody: {
    margin: "0 0 14px",
    fontSize: 14,
    color: "#475467",
    lineHeight: 1.7,
    maxWidth: 620,
  },
  metaRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  metaPill: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    fontSize: 12,
    fontWeight: 700,
    color: "#344054",
  },
  heroActions: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minWidth: 220,
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: 12,
    border: "none",
    background: GREEN,
    color: "#fff",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    padding: "0 18px",
    fontFamily: "inherit",
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 12,
    border: `1px solid ${BORDER}`,
    background: "#fff",
    color: "#111",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    padding: "0 18px",
    fontFamily: "inherit",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
    marginBottom: 22,
  },
  statCard: {
    background: "#fff",
    border: `1px solid ${BORDER}`,
    borderRadius: 14,
    padding: "18px 20px",
  },
  statValue: {
    fontSize: 24,
    fontWeight: 900,
    color: "#0f1720",
    lineHeight: 1.1,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0f1720",
    marginTop: 8,
  },
  statSub: {
    fontSize: 11,
    color: "#8a9ab0",
    marginTop: 4,
    lineHeight: 1.4,
  },
  sectionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 16,
  },
  sectionCard: {
    background: "#fff",
    border: `1px solid ${BORDER}`,
    borderRadius: 16,
    padding: "20px 20px 18px",
  },
  sectionTitle: {
    margin: "0 0 14px",
    fontSize: 18,
    fontWeight: 800,
    color: "#0f1720",
    letterSpacing: "-0.02em",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "flex-start",
    paddingTop: 12,
    marginTop: 12,
    borderTop: "1px solid #edf1f5",
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0f1720",
  },
  summaryHint: {
    fontSize: 12,
    color: "#667085",
    marginTop: 4,
    lineHeight: 1.5,
    maxWidth: 300,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: 800,
    color: "#0f1720",
    textAlign: "right",
    maxWidth: 180,
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 12,
  },
  actionCard: {
    border: "1.5px solid",
    borderRadius: 14,
    padding: "18px 18px 16px",
    textAlign: "left",
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "inherit",
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: "#0f1720",
    marginBottom: 6,
  },
  actionDescription: {
    fontSize: 13,
    color: "#5b6675",
    lineHeight: 1.55,
  },
  linkList: {
    display: "grid",
    gap: 10,
  },
  linkRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    paddingTop: 12,
    borderTop: "1px solid #edf1f5",
  },
  linkTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: "#0f1720",
    marginBottom: 3,
  },
  linkDetail: {
    fontSize: 12,
    color: "#667085",
    lineHeight: 1.55,
    maxWidth: 360,
  },
  inlineButton: {
    border: `1px solid ${BORDER}`,
    background: "#fff",
    color: GREEN,
    fontWeight: 800,
    fontSize: 12,
    borderRadius: 10,
    minHeight: 36,
    padding: "0 14px",
    whiteSpace: "nowrap",
    fontFamily: "inherit",
  },
  billingPlaceholder: {
    fontSize: 13,
    color: "#8a9ab0",
    padding: "14px 0 4px",
  },
  displayCard: {
    background: SOFT,
    border: "1px solid #dbe4ee",
    borderRadius: 14,
    padding: "18px 18px 16px",
  },
  displayTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: "#0f1720",
    marginBottom: 4,
  },
  displayBody: {
    fontSize: 13,
    color: "#5b6675",
    lineHeight: 1.55,
    marginBottom: 14,
  },
  displayActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  menuList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  menuRow: {
    background: "#fff",
    border: `1px solid ${BORDER}`,
    borderRadius: 12,
    padding: "14px 18px",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  menuName: {
    fontWeight: 700,
    fontSize: 14,
    color: "#0f1720",
  },
  menuTypePill: {
    marginLeft: 8,
    fontSize: 11,
    background: "#eef4ff",
    color: "#164a9e",
    borderRadius: 999,
    padding: "2px 7px",
    fontWeight: 600,
  },
  menuCount: {
    fontSize: 12,
    color: "#8a9ab0",
    whiteSpace: "nowrap",
  },
  emptyCard: {
    maxWidth: 520,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    borderRadius: 16,
    padding: "36px 32px",
    textAlign: "center",
    margin: "0 auto",
  },
  emptyTitle: {
    margin: "0 0 10px",
    fontSize: 18,
    fontWeight: 700,
    color: "#0f1720",
  },
  emptyBody: {
    margin: "0 0 24px",
    fontSize: 14,
    color: "#5b6675",
    lineHeight: 1.6,
  },
};
