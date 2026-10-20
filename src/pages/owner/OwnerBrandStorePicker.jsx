import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { inputStyle } from "./ownerMenuEditorComponents.jsx";
import {
  addMenuConsoleRestaurantToCluster,
  listMenuConsoleAvailableClusters,
  listMenuConsoleChainStores,
} from "../../lib/ownerApi.js";

/** Farther than this from the cluster center, a store is probably not "in" it. */
const NEAR_CLUSTER_MILES = 3;

/** True when the open restaurant is a chain's brand record (HQ row), not a store. */
export function isBrandRecord(restaurant) {
  if (!restaurant) return false;
  return restaurant.business_type?.is_brand_record === true || restaurant.is_canonical_parent === true;
}

function storeAddress(s) {
  const cityLine = [s.city, [s.state, s.postal_code].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return [s.address_line1, cityLine].filter(Boolean).join(" · ") || "No address on file";
}

const smallBtn = {
  padding: "6px 10px",
  borderRadius: 8,
  border: `1px solid ${OWNER_COLORS.line}`,
  background: "#fff",
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

/**
 * Brand record → its stores. Owner search shows a chain as one brand row, so this is where
 * an owner picks the one location to put in a cluster (or to open and edit).
 */
export default function OwnerBrandStorePicker({ restaurant, onOpenStore }) {
  const chainName = restaurant?.business_type?.chain?.name
    || String(restaurant?.restaurant_name || restaurant?.name || "This brand").replace(/\s*\(.*\)\s*$/, "");
  const [clusters, setClusters] = useState([]);
  const [clusterId, setClusterId] = useState("");
  const [q, setQ] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let cancelled = false;
    listMenuConsoleAvailableClusters({ limit: 500 })
      .then((d) => { if (!cancelled) setClusters(d?.clusters || []); })
      .catch(() => { if (!cancelled) setClusters([]); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!restaurant?.id) return undefined;
    let cancelled = false;
    const t = window.setTimeout(() => {
      setLoading(true);
      setErr("");
      listMenuConsoleChainStores(restaurant.id, { q: q.trim(), cluster_id: clusterId || undefined })
        .then((d) => { if (!cancelled) setData(d); })
        .catch((e) => { if (!cancelled) setErr(e?.payload?.error || e?.message || "Could not load stores."); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 250);
    return () => { cancelled = true; window.clearTimeout(t); };
  }, [restaurant?.id, q, clusterId]);

  async function addToCluster(store) {
    if (!clusterId) return;
    setBusyId(store.id);
    setNotice(null);
    try {
      await addMenuConsoleRestaurantToCluster(store.id, clusterId);
      setData((prev) => prev && {
        ...prev,
        stores: prev.stores.map((s) => (s.id === store.id ? { ...s, in_cluster: true } : s)),
      });
      setNotice({ ok: true, text: `Added ${store.address_line1 || `store #${store.id}`} to ${data?.cluster?.name || "the cluster"}. Open the store to set its position on the cluster page.` });
    } catch (e) {
      setNotice({ ok: false, text: e?.payload?.error || e?.message || "Could not add to cluster." });
    } finally {
      setBusyId(null);
    }
  }

  const stores = data?.stores || [];
  const cluster = data?.cluster || null;
  const nearest = stores[0]?.distance_miles;
  const noneNearby = Boolean(clusterId && cluster?.lat != null && !q.trim()
    && !loading && (stores.length === 0 || nearest == null || nearest > NEAR_CLUSTER_MILES));

  return (
    <PageCard style={{ padding: 20, marginBottom: 16 }} id="owner-brand-store-picker">
      <SectionTitle
        title={`${chainName} locations${data ? ` — ${data.total} store${data.total === 1 ? "" : "s"}` : ""}`}
        subtitle="You opened the brand record (HQ), which isn't a store. Clusters, hours and prices belong to a store: pick a cluster to see the nearest stores, or search by street, city or ZIP."
      />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 10, marginTop: 12 }}>
        <select
          value={clusterId}
          onChange={(e) => { setClusterId(e.target.value); setNotice(null); }}
          style={inputStyle}
          aria-label="Cluster"
          data-testid="owner-brand-store-cluster"
        >
          <option value="">Add a store to a cluster… (optional)</option>
          {clusters.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}{c.city ? ` · ${c.city}${c.state ? `, ${c.state}` : ""}` : ""}
            </option>
          ))}
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Street, city or ZIP (e.g. Figueroa, 90007)"
          style={inputStyle}
          aria-label="Search stores"
          data-testid="owner-brand-store-search"
        />
      </div>

      {notice ? (
        <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: notice.ok ? "#166534" : "#991b1b" }}>
          {notice.text}
        </div>
      ) : null}
      {err ? <div style={{ marginTop: 10, fontSize: 13, color: "#991b1b" }}>{err}</div> : null}

      {noneNearby ? (
        <div
          data-testid="owner-brand-store-none-nearby"
          style={{ marginTop: 12, padding: 12, borderRadius: 8, background: "#fffbeb", border: "1px solid #fde68a", fontSize: 13 }}
        >
          No {chainName} store within {NEAR_CLUSTER_MILES} miles of {cluster?.name || "this cluster"}
          {nearest != null ? ` (nearest is ${nearest} mi away)` : ""}. Add the location first with{" "}
          <Link to="/owner/bots/franchise-bot" style={{ color: OWNER_COLORS.accent, fontWeight: 700 }}>Franchise Bot</Link>
          {" "}(paste its address), then come back here and add it to the cluster.
        </div>
      ) : null}

      <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
        {loading && !stores.length ? <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}>Loading stores…</div> : null}
        {!loading && data && !stores.length && !noneNearby ? (
          <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}>No stores match.</div>
        ) : null}
        {stores.map((s) => (
          <div
            key={s.id}
            data-testid="owner-brand-store-row"
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap",
              padding: "8px 10px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{storeAddress(s)}</div>
              <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
                #{s.id}
                {s.distance_miles != null ? ` · ${s.distance_miles} mi from ${cluster?.name}` : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {clusterId ? (
                s.in_cluster ? (
                  <span style={{ ...smallBtn, cursor: "default", color: "#166534", borderColor: "#bbf7d0", background: "#f0fdf4" }}>
                    ✓ In {cluster?.name}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => addToCluster(s)}
                    disabled={busyId === s.id}
                    style={{ ...smallBtn, background: OWNER_COLORS.accent, borderColor: OWNER_COLORS.accent, color: "#fff" }}
                    data-testid="owner-brand-store-add"
                  >
                    {busyId === s.id ? "Adding…" : `Add to ${cluster?.name || "cluster"}`}
                  </button>
                )
              ) : null}
              <button type="button" onClick={() => onOpenStore?.(s)} style={{ ...smallBtn, color: OWNER_COLORS.muted }}>
                Open store
              </button>
            </div>
          </div>
        ))}
        {data && data.total > stores.length ? (
          <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
            Showing {stores.length} of {data.total}. {clusterId ? "Nearest first. " : ""}Type a street, city or ZIP to narrow.
          </div>
        ) : null}
      </div>
    </PageCard>
  );
}
