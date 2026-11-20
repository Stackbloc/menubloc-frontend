import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import OwnerTodayCheckPanel from "./OwnerTodayCheckPanel.jsx";
import OwnerRestaurantEditPanel from "./OwnerRestaurantEditPanel.jsx";
import OwnerRestaurantPanel from "./OwnerRestaurantPanel.jsx";
import OwnerRestaurantBulkPanel, { OwnerRestaurantBulkHistory } from "./OwnerRestaurantBulkPanel.jsx";

const MAX_BULK = 300; // server cap per bulk edit (ownerRestaurantBulkService.MAX_BULK)
import OwnerLayout, { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import {
  getOwnerMimsFacets,
  getOwnerRestaurantCoverage,
  getOwnerRestaurantMarkets,
  sendOwnerRestaurantCoverage,
  getOwnerRestaurantOperations,
  getOwnerRestaurantOperationClusters,
} from "../../lib/ownerApi.js";

/**
 * Owner → Restaurant Management (plan 42, step 1). Read-only, system-wide grid.
 * Cluster, market, city and state are filters for admins only; Today stays driven by the
 * diner's location. Paging, filtering and sorting all run on the server.
 */

// 2026-11-20 (plan 68 step 1): metro_id + chain_id use the same rules as Owner → Menu Items.
const DEFAULTS = { q: "", metro_id: "", chain_id: "", state: "", city: "", market: "", cluster_id: "", missing: "", active: "", claim_status: "", sort: "name", page: 1, page_size: 10 };

const MISSING = [
  ["", "Any"],
  ["hours", "Hours"],
  ["cuisine", "Cuisine"],
  ["service", "Dine-in / pickup / delivery"],
  ["dishes", "Dishes (Today needs them)"],
  ["latlng", "Coordinates"],
  ["address", "Street address"],
  ["menu_with_dishes", "Published menu (has dishes)"],
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
  const [metros, setMetros] = useState([]);
  const [chains, setChains] = useState([]);
  // 2026-11-20 (Andre): Metro defaults to Los Angeles, like Menu Items. metro_id "" = the default metro
  // (from the Menu Items facets), "all" = every metro. The grid waits for the facets so it doesn't load twice.
  const [defaultMetroId, setDefaultMetroId] = useState(null);
  const [facetsReady, setFacetsReady] = useState(false);
  const [checking, setChecking] = useState(null);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null); // 2026-11-20 (plan 68 step 3): restaurant panel
  const [reloadKey, setReloadKey] = useState(0);
  // Bulk selection: picked ids (kept across pages) or "all matching this filter".
  const [picked, setPicked] = useState(() => new Set());
  const [allMatching, setAllMatching] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    getOwnerRestaurantMarkets().then((r) => setMarkets(Array.isArray(r?.markets) ? r.markets : [])).catch(() => setMarkets([]));
    getOwnerRestaurantOperationClusters().then((r) => setClusters(Array.isArray(r?.clusters) ? r.clusters : [])).catch(() => setClusters([]));
    // Same Metro and Chain lists as Menu Items.
    getOwnerMimsFacets()
      .then((r) => {
        const fx = r?.facets || r || {};
        setMetros(Array.isArray(fx.metros) ? fx.metros : []);
        setChains(Array.isArray(fx.chains) ? fx.chains : []);
        setDefaultMetroId(fx.default_metro_id != null ? String(fx.default_metro_id) : null);
      })
      .catch(() => {
        setMetros([]);
        setChains([]);
      })
      .finally(() => setFacetsReady(true));
  }, []);

  // Search box: wait for typing to pause, then go back to page 1.
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.q === search.trim() ? f : { ...f, q: search.trim(), page: 1 })), 350);
    return () => clearTimeout(t);
  }, [search]);

  const params = useMemo(() => {
    const out = {};
    for (const [k, v] of Object.entries(filters)) if (v !== "" && v != null) out[k] = String(v);
    if (!out.metro_id && defaultMetroId) out.metro_id = defaultMetroId;
    if (out.metro_id === "all") delete out.metro_id;
    return out;
  }, [filters, defaultMetroId]);

  useEffect(() => {
    if (!facetsReady) return undefined;
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
  }, [params, reloadKey, facetsReady]);

  // The filter without paging/sort: what "all matching" means. Changing it clears the selection.
  const filterOnly = useMemo(() => {
    const out = { ...params };
    delete out.page;
    delete out.page_size;
    delete out.sort;
    return out;
  }, [params]);
  const filterKey = JSON.stringify(filterOnly);
  // Coverage counts ignore the gap pickers themselves (Missing, Active): tapping a gap must not change the counts.
  const coverageFilter = useMemo(() => {
    const { missing: _m, active: _a, ...rest } = filterOnly;
    return rest;
  }, [filterOnly]);
  useEffect(() => {
    setPicked(new Set());
    setAllMatching(false);
  }, [filterKey]);

  const set = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value, page: 1 }));
  const { page, page_size: pageSize, total } = data.pagination;
  const pageIds = data.restaurants.map((r) => r.restaurant_id);
  const pageAllPicked = pageIds.length > 0 && pageIds.every((id) => picked.has(id));
  const selectedCount = allMatching ? total : picked.size;
  const togglePick = (id) => {
    setAllMatching(false);
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const togglePage = () => {
    setAllMatching(false);
    setPicked((prev) => {
      const next = new Set(prev);
      for (const id of pageIds) {
        if (pageAllPicked) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  };
  const clearPicked = () => {
    setPicked(new Set());
    setAllMatching(false);
  };
  const bulkSelection = allMatching ? { filter: filterOnly, expected_total: total } : { ids: [...picked] };
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
            <input style={{ ...inputStyle, width: 220 }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, city or #ID" />
          </Field>
          <Field label="Metro">
            <select
              style={inputStyle}
              value={filters.metro_id || defaultMetroId || "all"}
              onChange={(e) => {
                const v = e.target.value;
                setFilters((f) => ({ ...f, metro_id: defaultMetroId && v === defaultMetroId ? "" : v, page: 1 }));
              }}
            >
              <option value="all">All metros</option>
              {metros.map((m) => (
                <option key={m.id} value={m.id}>{m.name}{m.state && !String(m.name || "").includes(m.state) ? `, ${m.state}` : ""}</option>
              ))}
            </select>
          </Field>
          <Field label="Chain">
            <select style={{ ...inputStyle, maxWidth: 180 }} value={filters.chain_id} onChange={set("chain_id")}>
              <option value="">Any</option>
              <option value="none">No chain</option>
              {chains.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
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

      <CoverageCard
        ready={facetsReady}
        filter={coverageFilter}
        reloadKey={reloadKey}
        current={{ missing: filters.missing, active: filters.active }}
        onShow={(gapFilter) =>
          setFilters((f) => ({ ...f, missing: gapFilter.missing || "", active: gapFilter.active || "", page: 1 }))
        }
      />

      <PageCard style={{ padding: 18 }}>
        <SectionTitle
          title="Restaurants"
          subtitle={loading ? "Loading…" : `${total.toLocaleString()} match${total === 1 ? "" : "es"}${total ? ` · showing ${from}–${to}` : ""}`}
        />
        {error ? <div style={{ color: "#9f3a22", fontSize: 13, marginBottom: 12 }}>{error}</div> : null}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", minHeight: 22, marginBottom: 10, fontSize: 13 }}>
          {selectedCount ? (
            <>
              <b>{allMatching ? `All ${total.toLocaleString()} matching selected` : `${picked.size.toLocaleString()} selected`}</b>
              {selectedCount > MAX_BULK ? (
                <span style={{ color: "#9f3a22" }}>Bulk edits take up to {MAX_BULK}. Unselect some.</span>
              ) : (
                <button type="button" style={linkBtnStyle} onClick={() => setBulkOpen(true)}>Bulk edit</button>
              )}
              <button type="button" style={linkBtnStyle} onClick={clearPicked}>Clear</button>
              {pageAllPicked && !allMatching && total > picked.size ? (
                total <= MAX_BULK ? (
                  <button type="button" style={linkBtnStyle} onClick={() => setAllMatching(true)}>Select all {total.toLocaleString()} matching</button>
                ) : (
                  <span style={{ color: OWNER_COLORS.muted }}>{total.toLocaleString()} match: narrow the filter to {MAX_BULK} or fewer to select them all.</span>
                )
              ) : null}
            </>
          ) : (
            <span style={{ color: OWNER_COLORS.muted }}>Tick restaurants to edit several at once.</span>
          )}
          <button type="button" style={{ ...linkBtnStyle, marginLeft: "auto" }} onClick={() => setHistoryOpen(true)}>Recent bulk edits</button>
        </div>
        {!loading && !data.restaurants.length ? (
          <EmptyState>No restaurants match these filters.</EmptyState>
        ) : (
          <div style={{ overflowX: "auto", opacity: loading ? 0.5 : 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1180 }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: 28 }}>
                    <input type="checkbox" aria-label="Select this page" checked={pageAllPicked || allMatching} onChange={togglePage} disabled={allMatching} />
                  </th>
                  {["Restaurant", "Where", "Cuisine · Today type", "Hours", "Service", "Dishes", "Status", "Today basics", "Missing", "Last checked"].map((l) => (
                    <th key={l} style={thStyle}>{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.restaurants.map((r) => (
                  <Row
                    key={r.restaurant_id}
                    r={r}
                    picked={allMatching || picked.has(r.restaurant_id)}
                    pickDisabled={allMatching}
                    onPick={() => togglePick(r.restaurant_id)}
                    onCheck={() => setChecking(r)}
                    onEdit={() => setEditing(r)}
                    onView={() => setViewing(r)}
                  />
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
      {viewing ? (
        <OwnerRestaurantPanel
          restaurant={viewing}
          onClose={() => setViewing(null)}
          onChanged={() => setReloadKey((k) => k + 1)}
          onEdit={() => {
            setEditing(viewing);
            setViewing(null);
          }}
        />
      ) : null}
      {editing ? <OwnerRestaurantEditPanel restaurant={editing} onClose={() => setEditing(null)} onSaved={() => setReloadKey((k) => k + 1)} /> : null}
      {bulkOpen ? (
        <OwnerRestaurantBulkPanel
          selection={bulkSelection}
          count={selectedCount}
          onClose={() => setBulkOpen(false)}
          onApplied={() => setReloadKey((k) => k + 1)}
        />
      ) : null}
      {historyOpen ? (
        <OwnerRestaurantBulkHistory onClose={() => setHistoryOpen(false)} onChanged={() => setReloadKey((k) => k + 1)} />
      ) : null}
      {checking ? <OwnerTodayCheckPanel restaurant={checking} clusters={clusters} onClose={() => setChecking(null)} /> : null}
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

/**
 * 2026-11-20 (plan 68 step 2): Coverage. For the filters above (not the Missing/Active pickers), how many
 * restaurants have each gap. Tap a count to list them below; a gap a bot can fix has a Send button
 * (the bot's own run and review rules; at most send_max active restaurants per send).
 */
const BOT_LABEL = { hours: "Hours Bot", address: "Address Bot", menubot: "Menubot" };

function CoverageCard({ ready, filter, reloadKey, current, onShow }) {
  const [cov, setCov] = useState(null);
  const [err, setErr] = useState("");
  const [sending, setSending] = useState("");
  const [note, setNote] = useState(null);
  const key = JSON.stringify(filter);
  useEffect(() => {
    if (!ready) return undefined;
    let live = true;
    setErr("");
    getOwnerRestaurantCoverage(filter)
      .then((r) => live && setCov(r))
      .catch((e) => live && setErr(e?.message || "Could not load coverage"));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reloadKey, ready]);
  useEffect(() => setNote(null), [key]);

  const isOn = (g) => (g.filter.missing || "") === (current.missing || "") && (g.filter.active || "") === (current.active || "");
  const send = async (g) => {
    const max = cov?.send_max || 300;
    const n = Math.min(g.count, max);
    const what =
      g.bot === "menubot"
        ? "Menubot looks for menus in this cluster, 10 restaurants at a time. Menus wait for your review."
        : `${BOT_LABEL[g.bot]} gets up to ${n.toLocaleString()} active restaurants with "${g.label.toLowerCase()}"${g.count > max ? ` (of ${g.count.toLocaleString()}; send again for more)` : ""}.`;
    if (!window.confirm(`${what}\n\nStart it now?`)) return;
    setSending(g.key);
    setNote(null);
    try {
      const r = await sendOwnerRestaurantCoverage({ bot: g.bot, filter });
      setNote(
        r.ok
          ? { ok: true, text: `${r.bot_label} started: ${Number(r.sent || 0).toLocaleString()} restaurant${r.sent === 1 ? "" : "s"}${r.capped ? ` (of ${Number(r.total).toLocaleString()})` : ""}. Follow it in Owner → Bots.` }
          : { ok: false, text: r.reason === "already_running" ? `${r.bot_label || BOT_LABEL[g.bot]} is already running. Try again when it finishes.` : r.message || "Nothing was started." }
      );
    } catch (e) {
      setNote({ ok: false, text: e?.message || "Could not start the bot" });
    } finally {
      setSending("");
    }
  };

  return (
    <PageCard style={{ padding: 18, marginBottom: 16 }}>
      <SectionTitle
        title="Coverage"
        subtitle={
          cov
            ? `${Number(cov.total).toLocaleString()} restaurants match the filters above. Tap a number to list them.`
            : err || "Counting…"
        }
      />
      {cov ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 10 }}>
          {cov.gaps.map((g) => {
            const on = isOn(g);
            const needsCluster = g.bot === "menubot" && !filter.cluster_id;
            return (
              <div
                key={g.key}
                style={{
                  border: `1px solid ${on ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
                  borderRadius: 10,
                  padding: "10px 12px",
                  background: on ? "rgba(0,0,0,0.02)" : "#fff",
                }}
              >
                <button
                  type="button"
                  onClick={() => onShow(on ? {} : g.filter)}
                  aria-pressed={on}
                  style={{ ...linkBtnStyle, color: OWNER_COLORS.ink, textAlign: "left", display: "block", width: "100%" }}
                  title={on ? "Show all again" : "List these restaurants below"}
                >
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{Number(g.count).toLocaleString()}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: OWNER_COLORS.muted }}>{g.label}</div>
                </button>
                {g.bot && g.count > 0 ? (
                  needsCluster ? (
                    <div style={{ fontSize: 11, color: OWNER_COLORS.muted, marginTop: 6 }}>Pick one cluster to send to Menubot</div>
                  ) : (
                    <button
                      type="button"
                      style={{ ...linkBtnStyle, fontSize: 12, marginTop: 6 }}
                      disabled={Boolean(sending)}
                      onClick={() => send(g)}
                    >
                      {sending === g.key ? "Starting…" : `Send to ${BOT_LABEL[g.bot]} ›`}
                    </button>
                  )
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
      {note ? (
        <div style={{ marginTop: 10, fontSize: 13, color: note.ok ? OWNER_COLORS.ink : "#9f3a22" }}>{note.text}</div>
      ) : null}
    </PageCard>
  );
}

function Row({ r, picked, pickDisabled, onPick, onCheck, onEdit, onView }) {
  const muted = { fontSize: 12, color: OWNER_COLORS.muted };
  const service = [r.service.dine_in && "Dine-in", r.service.pickup && "Pickup", r.service.delivery && "Delivery"].filter(Boolean);
  return (
    <tr>
      <td style={{ ...tdStyle, width: 28 }}>
        <input type="checkbox" aria-label={`Select ${r.restaurant_name}`} checked={picked} disabled={pickDisabled} onChange={onPick} />
      </td>
      <td style={tdStyle}>
        {/* 2026-11-20 (plan 68 step 3): the name opens the restaurant panel (public page link is inside it). */}
        <button
          type="button"
          onClick={onView}
          title="See everything about this restaurant"
          style={{ ...linkBtnStyle, fontSize: 13, color: OWNER_COLORS.ink, textAlign: "left" }}
        >
          {r.restaurant_name}
        </button>{" "}
        <span style={{ fontWeight: 600, color: OWNER_COLORS.ink, whiteSpace: "nowrap" }}>#{r.restaurant_id}</span>
        {r.chain_name ? <div style={muted}>{r.chain_name}</div> : null}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button type="button" style={{ ...linkBtnStyle, fontSize: 12 }} onClick={onEdit}>Edit</button>
          {/* 2026-11-20 (plan 68 step 1): the same restaurant in Menu Items and in Restaurant Manager. */}
          <Link to={`/owner/menu-items?metro_id=all&restaurant_id=${encodeURIComponent(r.restaurant_id)}`} style={{ ...linkBtnStyle, fontSize: 12, textDecoration: "none" }}>
            Dishes ›
          </Link>
          <Link to={`/owner/restaurant-manager?restaurant=${encodeURIComponent(r.restaurant_id)}&section=details`} style={{ ...linkBtnStyle, fontSize: 12, textDecoration: "none" }}>
            Open ›
          </Link>
        </div>
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
          {r.today_type.source === "owner" ? " · set by hand" : r.today_type.source ? ` · from ${String(r.today_type.source).replace(/_/g, " ")}` : ""}
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
        <div>
          <button type="button" style={{ ...linkBtnStyle, fontSize: 12 }} onClick={onCheck}>Check Today</button>
        </div>
        <div>
          <Link
            to={`/owner/search/meal-time?tab=check&restaurant_id=${encodeURIComponent(r.restaurant_id)}&name=${encodeURIComponent(r.restaurant_name || "")}`}
            style={{ ...linkBtnStyle, fontSize: 12, textDecoration: "none" }}
          >
            Check meal search
          </Link>
        </div>
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
