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

import React, { useState, useCallback, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useOperator } from "../../context/OperatorContext.jsx";
import { getSensitiveSession, verifyOwnerPin } from "../../lib/operatorApi.js";
import "./operatorResponsive.css";

// ── Sidebar width ────────────────────────────────────────────────────────
const SIDEBAR_W = 230;

// ── Navigation section definitions ───────────────────────────────────────

const OPERATIONS_NAV = [
  { to: "/operator",           label: "Home",          icon: "⌂" },
  { to: "/operator/orders",    label: "Orders",        icon: "☷" },
  { to: "/operator/delivery",  label: "Delivery",      icon: "⇄" },
  { to: "/operator/orders?tab=history", label: "Order History", icon: "⊡" },
];

const MENU_NAV = [
  { to: "/operator/menu",              label: "Menu Editor",        icon: "☰" },
  { to: "/operator/deals",             label: "Deals",              icon: "⊹" },
  { to: "/operator/hours",             label: "Hours",              icon: "⏰" },
  { to: "/operator/bid-free-bidding",  label: "Bid-Free Bidding™",  icon: "◇" },
  { to: "/operator/design",            label: "Adobe Studio",       icon: "▣", benefitKey: "design_exports" },
  { to: "/operator/display-settings",  label: "Display Board",      icon: "⊞", benefitKey: "tv_menu_board" },
  { to: "/operator/menu-studio",       label: "Menu Studio",        icon: "✦", benefitKey: "menu_outputs" },
  { to: "/operator/brand",             label: "Brand Settings",     icon: "◉", benefitKey: "brand_customization" },
];

// Staff only sees this subset of menu tools
const STAFF_MENU_NAV = [
  { to: "/operator/menu",   label: "Menu Editor",  icon: "☰" },
  { to: "/operator/deals",  label: "Deals",        icon: "⊹" },
  { to: "/operator/hours",  label: "Hours",        icon: "⏰" },
];

const SUPPORT_NAV = [
  { to: "/operator/my-account", label: "My Account",    icon: "◈" },
  { to: "/operator/help",       label: "Knowledge Base", icon: "?" },
];

const BUSINESS_NAV = [
  { to: "/operator/profile",       label: "Restaurant Profile",  icon: "◷", sensitive: true },
  { to: "/operator/subscription",  label: "Subscription",        icon: "◈", sensitive: true },
];

// ── PIN gate modal ────────────────────────────────────────────────────────

function PinGateModal({ restaurantId, onSuccess, onClose }) {
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
      setError("Enter all 4 digits.");
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
      setError(err.message || "Incorrect PIN.");
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
          Owner Access Required
        </div>
        <div style={{ fontSize: 14, color: "#5b6675", marginBottom: 24 }}>
          Enter your 4-digit Owner PIN to continue.
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
            background: "#1F4E3D", color: "#fff",
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
            border: "1px solid #e4e9f0", background: "#fff",
            fontSize: 14, fontWeight: 600, color: "#5b6675", cursor: "pointer",
          }}
        >
          Cancel
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
    color: isActive ? "#1F4E3D" : "#4a5568",
    background: isActive ? "#edf7f2" : "transparent",
    textDecoration: "none",
    borderLeft: isActive ? "3px solid #1F4E3D" : "3px solid transparent",
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
      color: accent ? "#fff" : "#8a9ab0",
      background: accent ? "#1F4E3D" : "transparent",
    }}>
      {label}
    </div>
  );
}

// ── Main layout ───────────────────────────────────────────────────────────

export default function OperatorLayout({ title, children }) {
  const {
    operator, selectedRestaurant, restaurants,
    setSelectedRestaurant, logout, hasBenefit,
  } = useOperator();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // PIN gate state
  const [pinTarget, setPinTarget] = useState(null);   // route string to navigate to after PIN
  const [sensitiveReady, setSensitiveReady] = useState(false); // optimistic cache

  const role = selectedRestaurant?.role || "staff";
  const rid = selectedRestaurant?.id;

  // Determine which menu nav items are visible
  const menuNav = role === "staff" ? STAFF_MENU_NAV : MENU_NAV;
  const visibleMenuNav = menuNav.filter((item) => !item.benefitKey || hasBenefit(item.benefitKey));

  // Business section only shown to owners and managers
  const showBusiness = role === "owner" || role === "manager";

  useEffect(() => {
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
    } catch (_) {
      // Fall through to PIN gate
    }
    setPinTarget(targetRoute);
  }, [rid, navigate]);

  function handlePinSuccess() {
    const target = pinTarget;
    setPinTarget(null);
    setSensitiveReady(true);
    if (target) navigate(target);
  }

  return (
    <div className="operator-shell" style={{ display: "flex", minHeight: "100vh", background: "#f4f3ef", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div
        className={`operator-shell__backdrop${mobileNavOpen ? " operator-shell__backdrop--visible" : ""}`}
        onClick={() => setMobileNavOpen(false)}
      />

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside
        className={`operator-shell__sidebar${mobileNavOpen ? " operator-shell__sidebar--open" : ""}`}
        style={{
        width: SIDEBAR_W, minHeight: "100vh",
        background: "#fff", borderRight: "1px solid #e4e9f0",
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 10,
        overflowY: "auto",
      }}>

        {/* Logo */}
        <div style={{ padding: "18px 16px 10px", borderBottom: "1px solid #f0f0ec" }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: "#1F4E3D", letterSpacing: "-0.5px" }}>
            menuply
          </div>
          <div style={{ fontSize: 11, color: "#8a9ab0", marginTop: 2, fontWeight: 500 }}>
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
          <div style={{ background: "#1F4E3D", paddingBottom: 4 }}>
            <SectionHeader label="Operations" accent />
            {OPERATIONS_NAV.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/operator" || to === "/operator/orders"}
                style={({ isActive }) => ({
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "10px 16px",
                  fontSize: 13, fontWeight: isActive ? 800 : 500,
                  color: isActive ? "#fff" : "rgba(255,255,255,0.72)",
                  background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
                  textDecoration: "none",
                  borderLeft: isActive ? "3px solid #7dd3ad" : "3px solid transparent",
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
              <SectionHeader label="Menu & Customer" />
              {visibleMenuNav.map(({ to, label, icon }) => (
                <SideNavLink key={to} to={to} label={label} icon={icon} />
              ))}
            </div>
          )}

          {/* ── OWNER / BUSINESS section ─────────────────────────── */}
          {showBusiness && (
            <div>
              <SectionHeader label="Owner / Business" />
              {BUSINESS_NAV.map(({ to, label, icon, sensitive }) => (
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
            <SectionHeader label="Support" />
            {SUPPORT_NAV.map(({ to, label, icon }) => (
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
                {title}
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
    </div>
  );
}
