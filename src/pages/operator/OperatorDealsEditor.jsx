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

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext.jsx";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";
import { useOperatorLabels } from "../../i18n/useOperatorLabels.js";
import {
  DEAL_MEAL_PERIODS,
  dealMealPeriodSummary,
  formatMealTimeDealCaption,
  normalizeDealMealPeriodList,
} from "../../lib/dealMealPeriods.js";
import { resolveBillboardMediaUrl } from "../../lib/billboardMediaUrl.js";

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
  { value: "combo",        label: "Combo" },
  { value: "other",        label: "Other" },
];

function StatusBadge({ status, t }) {
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
      {t ? t(`operator.deals.status.${status}`, status) : status}
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
  if (deal.deal_type === "combo" || deal.deal_type === "bundle") return "Combo";
  return deal.deal_type;
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Deal form panel ────────────────────────────────────────────────────────
// onSave receives (dealPayload, billboardPayload)
// billboardPayload: { enabled: false } | { enabled: true, headline_override, image_url, cta_label, cta_url, is_primary_search_billboard }
// One additional item picker slot for combo deals.
// selectedId: the chosen menu_item_id | ""; onSelect(id, name); onClear()
function ComboItemPicker({ label, selectedId, selectedName, allItems, onSelect, onClear, disabledIds }) {
  const [search, setSearch] = useState(selectedName || "");
  const filtered = allItems.filter(i => {
    if (disabledIds.has(i.id)) return false;
    if (!search.trim() || selectedId) return false;
    return (
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.item_number || "").toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div style={{ gridColumn: "1 / -1" }}>
      <label style={LABEL}>{label} <span style={{ fontWeight: 400, color: "#b0bbc8" }}>(optional)</span></label>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input
          style={{ ...INPUT, flex: 1 }}
          value={selectedId ? selectedName : search}
          onChange={e => { setSearch(e.target.value); if (selectedId) onClear(); }}
          placeholder="Search by name or item number…"
          disabled={false}
        />
        {selectedId && (
          <button
            type="button"
            onClick={() => { onClear(); setSearch(""); }}
            style={{ background: "none", border: "1.5px solid #e4e9f0", borderRadius: 8, padding: "8px 10px", cursor: "pointer", color: "#8a9ab0", fontSize: 13 }}
          >✕</button>
        )}
      </div>
      {!selectedId && search && filtered.length > 0 && (
        <div style={{ border: "1px solid #e4e9f0", borderRadius: 8, background: "#fff", maxHeight: 140, overflowY: "auto", marginTop: 4 }}>
          {filtered.slice(0, 8).map(i => (
            <div
              key={i.id}
              onClick={() => { onSelect(i.id, i.name); setSearch(i.name); }}
              style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid #f4f3ef", display: "flex", justifyContent: "space-between" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f0f8f4"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}
            >
              <span>{i.name}</span>
              <span style={{ color: "#8a9ab0", fontSize: 11 }}>{i.item_number} · {i.price != null ? `$${Number(i.price).toFixed(2)}` : ""}</span>
            </div>
          ))}
        </div>
      )}
      {selectedId && (
        <div style={{ fontSize: 12, color: "#1F4E3D", fontWeight: 600, marginTop: 4 }}>✓ {selectedName}</div>
      )}
    </div>
  );
}

function DealForm({ allItems, restaurantId, initial = {}, initialBillboard = null, onSave, onCancel, busy }) {
  const [form, setForm] = useState({
    title: initial.title || "",
    description: initial.description || "",
    deal_type: (initial.deal_type === "bundle" ? "combo" : initial.deal_type) || "percent_off",
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
    display_on_menu_browser: initial.is_promoted === true,
    video_url: initial.video_url || "",
  });
  const [mealPeriods, setMealPeriods] = useState(() =>
    normalizeDealMealPeriodList(initial.meal_periods)
  );
  const [showMealTimeCaption, setShowMealTimeCaption] = useState(
    initial.show_meal_time_caption === true
  );
  const [itemSearch, setItemSearch] = useState(initial.item_name || "");

  // Combo additional items: up to 3 slots, each {id, name}
  const initComboIds = Array.isArray(initial.combo_item_ids) ? initial.combo_item_ids : [];
  const initComboNames = (() => {
    const map = Object.fromEntries(allItems.map(i => [i.id, i.name]));
    return initComboIds.map(id => map[id] || "");
  })();
  const [comboItems, setComboItems] = useState([
    { id: initComboIds[0] || "", name: initComboNames[0] || "" },
    { id: initComboIds[1] || "", name: initComboNames[1] || "" },
    { id: initComboIds[2] || "", name: initComboNames[2] || "" },
  ]);

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

  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [bbPhotoFile, setBbPhotoFile] = useState(null);
  const [bbPhotoPreview, setBbPhotoPreview] = useState(null);
  const [bbPhotoError, setBbPhotoError] = useState("");
  const [dealVideoFile, setDealVideoFile] = useState(null);
  const [dealVideoUploadBusy, setDealVideoUploadBusy] = useState(false);
  const [dealVideoError, setDealVideoError] = useState("");

  const f    = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const bb_f = (k) => (e) => setBb(p => ({ ...p, [k]: e.target.value }));

  function toggleMealPeriod(id) {
    setMealPeriods((prev) => {
      const set = new Set(prev);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      const next = DEAL_MEAL_PERIODS.map((p) => p.id).filter((pid) => set.has(pid));
      if (!next.length) setShowMealTimeCaption(false);
      return next;
    });
  }

  const mealTimeCaptionPreview =
    showMealTimeCaption && mealPeriods.length
      ? formatMealTimeDealCaption(mealPeriods)
      : null;

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
      display_on_menu_browser: form.display_on_menu_browser === true,
      video_url: form.video_url.trim() || null,
      meal_periods: mealPeriods,
      show_meal_time_caption: showMealTimeCaption && mealPeriods.length > 0,
    };
    // Backend buildDealFields reads `body.value`:
    // percent_off → value is the percent integer (e.g. 20)
    // amount_off  → value is dollars (e.g. 3.00); backend multiplies by 100
    // fixed_price → value is dollars (e.g. 9.99); backend multiplies by 100
    // Form state stores dollars for amount_off/fixed_price (initialized as cents/100).
    if (form.deal_type === "percent_off") p.value = parseFloat(form.discount_percent) || null;
    if (form.deal_type === "amount_off")  p.value = parseFloat(form.discount_amount_cents) || null;
    if (form.deal_type === "fixed_price") p.value = parseFloat(form.fixed_price_cents) || null;
    if (form.deal_type === "combo") {
      p.combo_item_ids = comboItems.filter(c => c.id).map(c => Number(c.id));
    }
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

  const savedBillboardImageUrl = resolveBillboardMediaUrl(bb.image_url) || "";

  async function uploadDealVideoNow(file) {
    if (!restaurantId || !initial.id || !file) return;
    setDealVideoUploadBusy(true);
    setDealVideoError("");
    try {
      const uploaded = await api.uploadDealMediaVideo(restaurantId, initial.id, file);
      if (uploaded?.video_url) {
        setForm((p) => ({ ...p, video_url: uploaded.video_url }));
        setDealVideoFile(null);
      } else {
        throw new Error(uploaded?.error || "Video upload failed");
      }
    } catch (err) {
      setDealVideoError(err.message || "Unable to upload deal video");
    } finally {
      setDealVideoUploadBusy(false);
    }
  }

  async function onDealVideoSelected(file) {
    if (!file) return;
    setDealVideoError("");
    setDealVideoFile(file);
    if (initial.id) {
      await uploadDealVideoNow(file);
    }
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

      <div className="operator-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
          <select
            style={{ ...INPUT, width: "100%", cursor: "pointer" }}
            value={form.deal_type}
            onChange={e => {
              const newType = e.target.value;
              setForm(p => ({ ...p, deal_type: newType }));
              if (newType !== "combo") setComboItems([{ id: "", name: "" }, { id: "", name: "" }, { id: "", name: "" }]);
            }}
          >
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

        {/* Combo additional item pickers */}
        {form.deal_type === "combo" && (
          <>
            <ComboItemPicker
              label="Additional item 1"
              selectedId={comboItems[0].id}
              selectedName={comboItems[0].name}
              allItems={allItems}
              onSelect={(id, name) => setComboItems(p => [{ id, name }, p[1], p[2]])}
              onClear={() => setComboItems(p => [{ id: "", name: "" }, p[1], p[2]])}
              disabledIds={new Set([form.menu_item_id, comboItems[1].id, comboItems[2].id].filter(Boolean).map(Number))}
            />
            <ComboItemPicker
              label="Additional item 2"
              selectedId={comboItems[1].id}
              selectedName={comboItems[1].name}
              allItems={allItems}
              onSelect={(id, name) => setComboItems(p => [p[0], { id, name }, p[2]])}
              onClear={() => setComboItems(p => [p[0], { id: "", name: "" }, p[2]])}
              disabledIds={new Set([form.menu_item_id, comboItems[0].id, comboItems[2].id].filter(Boolean).map(Number))}
            />
            <ComboItemPicker
              label="Additional item 3"
              selectedId={comboItems[2].id}
              selectedName={comboItems[2].name}
              allItems={allItems}
              onSelect={(id, name) => setComboItems(p => [p[0], p[1], { id, name }])}
              onClear={() => setComboItems(p => [p[0], p[1], { id: "", name: "" }])}
              disabledIds={new Set([form.menu_item_id, comboItems[0].id, comboItems[1].id].filter(Boolean).map(Number))}
            />
          </>
        )}

        <div>
          <label style={LABEL}>Start date</label>
          <input style={{ ...INPUT, width: "100%" }} type="date" value={form.starts_at} onChange={f("starts_at")} />
        </div>
        <div>
          <label style={LABEL}>Expires *</label>
          <input style={{ ...INPUT, width: "100%" }} type="date" value={form.expires_at} onChange={f("expires_at")} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: "#0f1720", fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={form.display_on_menu_browser === true}
              onChange={(e) => setForm((p) => ({ ...p, display_on_menu_browser: e.target.checked }))}
              style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#1F4E3D" }}
            />
            Display on Menu Browser (as sponsored ad page)
          </label>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={LABEL}>Meal time (offer applies)</label>
          <div style={{ fontSize: 12, color: "#8a9ab0", marginBottom: 8, lineHeight: 1.5 }}>
            Select when this offer applies. Choose one or more — e.g. breakfast and lunch for a
            brunch deal. Leave all unchecked for all-day.
          </div>
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
            data-testid="deal-form-meal-periods"
            role="group"
            aria-label="Meal times for this offer"
          >
            {DEAL_MEAL_PERIODS.map((period) => {
              const selected = mealPeriods.includes(period.id);
              return (
                <button
                  key={period.id}
                  type="button"
                  aria-pressed={selected}
                  data-testid={`deal-meal-period-${period.id}`}
                  onClick={() => toggleMealPeriod(period.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: "1.5px solid",
                    borderColor: selected ? "#1F4E3D" : "#e4e9f0",
                    background: selected ? "#ecfdf5" : "#fff",
                    color: selected ? "#1F4E3D" : "#5b6675",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {period.label}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 12, color: "#1F4E3D", fontWeight: 600, marginTop: 8 }}>
            {dealMealPeriodSummary(mealPeriods)}
          </div>
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              marginTop: 12,
              cursor: mealPeriods.length ? "pointer" : "not-allowed",
              opacity: mealPeriods.length ? 1 : 0.55,
            }}
            data-testid="deal-form-meal-time-caption"
          >
            <input
              type="checkbox"
              checked={showMealTimeCaption && mealPeriods.length > 0}
              disabled={!mealPeriods.length}
              onChange={(e) => setShowMealTimeCaption(e.target.checked)}
              style={{ marginTop: 2 }}
            />
            <span style={{ fontSize: 13, color: "#334155", lineHeight: 1.45 }}>
              Show meal time caption on Feed video
              <span style={{ display: "block", fontSize: 12, color: "#8a9ab0", fontWeight: 400 }}>
                Uses your meal selections — e.g. &quot;Lunch Deal&quot;. Select at least one meal
                time above.
              </span>
              {mealTimeCaptionPreview ? (
                <span
                  style={{
                    display: "block",
                    marginTop: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#1F4E3D",
                  }}
                  data-testid="deal-form-meal-time-caption-preview"
                >
                  Preview: {mealTimeCaptionPreview}
                </span>
              ) : null}
            </span>
          </label>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={LABEL}>Deal video (Feed → Deals)</label>
          <div style={{ fontSize: 12, color: "#8a9ab0", marginBottom: 8, lineHeight: 1.5 }}>
            Upload a short video for this offer. When the deal is <strong>active</strong> and has a
            video, it appears in Feed → Deals swipe. MP4 (H.264+AAC) preferred.
          </div>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onDealVideoSelected(file);
              e.target.value = "";
            }}
          />
          {form.video_url ? (
            <div style={{ marginBottom: 10 }}>
              <video
                src={form.video_url}
                controls
                playsInline
                style={{
                  width: "100%",
                  maxWidth: 320,
                  maxHeight: 180,
                  borderRadius: 8,
                  background: "#0f1720",
                }}
                data-testid="deal-form-video-preview"
              />
            </div>
          ) : null}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              style={BTN("ghost", { fontSize: 12, padding: "6px 12px" })}
              disabled={busy || dealVideoUploadBusy}
              onClick={() => videoInputRef.current?.click()}
            >
              {dealVideoUploadBusy
                ? "Uploading…"
                : form.video_url
                  ? "Replace video"
                  : "Upload deal video"}
            </button>
            {dealVideoFile && !initial.id ? (
              <span style={{ fontSize: 12, color: "#1F4E3D", fontWeight: 600 }}>
                ✓ {dealVideoFile.name} — uploads when you save
              </span>
            ) : null}
          </div>
          {dealVideoError ? (
            <p role="alert" style={{ fontSize: 12, color: "#b91c1c", marginTop: 8 }}>
              {dealVideoError}
            </p>
          ) : null}
          <details style={{ marginTop: 10 }}>
            <summary style={{ fontSize: 12, color: "#5b6675", cursor: "pointer" }}>
              Or paste durable video URL
            </summary>
            <input
              style={{ ...INPUT, width: "100%", marginTop: 8 }}
              value={form.video_url}
              onChange={f("video_url")}
              placeholder="https://… (mp4, H.264+AAC preferred)"
              disabled={Boolean(dealVideoFile) || dealVideoUploadBusy}
            />
          </details>
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
        <div style={{ fontSize: 12, color: "#8a9ab0", lineHeight: 1.5, marginTop: 8 }}>
          Upload a graphic here after entering deal text. Or create from{" "}
          <Link to="/operator/billboards" style={{ color: "#1F4E3D", fontWeight: 700 }}>Billboards</Link>
          {" "}(graphic first) — same deal, synced both ways.
        </div>

        {billboardEnabled && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 12, color: "#8a9ab0", lineHeight: 1.5 }}>
              These settings control how this deal appears on your restaurant profile splash.
              All fields are optional — defaults use the deal title and description above.
            </div>

            <div className="operator-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
                  Photo{" "}
                  <span style={{ fontWeight: 400, color: "#b0bbc8" }}>(optional)</span>
                </label>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (bbPhotoPreview) URL.revokeObjectURL(bbPhotoPreview);
                    const previewUrl = URL.createObjectURL(file);
                    setBbPhotoFile(file);
                    setBbPhotoPreview(previewUrl);
                    setBb(p => ({ ...p, image_url: "" }));
                    setBbPhotoError("");
                    e.target.value = "";
                  }}
                />
                {bbPhotoPreview || savedBillboardImageUrl ? (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{
                      width: 80, height: 80, borderRadius: 8, overflow: "hidden",
                      border: "1.5px solid #e4e9f0", flexShrink: 0,
                    }}>
                      <img
                        src={bbPhotoPreview || savedBillboardImageUrl}
                        alt="Billboard"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={() => setBbPhotoError("Could not load image")}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <button
                        type="button"
                        style={{ ...BTN("ghost"), fontSize: 12, padding: "4px 10px" }}
                        onClick={() => photoInputRef.current?.click()}
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        style={{ ...BTN("danger"), fontSize: 12, padding: "4px 10px" }}
                        onClick={() => {
                          if (bbPhotoPreview) URL.revokeObjectURL(bbPhotoPreview);
                          setBbPhotoFile(null);
                          setBbPhotoPreview(null);
                          setBb(p => ({ ...p, image_url: "" }));
                          setBbPhotoError("");
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    style={{ ...BTN("ghost"), fontSize: 12, padding: "6px 14px" }}
                    onClick={() => photoInputRef.current?.click()}
                  >
                    + Upload photo
                  </button>
                )}
                {bbPhotoError && (
                  <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 4 }}>{bbPhotoError}</div>
                )}
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

            {/* Billboard preview */}
            {(bbPhotoPreview || savedBillboardImageUrl || bb.headline_override || form.title) && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#5b6675", marginBottom: 6 }}>Preview</div>
                <div style={{
                  width: 200, height: 200, borderRadius: 12, overflow: "hidden",
                  position: "relative", border: "1.5px solid #e4e9f0", flexShrink: 0,
                  background: bbPhotoPreview || savedBillboardImageUrl
                    ? `url(${encodeURI(bbPhotoPreview || savedBillboardImageUrl)}) center/cover no-repeat`
                    : "linear-gradient(135deg, #1F4E3D 0%, #3b7a68 100%)",
                }}>
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)",
                  }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 12px 10px" }}>
                    <div style={{
                      color: "#fff", fontWeight: 800, fontSize: 13, lineHeight: 1.3,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}>
                      {bb.headline_override || form.title || "Deal title"}
                    </div>
                    {bb.cta_label && (
                      <div style={{
                        marginTop: 6, display: "inline-block",
                        background: "#fff", color: "#1F4E3D",
                        borderRadius: 6, padding: "4px 10px",
                        fontSize: 11, fontWeight: 700,
                      }}>
                        {bb.cta_label}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="operator-responsive-card-actions" style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button style={BTN("muted")} onClick={onCancel} type="button">Cancel</button>
        <button
          style={{ ...BTN("primary"), opacity: (busy || !valid) ? 0.6 : 1 }}
          disabled={busy || !valid}
          onClick={() => onSave(buildPayload(), buildBillboardPayload(), bbPhotoFile, dealVideoFile)}
          type="button"
        >
          {busy ? "Saving…" : initial.id ? "Save changes" : "Create deal"}
        </button>
      </div>
    </div>
  );
}

// ── Deal row ───────────────────────────────────────────────────────────────
function DealRow({ deal, onEdit, onPublish, onPause, onDelete, busy, labels }) {
  const isFeatured = deal.billboard_status === "active";
  return (
    <div className="operator-responsive-row" style={{
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
          {deal.is_promoted === true && (
            <span style={{
              background: "#dcfce7",
              color: "#166534",
              borderRadius: 999,
              padding: "2px 8px",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.2,
            }}>
              Menu Browser Ad
            </span>
          )}
          {deal.video_url ? (
            <span
              style={{
                background: "#dbeafe",
                color: "#1e40af",
                borderRadius: 999,
                padding: "2px 8px",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.2,
              }}
              data-testid="deal-row-feed-video-badge"
            >
              Feed video
            </span>
          ) : null}
          <span
            style={{
              background: "#f1f5f9",
              color: "#475569",
              borderRadius: 999,
              padding: "2px 8px",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.2,
            }}
            data-testid="deal-row-meal-periods"
          >
            {dealMealPeriodSummary(deal.meal_periods)}
          </span>
        </div>
      </div>

      <div className="operator-responsive-status" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
        <StatusBadge status={deal.status} t={labels.t} />
        <div className="operator-responsive-card-actions" style={{ display: "flex", gap: 6 }}>
          {deal.status === "draft" && (
            <button style={BTN("sm")} onClick={() => onPublish(deal)} disabled={busy}>
              {labels.publish}
            </button>
          )}
          {deal.status === "active" && (
            <button style={{ ...BTN("sm", { background: "#f59e0b", color: "#fff" }) }} onClick={() => onPause(deal)} disabled={busy}>
              {labels.pause}
            </button>
          )}
          {deal.status === "paused" && (
            <button style={BTN("sm")} onClick={() => onPublish(deal)} disabled={busy}>
              {labels.publish}
            </button>
          )}
          <button style={{ ...BTN("ghost"), fontSize: 12, padding: "4px 10px" }} onClick={() => onEdit(deal)} disabled={busy}>
            {labels.edit}
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
const FILTER_LABEL_KEYS = {
  all: "filterAll",
  active: "filterActive",
  draft: "filterDraft",
  paused: "filterPaused",
  expired: "filterExpired",
};

export default function OperatorDealsEditor() {
  const labels = useOperatorLabels();
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

  async function handleCreate(payload, billboardPayload, pendingPhotoFile, pendingVideoFile) {
    setBusy(true);
    try {
      const result = await api.createDeal(rid, payload);
      const dealId = result.deal?.id;
      if (pendingVideoFile && dealId) {
        try {
          await api.uploadDealMediaVideo(rid, dealId, pendingVideoFile);
        } catch (videoErr) {
          setError(`Deal created but Feed video could not be uploaded: ${videoErr.message}`);
        }
      }
      if (billboardPayload?.enabled && dealId) {
        let finalBbPayload = { ...billboardPayload };
        if (pendingPhotoFile) {
          try {
            const uploaded = await api.uploadBillboardPhoto(rid, result.deal.id, pendingPhotoFile);
            if (uploaded?.photo_url) finalBbPayload.image_url = uploaded.photo_url;
          } catch {
            // Non-fatal — billboard saves without photo
          }
        }
        try {
          await api.upsertDealBillboard(rid, result.deal.id, finalBbPayload);
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

  async function handleEditSave(payload, billboardPayload, pendingPhotoFile, pendingVideoFile) {
    setBusy(true);
    try {
      await api.updateDeal(rid, editingDeal.id, payload);

      if (pendingVideoFile) {
        try {
          await api.uploadDealMediaVideo(rid, editingDeal.id, pendingVideoFile);
        } catch (videoErr) {
          setError(`Deal saved but Feed video could not be uploaded: ${videoErr.message}`);
        }
      }

      if (billboardPayload?.enabled) {
        let finalBbPayload = { ...billboardPayload };
        if (pendingPhotoFile) {
          try {
            const uploaded = await api.uploadBillboardPhoto(rid, editingDeal.id, pendingPhotoFile);
            if (uploaded?.photo_url) finalBbPayload.image_url = uploaded.photo_url;
          } catch {
            // Non-fatal
          }
        }
        try {
          await api.upsertDealBillboard(rid, editingDeal.id, finalBbPayload);
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
      <OperatorLayout title={labels.t("operator.deals.title", "Deals")}>
        <p style={{ color: "#8a9ab0" }}>
          {labels.t("operator.selectRestaurantFirst", "Select a restaurant first.")}
        </p>
      </OperatorLayout>
    );
  }

  const STATUS_FILTERS = ["all", "active", "draft", "paused", "expired"];

  return (
    <OperatorLayout title={labels.t("operator.deals.title", "Deals")}>
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div className="operator-responsive-actions" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
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
              {labels[FILTER_LABEL_KEYS[s]] || s}
            </button>
          ))}
        </div>

        <button
          style={{ ...BTN("primary"), marginLeft: "auto" }}
          onClick={() => { setShowForm(v => !v); setEditingDeal(null); setEditingBillboard(null); }}
        >
          + {labels.newDeal}
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
          restaurantId={rid}
          onSave={handleCreate}
          onCancel={() => setShowForm(false)}
          busy={busy}
        />
      )}

      {/* Edit deal form */}
      {editingDeal && (
        <DealForm
          allItems={allItems}
          restaurantId={rid}
          initial={editingDeal}
          initialBillboard={editingBillboard}
          onSave={handleEditSave}
          onCancel={() => { setEditingDeal(null); setEditingBillboard(null); }}
          busy={busy}
        />
      )}

      {/* Deals list */}
      {loading ? (
        <p style={{ color: "#8a9ab0", fontSize: 13 }}>{labels.loading}</p>
      ) : deals.length === 0 ? (
        <div style={{
          background: "#fff", border: "1px solid #e4e9f0", borderRadius: 14,
          padding: "40px 32px", textAlign: "center",
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⊹</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f1720", marginBottom: 8 }}>
            {statusFilter === "all" ? labels.noDeals : `${labels.noDeals} (${labels.statusLabel(statusFilter)})`}
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
              labels={labels}
            />
          ))}
        </div>
      )}
    </OperatorLayout>
  );
}
