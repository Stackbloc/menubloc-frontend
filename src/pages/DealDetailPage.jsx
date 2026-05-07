// ============================================================
// File: src/pages/DealDetailPage.jsx
// Purpose: Consumer-facing deal detail page.
//   Shows full deal terms set by the restaurant, preference
//   selectors (when deal_options are available), and Add to order.
// ============================================================

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { useOrderCart } from "../context/OrderCartContext.jsx";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

// ── Helpers ──────────────────────────────────────────────────

function formatCents(cents) {
  if (!Number.isFinite(cents) || cents < 0) return null;
  return `$${(cents / 100).toFixed(2)}`;
}

function parsePriceCents(value) {
  const n = Number.parseFloat(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

function getDealPriceCents(deal) {
  if (Number.isFinite(Number(deal.fixed_price_cents)) && deal.fixed_price_cents >= 0)
    return Number(deal.fixed_price_cents);
  if (Number.isFinite(Number(deal.deal_price_cents)) && deal.deal_price_cents >= 0)
    return Number(deal.deal_price_cents);
  const menuCents = parsePriceCents(deal.menu_item_price);
  if (deal.deal_type === "fixed_price") {
    const p = parsePriceCents(deal.discount_value);
    if (p != null) return p;
  }
  if (deal.deal_type === "amount_off" && menuCents != null) {
    const off = parsePriceCents(deal.discount_value ?? deal.discount_amount_cents);
    if (off != null) return Math.max(menuCents - off, 0);
  }
  if (deal.deal_type === "percent_off" && menuCents != null) {
    const pct = Number.parseFloat(String(deal.discount_value ?? deal.discount_percent ?? "").replace(/[^0-9.]/g, ""));
    if (Number.isFinite(pct) && pct > 0) return Math.max(Math.round(menuCents * (1 - pct / 100)), 0);
  }
  return menuCents;
}

function discountBadgeText(deal) {
  if (deal.deal_type === "percent_off") {
    const pct = Number.parseFloat(String(deal.discount_value ?? deal.discount_percent ?? "").replace(/[^0-9.]/g, ""));
    if (Number.isFinite(pct) && pct > 0) return `${pct}% off`;
  }
  if (deal.deal_type === "amount_off") {
    const off = parsePriceCents(deal.discount_value ?? deal.discount_amount_cents);
    if (off != null) return `${formatCents(off)} off`;
  }
  if (deal.deal_type === "fixed_price") {
    const p = parsePriceCents(deal.fixed_price_cents ?? deal.discount_value);
    if (p != null) return `Special price ${formatCents(p)}`;
  }
  if (deal.deal_type === "bogo") return "Buy one get one";
  if (deal.deal_type === "bundle") return "Bundle deal";
  return "Deal";
}

function daysUntil(isoDate) {
  if (!isoDate) return null;
  const diff = new Date(isoDate) - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ── Page ─────────────────────────────────────────────────────

export default function DealDetailPage() {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useOrderCart();

  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API}/deals/${dealId}`);
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!json.ok) throw new Error(json.error || "Deal not found");
        setDeal(json.deal);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [dealId]);

  function handleAddToOrder() {
    if (!deal) return;
    const dealPriceCents = getDealPriceCents(deal);
    const menuPriceCents = parsePriceCents(deal.menu_item_price);
    const hasDealPrice = dealPriceCents != null && menuPriceCents != null && dealPriceCents !== menuPriceCents;
    addToCart({
      restaurant: {
        restaurantId: deal.restaurant_id,
        restaurantName: deal.restaurant_name,
        slug: deal.restaurant_slug,
      },
      item: {
        menuItemId: deal.menu_item_id,
        name: deal.menu_item_name || deal.title || "Deal item",
        description: deal.description || "",
        quantity: 1,
        basePriceCents: dealPriceCents ?? menuPriceCents ?? 0,
        originalBasePriceCents: hasDealPrice ? menuPriceCents : (dealPriceCents ?? 0),
        pricingType: hasDealPrice ? "deal" : "",
        pricingLabel: hasDealPrice ? "Deal applied" : "",
      },
    });
    setAdded(true);
  }

  const restaurantUrl = deal
    ? `/restaurants/${deal.restaurant_slug || deal.restaurant_id}`
    : null;
  const restaurantMenuUrl = deal
    ? `/restaurants/${deal.restaurant_slug || deal.restaurant_id}/menu`
    : null;

  const dealPriceCents = deal ? getDealPriceCents(deal) : null;
  const menuPriceCents = deal ? parsePriceCents(deal.menu_item_price) : null;
  const hasDealPrice = dealPriceCents != null && menuPriceCents != null && dealPriceCents !== menuPriceCents;
  const days = deal ? daysUntil(deal.expires_at) : null;

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#0B0F0C", color: "#FFFFFF" }}>
      <StickyPageHeader title="Deal details" />

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "16px 16px 100px" }}>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[120, 60, 80, 200].map((h, i) => (
              <div key={i} style={{
                height: h, borderRadius: 12, background: "#1F2937",
                animation: "skelPulse 1.4s ease-in-out infinite",
              }} />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{
            padding: "20px 18px", borderRadius: 14,
            border: "1px solid #450a0a", background: "#1c0a0a",
            fontSize: 14, fontWeight: 700, color: "#fca5a5",
          }}>
            {error}
          </div>
        )}

        {/* Deal content */}
        {!loading && deal && (
          <>
            {/* Discount badge */}
            <div style={{ marginBottom: 14 }}>
              <span style={{
                display: "inline-block",
                padding: "4px 14px", borderRadius: 999,
                background: "#22C55E", color: "#0B0F0C",
                fontSize: 13, fontWeight: 900, letterSpacing: "0.02em",
              }}>
                {discountBadgeText(deal)}
              </span>
            </div>

            {/* Deal title */}
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 4px", lineHeight: 1.2 }}>
              {deal.title}
            </h1>
            <div
              style={{
                position: "sticky",
                top: 68,
                zIndex: 20,
                marginTop: 10,
                marginBottom: 16,
                padding: "12px 14px",
                borderRadius: 14,
                background: "rgba(18, 26, 20, 0.96)",
                border: "1px solid #1F2937",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                backdropFilter: "blur(10px)",
              }}
            >
              {restaurantUrl ? (
                <Link
                  to={restaurantUrl}
                  style={{ fontSize: 13, color: "#22C55E", fontWeight: 700, textDecoration: "none" }}
                >
                  {deal.restaurant_name}
                </Link>
              ) : (
                <span style={{ fontSize: 13, color: "#667085", fontWeight: 700 }}>
                  {deal.restaurant_name}
                </span>
              )}

              {days != null && (
                <div style={{
                  marginTop: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  color: days <= 2 ? "#b91c1c" : "#9ca3af",
                }}>
                  {days === 0
                    ? "Expires today"
                    : days === 1
                    ? "Expires tomorrow"
                    : `Expires in ${days} days`}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                {restaurantMenuUrl && (
                  <Link
                    to={restaurantMenuUrl}
                    style={{
                      height: 38,
                      padding: "0 14px",
                      borderRadius: 10,
                      border: "1.5px solid #22C55E",
                      background: "transparent",
                      color: "#22C55E",
                      fontSize: 13,
                      fontWeight: 800,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    Show full menu
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => navigate("/deals")}
                  style={{
                    height: 38,
                    padding: "0 14px",
                    borderRadius: 10,
                    border: "1.5px solid #1F2937",
                    background: "transparent",
                    color: "#9CA3AF",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Back to deals
                </button>
              </div>
            </div>

            {/* Description */}
            {deal.description && (
              <div style={{
                marginTop: 16, padding: "14px 16px",
                borderRadius: 12, background: "#121A14",
                border: "1px solid #1F2937",
                fontSize: 14, color: "#D1D5DB", lineHeight: 1.65,
              }}>
                {deal.description}
              </div>
            )}

            {/* Menu item card */}
            {deal.menu_item_name && (
              <div style={{
                marginTop: 12, padding: "14px 16px",
                borderRadius: 12, background: "#121A14",
                border: "1px solid #1F2937",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Includes
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF" }}>
                  {deal.menu_item_name}
                </div>
                {deal.menu_item_description && (
                  <div style={{ fontSize: 13, color: "#667085", marginTop: 4, lineHeight: 1.5 }}>
                    {deal.menu_item_description}
                  </div>
                )}
                {/* Pricing row */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                  {hasDealPrice && (
                    <span style={{
                      fontSize: 18, fontWeight: 900, color: "#22C55E",
                    }}>
                      {formatCents(dealPriceCents)}
                    </span>
                  )}
                  {hasDealPrice && menuPriceCents != null && (
                    <span style={{
                      fontSize: 14, color: "#9ca3af", fontWeight: 600,
                      textDecoration: "line-through",
                    }}>
                      {formatCents(menuPriceCents)}
                    </span>
                  )}
                  {!hasDealPrice && dealPriceCents != null && (
                    <span style={{ fontSize: 18, fontWeight: 900, color: "#FFFFFF" }}>
                      {formatCents(dealPriceCents)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Preference selector — bundle/combo choices */}
            {deal.deal_type === "bundle" && (
              <div style={{
                marginTop: 12, padding: "14px 16px",
                borderRadius: 12, background: "#1c1a0a",
                border: "1px solid #44400a",
              }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#92400e", marginBottom: 4 }}>
                  Customize your deal
                </div>
                <div style={{ fontSize: 13, color: "#78350f", lineHeight: 1.55 }}>
                  Deal options (e.g. drink or side choice) are set by the restaurant
                  and will appear here once configured.
                </div>
              </div>
            )}

            {/* Terms section */}
            <div style={{
              marginTop: 12, padding: "14px 16px",
              borderRadius: 12, background: "#121A14",
              border: "1px solid #1F2937",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Deal terms
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <TermRow label="Type" value={deal.deal_type?.replace(/_/g, " ")} />
                {deal.discount_percent != null && (
                  <TermRow label="Discount" value={`${deal.discount_percent}% off`} />
                )}
                {deal.discount_amount_cents != null && (
                  <TermRow label="Discount" value={`${formatCents(deal.discount_amount_cents)} off`} />
                )}
                {deal.fixed_price_cents != null && (
                  <TermRow label="Special price" value={formatCents(deal.fixed_price_cents)} />
                )}
                {deal.starts_at && (
                  <TermRow label="Valid from" value={new Date(deal.starts_at).toLocaleDateString()} />
                )}
                {deal.expires_at && (
                  <TermRow label="Valid until" value={new Date(deal.expires_at).toLocaleDateString()} />
                )}
                {deal.restaurant_city && deal.restaurant_state && (
                  <TermRow label="Location" value={`${deal.restaurant_city}, ${deal.restaurant_state}`} />
                )}
              </div>
            </div>

            {/* Add to order */}
            <div style={{ marginTop: 20 }}>
              {added ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{
                    textAlign: "center", padding: "14px",
                    borderRadius: 12, background: "rgba(34,197,94,0.1)",
                    border: "1px solid rgba(34,197,94,0.3)",
                    fontSize: 14, fontWeight: 800, color: "#22C55E",
                  }}>
                    ✓ Added to your order
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAddToOrder}
                  disabled={!deal.menu_item_id}
                  style={{
                    display: "block", width: "100%", height: 50,
                    borderRadius: 12, border: "none",
                    background: deal.menu_item_id ? "#1F4E3D" : "#e4e7ec",
                    color: deal.menu_item_id ? "#fff" : "#9ca3af",
                    fontSize: 16, fontWeight: 900,
                    cursor: deal.menu_item_id ? "pointer" : "not-allowed",
                  }}
                >
                  {deal.menu_item_id
                    ? `Add to order${dealPriceCents != null ? ` · ${formatCents(dealPriceCents)}` : ""}`
                    : "Order not available"}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <BottomNav />

      <style>{`
        @keyframes skelPulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
      `}</style>
    </div>
  );
}

function TermRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
      <span style={{ color: "#9ca3af", fontWeight: 600 }}>{label}</span>
      <span style={{ color: "#101828", fontWeight: 700, textTransform: "capitalize" }}>{value}</span>
    </div>
  );
}
