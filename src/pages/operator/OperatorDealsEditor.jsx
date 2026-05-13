/**
 * src/pages/operator/OperatorDealsEditor.jsx
 *
 * Deals Editor — list, create, publish, pause, delete deals.
 *
 * Features:
 *   • Deals list with status badges
 *   • Filter by status (all / active / draft / paused / expired)
 *   • "New Deal" slide-in form
 *   • Item picker (type-ahead search from menu items)
 *   • Publish / Pause / Delete per row
 *   • "Feature as Billboard" section — promotes a deal as a display billboard
 */

import React, { useState, useEffect, useCallback } from "react";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";

// ── Shared styles ─────────────────────────────────────────────────────────
const INPUT = {
  padding: "9px 12px",
  fontSize: 13,
  border: "1.5px solid #e4e9f0",
  borderRadius: 8,
  outline: "none",
  color: "#0f1720",
  background: "#fff",
  fontFamily: "inherit",
  boxSizing: "border-box",
};
const LABEL = { fontSize: 11, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 4 };
const BTN = (variant = "primary", extra = {}) => ({
  padding: "8px 16px",
  fontSize: 13,
  fontWeight: 600,
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontFamily: "inherit",
  ...(variant === "primary" && { background: "#1F4E3D", color: "#fff" }),
  ...(variant === "ghost"   && { background: "transparent", color: "#1F4E3D", border: "1.5px solid #1F4E3D" }),
  ...(variant === "danger"  && { background: "transparent", color: "#b91c1c", border: "1.5px solid #fecaca" }),
  ...(variant === "muted"   && { background: "#f4f3ef", color: "#5b6675" }),
  ...(variant === "sm"      && { background: "#1F4E3D", color: "#fff", fontSize: 11, padding: "4px 10px" }),
  ...extra,
});

const DEAL_TYPES = [
  { value: "percent_off",  label: "% Off" },
  { value: "amount_off",   label: "$ Off" },
  { value: "bogo",         label: "BOGO" },
  { value: "fixed_price",  label: "Fixed Price" },
  { value: "bundle",       label: "Bundle" },
  { value: "other",        label: "Other" },
];

function StatusBadge({ status }) {
  const map = {
    active:  { bg: "#d1fae5", color: "#065f46" },
    draft:   { bg: "#fef9c3", color: "#854d0e" },
    paused:  { bg: "#fef3c7", color: "#92400e" },
    expired: { bg: "#f1f5f9", color: "#475569" },
    removed: { bg: "#fee2e2", color: "#991b1b" },
  };
  const s = map[status] || { bg: "#f1f5f9", color: "#475569" };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 999, padding: "3px 9px", fontSize: 11, fontWeight: 700 }}>
      {status}
    </span>
  );
}

function formatDiscount(deal) {
  if (deal.deal_type === "percent_off" && deal.discount_percent)
    return `${deal.discount_percent}% off`;
  if (deal.deal_type === "amount_off" && deal.discount_amount_cents)
    return `$${(deal.discount_amount_cents / 100).toFixed(2)} off`;
  if (deal.deal_type === "fixed_price" && deal.fixed_price_cents)
    return `$${(deal.fixed_price_cents / 100).toFixed(2)} fixed`;
  if (deal.deal_type === "bogo") return "BOGO";
  if (deal.deal_type === "bundle") return "Bundle";
  return deal.deal_type;
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Deal form panel ────────────────────────────────────────────────────────
// onSave receives (dealPayload, billboardPayload)
// billboardPayload: { enabled: false } | { enabled: true, headline_override, image_url, cta_label, cta_url, is_primary_search_billboard }
function DealForm({ allItems, initial = {}, initialBillboard = null, onSave, onCancel, busy }) {
  const [form, setForm] = useState({
    title: initial.title || "",
    description: initial.description || "",
    deal_type: initial.deal_type || "percent_off",
    discount_percent: initial.discount_percent || "",
    discount_amount_cents: initial.discount_amount_cents
      ? (initial.discount_amount_cents / 100).toString()
      : "",
    fixed_price_cents: initial.fixed_price_cents
      ? (initial.fixed_price_cents / 100).toString()
      : "",
    menu_item_id: initial.menu_item_id || "",
    starts_at: initial.starts_at ? initial.starts_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
    expires_at: initial.expires_at ? initial.expires_at.slice(0, 10) : "",
  });
  const [itemSearch, setItemSearch] = useState(initial.item_name || "");

  // Billboard section state
  const existingActive = initialBillboard?.billboard_status === "active";
  const [billboardEnabled, setBillboardEnabled] = useState(existingActive);
  const [bb, setBb] = useState({
    headline_override:          initialBillboard?.headline_override || "",
    image_url:                  initialBillboard?.image_url || "",
    cta_label:                  initialBillboard?.cta_label || "",
    cta_url:                    initialBillboard?.cta_url || "",
    is_primary_search_billboard: initialBillboard?.is_primary_search_billboard || false,
  });

  const f    = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const bb_f = (k) => (e) => setBb(p => ({ ...p, [k]: e.target.value }));

  const filteredItems = allItems.filter(i =>
    !itemSearch.trim() ||
    i.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
    (i.item_number || "").toLowerCase().includes(itemSearch.toLowerCase())
  );

  function buildPayload() {
    const p = {
      title: form.title,
      description: form.description,
      deal_type: form.deal_type,
      starts_at: form.starts_at,
      expires_at: form.expires_at,
      menu_item_id: form.menu_item_id || undefined,
    };
    // Backend buildDealFields reads `body.value`:
    // percent_off → value is the percent integer (e.g. 20)
    // amount_off  → value is dollars (e.g. 3.00); backend multiplies by 100
    // fixed_price → value is dollars (e.g. 9.99); backend multiplies by 100
    // Form state stores dollars for amount_off/fixed_price (initialized as cents/100).
    if (form.deal_type === "percent_off") p.value = parseFloat(form.discount_percent) || null;
    if (form.deal_type === "amount_off")  p.value = parseFloat(form.discount_amount_cents) || null;
    if (form.deal_type === "fixed_price") p.value = parseFloat(form.fixed_price_cents) || null;
    return p;
  }

  function buildBillboardPayload() {
    if (!billboardEnabled) return { enabled: false };
    return {
      enabled: true,
      headline_override:          bb.headline_override.trim() || null,
      image_url:                  bb.image_url.trim() || null,
      cta_label:                  bb.cta_label.trim() || null,
      cta_url:                    bb.cta_url.trim() || null,
      is_primary_search_billboard: bb.is_primary_search_billboard,
    };
  }

  const valid = form.title && form.description && form.expires_at && form.menu_item_id;

  return (
    <div style={{
      background: "#fff",
      border: "1.5px solid #1F4E3D",
      borderRadius: 14,
      padding: "20px 22px",
      marginBottom: 24,
      display: "flex",
      flexDirection: "column",
      gap: 14,
    }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#0f1720", marginBottom: -4 }}>
        {initial.id ? "Edit deal" : "New deal"}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={LABEL}>Title *</label>
          <input style={{ ...INPUT, width: "100%" }} value={form.title} onChange={f("title")} placeholder="e.g. Happy Hour Special" />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={LABEL}>Description *</label>
          <input style={{ ...INPUT, width: "100%" }} value={form.description} onChange={f("description")} placeholder="Short description shown to customers" />
        </div>

        {/* Item picker */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={LABEL}>Menu item *</label>
          <input
            style={{ ...INPUT, width: "100%", marginBottom: 6 }}
            value={itemSearch}
            onChange={e => { setItemSearch(e.target.value); setForm(p => ({ ...p, menu_item_id: "" })); }}
            placeholder="Search by name or item number…"
          />
          {itemSearch && !form.menu_item_id && filteredItems.length > 0 && (
            <div style={{
              border: "1px solid #e4e9f0", borderRadius: 8, background: "#fff",
              maxHeight: 160, overflowY: "auto",
            }}>
              {filteredItems.slice(0, 8).map(i => (
                <div
                  key={i.id}
                  onClick={() => { setForm(p => ({ ...p, menu_item_id: i.id })); setItemSearch(i.name); }}
                  style={{
                    padding: "8px 12px", cursor: "pointer", fontSize: 13,
                    borderBottom: "1px solid #f4f3ef",
                    display: "flex", justifyContent: "space-between",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f0f8f4"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                >
                  <span>{i.name}</span>
                  <span style={{ color: "#8a9ab0", fontSize: 11 }}>{i.item_number} · {i.price != null ? `$${Number(i.price).toFixed(2)}` : ""}</span>
                </div>
              ))}
            </div>
          )}
          {form.menu_item_id && (
            <div style={{ fontSize: 12, color: "#1F4E3D", fontWeight: 600, marginTop: 4 }}>
              ✓ {itemSearch}
            </div>
          )}
        </div>

        {/* Deal type */}
        <div>
          <label style={LABEL}>Deal type</label>
          <select style={{ ...INPUT, width: "100%", cursor: "pointer" }} value={form.deal_type} onChange={f("deal_type")}>
            {DEAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Conditional discount field */}
        {form.deal_type === "percent_off" && (
          <div>
            <label style={LABEL}>Discount %</label>
            <input style={{ ...INPUT, width: "100%" }} type="number" min="1" max="100" value={form.discount_percent} onChange={f("discount_percent")} placeholder="e.g. 20" />
          </div>
        )}
        {form.deal_type === "amount_off" && (
          <div>
            <label style={LABEL}>Discount $</label>
            <input style={{ ...INPUT, width: "100%" }} type="number" min="0" step="0.01" value={form.discount_amount_cents} onChange={f("discount_amount_cents")} placeholder="e.g. 3.00" />
          </div>
        )}
        {form.deal_type === "fixed_price" && (
          <div>
            <label style={LABEL}>Fixed price $</label>
            <input style={{ ...INPUT, width: "100%" }} type="number" min="0" step="0.01" value={form.fixed_price_cents} onChange={f("fixed_price_cents")} placeholder="e.g. 9.99" />
          </div>
        )}

        <div>
          <label style={LABEL}>Start date</label>
          <input style={{ ...INPUT, width: "100%" }} type="date" value={form.starts_at} onChange={f("starts_at")} />
        </div>
        <div>
          <label style={LABEL}>Expires *</label>
          <input style={{ ...INPUT, width: "100%" }} type="date" value={form.expires_at} onChange={f("expires_at")} />
        </div>
      </div>

      {/* ── Feature as Billboard section ──────────────────────────────── */}
      <div style={{ borderTop: "1.5px solid #e4e9f0", paddingTop: 16, marginTop: 2 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={billboardEnabled}
            onChange={e => setBillboardEnabled(e.target.checked)}
            style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#1F4E3D" }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f1720" }}>Feature this deal as a billboard</span>
        </label>

        {billboardEnabled && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 12, color: "#8a9ab0", lineHeight: 1.5 }}>
              These settings control how this deal appears in your restaurant profile and search results.
              All fields are optional — defaults use the deal title and description above.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={LABEL}>
                  Headline{" "}
                  <span style={{ fontWeight: 400, color: "#b0bbc8" }}>(optional — defaults to deal title)</span>
                </label>
                <input
                  style={{ ...INPUT, width: "100%" }}
                  value={bb.headline_override}
                  onChange={bb_f("headline_override")}
                  placeholder={form.title || "Deal title"}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={LABEL}>
                  Image URL{" "}
                  <span style={{ fontWeight: 400, color: "#b0bbc8" }}>(optional)</span>
                </label>
                <input
                  style={{ ...INPUT, width: "100%" }}
                  value={bb.image_url}
                  onChange={bb_f("image_url")}
                  placeholder="https://…"
                />
              </div>
              <div>
                <label style={LABEL}>
                  CTA label{" "}
                  <span style={{ fontWeight: 400, color: "#b0bbc8" }}>(optional)</span>
                </label>
                <input
                  style={{ ...INPUT, width: "100%" }}
                  value={bb.cta_label}
                  onChange={bb_f("cta_label")}
                  placeholder="e.g. Get this deal"
                />
              </div>
              <div>
                <label style={LABEL}>
                  CTA URL{" "}
                  <span style={{ fontWeight: 400, color: "#b0bbc8" }}>(optional)</span>
                </label>
                <input
                  style={{ ...INPUT, width: "100%" }}
                  value={bb.cta_url}
                  onChange={bb_f("cta_url")}
                  placeholder="https://…"
                />
              </div>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={bb.is_primary_search_billboard}
                onChange={e => setBb(p => ({ ...p, is_primary_search_billboard: e.target.checked }))}
                style={{ width: 14, height: 14, cursor: "pointer", accentColor: "#1F4E3D" }}
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#0f1720" }}>Show in search results</span>
            </label>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button style={BTN("muted")} onClick={onCancel} type="button">Cancel</button>
        <button
          style={{ ...BTN("primary"), opacity: (busy || !valid) ? 0.6 : 1 }}
          disabled={busy || !valid}
          onClick={() => onSave(buildPayload(), buildBillboardPayload())}
          type="button"
        >
          {busy ? "Saving…" : initial.id ? "Save changes" : "Create deal"}
        </button>
      </div>
    </div>
  );
}

// ── Deal row ───────────────────────────────────────────────────────────────
function DealRow({ deal, onEdit, onPublish, onPause, onDelete, busy }) {
  const isFeatured = deal.billboard_status === "active";
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e4e9f0",
      borderRadius: 12,
      padding: "14px 16px",
      display: "flex",
      alignItems: "flex-start",
      gap: 14,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#0f1720", marginBottom: 2 }}>{deal.title}</div>
        <div style={{ fontSize: 12, color: "#5b6675", marginBottom: 6 }}>{deal.description}</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#1F4E3D", fontWeight: 600 }}>{formatDiscount(deal)}</span>
          {deal.item_name && (
            <span style={{ fontSize: 12, color: "#8a9ab0" }}>
              on <span style={{ fontWeight: 600, color: "#5b6675" }}>{deal.item_name}</span>
              {deal.item_number ? ` (${deal.item_number})` : ""}
            </span>
          )}
          <span style={{ fontSize: 11, color: "#b0bbc8" }}>
            {formatDate(deal.starts_at)} – {formatDate(deal.expires_at)}
          </span>
          {isFeatured && (
            <span style={{
              background: "#fef3c7", color: "#92400e",
              borderRadius: 999, padding: "2px 8px",
              fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
            }}>
              Featured
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
        <StatusBadge status={deal.status} />
        <div style={{ display: "flex", gap: 6 }}>
          {deal.status === "draft" && (
            <button style={BTN("sm")} onClick={() => onPublish(deal)} disabled={busy}>
              Publish
            </button>
          )}
          {deal.status === "active" && (
            <button style={{ ...BTN("sm", { background: "#f59e0b", color: "#fff" }) }} onClick={() => onPause(deal)} disabled={busy}>
              Pause
            </button>
          )}
          {deal.status === "paused" && (
            <button style={BTN("sm")} onClick={() => onPublish(deal)} disabled={busy}>
              Resume
            </button>
          )}
          <button style={{ ...BTN("ghost"), fontSize: 12, padding: "4px 10px" }} onClick={() => onEdit(deal)} disabled={busy}>
            Edit
          </button>
          <button style={{ ...BTN("danger"), fontSize: 12, padding: "4px 10px" }} onClick={() => onDelete(deal)} disabled={busy}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function OperatorDealsEditor() {
  const { selectedRestaurant } = useOperator();
  const rid = selectedRestaurant?.id;

  const [deals, setDeals]               = useState([]);
  const [allItems, setAllItems]         = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [showForm, setShowForm]         = useState(false);
  const [editingDeal, setEditingDeal]   = useState(null);
  const [editingBillboard, setEditingBillboard] = useState(null);
  const [busy, setBusy]                 = useState(false);

  const loadDeals = useCallback(async () => {
    if (!rid) return;
    setLoading(true);
    try {
      const params = statusFilter !== "all" ? { status: statusFilter } : {};
      const d = await api.getDeals(rid, params);
      setDeals(d.deals || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [rid, statusFilter]);

  useEffect(() => { loadDeals(); }, [loadDeals]);

  // Load all menu items for the item picker
  useEffect(() => {
    if (!rid) return;
    api.getMenus(rid).then(async d => {
      const menus = d.menus || [];
      const itemArrays = await Promise.all(
        menus.map(m => api.getMenuItems(rid, m.id).then(r => r.items || []).catch(() => []))
      );
      const all = itemArrays.flat();
      const seen = new Set();
      setAllItems(all.filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true; }));
    }).catch(() => {});
  }, [rid]);

  async function handleCreate(payload, billboardPayload) {
    setBusy(true);
    try {
      const result = await api.createDeal(rid, payload);
      if (billboardPayload?.enabled && result.deal?.id) {
        try {
          await api.upsertDealBillboard(rid, result.deal.id, billboardPayload);
        } catch (billboardErr) {
          setError(`Deal created but billboard could not be saved: ${billboardErr.message}`);
        }
      }
      setShowForm(false);
      loadDeals();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleEdit(deal) {
    setShowForm(false);
    setEditingBillboard(null);
    setBusy(true);
    try {
      const data = await api.getDealBillboard(rid, deal.id);
      setEditingBillboard(data.billboard || null);
    } catch {
      setEditingBillboard(null);
    } finally {
      setBusy(false);
      setEditingDeal(deal);
    }
  }

  async function handleEditSave(payload, billboardPayload) {
    setBusy(true);
    try {
      await api.updateDeal(rid, editingDeal.id, payload);

      if (billboardPayload?.enabled) {
        try {
          await api.upsertDealBillboard(rid, editingDeal.id, billboardPayload);
        } catch (billboardErr) {
          setError(`Deal saved but billboard could not be updated: ${billboardErr.message}`);
        }
      } else if (billboardPayload?.enabled === false) {
        try {
          await api.removeDealBillboard(rid, editingDeal.id);
        } catch {
          // Non-fatal — billboard may not have existed
        }
      }

      setEditingDeal(null);
      setEditingBillboard(null);
      loadDeals();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handlePublish(deal) {
    setBusy(true);
    try {
      if (deal.status === "draft" || deal.status === "paused") {
        await api.publishDeal(rid, deal.id);
      }
      loadDeals();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handlePause(deal) {
    setBusy(true);
    try {
      await api.pauseDeal(rid, deal.id);
      loadDeals();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(deal) {
    if (!window.confirm(`Remove deal "${deal.title}"?`)) return;
    setBusy(true);
    try {
      await api.deleteDeal(rid, deal.id);
      loadDeals();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!rid) {
    return (
      <OperatorLayout title="Deals">
        <p style={{ color: "#8a9ab0" }}>Select a restaurant to manage deals.</p>
      </OperatorLayout>
    );
  }

  const STATUS_FILTERS = ["all", "active", "draft", "paused", "expired"];

  return (
    <OperatorLayout title="Deals">
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "5px 12px",
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 999,
                border: "1.5px solid",
                cursor: "pointer",
                fontFamily: "inherit",
                borderColor: statusFilter === s ? "#1F4E3D" : "#e4e9f0",
                background: statusFilter === s ? "#1F4E3D" : "#fff",
                color: statusFilter === s ? "#fff" : "#5b6675",
              }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <button
          style={{ ...BTN("primary"), marginLeft: "auto" }}
          onClick={() => { setShowForm(v => !v); setEditingDeal(null); setEditingBillboard(null); }}
        >
          + New deal
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
          padding: "10px 14px", color: "#b91c1c", fontSize: 13, marginBottom: 16,
          display: "flex", justifyContent: "space-between",
        }}>
          {error}
          <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#b91c1c", fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* New deal form */}
      {showForm && (
        <DealForm
          allItems={allItems}
          onSave={handleCreate}
          onCancel={() => setShowForm(false)}
          busy={busy}
        />
      )}

      {/* Edit deal form */}
      {editingDeal && (
        <DealForm
          allItems={allItems}
          initial={editingDeal}
          initialBillboard={editingBillboard}
          onSave={handleEditSave}
          onCancel={() => { setEditingDeal(null); setEditingBillboard(null); }}
          busy={busy}
        />
      )}

      {/* Deals list */}
      {loading ? (
        <p style={{ color: "#8a9ab0", fontSize: 13 }}>Loading deals…</p>
      ) : deals.length === 0 ? (
        <div style={{
          background: "#fff", border: "1px solid #e4e9f0", borderRadius: 14,
          padding: "40px 32px", textAlign: "center",
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⊹</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f1720", marginBottom: 8 }}>
            {statusFilter === "all" ? "No deals yet" : `No ${statusFilter} deals`}
          </div>
          {statusFilter === "all" && (
            <div style={{ fontSize: 13, color: "#8a9ab0" }}>
              Create your first deal with the button above.
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 780 }}>
          {deals.map(deal => (
            <DealRow
              key={deal.id}
              deal={deal}
              onEdit={handleEdit}
              onPublish={handlePublish}
              onPause={handlePause}
              onDelete={handleDelete}
              busy={busy}
            />
          ))}
        </div>
      )}
    </OperatorLayout>
  );
}
