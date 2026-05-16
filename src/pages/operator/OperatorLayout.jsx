/**
 * src/pages/operator/OperatorLayout.jsx
 *
 * Shared sidebar + content shell used by all operator screens.
 *
 * Props:
 *   title        string   — page heading shown in the top bar
 *   children     ReactNode — main content area
 */

import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useOperator } from "../../context/OperatorContext.jsx";

const NAV = [
  { to: "/operator",              label: "Dashboard",    icon: "⊞" },
  { to: "/operator/orders",       label: "Orders",       icon: "☷" },
  { to: "/operator/delivery",     label: "Delivery",     icon: "⇄" },
  { to: "/operator/profile",      label: "Profile",      icon: "◷" },
  { to: "/operator/menu",         label: "Menu Editor",  icon: "☰" },
  { to: "/operator/deals",        label: "Deals",        icon: "⊹" },
  { to: "/operator/hours",        label: "Hours",        icon: "⏰" },
  { to: "/operator/bid-free-bidding", label: "Bid-Free Bidding™", icon: "◇" },
  { to: "/operator/design",            label: "Adobe Studio",  icon: "▣", benefitKey: "design_exports" },
  { to: "/operator/display-settings", label: "Display Board",  icon: "⊡", benefitKey: "tv_menu_board" },
  { to: "/operator/menu-studio",      label: "Menu Studio",    icon: "✦", benefitKey: "menu_outputs" },
  { to: "/operator/brand",            label: "Brand Settings", icon: "◉", benefitKey: "brand_customization" },
  { to: "/operator/help",             label: "Ops Center",     icon: "?" },
  { to: "/operator/subscription",     label: "Subscription",   icon: "◈" },
];

const SIDEBAR_W = 220;

export default function OperatorLayout({ title, children }) {
  const { operator, selectedRestaurant, restaurants, setSelectedRestaurant, logout, hasBenefit } = useOperator();
  const navigate = useNavigate();
  const visibleNav = NAV.filter((item) => !item.benefitKey || hasBenefit(item.benefitKey));

  async function handleLogout() {
    await logout();
    navigate("/operator/login", { replace: true });
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f3ef", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside style={{
        width: SIDEBAR_W,
        minHeight: "100vh",
        background: "#fff",
        borderRight: "1px solid #e4e9f0",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 18px 12px", borderBottom: "1px solid #f0f0ec" }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#1F4E3D", letterSpacing: "-0.5px" }}>
            grubbid
          </div>
          <div style={{ fontSize: 11, color: "#8a9ab0", marginTop: 2, fontWeight: 500 }}>
            Operator Portal
          </div>
        </div>

        {/* Restaurant selector */}
        {restaurants.length > 0 && (
          <div style={{ padding: "12px 14px", borderBottom: "1px solid #f0f0ec" }}>
            {restaurants.length === 1 ? (
              <div>
                <div style={{ fontSize: 11, color: "#8a9ab0", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Restaurant
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f1720" }}>
                  {selectedRestaurant?.restaurant_name || "—"}
                </div>
                {selectedRestaurant?.city && (
                  <div style={{ fontSize: 11, color: "#8a9ab0", marginTop: 2 }}>
                    {selectedRestaurant.city}{selectedRestaurant.state ? `, ${selectedRestaurant.state}` : ""}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 11, color: "#8a9ab0", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Restaurant
                </div>
                <select
                  value={selectedRestaurant?.id || ""}
                  onChange={(e) => {
                    const r = restaurants.find(r => String(r.id) === e.target.value);
                    if (r) setSelectedRestaurant(r);
                  }}
                  style={{
                    width: "100%", fontSize: 12, padding: "6px 8px",
                    border: "1px solid #e4e9f0", borderRadius: 8,
                    background: "#fff", color: "#0f1720", cursor: "pointer",
                  }}
                >
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.restaurant_name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Nav links */}
        <nav style={{ flex: 1, padding: "8px 0" }}>
          {visibleNav.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/operator"}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 18px",
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "#1F4E3D" : "#4a5568",
                background: isActive ? "#edf7f2" : "transparent",
                textDecoration: "none",
                borderLeft: isActive ? "3px solid #1F4E3D" : "3px solid transparent",
                transition: "background 0.1s",
              })}
            >
              <span style={{ fontSize: 15, lineHeight: 1 }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: operator info + logout */}
        <div style={{ borderTop: "1px solid #f0f0ec", padding: "12px 14px" }}>
          <div style={{ fontSize: 12, color: "#0f1720", fontWeight: 600, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {operator?.full_name || operator?.email || ""}
          </div>
          {operator?.full_name && (
            <div style={{ fontSize: 11, color: "#8a9ab0", marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {operator.email}
            </div>
          )}
          <button
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

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div style={{ marginLeft: SIDEBAR_W, flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <header style={{
          background: "#fff",
          borderBottom: "1px solid #e4e9f0",
          padding: "0 28px",
          height: 56,
          display: "flex",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 5,
        }}>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f1720" }}>
            {title}
          </h1>
        </header>

        {/* Page content */}
        <main style={{ padding: "28px", flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
