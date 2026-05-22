import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";

const GREEN = "#1F4E3D";
const BORDER = "#e4e9f0";

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

function StatCard({ label, value }) {
  return (
    <div style={s.statCard}>
      <div style={s.statValue}>{value ?? "—"}</div>
      <div style={s.statLabel}>{label}</div>
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

function StatusBadge({ status }) {
  const map = {
    published: { bg: "#d1fae5", color: "#065f46", label: "Live" },
    draft:     { bg: "#fef9c3", color: "#854d0e", label: "Draft" },
    archived:  { bg: "#f1f5f9", color: "#475569", label: "Archived" },
  };
  const norm = String(status || "").toLowerCase();
  const style = map[norm] || { bg: "#f1f5f9", color: "#475569", label: norm || "Unknown" };
  return (
    <span style={{ background: style.bg, color: style.color, borderRadius: 999, padding: "3px 9px", fontSize: 11, fontWeight: 700 }}>
      {style.label}
    </span>
  );
}

function deriveMenuStatusLabel(menus) {
  const live = menus.filter((m) => String(m.status || "").toLowerCase() === "published").length;
  const draft = menus.filter((m) => String(m.status || "").toLowerCase() === "draft").length;
  if (live > 0) return `${live} menu${live === 1 ? "" : "s"} live`;
  if (draft > 0) return `${draft} draft`;
  if (menus.length > 0) return "Not published";
  return "No menu yet";
}

export default function OperatorDashboard() {
  const { selectedRestaurant, restaurants, hasBenefit } = useOperator();
  const navigate = useNavigate();

  const [menus, setMenus] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedRestaurant?.id) {
      setMenus([]);
      setDeals([]);
      return;
    }
    const rid = selectedRestaurant.id;
    setLoading(true);
    Promise.allSettled([api.getMenus(rid), api.getDeals(rid)])
      .then(([menusResult, dealsResult]) => {
        setMenus(menusResult.status === "fulfilled" ? menusResult.value?.menus || [] : []);
        setDeals(dealsResult.status === "fulfilled" ? dealsResult.value?.deals || [] : []);
      })
      .finally(() => setLoading(false));
  }, [selectedRestaurant?.id]);

  const noRestaurant = restaurants.length === 0;

  const totals = useMemo(() => {
    const totalItems = menus.reduce((sum, m) => sum + (Number(m.item_count) || 0), 0);
    const activeDeals = deals.filter((d) => String(d.status || "").toLowerCase() === "active").length;
    return { totalItems, activeDeals };
  }, [menus, deals]);

  const menuStatusLabel = deriveMenuStatusLabel(menus);
  const locationLabel = [selectedRestaurant?.city, selectedRestaurant?.state].filter(Boolean).join(", ");

  return (
    <OperatorLayout title="Home">
      {noRestaurant ? (
        <div style={s.emptyCard}>
          <h2 style={s.emptyTitle}>No restaurant linked yet</h2>
          <p style={s.emptyBody}>
            Link your operator account to a restaurant listing to manage your menu and operations.
          </p>
          <button type="button" onClick={() => navigate("/operator/claim")} style={s.primaryButton}>
            Find and claim my restaurant
          </button>
        </div>
      ) : (
        <div style={s.page}>

          {/* ── Header ─────────────────────────────────────────── */}
          <div style={s.header}>
            <div>
              <h1 style={s.heroTitle}>
                {selectedRestaurant?.restaurant_name || "My Restaurant"}
              </h1>
              <div style={s.metaRow}>
                {locationLabel ? <span style={s.metaPill}>{locationLabel}</span> : null}
                <span style={s.metaPill}>{loading ? "Loading…" : menuStatusLabel}</span>
              </div>
            </div>
            <button type="button" onClick={() => navigate("/operator/menu")} style={s.primaryButton}>
              Open Menu Editor
            </button>
          </div>

          {/* ── Stats ──────────────────────────────────────────── */}
          <div style={s.statsRow}>
            <StatCard label="Menu items" value={loading ? "…" : totals.totalItems} />
            <StatCard label="Active deals" value={loading ? "…" : totals.activeDeals} />
          </div>

          {/* ── Quick actions ───────────────────────────────────── */}
          <div style={{ marginBottom: 22 }}>
            <SectionCard title="Quick actions">
              <div style={s.actionGrid}>
                <ActionCard
                  icon="▣"
                  title="QR Tools"
                  description="Order and manage QR starter kits."
                  onClick={() => navigate("/operator/qr-kits/order")}
                />
                <ActionCard
                  icon="↗"
                  title="Public Menu"
                  description="Open the customer-facing menu in a new tab."
                  onClick={() => window.open(`/public/restaurants/${selectedRestaurant.id}/menu`, "_blank")}
                />
                <ActionCard
                  icon="◷"
                  title="Public Profile"
                  description="View the public restaurant profile page."
                  onClick={() => window.open(`/restaurant-profile/${selectedRestaurant.id}`, "_blank")}
                />
              </div>
            </SectionCard>
          </div>

          {/* ── Menu list ───────────────────────────────────────── */}
          {menus.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <SectionCard title="Menus">
                <div style={s.menuList}>
                  {menus.map((menu) => (
                    <div key={menu.id} style={s.menuRow}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={s.menuName}>{menu.name}</span>
                        {menu.menu_type !== "standard" && (
                          <span style={s.menuTypePill}>{menu.menu_type}</span>
                        )}
                      </div>
                      <span style={s.menuCount}>{menu.item_count} items</span>
                      <StatusBadge status={menu.status} />
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}

          {/* ── Live display (benefit-gated) ─────────────────────── */}
          {hasBenefit("tv_menu_board") && selectedRestaurant && (
            <SectionCard title="Live display">
              <div style={s.displayCard}>
                <div>
                  <div style={s.displayTitle}>Digital menu board</div>
                  <div style={s.displayBody}>
                    Open the in-store display or copy the URL for a TV or menu screen.
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
          )}

        </div>
      )}
    </OperatorLayout>
  );
}

const s = {
  page: { maxWidth: 960, margin: "0 auto" },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    flexWrap: "wrap", gap: 16, marginBottom: 20,
  },
  heroTitle: {
    margin: "0 0 10px", fontSize: 26, fontWeight: 900,
    color: "#0f1720", letterSpacing: "-0.03em",
  },
  metaRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  metaPill: {
    padding: "5px 10px", borderRadius: 999,
    background: "#fff", border: `1px solid ${BORDER}`,
    fontSize: 12, fontWeight: 700, color: "#344054",
  },
  primaryButton: {
    minHeight: 42, borderRadius: 10, border: "none",
    background: GREEN, color: "#fff", fontWeight: 800,
    fontSize: 14, cursor: "pointer", padding: "0 18px",
    fontFamily: "inherit",
  },
  secondaryButton: {
    minHeight: 42, borderRadius: 10, border: `1px solid ${BORDER}`,
    background: "#fff", color: "#111", fontWeight: 700,
    fontSize: 14, cursor: "pointer", padding: "0 18px",
    fontFamily: "inherit",
  },
  statsRow: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 14, marginBottom: 22,
  },
  statCard: {
    background: "#fff", border: `1px solid ${BORDER}`,
    borderRadius: 14, padding: "18px 20px",
  },
  statValue: { fontSize: 28, fontWeight: 900, color: "#0f1720", lineHeight: 1.1 },
  statLabel: { fontSize: 13, fontWeight: 700, color: "#475467", marginTop: 8 },
  sectionCard: {
    background: "#fff", border: `1px solid ${BORDER}`,
    borderRadius: 16, padding: "20px 20px 18px",
  },
  sectionTitle: {
    margin: "0 0 16px", fontSize: 16, fontWeight: 800,
    color: "#0f1720", letterSpacing: "-0.02em",
  },
  actionGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 },
  actionCard: {
    border: "1.5px solid", borderRadius: 14, padding: "16px 16px 14px",
    textAlign: "left", cursor: "pointer", fontFamily: "inherit",
    transition: "border-color 0.12s, background 0.12s",
  },
  actionIcon: { fontSize: 22, marginBottom: 10 },
  actionTitle: { fontSize: 14, fontWeight: 800, color: "#0f1720", marginBottom: 5 },
  actionDescription: { fontSize: 12, color: "#5b6675", lineHeight: 1.5 },
  menuList: { display: "flex", flexDirection: "column", gap: 8 },
  menuRow: {
    border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 16px",
    display: "flex", alignItems: "center", gap: 12,
  },
  menuName: { fontWeight: 700, fontSize: 14, color: "#0f1720" },
  menuTypePill: {
    marginLeft: 8, fontSize: 11, background: "#eef4ff",
    color: "#164a9e", borderRadius: 999, padding: "2px 7px", fontWeight: 600,
  },
  menuCount: { fontSize: 12, color: "#8a9ab0", whiteSpace: "nowrap" },
  displayCard: {
    background: "#f8fafc", border: "1px solid #dbe4ee",
    borderRadius: 12, padding: "16px 18px",
  },
  displayTitle: { fontSize: 14, fontWeight: 800, color: "#0f1720", marginBottom: 4 },
  displayBody: { fontSize: 13, color: "#5b6675", lineHeight: 1.5, marginBottom: 14 },
  displayActions: { display: "flex", gap: 10, flexWrap: "wrap" },
  emptyCard: {
    maxWidth: 480, background: "#fff", border: `1px solid ${BORDER}`,
    borderRadius: 16, padding: "36px 32px", textAlign: "center", margin: "0 auto",
  },
  emptyTitle: { margin: "0 0 10px", fontSize: 18, fontWeight: 700, color: "#0f1720" },
  emptyBody: { margin: "0 0 24px", fontSize: 14, color: "#5b6675", lineHeight: 1.6 },
};
