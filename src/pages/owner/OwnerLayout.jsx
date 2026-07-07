import React, { useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { NavLink, useNavigate } from "react-router-dom";
import { useOwner } from "../../context/OwnerContext.jsx";
import "./ownerResponsive.css";

const NAV = [
  { to: "/owner", label: "Dashboard" },
  { to: "/owner/phms", label: "Platform Health" },
  { to: "/owner/deployments", label: "Deployment Operations" },
  { to: "/owner/intelligence", label: "Platform Intelligence" },
  { to: "/owner/restaurants", label: "Restaurant Intelligence" },
  { to: "/owner/revenue", label: "Revenue" },
  { to: "/owner/market-expansion", label: "Market Expansion" },
  { to: "/owner/support", label: "Support Tickets" },
  { to: "/owner/menu-manager", label: "Menu Manager" },
  { to: "/owner/qr-stickers", label: "QR Stickers" },
];

export const OWNER_COLORS = {
  ink: "#101828",
  muted: "#667085",
  panel: "#fffdf8",
  accent: "#9f3a22",
  accentSoft: "#fce6dd",
  line: "#ead9ce",
  page: "linear-gradient(180deg, #f7f1ea 0%, #efe5db 100%)",
};

export function PageCard({ children, style = {}, id }) {
  return (
    <section
      id={id}
      style={{
        background: OWNER_COLORS.panel,
        border: `1px solid ${OWNER_COLORS.line}`,
        borderRadius: 18,
        boxShadow: "0 12px 40px rgba(86, 47, 29, 0.08)",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export function SectionTitle({ title, subtitle, action = null }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 18 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 20, color: OWNER_COLORS.ink }}>{title}</h2>
        {subtitle ? <div style={{ marginTop: 6, color: OWNER_COLORS.muted, fontSize: 13 }}>{subtitle}</div> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ children }) {
  return (
    <div style={{ padding: 20, borderRadius: 14, background: "#fff", border: `1px dashed ${OWNER_COLORS.line}`, color: OWNER_COLORS.muted }}>
      {children}
    </div>
  );
}

export default function OwnerLayout({ title, children, actions = null }) {
  const { t } = useLanguage();
  const { owner, logout } = useOwner();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/owner/login", { replace: true });
  }

  function closeSidebar() {
    setMobileNavOpen(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: OWNER_COLORS.page, fontFamily: '"Instrument Sans", "Avenir Next", sans-serif', color: OWNER_COLORS.ink }}>
      <div
        className={`owner-shell__backdrop${mobileNavOpen ? " owner-shell__backdrop--visible" : ""}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />
      <div className="owner-shell">
        <aside
          className={`owner-shell__sidebar${mobileNavOpen ? " owner-shell__sidebar--open" : ""}`}
          style={{ borderRight: `1px solid ${OWNER_COLORS.line}`, padding: "28px 18px", background: "rgba(255,250,243,0.97)", backdropFilter: "blur(10px)" }}
        >
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.04em", color: OWNER_COLORS.accent }}>menuply</div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: OWNER_COLORS.muted, marginTop: 6 }}>
              Owner Control Center
            </div>
          </div>

          <nav style={{ display: "grid", gap: 8 }}>
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/owner"}
                onClick={closeSidebar}
                style={({ isActive }) => ({
                  padding: "12px 14px",
                  borderRadius: 14,
                  textDecoration: "none",
                  color: isActive ? OWNER_COLORS.accent : OWNER_COLORS.ink,
                  background: isActive ? OWNER_COLORS.accentSoft : "transparent",
                  border: isActive ? `1px solid ${OWNER_COLORS.line}` : "1px solid transparent",
                  fontWeight: isActive ? 700 : 600,
                  fontSize: 14,
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div style={{ marginTop: 28, paddingTop: 18, borderTop: `1px solid ${OWNER_COLORS.line}` }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{owner?.full_name || owner?.email}</div>
            <div style={{ marginTop: 4, color: OWNER_COLORS.muted, fontSize: 12 }}>{owner?.role || "owner_admin"}</div>
            <button
              onClick={handleLogout}
              style={{
                marginTop: 12,
                width: "100%",
                border: `1px solid ${OWNER_COLORS.line}`,
                background: "#fff",
                color: OWNER_COLORS.ink,
                borderRadius: 12,
                padding: "10px 12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </div>
        </aside>

        <main className="owner-shell__main">
          <header
            className="owner-shell__header"
            style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", padding: "30px 34px 0", marginBottom: 26 }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0 }}>
              <button
                className="owner-shell__menu-button"
                onClick={() => setMobileNavOpen((v) => !v)}
                aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileNavOpen}
                style={{
                  border: `1px solid ${OWNER_COLORS.line}`,
                  background: "#fff",
                  color: OWNER_COLORS.ink,
                  marginTop: 4,
                }}
              >
                {mobileNavOpen ? "✕" : "☰"}
              </button>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: OWNER_COLORS.muted, marginBottom: 8 }}>
                  Platform Admin
                </div>
                <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.05, letterSpacing: "-0.04em" }}>{title}</h1>
              </div>
            </div>
            {actions}
          </header>
          <div className="owner-shell__content" style={{ padding: "26px 34px 40px" }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
