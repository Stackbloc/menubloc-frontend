/**
 * src/pages/operator/OperatorLayout.jsx
 *
 * Shared sidebar + content shell for all operator screens.
 *
 * Sidebar is organized into three role-aware sections:
 *   OPERATIONS  — live order handling (all roles)
 *   MENU & CUSTOMER — menu tools (owner + manager; staff gets subset)
 *   OWNER / BUSINESS — financial/admin (owner only; manager with PIN)
 *
 * Sensitive (Owner / Business) links require Owner PIN verification.
 * A PIN gate modal intercepts navigation and calls /security/pin/verify.
 * After successful verify, a 15-min server-side session is granted.
 */

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useOperator } from "../../context/OperatorContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { getSensitiveSession, verifyOwnerPin } from "../../lib/operatorApi.js";
import HelpSearchButton from "../../components/helpSearch/HelpSearchButton.jsx";
import HelpSearchDrawer from "../../components/helpSearch/HelpSearchDrawer.jsx";
import { BrandLogo } from "../../components/BrandLogo.jsx";
import "./operatorResponsive.css";

// ── Brand tokens (aligned with site --gb-color-accent) ───────────────────
const BRAND = {
  accent: "#22C55E",
  accentDark: "#16A34A",
  ink: "#0B0F0C",
  muted: "#667085",
  line: "#E5E7EB",
  page: "#ffffff",
  soft: "rgba(34, 197, 94, 0.12)",
};

// ── Sidebar width ────────────────────────────────────────────────────────
const SIDEBAR_W = 230;

// ── Navigation section definitions ───────────────────────────────────────

const OPERATIONS_NAV = [
  { to: "/operator",           label: "Home",          icon: "⌂" },
  { to: "/operator/orders",    label: "Orders",        icon: "☷" },
  { to: "/operator/orders?tab=history", label: "Order History", icon: "⊡" },
];

const MENU_NAV = [
  { to: "/operator/menulab",           label: "Menu Lab",           icon: "☰" },
  { to: "/operator/menudesign",        label: "Menu Design",        icon: "◈" },
  { to: "/operator/deals",             label: "Deals",              icon: "⊹" },
  { to: "/operator/hours",             label: "Hours",              icon: "⏰" },
  { to: "/operator/bid-free-bidding",  label: "Bid-Free Bidding™",  icon: "◇" },
  { to: "/operator/design",            label: "Adobe Studio",       icon: "▣", benefitKey: "design_exports" },
  { to: "/operator/display-settings",  label: "Display Board",      icon: "⊞", benefitKey: "tv_menu_board" },
  { to: "/operator/menu-studio",       label: "Menu Studio",        icon: "✦", benefitKey: "menu_outputs" },
  { to: "/operator/brand",             label: "Brand Settings",     icon: "◉", benefitKey: "brand_customization" },
  { to: "/operator/qr-stickers",       label: "QR Stickers",        icon: "▦" },
];

// Staff only sees this subset of menu tools
const STAFF_MENU_NAV = [
  { to: "/operator/menulab",   label: "Menu Lab",     icon: "☰" },
  { to: "/operator/deals",  label: "Deals",        icon: "⊹" },
  { to: "/operator/hours",  label: "Hours",        icon: "⏰" },
];

const SUPPORT_NAV = [
  { to: "/operator/help", label: "Knowledge Base", icon: "?" },
];

const BUSINESS_NAV = [
  { to: "/operator/my-account", label: "My Account", icon: "◈" },
];

// ── PIN gate modal ────────────────────────────────────────────────────────

function PinGateModal({ restaurantId, onSuccess, onClose }) {
  const { t } = useLanguage();
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const [retryIn, setRetryIn] = useState(0);

  function handleDigit(idx, val) {
    const clean = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = clean;
    setDigits(next);
    setError("");
    // Auto-advance focus
    if (clean && idx < 3) {
      const nextInput = document.getElementById(`pin-digit-${idx + 1}`);
      if (nextInput) nextInput.focus();
    }
    // Auto-submit when 4th digit entered
    if (idx === 3 && clean) {
      const pin = [...next.slice(0, 3), clean].join("");
      if (pin.length === 4) submitPin(pin);
    }
  }

  function handleKeyDown(idx, e) {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      const prev = document.getElementById(`pin-digit-${idx - 1}`);
      if (prev) prev.focus();
    }
  }

  async function submitPin(pinOverride) {
    const pin = pinOverride ?? digits.join("");
    if (pin.length !== 4) {
      setError(t("auth.pinEnterAllDigits", "Enter all 4 digits."));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await verifyOwnerPin(restaurantId, pin);
      onSuccess();
    } catch (err) {
      if (err?.payload?.code === "pin_locked") {
        setLocked(true);
        setRetryIn(err?.payload?.retry_after_seconds || 300);
      }
      setError(err.message || t("auth.pinIncorrect", "Incorrect PIN. Try again."));
      setDigits(["", "", "", ""]);
      setTimeout(() => document.getElementById("pin-digit-0")?.focus(), 50);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, padding: 20,
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "32px 28px",
        width: "100%", maxWidth: 360, boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: "#0f1720", marginBottom: 6 }}>
          {t("auth.pinGateTitle", "Owner verification")}
        </div>
        <div style={{ fontSize: 14, color: "#5b6675", marginBottom: 24 }}>
          {t("auth.pinGateSubtitle", "Enter your 4-digit owner PIN to continue.")}
        </div>

        {/* 4-digit PIN entry */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 20 }}>
          {digits.map((d, idx) => (
            <input
              key={idx}
              id={`pin-digit-${idx}`}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              disabled={busy || locked}
              autoFocus={idx === 0}
              onChange={(e) => handleDigit(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              style={{
                width: 52, height: 60, textAlign: "center",
                fontSize: 28, fontWeight: 900,
                border: error ? "2px solid #dc2626" : "2px solid #d0d5dd",
                borderRadius: 12, outline: "none",
                background: d ? "#f0fdf4" : "#fff",
                caretColor: "transparent",
              }}
            />
          ))}
        </div>

        {error && (
          <div style={{
            marginBottom: 16, padding: "10px 14px", borderRadius: 10,
            background: "#fee2e2", color: "#991b1b", fontSize: 14, fontWeight: 600,
          }}>
            {error}
            {locked && retryIn > 0 && (
              <div style={{ fontSize: 12, marginTop: 4, fontWeight: 500 }}>
                Try again in {Math.ceil(retryIn / 60)} min.
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => submitPin()}
          disabled={busy || locked || digits.join("").length !== 4}
          style={{
            width: "100%", minHeight: 52, borderRadius: 14, border: "none",
            background: BRAND.accentDark, color: "#fff",
            fontSize: 16, fontWeight: 800, cursor: "pointer",
            opacity: (busy || locked || digits.join("").length !== 4) ? 0.5 : 1,
            marginBottom: 12,
          }}
        >
          {busy ? "Verifying…" : "Unlock"}
        </button>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: "100%", minHeight: 44, borderRadius: 12,
            border: `1px solid ${BRAND.line}`, background: "#fff",
            fontSize: 14, fontWeight: 600, color: BRAND.muted, cursor: "pointer",
          }}
        >
          {t("auth.cancel", "Cancel")}
        </button>
      </div>
    </div>
  );
}

// ── Nav link ──────────────────────────────────────────────────────────────

function SideNavLink({ to, label, icon, sensitive, onSensitiveClick }) {
  const base = to.split("?")[0]; // strip query for matching

  if (sensitive && onSensitiveClick) {
    return (
      <NavLink
        to={to}
        end={false}
        onClick={(e) => { e.preventDefault(); onSensitiveClick(to); }}
        style={({ isActive }) => navLinkStyle(isActive)}
      >
        <span style={{ fontSize: 14, lineHeight: 1 }}>{icon}</span>
        {label}
        <span style={{ marginLeft: "auto", fontSize: 11, opacity: 0.6 }}>🔒</span>
      </NavLink>
    );
  }

  return (
    <NavLink
      to={to}
      end={to === "/operator"}
      style={({ isActive }) => navLinkStyle(isActive || (to.includes("?") && window.location.pathname === base))}
    >
      <span style={{ fontSize: 14, lineHeight: 1 }}>{icon}</span>
      {label}
    </NavLink>
  );
}

function navLinkStyle(isActive) {
  return {
    display: "flex", alignItems: "center", gap: 9,
    padding: "9px 16px",
    fontSize: 13, fontWeight: isActive ? 700 : 500,
    color: isActive ? BRAND.accentDark : "#4a5568",
    background: isActive ? BRAND.soft : "transparent",
    textDecoration: "none",
    borderLeft: isActive ? `3px solid ${BRAND.accent}` : "3px solid transparent",
    transition: "background 0.1s",
  };
}

// ── Section header ────────────────────────────────────────────────────────

function SectionHeader({ label, accent }) {
  return (
    <div style={{
      padding: "10px 16px 4px",
      fontSize: 10, fontWeight: 900, letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: accent ? "#fff" : BRAND.muted,
      background: accent ? BRAND.ink : "transparent",
    }}>
      {label}
    </div>
  );
}

const OPERATOR_PAGE_TITLE_KEYS = {
  Home: "operator.nav.home",
  "Menu Lab": "operator.nav.menuLab",
  "Knowledge Base": "operator.nav.knowledgeBase",
  Subscription: "operator.subscription.title",
  "Incoming Orders": "operator.orders.title",
  Deals: "operator.deals.title",
  "Order QR Code Kit": "operator.qrKit.title",
  "Display Board": "operator.nav.displayBoard",
  Hours: "operator.hours.title",
  "Order Detail": "operator.orders.detailTitle",
  "Delivery Accounts": "operator.delivery.title",
  Profile: "operator.profile.title",
  "Bid-Free Bidding™": "operator.nav.bidFree",
  "Adobe Studio": "operator.nav.adobeStudio",
  "Menu Studio": "operator.nav.menuStudio",
  "Brand Settings": "operator.nav.brandSettings",
};

function resolveOperatorTitle(title, t) {
  if (!title) return "";
  const key = OPERATOR_PAGE_TITLE_KEYS[title];
  return key ? t(key, title) : title;
}

// ── Main layout ───────────────────────────────────────────────────────────

export default function OperatorLayout({ title, children }) {
  const {
    operator, selectedRestaurant, restaurants,
    setSelectedRestaurant, logout, hasBenefit,
  } = useOperator();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const operationsNav = useMemo(() => ([
    { to: "/operator", label: t("operator.nav.home", "Home"), icon: "⌂" },
    { to: "/operator/orders", label: t("operator.nav.orders", "Orders"), icon: "☷" },
    { to: "/operator/orders?tab=history", label: t("operator.nav.orderHistory", "Order History"), icon: "⊡" },
  ]), [t]);

  const menuNavBase = useMemo(() => ([
    { to: "/operator/menulab", label: t("operator.nav.menuLab", "Menu Lab"), icon: "☰" },
    { to: "/operator/deals", label: t("operator.nav.deals", "Deals"), icon: "⊹" },
    { to: "/operator/hours", label: t("operator.nav.hours", "Hours"), icon: "⏰" },
    { to: "/operator/bid-free-bidding", label: t("operator.nav.bidFree", "Bid-Free Bidding™"), icon: "◇" },
    { to: "/operator/design", label: t("operator.nav.adobeStudio", "Adobe Studio"), icon: "▣", benefitKey: "design_exports" },
    { to: "/operator/menudesign", label: t("operator.nav.menuDesign", "Menu Design"), icon: "◈" },
    { to: "/operator/display-settings", label: t("operator.nav.displayBoard", "Display Board"), icon: "⊞", benefitKey: "tv_menu_board" },
    { to: "/operator/menu-studio", label: t("operator.nav.menuStudio", "Menu Studio"), icon: "✦", benefitKey: "menu_outputs" },
    { to: "/operator/brand", label: t("operator.nav.brandSettings", "Brand Settings"), icon: "◉", benefitKey: "brand_customization" },
  ]), [t]);

  const staffMenuNav = useMemo(() => menuNavBase.slice(0, 3), [menuNavBase]);

  const supportNav = useMemo(() => ([
    { to: "/operator/help", label: t("operator.nav.knowledgeBase", "Knowledge Base"), icon: "?" },
  ]), [t]);

  const businessNav = useMemo(() => ([
    { to: "/operator/my-account", label: t("operator.nav.myAccount", "My Account"), icon: "◈" },
  ]), [t]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [helpSearchOpen, setHelpSearchOpen] = useState(false);

  // PIN gate state
  const [pinTarget, setPinTarget] = useState(null);   // route string to navigate to after PIN

  const role = selectedRestaurant?.role || "staff";
  const rid = selectedRestaurant?.id;

  // Determine which menu nav items are visible
  const menuNav = role === "staff" ? staffMenuNav : menuNavBase;
  const visibleMenuNav = menuNav.filter((item) => !item.benefitKey || hasBenefit(item.benefitKey));

  // Business section only shown to owners and managers
  const showBusiness = role === "owner" || role === "manager";

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileNavOpen(false);
  }, [location.pathname, location.search]);

  async function handleLogout() {
    await logout();
    navigate("/operator/login", { replace: true });
  }

  // Called when a sensitive nav link is clicked
  const handleSensitiveClick = useCallback(async (targetRoute) => {
    if (!rid) return;
    // Check if server session is already active
    try {
      const data = await getSensitiveSession(rid);
      if (data.active) {
        navigate(targetRoute);
        return;
      }
    } catch {
      // Fall through to PIN gate
    }
    setPinTarget(targetRoute);
  }, [rid, navigate]);

  function handlePinSuccess() {
    const target = pinTarget;
    setPinTarget(null);
    if (target) navigate(target);
  }

  return (
    <div className="operator-shell" style={{ display: "flex", minHeight: "100vh", background: BRAND.page, fontFamily: "var(--gb-font-ui)" }}>
      <div
        className={`operator-shell__backdrop${mobileNavOpen ? " operator-shell__backdrop--visible" : ""}`}
        onClick={() => setMobileNavOpen(false)}
      />

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside
        className={`operator-shell__sidebar${mobileNavOpen ? " operator-shell__sidebar--open" : ""}`}
        style={{
        width: SIDEBAR_W, minHeight: "100vh",
        background: "#fff", borderRight: `1px solid ${BRAND.line}`,
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 10,
        overflowY: "auto",
      }}>

        {/* Logo */}
        <div style={{ padding: "16px 14px 12px", borderBottom: `1px solid ${BRAND.line}` }}>
          <BrandLogo
            to="/operator"
            height={28}
            radius={6}
            matchPageBackground={false}
            pageColor="#ffffff"
            wordmarkColor={BRAND.ink}
            ariaLabel="Menuply restaurant operations home"
          />
          <div style={{ fontSize: 11, color: BRAND.muted, marginTop: 6, fontWeight: 600 }}>
            Restaurant Operations
          </div>
        </div>

        {/* Restaurant selector */}
        {restaurants.length > 0 && (
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #f0f0ec" }}>
            {restaurants.length === 1 ? (
              <div>
                <div style={{ fontSize: 10, color: "#8a9ab0", marginBottom: 3, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Restaurant
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f1720" }}>
                  {selectedRestaurant?.restaurant_name || "—"}
                </div>
                {selectedRestaurant?.city && (
                  <div style={{ fontSize: 11, color: "#8a9ab0", marginTop: 1 }}>
                    {selectedRestaurant.city}{selectedRestaurant.state ? `, ${selectedRestaurant.state}` : ""}
                  </div>
                )}
                {role && (
                  <div style={{
                    display: "inline-block", marginTop: 4,
                    padding: "2px 8px", borderRadius: 999,
                    background: role === "owner" ? "#fef3c7" : role === "manager" ? "#e0f2fe" : "#f1f5f9",
                    color: role === "owner" ? "#92400e" : role === "manager" ? "#075985" : "#475467",
                    fontSize: 10, fontWeight: 800, textTransform: "capitalize",
                  }}>
                    {role}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 10, color: "#8a9ab0", marginBottom: 5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Restaurant
                </div>
                <select
                  value={selectedRestaurant?.id || ""}
                  onChange={(e) => {
                    const r = restaurants.find((r) => String(r.id) === e.target.value);
                    if (r) setSelectedRestaurant(r);
                  }}
                  style={{
                    width: "100%", fontSize: 12, padding: "6px 8px",
                    border: "1px solid #e4e9f0", borderRadius: 8,
                    background: "#fff", color: "#0f1720", cursor: "pointer",
                  }}
                >
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>{r.restaurant_name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* ── OPERATIONS section ─────────────────────────────────── */}
        <nav style={{ flex: 1 }}>
          <div style={{ background: BRAND.ink, paddingBottom: 4 }}>
            <SectionHeader label={t("operator.section.operations", "Operations")} accent />
            {operationsNav.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/operator" || to === "/operator/orders"}
                style={({ isActive }) => ({
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "10px 16px",
                  fontSize: 13, fontWeight: isActive ? 800 : 500,
                  color: isActive ? "#fff" : "rgba(255,255,255,0.72)",
                  background: isActive ? "rgba(34,197,94,0.18)" : "transparent",
                  textDecoration: "none",
                  borderLeft: isActive ? `3px solid ${BRAND.accent}` : "3px solid transparent",
                })}
              >
                <span style={{ fontSize: 14 }}>{icon}</span>
                {label}
              </NavLink>
            ))}
          </div>

          {/* ── MENU & CUSTOMER section ──────────────────────────── */}
          {visibleMenuNav.length > 0 && (
            <div style={{ borderBottom: "1px solid #f0f0ec" }}>
              <SectionHeader label={t("operator.section.menuCustomer", "Menu & Customer")} />
              {visibleMenuNav.map(({ to, label, icon }) => (
                <SideNavLink key={to} to={to} label={label} icon={icon} />
              ))}
            </div>
          )}

          {/* ── OWNER / BUSINESS section ─────────────────────────── */}
          {showBusiness && (
            <div>
              <SectionHeader label={t("operator.section.business", "Owner / Business")} />
              {businessNav.map(({ to, label, icon, sensitive }) => (
                <SideNavLink
                  key={to}
                  to={to}
                  label={label}
                  icon={icon}
                  sensitive={sensitive}
                  onSensitiveClick={handleSensitiveClick}
                />
              ))}
              {/* PIN setup link for owners */}
              {role === "owner" && (
                <button
                  type="button"
                  onClick={() => handleSensitiveClick("/operator/profile")}
                  style={{
                    display: "flex", alignItems: "center", gap: 9,
                    padding: "8px 16px", width: "100%",
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 12, color: "#8a9ab0", fontWeight: 500,
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 12 }}>⚙</span>
                  Owner PIN Settings
                </button>
              )}
            </div>
          )}

          {/* ── SUPPORT section ───────────────────────────────────── */}
          <div style={{ borderTop: "1px solid #f0f0ec" }}>
            <SectionHeader label={t("operator.section.support", "Support")} />
            {supportNav.map(({ to, label, icon }) => (
              <SideNavLink key={to} to={to} label={label} icon={icon} />
            ))}
          </div>
        </nav>

        {/* ── Operator info + logout ────────────────────────────── */}
        <div style={{ borderTop: "1px solid #f0f0ec", padding: "12px 14px" }}>
          <div style={{ fontSize: 12, color: "#0f1720", fontWeight: 600, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {operator?.full_name || operator?.email || ""}
          </div>
          {operator?.full_name && (
            <div style={{ fontSize: 11, color: "#8a9ab0", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {operator.email}
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: "none", border: "1px solid #e4e9f0", borderRadius: 8,
              padding: "6px 12px", fontSize: 12, color: "#5b6675",
              cursor: "pointer", width: "100%",
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className="operator-shell__main" style={{ marginLeft: SIDEBAR_W, flex: 1, display: "flex", flexDirection: "column" }}>
        <header className="operator-shell__header" style={{
          background: "#fff", borderBottom: "1px solid #e4e9f0",
          padding: "0 28px", height: 56,
          display: "flex", alignItems: "center",
          position: "sticky", top: 0, zIndex: 5,
        }}>
          <div className="operator-shell__header-row">
            <button
              type="button"
              className="operator-shell__menu-button"
              onClick={() => setMobileNavOpen((open) => !open)}
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileNavOpen}
            >
              ☰
            </button>
            <div className="operator-shell__title-wrap">
              <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f1720" }}>
                {resolveOperatorTitle(title, t)}
              </h1>
              {selectedRestaurant?.restaurant_name ? (
                <div className="operator-shell__mobile-restaurant">
                  {selectedRestaurant.restaurant_name}
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <main className="operator-shell__content" style={{ padding: "28px", flex: 1 }}>
          {children}
        </main>
      </div>

      {/* ── PIN Gate Modal ────────────────────────────────────────── */}
      {pinTarget && rid && (
        <PinGateModal
          restaurantId={rid}
          onSuccess={handlePinSuccess}
          onClose={() => setPinTarget(null)}
        />
      )}
      <HelpSearchButton onClick={() => setHelpSearchOpen(true)} />
      <HelpSearchDrawer isOpen={helpSearchOpen} onClose={() => setHelpSearchOpen(false)} />
    </div>
  );
}
