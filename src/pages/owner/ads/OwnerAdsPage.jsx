import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import OwnerLayout, { EmptyState, PageCard, SectionTitle, OWNER_COLORS } from "../OwnerLayout.jsx";
import { clusterPath } from "../../../lib/clusterUrl.js";
import {
  createOwnerAd,
  deleteOwnerAd,
  getOwnerClusterAdSlots,
  listOwnerAdClusters,
  listOwnerAdRestaurantDeals,
  provisionAllOwnerClusterAdSlots,
  provisionOwnerClusterAdSlots,
  searchOwnerAdRestaurants,
  updateOwnerAd,
  updateOwnerAdSlot,
  uploadOwnerAdImage,
} from "../../../lib/venueApi.js";

/**
 * Owner > Ads — manage the ad slots on every cluster.
 * Menuply house slots (no venue) and venue-owned slots side by side.
 * Backend: /api/owner/ads (src/routes/ownerAds.js).
 */

const REGION_PLACEMENT = {
  cluster_landing_hero: "Top of the Food page",
  cluster_landing_footer: "Below the food category chips",
  cluster_search_top: "Inside a food category's dish list",
  cluster_deals_top: "Inside the Drinks dish list",
  cluster_search_inline: "Inside food search results",
  cluster_events_top: "Middle of the Restaurants directory",
  cluster_restaurant_footer: "Bottom of the Restaurants directory",
  cluster_restaurant_header: "Not shown on the cluster page yet",
};

const ADVERTISER_LABELS = {
  house: "Menuply",
  restaurant: "Restaurant",
  deal: "Deal",
  external: "Other advertiser",
};

const STATUS_STYLES = {
  live: { label: "Live", bg: "#dcfce7", fg: "#166534" },
  scheduled: { label: "Scheduled", bg: "#dbeafe", fg: "#1e40af" },
  expired: { label: "Ended", bg: "#f3f4f6", fg: "#4b5563" },
  paused: { label: "Paused", bg: "#fef3c7", fg: "#92400e" },
};

const PAYMENT_LABELS = {
  not_required: "Not required",
  pending: "Pending",
  paid: "Paid",
  comped: "Comped",
  refunded: "Refunded",
};

const inputStyle = {
  display: "block",
  width: "100%",
  marginTop: 4,
  padding: 8,
  borderRadius: 8,
  border: `1px solid ${OWNER_COLORS.line}`,
  boxSizing: "border-box",
  font: "inherit",
};

const labelStyle = { fontSize: 13, color: OWNER_COLORS.ink, fontWeight: 600 };

function buttonStyle(kind = "secondary") {
  if (kind === "primary") {
    return {
      border: "none",
      background: OWNER_COLORS.accent,
      color: "#fff",
      borderRadius: 10,
      padding: "9px 14px",
      fontWeight: 700,
      cursor: "pointer",
    };
  }
  if (kind === "danger") {
    return {
      border: "1px solid #fecaca",
      background: "#fff",
      color: "#b91c1c",
      borderRadius: 10,
      padding: "7px 12px",
      fontWeight: 600,
      cursor: "pointer",
    };
  }
  return {
    border: `1px solid ${OWNER_COLORS.line}`,
    background: "#fff",
    color: OWNER_COLORS.ink,
    borderRadius: 10,
    padding: "7px 12px",
    fontWeight: 600,
    cursor: "pointer",
  };
}

function formatDate(value) {
  if (!value) return null;
  const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return String(value);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function displayWindow(ad) {
  const start = formatDate(ad.start_date);
  const end = formatDate(ad.end_date);
  if (!start && !end) return "Always on";
  if (start && end) return `${start} – ${end}`;
  if (start) return `From ${start}`;
  return `Until ${end}`;
}

function advertiserSummary(ad) {
  if (ad.advertiser_type === "restaurant") return ad.linked_restaurant_name || ad.advertiser_name || "Restaurant";
  if (ad.advertiser_type === "deal") {
    const deal = ad.linked_deal_title || "Deal";
    const who = ad.linked_restaurant_name || ad.advertiser_name;
    return who ? `${deal} · ${who}` : deal;
  }
  if (ad.advertiser_type === "external") return ad.advertiser_name || "Other advertiser";
  return "Menuply";
}

function StatusPill({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.paused;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: s.bg,
        color: s.fg,
      }}
    >
      {s.label}
    </span>
  );
}

export default function OwnerAdsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("cluster");
  const [clusters, setClusters] = useState([]);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const reloadClusters = useCallback(async () => {
    const data = await listOwnerAdClusters();
    setClusters(data.clusters || []);
    return data.clusters || [];
  }, []);

  const reloadDetail = useCallback(async (clusterId) => {
    if (!clusterId) {
      setDetail(null);
      return;
    }
    const data = await getOwnerClusterAdSlots(clusterId);
    setDetail(data);
  }, []);

  useEffect(() => {
    reloadClusters()
      .then((rows) => {
        if (!selectedId && rows[0]) {
          setSearchParams({ cluster: String(rows[0].id) }, { replace: true });
        }
      })
      .catch((err) => setError(err.message || "Failed to load clusters"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setError("");
    reloadDetail(selectedId).catch((err) => setError(err.message || "Failed to load ad slots"));
  }, [selectedId, reloadDetail]);

  async function refreshAll() {
    await Promise.all([reloadClusters(), reloadDetail(selectedId)]);
  }

  async function run(work, successMessage) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await work();
      await refreshAll();
      if (successMessage) setNotice(typeof successMessage === "function" ? successMessage(result) : successMessage);
      return result;
    } catch (err) {
      setError(err.message || "Something went wrong");
      return null;
    } finally {
      setBusy(false);
    }
  }

  const clustersMissingSlots = clusters.filter((c) => c.active_slots < c.max_active_slots);

  return (
    <OwnerLayout
      title="Ads"
      actions={
        clustersMissingSlots.length ? (
          <button
            type="button"
            disabled={busy}
            style={buttonStyle("primary")}
            onClick={() =>
              run(
                () => provisionAllOwnerClusterAdSlots(),
                (r) => `Created ${r?.created || 0} ad slot${r?.created === 1 ? "" : "s"} across all clusters.`
              )
            }
          >
            Set up standard slots on all clusters
          </button>
        ) : null
      }
    >
      <div style={{ display: "grid", gap: 20 }}>
        {error ? (
          <div role="alert" style={{ color: "#b91c1c", fontWeight: 600 }}>
            {error}
          </div>
        ) : null}
        {notice ? <div style={{ color: "#166534", fontWeight: 600 }}>{notice}</div> : null}

        <PageCard style={{ padding: 20 }}>
          <SectionTitle
            title="Cluster ad spaces"
            subtitle="Each cluster has up to 6 ad slots, sized like L.A. Live. Slots without a venue belong to Menuply."
          />
          {clusters.length === 0 ? (
            <EmptyState>No clusters found.</EmptyState>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ textAlign: "left", color: OWNER_COLORS.muted, fontSize: 12 }}>
                    <th style={{ padding: "8px 6px" }}>Cluster</th>
                    <th style={{ padding: "8px 6px" }}>Owner</th>
                    <th style={{ padding: "8px 6px" }}>Active slots</th>
                    <th style={{ padding: "8px 6px" }}>Active ads</th>
                  </tr>
                </thead>
                <tbody>
                  {clusters.map((c) => {
                    const selected = String(c.id) === String(selectedId);
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSearchParams({ cluster: String(c.id) })}
                        style={{
                          cursor: "pointer",
                          borderTop: `1px solid ${OWNER_COLORS.line}`,
                          background: selected ? OWNER_COLORS.accentSoft : "transparent",
                        }}
                      >
                        <td style={{ padding: "10px 6px", fontWeight: 600 }}>
                          {c.name}
                          <div style={{ fontSize: 12, color: OWNER_COLORS.muted, fontWeight: 400 }}>
                            {[c.city, c.state].filter(Boolean).join(", ")}
                          </div>
                        </td>
                        <td style={{ padding: "10px 6px" }}>{c.venue_name || "Menuply"}</td>
                        <td style={{ padding: "10px 6px" }}>
                          {c.active_slots} / {c.max_active_slots}
                          {c.active_slots > c.max_active_slots ? (
                            <span style={{ color: OWNER_COLORS.muted, fontSize: 12 }}> (legacy)</span>
                          ) : null}
                        </td>
                        <td style={{ padding: "10px 6px" }}>{c.active_ads}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </PageCard>

        {detail ? (
          <ClusterSlotsPanel detail={detail} busy={busy} run={run} />
        ) : selectedId ? (
          <EmptyState>Loading ad slots…</EmptyState>
        ) : null}
      </div>
    </OwnerLayout>
  );
}

function ClusterSlotsPanel({ detail, busy, run }) {
  const { cluster, slots, missing_standard_slots: missing = [], active_slots, max_active_slots } = detail;
  const publicPath = clusterPath(cluster);

  return (
    <PageCard style={{ padding: 20 }}>
      <SectionTitle
        title={cluster.name}
        subtitle={`${active_slots} of ${max_active_slots} slots active · owned by ${cluster.venue_name || "Menuply"} · dates follow ${cluster.state || "UTC"} local time`}
        action={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {publicPath ? (
              <a href={publicPath} target="_blank" rel="noopener noreferrer" style={buttonStyle()}>
                View cluster
              </a>
            ) : null}
            {missing.length && active_slots < max_active_slots ? (
              <button
                type="button"
                disabled={busy}
                style={buttonStyle("primary")}
                onClick={() =>
                  run(
                    () => provisionOwnerClusterAdSlots(cluster.id),
                    (r) => `Added ${r?.created?.length || 0} slot(s) with the Menuply banner.`
                  )
                }
              >
                Add missing standard slots ({missing.length})
              </button>
            ) : null}
          </div>
        }
      />
      {slots.length === 0 ? (
        <EmptyState>This cluster has no ad slots yet. Use “Add missing standard slots”.</EmptyState>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {slots.map((slot) => (
            <SlotCard key={slot.id} slot={slot} busy={busy} run={run} />
          ))}
        </div>
      )}
    </PageCard>
  );
}

function SlotCard({ slot, busy, run }) {
  const [editingAd, setEditingAd] = useState(null); // null | "new" | ad
  const [showPricing, setShowPricing] = useState(false);
  const placement = REGION_PLACEMENT[slot.page_region] || slot.page_region;
  const size = slot.width && slot.height ? `${slot.width}×${slot.height}` : "Flexible size";

  return (
    <div
      data-testid="owner-ad-slot"
      style={{
        border: `1px solid ${OWNER_COLORS.line}`,
        borderRadius: 14,
        background: "#fff",
        padding: 16,
        opacity: slot.active ? 1 : 0.7,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 700, color: OWNER_COLORS.ink }}>
            {slot.slot_number ? `Slot ${slot.slot_number} · ` : ""}
            {slot.name}
          </div>
          <div style={{ fontSize: 13, color: OWNER_COLORS.muted, marginTop: 4 }}>
            {placement} · {slot.inventory_type} · {size} · {slot.owner === "venue" ? slot.venue_name || "Venue" : "Menuply"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13, fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={slot.active}
              disabled={busy}
              onChange={(e) =>
                run(
                  () => updateOwnerAdSlot(slot.id, { active: e.target.checked }),
                  e.target.checked ? "Slot turned on." : "Slot turned off."
                )
              }
            />
            Slot on
          </label>
          <button type="button" style={buttonStyle()} onClick={() => setShowPricing((v) => !v)}>
            Pricing
          </button>
          <button type="button" style={buttonStyle()} disabled={busy} onClick={() => setEditingAd("new")}>
            Add ad
          </button>
        </div>
      </div>

      {showPricing ? <SlotPricingForm slot={slot} busy={busy} run={run} onDone={() => setShowPricing(false)} /> : null}

      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        {slot.advertisements.length === 0 ? (
          <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}>No ads in this slot. Nothing shows here.</div>
        ) : (
          slot.advertisements.map((ad) => (
            <div
              key={ad.id}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(96px, 160px) 1fr auto",
                gap: 12,
                alignItems: "center",
                padding: 10,
                border: `1px solid ${OWNER_COLORS.line}`,
                borderRadius: 10,
              }}
            >
              <img
                src={ad.image_url}
                alt=""
                style={{ width: "100%", maxHeight: 90, objectFit: "cover", borderRadius: 6, background: "#f3f4f6" }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700 }}>{ad.name}</span>
                  <StatusPill status={ad.status} />
                </div>
                <div style={{ fontSize: 13, color: OWNER_COLORS.muted, marginTop: 4 }}>
                  {ADVERTISER_LABELS[ad.advertiser_type] || "Menuply"}: {advertiserSummary(ad)} · {displayWindow(ad)} ·
                  priority {ad.priority}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: OWNER_COLORS.muted,
                    marginTop: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  Clicks go to {ad.resolved_destination_url || "nowhere (no link)"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button type="button" style={buttonStyle()} disabled={busy} onClick={() => setEditingAd(ad)}>
                  Edit
                </button>
                <button
                  type="button"
                  style={buttonStyle()}
                  disabled={busy}
                  onClick={() =>
                    run(() => updateOwnerAd(ad.id, { active: !ad.active }), ad.active ? "Ad paused." : "Ad turned on.")
                  }
                >
                  {ad.active ? "Pause" : "Turn on"}
                </button>
                <button
                  type="button"
                  style={buttonStyle("danger")}
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(`Delete “${ad.name}”? This can't be undone.`)) {
                      run(() => deleteOwnerAd(ad.id), "Ad deleted.");
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {editingAd ? (
        <AdEditor
          slot={slot}
          ad={editingAd === "new" ? null : editingAd}
          busy={busy}
          onCancel={() => setEditingAd(null)}
          onSave={async (body) => {
            const result = await run(
              () => (editingAd === "new" ? createOwnerAd({ ...body, inventory_id: slot.id }) : updateOwnerAd(editingAd.id, body)),
              editingAd === "new" ? "Ad created." : "Ad saved."
            );
            if (result) setEditingAd(null);
          }}
        />
      ) : null}
    </div>
  );
}

function SlotPricingForm({ slot, busy, run, onDone }) {
  const [price, setPrice] = useState(slot.price_cents != null ? (slot.price_cents / 100).toFixed(2) : "");
  const [period, setPeriod] = useState(slot.billing_period || "");
  const [purchasable, setPurchasable] = useState(Boolean(slot.purchasable));

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const cents = price === "" ? null : Math.round(Number(price) * 100);
        const result = await run(
          () => updateOwnerAdSlot(slot.id, { price_cents: cents, billing_period: period || null, purchasable }),
          "Pricing saved."
        );
        if (result) onDone();
      }}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 12,
        alignItems: "end",
        marginTop: 12,
        padding: 12,
        borderRadius: 10,
        background: OWNER_COLORS.page,
      }}
    >
      <div style={{ gridColumn: "1 / -1", fontSize: 12, color: OWNER_COLORS.muted }}>
        For future paid ads. Advertisers can't buy slots yet; these values are only stored.
      </div>
      <label style={labelStyle}>
        Price (USD)
        <input
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={inputStyle}
        />
      </label>
      <label style={labelStyle}>
        Per
        <select value={period} onChange={(e) => setPeriod(e.target.value)} style={inputStyle}>
          <option value="">—</option>
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
      </label>
      <label style={{ ...labelStyle, display: "flex", gap: 6, alignItems: "center" }}>
        <input type="checkbox" checked={purchasable} onChange={(e) => setPurchasable(e.target.checked)} />
        Open for purchase
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" style={buttonStyle("primary")} disabled={busy}>
          Save pricing
        </button>
        <button type="button" style={buttonStyle()} onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function emptyAdForm(slot) {
  return {
    name: "",
    image_url: "",
    mobile_image_url: "",
    advertiser_type: "house",
    restaurant_id: null,
    restaurant_label: "",
    deal_id: null,
    advertiser_name: "",
    destination_url: "",
    start_date: "",
    end_date: "",
    priority: 0,
    active: true,
    payment_status: "not_required",
    inventory_name: slot.name,
  };
}

function formFromAd(ad, slot) {
  return {
    ...emptyAdForm(slot),
    name: ad.name || "",
    image_url: ad.image_url || "",
    mobile_image_url: ad.mobile_image_url || "",
    advertiser_type: ad.advertiser_type || "house",
    restaurant_id: ad.restaurant_id ?? null,
    restaurant_label: ad.linked_restaurant_name || ad.advertiser_name || "",
    deal_id: ad.deal_id ?? null,
    advertiser_name: ad.advertiser_type === "external" ? ad.advertiser_name || "" : "",
    destination_url: ad.destination_url || "",
    start_date: ad.start_date || "",
    end_date: ad.end_date || "",
    priority: ad.priority ?? 0,
    active: ad.active !== false,
    payment_status: ad.payment_status || "not_required",
  };
}

function AdEditor({ slot, ad, busy, onCancel, onSave }) {
  const [form, setForm] = useState(() => (ad ? formFromAd(ad, slot) : emptyAdForm(slot)));
  const [uploading, setUploading] = useState("");
  const [localError, setLocalError] = useState("");
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  async function handleUpload(field, file) {
    if (!file) return;
    setUploading(field);
    setLocalError("");
    try {
      const result = await uploadOwnerAdImage(file);
      set({ [field]: result.photo_url });
    } catch (err) {
      setLocalError(err.message || "Upload failed");
    } finally {
      setUploading("");
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setLocalError("");
    if (!form.image_url) {
      setLocalError("Upload a banner image first.");
      return;
    }
    if (form.advertiser_type === "restaurant" && !form.restaurant_id) {
      setLocalError("Choose the restaurant this ad is for.");
      return;
    }
    if (form.advertiser_type === "deal" && !form.deal_id) {
      setLocalError("Choose the deal this ad is for.");
      return;
    }
    onSave({
      name: form.name,
      image_url: form.image_url,
      mobile_image_url: form.mobile_image_url || null,
      advertiser_type: form.advertiser_type,
      restaurant_id: form.restaurant_id,
      deal_id: form.deal_id,
      advertiser_name: form.advertiser_type === "external" ? form.advertiser_name : null,
      destination_url: form.destination_url || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      priority: Number(form.priority) || 0,
      active: form.active,
      payment_status: form.payment_status,
    });
  }

  const sizeHint = slot.width && slot.height ? `Best at ${slot.width}×${slot.height}px.` : "";
  const autoLink =
    form.advertiser_type === "deal" && form.deal_id
      ? `/deals/${form.deal_id}`
      : form.advertiser_type === "restaurant" && form.restaurant_id
        ? `/restaurants/${form.restaurant_id}`
        : null;

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="owner-ad-editor"
      style={{
        display: "grid",
        gap: 14,
        marginTop: 14,
        padding: 16,
        borderRadius: 12,
        border: `1px solid ${OWNER_COLORS.line}`,
        background: OWNER_COLORS.page,
      }}
    >
      <div style={{ fontWeight: 700 }}>{ad ? `Edit “${ad.name}”` : `New ad in ${slot.name}`}</div>

      <label style={labelStyle}>
        Ad name
        <input required value={form.name} onChange={(e) => set({ name: e.target.value })} style={inputStyle} />
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        <ImageField
          label="Banner image"
          hint={sizeHint}
          url={form.image_url}
          uploading={uploading === "image_url"}
          onFile={(file) => handleUpload("image_url", file)}
          onClear={() => set({ image_url: "" })}
        />
        <ImageField
          label="Mobile image (optional)"
          hint="Used on phones if provided."
          url={form.mobile_image_url}
          uploading={uploading === "mobile_image_url"}
          onFile={(file) => handleUpload("mobile_image_url", file)}
          onClear={() => set({ mobile_image_url: "" })}
        />
      </div>

      <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
        <legend style={{ ...labelStyle, marginBottom: 6 }}>Who is this ad for?</legend>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 14 }}>
          {Object.entries(ADVERTISER_LABELS).map(([value, label]) => (
            <label key={value} style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                type="radio"
                name={`advertiser-type-${slot.id}`}
                value={value}
                checked={form.advertiser_type === value}
                onChange={() => set({ advertiser_type: value, deal_id: value === "deal" ? form.deal_id : null })}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {form.advertiser_type === "restaurant" || form.advertiser_type === "deal" ? (
        <RestaurantPicker
          selectedId={form.restaurant_id}
          selectedLabel={form.restaurant_label}
          onSelect={(r) => set({ restaurant_id: r?.id ?? null, restaurant_label: r?.restaurant_name || "", deal_id: null })}
        />
      ) : null}

      {form.advertiser_type === "deal" && form.restaurant_id ? (
        <DealPicker restaurantId={form.restaurant_id} value={form.deal_id} onChange={(dealId) => set({ deal_id: dealId })} />
      ) : null}

      {form.advertiser_type === "external" ? (
        <label style={labelStyle}>
          Advertiser name
          <input
            required
            value={form.advertiser_name}
            onChange={(e) => set({ advertiser_name: e.target.value })}
            style={inputStyle}
          />
        </label>
      ) : null}

      <label style={labelStyle}>
        Link {form.advertiser_type === "external" ? "(required)" : "(optional)"}
        <input
          value={form.destination_url}
          required={form.advertiser_type === "external"}
          placeholder={autoLink ? `Leave blank to use ${autoLink}` : "https://…"}
          onChange={(e) => set({ destination_url: e.target.value })}
          style={inputStyle}
        />
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        <label style={labelStyle}>
          Start date
          <input type="date" value={form.start_date} onChange={(e) => set({ start_date: e.target.value })} style={inputStyle} />
        </label>
        <label style={labelStyle}>
          End date
          <input
            type="date"
            value={form.end_date}
            min={form.start_date || undefined}
            onChange={(e) => set({ end_date: e.target.value })}
            style={inputStyle}
          />
        </label>
        <label style={labelStyle}>
          Priority
          <input
            type="number"
            step="1"
            value={form.priority}
            onChange={(e) => set({ priority: e.target.value })}
            style={inputStyle}
          />
        </label>
        <label style={labelStyle}>
          Payment
          <select value={form.payment_status} onChange={(e) => set({ payment_status: e.target.value })} style={inputStyle}>
            {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
        Leave dates blank to run with no end. The highest-priority live ad shows; ties rotate.
      </div>

      <label style={{ ...labelStyle, display: "flex", gap: 6, alignItems: "center" }}>
        <input type="checkbox" checked={form.active} onChange={(e) => set({ active: e.target.checked })} />
        Ad is on
      </label>

      {localError ? <div style={{ color: "#b91c1c", fontWeight: 600 }}>{localError}</div> : null}

      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" style={buttonStyle("primary")} disabled={busy || Boolean(uploading)}>
          {ad ? "Save ad" : "Create ad"}
        </button>
        <button type="button" style={buttonStyle()} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function ImageField({ label, hint, url, uploading, onFile, onClear }) {
  return (
    <div style={labelStyle}>
      {label}
      <div
        style={{
          marginTop: 4,
          padding: 10,
          borderRadius: 10,
          border: `1px dashed ${OWNER_COLORS.line}`,
          background: "#fff",
          display: "grid",
          gap: 8,
        }}
      >
        {url ? (
          <img src={url} alt="" style={{ width: "100%", maxHeight: 160, objectFit: "contain", background: "#f3f4f6" }} />
        ) : null}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            onChange={(e) => onFile(e.target.files?.[0])}
            style={{ fontWeight: 400 }}
          />
          {url ? (
            <button type="button" style={buttonStyle()} onClick={onClear}>
              Remove
            </button>
          ) : null}
        </div>
        <div style={{ fontSize: 12, color: OWNER_COLORS.muted, fontWeight: 400 }}>
          {uploading ? "Uploading…" : hint}
        </div>
      </div>
    </div>
  );
}

function RestaurantPicker({ selectedId, selectedLabel, onSelect }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return undefined;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(() => {
      searchOwnerAdRestaurants(term)
        .then((data) => {
          if (!cancelled) setResults(data.restaurants || []);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  if (selectedId) {
    return (
      <div style={{ ...labelStyle, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        Restaurant: <span style={{ fontWeight: 400 }}>{selectedLabel || `#${selectedId}`}</span>
        <button type="button" style={buttonStyle()} onClick={() => onSelect(null)}>
          Change
        </button>
      </div>
    );
  }

  return (
    <label style={labelStyle}>
      Restaurant
      <input
        value={q}
        placeholder="Search restaurants by name"
        onChange={(e) => setQ(e.target.value)}
        style={inputStyle}
      />
      {searching ? <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 4 }}>Searching…</div> : null}
      {results.length ? (
        <div
          style={{
            marginTop: 6,
            border: `1px solid ${OWNER_COLORS.line}`,
            borderRadius: 8,
            background: "#fff",
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect(r)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 10px",
                border: "none",
                borderBottom: `1px solid ${OWNER_COLORS.line}`,
                background: "transparent",
                cursor: "pointer",
                font: "inherit",
                fontWeight: 400,
              }}
            >
              {r.restaurant_name}
              <span style={{ color: OWNER_COLORS.muted }}> · {[r.city, r.state].filter(Boolean).join(", ")}</span>
            </button>
          ))}
        </div>
      ) : null}
    </label>
  );
}

function DealPicker({ restaurantId, value, onChange }) {
  const [deals, setDeals] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setDeals(null);
    listOwnerAdRestaurantDeals(restaurantId)
      .then((data) => {
        if (!cancelled) setDeals(data.deals || []);
      })
      .catch(() => {
        if (!cancelled) setDeals([]);
      });
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  const options = useMemo(() => deals || [], [deals]);

  if (deals === null) return <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}>Loading deals…</div>;
  if (!options.length) {
    return <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}>This restaurant has no active or paused deals.</div>;
  }
  return (
    <label style={labelStyle}>
      Deal
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        style={inputStyle}
      >
        <option value="">Choose a deal</option>
        {options.map((d) => (
          <option key={d.id} value={d.id}>
            {d.title} {d.status !== "active" ? `(${d.status})` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
