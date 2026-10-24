import React, { useCallback, useEffect, useMemo, useState } from "react";
import { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import DealMenuItemsPicker, { MAX_DEAL_MENU_ITEMS } from "./OwnerDealMenuItemsPicker.jsx";
import {
  createOwnerDeal,
  listOwnerDealMenuItems,
  listOwnerDeals,
  pauseOwnerDeal,
  publishOwnerDeal,
  removeOwnerDeal,
  updateOwnerDeal,
  uploadOwnerDealMediaVideo,
} from "../../lib/ownerApi.js";
import {
  DEAL_MEAL_PERIODS,
  dealMealPeriodSummary,
  formatMealTimeDealCaption,
  normalizeDealMealPeriodList,
} from "../../lib/dealMealPeriods.js";
import {
  videoDealTermsFromDeal,
  videoDealTermsProblem,
  videoDealTermsSummary,
} from "../../lib/videoDealTerms.js";
import { formatBytes, MAX_UPLOAD_VIDEO_BYTES } from "../../lib/consumerCameraCapture.js";

/**
 * Restaurant Manager → Deals (2026-10-24): structured deals for one restaurant, entered by the
 * platform owner (no subscription gate — same deals table as Operator → Deals). A video is
 * optional; when attached the deal also runs in Feed → Deals, so its written terms must be
 * complete first (videoDealTerms.js). Deals without a video publish with require_video: false.
 */

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: `1px solid ${OWNER_COLORS.line}`,
  fontSize: 14,
  boxSizing: "border-box",
};

const DEAL_TYPES = [
  { value: "percent_off", label: "% off" },
  { value: "amount_off", label: "$ off" },
  { value: "fixed_price", label: "Special price" },
  { value: "bogo", label: "Buy one, get one" },
  { value: "combo", label: "Combo" },
  { value: "other", label: "Other" },
];
const PRICED_TYPES = new Set(["percent_off", "amount_off", "fixed_price"]);

const STATUS_COLORS = {
  active: { bg: "#d1fae5", color: "#065f46", label: "Live" },
  draft: { bg: "#fef9c3", color: "#854d0e", label: "Draft" },
  paused: { bg: "#fef3c7", color: "#92400e", label: "Paused" },
  expired: { bg: "#f1f5f9", color: "#475569", label: "Expired" },
};

function ymd(value) {
  if (!value) return "";
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysYmd(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function displayStatus(deal) {
  if (deal.status === "active" && deal.expires_at && new Date(deal.expires_at) < new Date()) {
    return "expired";
  }
  return deal.status;
}

function dealValueFromRow(deal) {
  const v = videoDealTermsFromDeal(deal).value;
  return v == null ? "" : String(Number(v));
}

function dealTermsLabel(deal) {
  if (PRICED_TYPES.has(deal.deal_type)) {
    const summary = videoDealTermsSummary({ dealType: deal.deal_type, value: dealValueFromRow(deal) });
    if (summary) return summary;
  }
  return DEAL_TYPES.find((t) => t.value === deal.deal_type)?.label || deal.deal_type || "Deal";
}

function itemIdsFromDeal(deal) {
  return [deal.menu_item_id, ...(Array.isArray(deal.applies_to_menu_item_ids) ? deal.applies_to_menu_item_ids : [])]
    .filter((id) => id != null && id !== "")
    .map(String);
}

function emptyForm() {
  return {
    title: "",
    description: "",
    dealType: "percent_off",
    value: "",
    items: [],
    mealPeriods: [],
    showMealTimeCaption: true,
    startDate: todayYmd(),
    endDate: plusDaysYmd(30),
    videoUrl: "",
  };
}

function formFromDeal(deal, menuItems) {
  const byId = new Map(menuItems.map((i) => [String(i.id), i]));
  return {
    title: deal.title || "",
    description: deal.description || "",
    dealType: deal.deal_type || "other",
    value: dealValueFromRow(deal),
    items: itemIdsFromDeal(deal).map((id) => byId.get(id) || { id, name: `Item #${id}` }),
    mealPeriods: normalizeDealMealPeriodList(deal.meal_periods),
    showMealTimeCaption: deal.show_meal_time_caption !== false,
    startDate: ymd(deal.starts_at) || todayYmd(),
    endDate: ymd(deal.expires_at) || plusDaysYmd(30),
    videoUrl: deal.video_url || "",
  };
}

function StatusPill({ status }) {
  const s = STATUS_COLORS[status] || { bg: "#f1f5f9", color: "#475569", label: status };
  return (
    <span
      style={{ background: s.bg, color: s.color, borderRadius: 999, padding: "3px 9px", fontSize: 11, fontWeight: 700 }}
      data-testid="owner-deal-status"
    >
      {s.label}
    </span>
  );
}

function smallButton(variant = "ghost") {
  return {
    padding: "6px 12px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    border: variant === "danger" ? "1px solid #fecaca" : `1px solid ${OWNER_COLORS.line}`,
    background: variant === "primary" ? OWNER_COLORS.accent : "#fff",
    color: variant === "primary" ? "#fff" : variant === "danger" ? "#b91c1c" : OWNER_COLORS.ink,
  };
}

function DealForm({ restaurantId, deal, menu, menuLoading, onSaved, onCancel }) {
  const isNew = !deal;
  const [form, setForm] = useState(() => (deal ? formFromDeal(deal, menu.items) : emptyForm()));
  const [videoFile, setVideoFile] = useState(null);
  const [publishAfterSave, setPublishAfterSave] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const priced = PRICED_TYPES.has(form.dealType);
  const maxItems = form.dealType === "combo" ? 1 : MAX_DEAL_MENU_ITEMS;
  const termsProblem = videoDealTermsProblem({
    dealType: form.dealType,
    value: form.value,
    itemCount: form.items.length,
    startsAt: form.startDate,
    expiresAt: form.endDate,
  });
  const wantsVideo = Boolean(videoFile || form.videoUrl);
  const captionPreview =
    form.showMealTimeCaption && form.mealPeriods.length ? formatMealTimeDealCaption(form.mealPeriods) : null;

  function toggleMealPeriod(id) {
    const chosen = new Set(form.mealPeriods);
    if (chosen.has(id)) chosen.delete(id);
    else chosen.add(id);
    const next = DEAL_MEAL_PERIODS.map((p) => p.id).filter((pid) => chosen.has(pid));
    set({ mealPeriods: next, ...(next.length ? {} : { showMealTimeCaption: false }) });
  }

  function onTypeChange(dealType) {
    const nextMax = dealType === "combo" ? 1 : MAX_DEAL_MENU_ITEMS;
    set({ dealType, value: PRICED_TYPES.has(dealType) ? form.value : "", items: form.items.slice(0, nextMax) });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) return setError("Deal title is required.");
    if (!form.startDate || !form.endDate) return setError("Start and end dates are required.");
    if (form.endDate < form.startDate) return setError("End date must be on or after the start date.");
    if (priced) {
      const n = Number(form.value);
      if (!Number.isFinite(n) || n <= 0 || (form.dealType === "percent_off" && n > 100)) {
        return setError(form.dealType === "percent_off" ? "Enter a percent off between 1 and 100." : "Enter the deal amount.");
      }
    }
    if (wantsVideo && termsProblem) return setError(`Video deals: ${termsProblem}`);
    if (videoFile && Number(videoFile.size || 0) > MAX_UPLOAD_VIDEO_BYTES) {
      return setError(`Video is too large (${formatBytes(videoFile.size)}). Max is ${formatBytes(MAX_UPLOAD_VIDEO_BYTES)}.`);
    }

    const body = {
      title: form.title.trim(),
      description: form.description.trim(),
      deal_type: form.dealType,
      value: priced ? Number(form.value) : null,
      start_date: form.startDate,
      end_date: form.endDate,
      meal_periods: form.mealPeriods,
      show_meal_time_caption: form.showMealTimeCaption && form.mealPeriods.length > 0,
      menu_item_id: form.items.length ? Number(form.items[0].id) : null,
      applies_to_menu_item_ids: form.dealType === "combo" ? [] : form.items.slice(1).map((i) => Number(i.id)),
      linked_items_source: menu.source,
    };
    // Cleared video on an existing deal (the upload route only ever sets one).
    if (!isNew && deal.video_url && !form.videoUrl && !videoFile) body.video_url = null;

    setBusy(true);
    try {
      let saved;
      if (isNew) {
        const created = await createOwnerDeal(restaurantId, { ...body, publish: false });
        saved = created?.deal;
      } else {
        const updated = await updateOwnerDeal(restaurantId, deal.id, body);
        saved = updated?.deal;
      }
      if (!saved?.id) throw new Error("Deal was not saved");

      if (videoFile) {
        await uploadOwnerDealMediaVideo(restaurantId, saved.id, videoFile);
      }
      if (publishAfterSave && saved.status !== "active") {
        await publishOwnerDeal(restaurantId, saved.id, { require_video: false });
      }
      onSaved?.(
        publishAfterSave || saved.status === "active"
          ? `“${body.title}” is live.`
          : `“${body.title}” saved as a draft.`
      );
    } catch (err) {
      setError(err.message || "Unable to save deal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-testid="owner-deal-form">
      <PageCard style={{ padding: 18, marginBottom: 16 }}>
        <SectionTitle
          title={isNew ? "New deal" : `Edit deal`}
          subtitle="Written terms first. Add a video to also run it in Feed → Deals."
        />
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, maxWidth: 620 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Deal type *</span>
              <select
                value={form.dealType}
                onChange={(e) => onTypeChange(e.target.value)}
                style={inputStyle}
                disabled={busy}
                data-testid="owner-deal-form-type"
              >
                {DEAL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>
            {priced ? (
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>
                  {form.dealType === "percent_off" ? "Percent off *" : form.dealType === "amount_off" ? "Dollars off *" : "Special price ($) *"}
                </span>
                <input
                  type="number"
                  min="0"
                  step={form.dealType === "percent_off" ? "1" : "0.01"}
                  value={form.value}
                  onChange={(e) => set({ value: e.target.value })}
                  style={inputStyle}
                  disabled={busy}
                  data-testid="owner-deal-form-value"
                />
              </label>
            ) : null}
          </div>

          <DealMenuItemsPicker
            items={menu.items}
            selected={form.items}
            onChange={(items) => set({ items })}
            loading={menuLoading}
            disabled={busy}
            max={maxItems}
            title={form.dealType === "combo" ? "Combo item" : null}
            hint={
              form.dealType === "combo"
                ? "Pick the combo's menu item, or describe what's in it below."
                : null
            }
          />

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Deal title *</span>
            <input
              value={form.title}
              onChange={(e) => set({ title: e.target.value.slice(0, 200) })}
              placeholder="e.g. Taco Tuesday — 20% off tacos"
              style={inputStyle}
              disabled={busy}
              data-testid="owner-deal-form-title"
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Description</span>
            <textarea
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              rows={2}
              placeholder="Fine print, what's included, how to redeem"
              style={{ ...inputStyle, resize: "vertical" }}
              disabled={busy}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Starts *</span>
              <input
                type="date"
                value={form.startDate}
                max={form.endDate || undefined}
                onChange={(e) => set({ startDate: e.target.value })}
                style={inputStyle}
                disabled={busy}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Ends *</span>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(e) => set({ endDate: e.target.value })}
                style={inputStyle}
                disabled={busy}
              />
            </label>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Meal time</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {DEAL_MEAL_PERIODS.map((period) => {
                const active = form.mealPeriods.includes(period.id);
                return (
                  <button
                    key={period.id}
                    type="button"
                    disabled={busy}
                    onClick={() => toggleMealPeriod(period.id)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 999,
                      border: `1.5px solid ${active ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
                      background: active ? OWNER_COLORS.accentSoft : "#fff",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    {period.label}
                  </button>
                );
              })}
            </div>
            <span style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
              Leave none selected for all day. Meal time ranks the deal higher at that time; it never hides it.
            </span>
            {form.mealPeriods.length ? (
              <label style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <input
                  type="checkbox"
                  checked={form.showMealTimeCaption}
                  onChange={(e) => set({ showMealTimeCaption: e.target.checked })}
                  disabled={busy}
                  style={{ marginTop: 2 }}
                />
                <span style={{ fontSize: 13 }}>
                  Show meal time caption on the video
                  {captionPreview ? (
                    <span style={{ display: "block", marginTop: 2, fontWeight: 700, color: OWNER_COLORS.accent }}>
                      Preview: {captionPreview}
                    </span>
                  ) : null}
                </span>
              </label>
            ) : null}
          </div>

          <div
            style={{ display: "grid", gap: 8, padding: 12, borderRadius: 10, border: `1px dashed ${OWNER_COLORS.line}` }}
            data-testid="owner-deal-form-video"
          >
            <span style={{ fontWeight: 700, fontSize: 13 }}>Deal video (optional)</span>
            {termsProblem ? (
              <span style={{ fontSize: 12, color: wantsVideo ? "#b91c1c" : OWNER_COLORS.muted }} data-testid="owner-deal-form-video-terms-needed">
                To attach a video: {termsProblem}
              </span>
            ) : (
              <span style={{ fontSize: 12, color: OWNER_COLORS.accent }}>
                This video is for: {videoDealTermsSummary({
                  dealType: form.dealType,
                  value: form.value,
                  startsAt: form.startDate,
                  expiresAt: form.endDate,
                })}
              </span>
            )}
            {form.videoUrl && !videoFile ? (
              <div style={{ display: "grid", gap: 6 }}>
                <video
                  src={form.videoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  style={{ width: "100%", maxWidth: 280, borderRadius: 8, background: "#000" }}
                />
                <button
                  type="button"
                  onClick={() => set({ videoUrl: "" })}
                  disabled={busy}
                  style={{ ...smallButton("danger"), justifySelf: "start" }}
                  data-testid="owner-deal-form-video-remove"
                >
                  Remove video
                </button>
              </div>
            ) : null}
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
              disabled={busy || !priced}
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              data-testid="owner-deal-form-video-file"
            />
            {videoFile ? (
              <span style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
                {videoFile.name} ({formatBytes(videoFile.size)}) — uploads when you save
              </span>
            ) : null}
          </div>

          {!isNew && deal.status === "active" ? null : (
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={publishAfterSave}
                onChange={(e) => setPublishAfterSave(e.target.checked)}
                disabled={busy}
                data-testid="owner-deal-form-publish"
              />
              <span style={{ fontSize: 13 }}>Publish now (otherwise saved as a draft)</span>
            </label>
          )}

          {error ? <div style={{ color: "#b91c1c", fontSize: 13 }} data-testid="owner-deal-form-error">{error}</div> : null}

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              disabled={busy}
              style={{ ...smallButton("primary"), padding: "10px 18px", fontSize: 13, cursor: busy ? "wait" : "pointer" }}
              data-testid="owner-deal-form-save"
            >
              {busy ? (videoFile ? "Saving and uploading video…" : "Saving…") : isNew ? "Create deal" : "Save deal"}
            </button>
            <button type="button" onClick={onCancel} disabled={busy} style={{ ...smallButton(), padding: "10px 18px", fontSize: 13 }}>
              Cancel
            </button>
          </div>
        </form>
      </PageCard>
    </div>
  );
}

export default function OwnerRestaurantDealsPanel({ restaurantId, restaurantName = "", onRestaurantLoaded = null }) {
  const rid = Number(restaurantId) || null;
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [menu, setMenu] = useState({ source: "public", items: [] });
  const [menuLoading, setMenuLoading] = useState(false);
  const [editing, setEditing] = useState(null); // null | "new" | deal row
  const [rowBusy, setRowBusy] = useState(null);

  const loadDeals = useCallback(async () => {
    if (!rid) return;
    setLoading(true);
    setError("");
    try {
      const res = await listOwnerDeals(rid);
      setDeals(Array.isArray(res?.deals) ? res.deals : []);
      if (res?.restaurant) onRestaurantLoaded?.(res.restaurant);
    } catch (err) {
      setError(err.message || "Unable to load deals");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rid]);

  useEffect(() => {
    setEditing(null);
    setNotice("");
    setDeals([]);
    loadDeals();
  }, [loadDeals]);

  useEffect(() => {
    setMenu({ source: "public", items: [] });
    if (!rid) return undefined;
    let cancelled = false;
    setMenuLoading(true);
    listOwnerDealMenuItems(rid)
      .then((res) => {
        if (cancelled) return;
        setMenu({
          source: res?.source === "commonknowledge" ? "commonknowledge" : "public",
          items: Array.isArray(res?.items) ? res.items : [],
        });
      })
      .catch(() => {
        if (!cancelled) setMenu({ source: "public", items: [] });
      })
      .finally(() => {
        if (!cancelled) setMenuLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [rid]);

  const itemNames = useMemo(() => new Map(menu.items.map((i) => [String(i.id), i.name])), [menu.items]);

  async function runRowAction(deal, action) {
    if (action === "remove" && !window.confirm(`Remove “${deal.title}”? It comes off the restaurant's profile and Feed.`)) {
      return;
    }
    setRowBusy(deal.id);
    setError("");
    setNotice("");
    try {
      if (action === "publish") await publishOwnerDeal(rid, deal.id, { require_video: false });
      else if (action === "pause") await pauseOwnerDeal(rid, deal.id);
      else if (action === "remove") await removeOwnerDeal(rid, deal.id);
      setNotice(
        action === "publish" ? `“${deal.title}” is live.` : action === "pause" ? `“${deal.title}” paused.` : `“${deal.title}” removed.`
      );
      await loadDeals();
    } catch (err) {
      setError(err.message || "Action failed");
    } finally {
      setRowBusy(null);
    }
  }

  if (!rid) return null;

  return (
    <div data-testid="owner-restaurant-deals">
      {editing ? (
        <DealForm
          key={editing === "new" ? "new" : editing.id}
          restaurantId={rid}
          deal={editing === "new" ? null : editing}
          menu={menu}
          menuLoading={menuLoading}
          onCancel={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setNotice(message);
            loadDeals();
          }}
        />
      ) : null}

      <PageCard style={{ padding: 18, marginBottom: 16 }}>
        <SectionTitle
          title={restaurantName ? `Deals · ${restaurantName}` : "Deals"}
          subtitle="Live deals show on the restaurant's profile, in search, and on Deals. Deals with a video also run in Feed → Deals."
          action={
            editing ? null : (
              <button
                type="button"
                onClick={() => {
                  setNotice("");
                  setEditing("new");
                }}
                style={{ ...smallButton("primary"), padding: "9px 16px", fontSize: 13 }}
                data-testid="owner-deal-new"
              >
                + New deal
              </button>
            )
          }
        />

        {notice ? <div style={{ color: "#166534", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{notice}</div> : null}
        {error ? <div style={{ color: "#b91c1c", fontSize: 13, marginBottom: 10 }}>{error}</div> : null}

        {loading ? (
          <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}>Loading deals…</div>
        ) : !deals.length ? (
          <div style={{ fontSize: 13, color: OWNER_COLORS.muted }} data-testid="owner-deals-empty">
            No deals yet for this restaurant.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }} data-testid="owner-deals-list">
            {deals.map((deal) => {
              const status = displayStatus(deal);
              const items = itemIdsFromDeal(deal).map((id) => itemNames.get(id) || `Item #${id}`);
              const meal = dealMealPeriodSummary(deal.meal_periods);
              const busy = rowBusy === deal.id;
              return (
                <div
                  key={deal.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    padding: 12,
                    borderRadius: 10,
                    border: `1px solid ${OWNER_COLORS.line}`,
                    background: editing && editing !== "new" && editing.id === deal.id ? OWNER_COLORS.accentSoft : "#fff",
                  }}
                  data-testid="owner-deal-row"
                >
                  <div style={{ display: "grid", gap: 4, minWidth: 0, flex: "1 1 260px" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 14 }}>{deal.title}</strong>
                      <StatusPill status={status} />
                      {deal.video_url ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: OWNER_COLORS.accent }} data-testid="owner-deal-has-video">
                          ▶ Video
                        </span>
                      ) : null}
                    </div>
                    <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
                      {[dealTermsLabel(deal), `${ymd(deal.starts_at)} – ${ymd(deal.expires_at)}`, meal]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                    {items.length ? (
                      <div style={{ fontSize: 12, color: OWNER_COLORS.ink }}>Applies to: {items.join(", ")}</div>
                    ) : null}
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <button type="button" disabled={busy} onClick={() => setEditing(deal)} style={smallButton()}>
                      Edit
                    </button>
                    {deal.status === "draft" || deal.status === "paused" ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => runRowAction(deal, "publish")}
                        style={smallButton("primary")}
                        data-testid="owner-deal-publish"
                      >
                        Publish
                      </button>
                    ) : null}
                    {deal.status === "active" ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => runRowAction(deal, "pause")}
                        style={smallButton()}
                        data-testid="owner-deal-pause"
                      >
                        Pause
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => runRowAction(deal, "remove")}
                      style={smallButton("danger")}
                      data-testid="owner-deal-remove"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageCard>
    </div>
  );
}
