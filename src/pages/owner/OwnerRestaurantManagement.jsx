import React, { useEffect, useMemo, useState } from "react";
import OwnerLayout, { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import {
  getOwnerRestaurantMarkets,
  getOwnerRestaurantOperations,
  getOwnerRestaurantOperationClusters,
} from "../../lib/ownerApi.js";

/**
 * Owner → Restaurant Management (plan 42, step 1). Read-only, system-wide grid.
 * Cluster, market, city and state are filters for admins only; Today stays driven by the
 * diner's location. Paging, filtering and sorting all run on the server.
 */

const DEFAULTS = { q: "", state: "", city: "", market: "", cluster_id: "", missing: "", active: "", claim_status: "", sort: "name", page: 1, page_size: 10 };

const MISSING = [
  ["", "Any"],
  ["hours", "Hours"],
  ["cuisine", "Cuisine"],
  ["service", "Dine-in / pickup / delivery"],
  ["dishes", "Dishes (Today needs them)"],
  ["latlng", "Coordinates"],
  ["website", "Website"],
  ["menu", "Published menu"],
];
const MISSING_LABEL = { hours: "hours", cuisine: "cuisine", coordinates: "coordinates", service: "service modes", website: "website", dishes: "dishes" };
const BLOCKER_LABEL = {
  franchise_hq_record: "Franchise HQ record",
  inactive: "Inactive",
  test_fixture: "Test listing",
  no_coordinates: "No coordinates",
  no_dishes: "No dishes",
};
const WROTE_LABEL = { platform_owner: "Owner portal", operator: "Restaurant", hours_bot: "Hours Bot", menubot: "Menubot", location_bot: "Location Bot", source_visit: "Source visit" };

function formatDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function OwnerRestaurantManagement() {
  const [filters, setFilters] = useState(DEFAULTS);
  const [search, setSearch] = useState("");
  const [data, setData] = useState({ restaurants: [], pagination: { page: 1, page_size: 10, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markets, setMarkets] = useState([]);
  const [clusters, setClusters] = useState([]);

  useEffect(() => {
    getOwnerRestaurantMarkets().then((r) => setMarkets(Array.isArray(r?.markets) ? r.markets : [])).catch(() => setMarkets([]));
    getOwnerRestaurantOperationClusters().then((r) => setClusters(Array.isArray(r?.clusters) ? r.clusters : [])).catch(() => setClusters([]));
  }, []);

  // Search box: wait for typing to pause, then go back to page 1.
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.q === search.trim() ? f : { ...f, q: search.trim(), page: 1 })), 350);
    return () => clearTimeout(t);
  }, [search]);

  const params = useMemo(() => {
    const out = {};
    for (const [k, v] of Object.entries(filters)) if (v !== "" && v != null) out[k] = String(v);
    return out;
  }, [filters]);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    getOwnerRestaurantOperations(params)
      .then((res) => live && setData({ restaurants: res?.restaurants || [], pagination: res?.pagination || { page: 1, page_size: 10, total: 0 } }))
      .catch((err) => live && setError(err?.message || "Could not load restaurants"))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [params]);

  const set = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value, page: 1 }));
  const { page, page_size: pageSize, total } = data.pagination;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(total, page * pageSize);
  const anyFilter = Object.keys(DEFAULTS).some((k) => !["sort", "page", "page_size"].includes(k) && filters[k] !== DEFAULTS[k]);

  return (
    <OwnerLayout title="Restaurant Management">
      <PageCard style={{ padding: 18, marginBottom: 16 }}>
        <SectionTitle
          title="Find restaurants"
          subtitle="All restaurants. Cluster, market, city and state only narrow this list; they never change what Today recommends."
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
          <Field label="Search">
            <input style={{ ...inputStyle, width: 220 }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, city or ID" />
          </Field>
          <Field label="State">
            <input style={{ ...inputStyle, width: 70 }} value={filters.state} onChange={set("state")} placeholder="CA" maxLength={2} />
          </Field>
          <Field label="City">
            <input style={{ ...inputStyle, width: 140 }} value={filters.city} onChange={set("city")} placeholder="Los Angeles" />
          </Field>
          <Field label="Market">
            <select style={inputStyle} value={filters.market} onChange={set("market")}>
              <option value="">Any</option>
              {markets.map((m) => (
                <option key={m.name} value={m.name}>{m.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Cluster">
            <select style={inputStyle} value={filters.cluster_id} onChange={set("cluster_id")}>
              <option value="">Any</option>
              {clusters.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.state ? ` · ${c.state}` : ""}</option>
              ))}
            </select>
          </Field>
          <Field label="Missing">
            <select style={inputStyle} value={filters.missing} onChange={set("missing")}>
              {MISSING.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Active">
            <select style={inputStyle} value={filters.active} onChange={set("active")}>
              <option value="">Any</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </Field>
          <Field label="Claimed">
            <select style={inputStyle} value={filters.claim_status} onChange={set("claim_status")}>
              <option value="">Any</option>
              <option value="claimed">Claimed</option>
              <option value="unclaimed">Unclaimed</option>
            </select>
          </Field>
          <Field label="Sort">
            <select style={inputStyle} value={filters.sort} onChange={set("sort")}>
              <option value="name">Name</option>
              <option value="city">City</option>
              <option value="state">State</option>
              <option value="updated_at">Recently updated</option>
            </select>
          </Field>
          {anyFilter ? (
            <button type="button" style={linkBtnStyle} onClick={() => { setSearch(""); setFilters(DEFAULTS); }}>
              Clear filters
            </button>
          ) : null}
        </div>
      </PageCard>

      <PageCard style={{ padding: 18 }}>
        <SectionTitle
          title="Restaurants"
          subtitle={loading ? "Loading…" : `${total.toLocaleString()} match${total === 1 ? "" : "es"}${total ? ` · showing ${from}–${to}` : ""}`}
        />
        {error ? <div style={{ color: "#9f3a22", fontSize: 13, marginBottom: 12 }}>{error}</div> : null}
        {!loading && !data.restaurants.length ? (
          <EmptyState>No restaurants match these filters.</EmptyState>
        ) : (
          <div style={{ overflowX: "auto", opacity: loading ? 0.5 : 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1180 }}>
              <thead>
                <tr>
                  {["Restaurant", "Where", "Cuisine · Today type", "Hours", "Service", "Dishes", "Status", "Today basics", "Missing", "Last checked"].map((l) => (
                    <th key={l} style={thStyle}>{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.restaurants.map((r) => (
                  <Row key={r.restaurant_id} r={r} />
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ display: "flex", gap: 14, alignItems: "center", justifyContent: "flex-end", marginTop: 14, fontSize: 13 }}>
          <label style={{ color: OWNER_COLORS.muted }}>
            Per page{" "}
            <select style={{ ...inputStyle, padding: "6px 8px" }} value={filters.page_size} onChange={set("page_size")}>
              {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button type="button" style={linkBtnStyle} disabled={page <= 1 || loading} onClick={() => setFilters((f) => ({ ...f, page: page - 1 }))}>
            ‹ Previous
          </button>
          <span style={{ color: OWNER_COLORS.muted }}>Page {page} of {totalPages.toLocaleString()}</span>
          <button type="button" style={linkBtnStyle} disabled={page >= totalPages || loading} onClick={() => setFilters((f) => ({ ...f, page: page + 1 }))}>
            Next ›
          </button>
        </div>
      </PageCard>
    </OwnerLayout>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 4, fontSize: 11, fontWeight: 700, color: OWNER_COLORS.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {label}
      {children}
    </label>
  );
}

function Row({ r }) {
  const muted = { fontSize: 12, color: OWNER_COLORS.muted };
  const service = [r.service.dine_in && "Dine-in", r.service.pickup && "Pickup", r.service.delivery && "Delivery"].filter(Boolean);
  return (
    <tr>
      <td style={tdStyle}>
        <a href={r.public_url} target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: OWNER_COLORS.ink, textDecoration: "none" }}>
          {r.restaurant_name}
        </a>
        <div style={muted}>#{r.restaurant_id}{r.chain_name ? ` · ${r.chain_name}` : ""}</div>
      </td>
      <td style={tdStyle}>
        <div>{[r.city, r.state].filter(Boolean).join(", ") || "—"}</div>
        {r.market ? <div style={muted}>{r.market}</div> : null}
        {r.clusters.length ? <div style={muted}>{r.clusters.map((c) => c.name).join(", ")}</div> : null}
      </td>
      <td style={tdStyle}>
        <div>{r.cuisine || "—"}</div>
        <div style={muted}>
          {r.today_type.styles.length ? r.today_type.styles.join(", ") : "No type"}
          {r.today_type.source ? ` · from ${String(r.today_type.source).replace(/_/g, " ")}` : ""}
        </div>
      </td>
      <td style={tdStyle}>
        <div>{r.hours.known ? r.hours.summary : "None"}</div>
        {r.hours.last_written_by ? <div style={muted}>by {WROTE_LABEL[r.hours.last_written_by] || r.hours.last_written_by}</div> : null}
      </td>
      <td style={tdStyle}>{service.length ? service.join(", ") : "—"}</td>
      <td style={tdStyle}>
        <div>{r.dishes.toLocaleString()}</div>
        <div style={muted}>{r.published_menus} published menu{r.published_menus === 1 ? "" : "s"}</div>
      </td>
      <td style={tdStyle}>
        <div>{r.active ? "Active" : "Inactive"}</div>
        <div style={muted}>{r.claimed ? "Claimed" : "Unclaimed"}</div>
      </td>
      <td style={tdStyle}>
        {r.today_basics.ok ? (
          <span>OK</span>
        ) : (
          <span style={{ color: "#9f3a22" }}>{r.today_basics.blockers.map((b) => BLOCKER_LABEL[b] || b).join(", ") || "Not shown"}</span>
        )}
      </td>
      <td style={tdStyle}>
        {r.missing.length ? <span style={{ color: "#9f3a22" }}>{r.missing.map((m) => MISSING_LABEL[m] || m).join(", ")}</span> : "—"}
      </td>
      <td style={tdStyle}>
        <div>{formatDate(r.verification.last_verified_at)}</div>
        <div style={muted}>
          {r.verification.status === "never" ? "Never checked" : `${r.verification.status === "stale" ? "Over 30 days · " : ""}${WROTE_LABEL[r.verification.by] || r.verification.by || ""}`}
        </div>
      </td>
    </tr>
  );
}

const inputStyle = { padding: "8px 10px", borderRadius: 10, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", fontSize: 13 };
const thStyle = { textAlign: "left", padding: "0 8px 10px 0", fontSize: 12, color: OWNER_COLORS.muted, whiteSpace: "nowrap" };
const tdStyle = { padding: "10px 8px 10px 0", borderTop: `1px solid ${OWNER_COLORS.line}`, fontSize: 13, verticalAlign: "top" };
const linkBtnStyle = { padding: 0, border: "none", background: "none", color: OWNER_COLORS.accent, fontWeight: 700, cursor: "pointer", fontSize: 13 };
