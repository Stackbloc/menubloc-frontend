/**
 * src/pages/operator/OperatorDashboard.jsx
 *
 * Dashboard — quick stats + navigation cards linking to the editors.
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";

function StatCard({ label, value, sub }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e4e9f0",
      borderRadius: 14,
      padding: "20px 22px",
      minWidth: 140,
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#0f1720", lineHeight: 1 }}>
        {value ?? "—"}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#0f1720", marginTop: 6 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#8a9ab0", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function ActionCard({ icon, title, description, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? "#f0f8f4" : "#fff",
        border: `1.5px solid ${hover ? "#1F4E3D" : "#e4e9f0"}`,
        borderRadius: 14,
        padding: "22px 24px",
        textAlign: "left",
        cursor: "pointer",
        transition: "all 0.15s",
        fontFamily: "inherit",
      }}
    >
      <div style={{ fontSize: 26, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#0f1720", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: "#5b6675", lineHeight: 1.5 }}>{description}</div>
    </button>
  );
}

export default function OperatorDashboard() {
  const { selectedRestaurant, restaurants } = useOperator();
  const navigate = useNavigate();

  const [menus, setMenus]     = useState([]);
  const [deals, setDeals]     = useState([]);
  const [stats, setStats]     = useState({ items: null, activeDeals: null });
  const [planName, setPlanName] = useState(null);

  useEffect(() => {
    api.getSubscription()
      .then(d => setPlanName(d?.name || d?.slug || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedRestaurant) return;
    const rid = selectedRestaurant.id;

    api.getMenus(rid)
      .then(d => setMenus(d.menus || []))
      .catch(() => {});

    api.getDeals(rid)
      .then(d => {
        const all = d.deals || [];
        setDeals(all);
        const active = all.filter(x => x.status === "active").length;
        setStats(s => ({ ...s, activeDeals: active }));
      })
      .catch(() => {});
  }, [selectedRestaurant]);

  // Count items across all menus
  useEffect(() => {
    if (!menus.length) { setStats(s => ({ ...s, items: 0 })); return; }
    const total = menus.reduce((sum, m) => sum + (m.item_count || 0), 0);
    setStats(s => ({ ...s, items: total }));
  }, [menus]);

  const noRestaurant = restaurants.length === 0;

  return (
    <OperatorLayout title="Dashboard">
      {noRestaurant ? (
        /* ── Empty state — no restaurant linked ────────────────────── */
        <div style={{
          maxWidth: 480,
          background: "#fff",
          border: "1px solid #e4e9f0",
          borderRadius: 16,
          padding: "36px 32px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>🍽️</div>
          <h2 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 700, color: "#0f1720" }}>
            No restaurant linked yet
          </h2>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: "#5b6675", lineHeight: 1.6 }}>
            To start managing a menu and deals, your account needs to be linked to a restaurant listing.
          </p>
          <button
            onClick={() => navigate("/operator/claim")}
            style={{
              background: "#1F4E3D", color: "#fff",
              border: "none", borderRadius: 10,
              padding: "11px 24px", fontSize: 14, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Find and claim my restaurant →
          </button>
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 }}>
            <StatCard label="Menu items" value={stats.items} sub="across all menus" />
            <StatCard label="Active deals" value={stats.activeDeals} />
            <StatCard label="Plan" value={planName} sub="upgrade anytime" />
          </div>

          {/* Action cards */}
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#5b6675", textTransform: "uppercase", letterSpacing: "0.6px", margin: "0 0 14px" }}>
            Quick actions
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, maxWidth: 800 }}>
            <ActionCard
              icon="☰"
              title="Menu Editor"
              description="Add, edit, and publish menu items. Manage sections and pricing."
              onClick={() => navigate("/operator/menu")}
            />
            <ActionCard
              icon="⊹"
              title="Deals"
              description="Create and manage deals tied to specific menu items."
              onClick={() => navigate("/operator/deals")}
            />
            <ActionCard
              icon="↗"
              title="Public Menu"
              description="See how your menu looks to customers."
              onClick={() => {
                if (selectedRestaurant) {
                  window.open(`/public/restaurants/${selectedRestaurant.id}/menu`, "_blank");
                }
              }}
            />
          </div>

          {/* Recent menus summary */}
          {menus.length > 0 && (
            <div style={{ marginTop: 40 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#5b6675", textTransform: "uppercase", letterSpacing: "0.6px", margin: "0 0 14px" }}>
                Menus
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 600 }}>
                {menus.map(m => (
                  <div
                    key={m.id}
                    style={{
                      background: "#fff",
                      border: "1px solid #e4e9f0",
                      borderRadius: 12,
                      padding: "14px 18px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: "#0f1720" }}>{m.name}</span>
                      {m.menu_type !== "standard" && (
                        <span style={{ marginLeft: 8, fontSize: 11, background: "#eef4ff", color: "#164a9e", borderRadius: 999, padding: "2px 7px", fontWeight: 600 }}>
                          {m.menu_type}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: "#8a9ab0" }}>{m.item_count} items</span>
                    <StatusBadge status={m.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </OperatorLayout>
  );
}

function StatusBadge({ status }) {
  const map = {
    published: { bg: "#d1fae5", color: "#065f46", label: "Live" },
    draft:     { bg: "#fef9c3", color: "#854d0e", label: "Draft" },
    archived:  { bg: "#f1f5f9", color: "#475569", label: "Archived" },
    active:    { bg: "#d1fae5", color: "#065f46", label: "Active" },
    paused:    { bg: "#fef9c3", color: "#854d0e", label: "Paused" },
    expired:   { bg: "#f1f5f9", color: "#475569", label: "Expired" },
  };
  const style = map[status] || { bg: "#f1f5f9", color: "#475569", label: status };
  return (
    <span style={{ background: style.bg, color: style.color, borderRadius: 999, padding: "3px 9px", fontSize: 11, fontWeight: 700 }}>
      {style.label}
    </span>
  );
}
