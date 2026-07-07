import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import OwnerLayout, { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import {
  addOwnerRestaurantToCrm,
  getOwnerRestaurantDetail,
  getOwnerRestaurantCuisines,
  getOwnerRestaurantMarkets,
  getOwnerRestaurantsSummary,
  searchOwnerRestaurants,
} from "../../lib/ownerApi.js";

const DEFAULT_FILTERS = {
  q: "",
  city: "",
  state: "",
  market: "",
  cuisine: "",
  chain: "",
  menu_status: "",
  claim_status: "",
  source: "",
  missing: "",
  sort: "updated_at",
  page: 1,
  limit: 50,
};

const FILTER_FORM_ID = "owner-restaurant-intelligence-filters";

export default function OwnerRestaurants() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [draft, setDraft] = useState(DEFAULT_FILTERS);
  const [summary, setSummary] = useState(null);
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [marketOptions, setMarketOptions] = useState([["", "Any market"]]);
  const [cuisineOptions, setCuisineOptions] = useState([["", "Any cuisine"]]);

  const queryParams = useMemo(() => {
    const params = {};
    for (const [key, value] of Object.entries(filters)) {
      if (value === "" || value == null) continue;
      params[key] = String(value);
    }
    return params;
  }, [filters]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [searchRes, summaryRes] = await Promise.all([
        searchOwnerRestaurants(queryParams),
        getOwnerRestaurantsSummary(queryParams),
      ]);
      setResults(searchRes.restaurants || []);
      setPagination(searchRes.pagination || { page: 1, limit: 50, total: 0 });
      setSummary(summaryRes.summary || null);
    } catch {
      setError("Unavailable.");
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    getOwnerRestaurantCuisines()
      .then((res) => {
        const rows = Array.isArray(res?.cuisines) ? res.cuisines : [];
        setCuisineOptions([
          ["", "Any cuisine"],
          ...rows.map((row) => [row.value, row.label || row.value]),
        ]);
      })
      .catch(() => {
        setCuisineOptions([["", "Unavailable"]]);
      });
  }, []);

  useEffect(() => {
    getOwnerRestaurantMarkets()
      .then((res) => {
        const rows = Array.isArray(res?.markets) ? res.markets : [];
        setMarketOptions([
          ["", "Any market"],
          ...rows.map((market) => [
            market.name,
            formatMarketOptionLabel(market),
          ]),
        ]);
      })
      .catch(() => {
        setMarketOptions([["", "Unavailable"]]);
      });
  }, []);

  function applyFilters(event) {
    event?.preventDefault?.();
    setFilters({ ...draft, page: 1 });
  }

  function resetFilters() {
    setDraft(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
  }

  function goToPage(page) {
    setFilters((cur) => ({ ...cur, page }));
  }

  async function openDetail(restaurantId) {
    setDetailLoading(true);
    try {
      const res = await getOwnerRestaurantDetail(restaurantId);
      setDetail(res.restaurant || null);
    } catch {
      setActionMessage("Could not load restaurant detail.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleAddToCrm(restaurantId) {
    setActionMessage("");
    try {
      const res = await addOwnerRestaurantToCrm(restaurantId);
      setActionMessage(res.created ? `CRM lead #${res.lead_id} created.` : `Linked existing CRM lead #${res.lead_id}.`);
      await loadData();
      if (detail?.restaurant_id === restaurantId) openDetail(restaurantId);
    } catch (err) {
      setActionMessage(err?.message || "Could not add CRM lead.");
    }
  }

  const breakdown = summary?.query_breakdown;
  const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / (pagination.limit || 50)));
  const appliedBrandQuery = String(filters.q || "").trim();
  const showBrandBreakdown = Boolean(breakdown && appliedBrandQuery && draft.q === filters.q);
  const hasActiveSearch = Boolean(filters.q || filters.city || filters.state);
  const [showAnalytics, setShowAnalytics] = useState(false);

  return (
    <OwnerLayout
      title="Restaurant Intelligence"
      actions={
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button type="button" onClick={resetFilters} style={secondaryBtnStyle}>Reset</button>
          <button type="submit" form={FILTER_FORM_ID} style={primaryBtnStyle}>Apply Filters</button>
        </div>
      }
    >
      <div className="owner-restaurant-intelligence" style={{ minWidth: 0, maxWidth: "100%" }}>
      {error ? <ErrorBanner message={error} /> : null}
      {actionMessage ? <InfoBanner message={actionMessage} /> : null}

      <PageCard style={{ padding: 18, marginBottom: 16 }}>
        <form id={FILTER_FORM_ID} onSubmit={applyFilters}>
          <SectionTitle title="Search & Filters" subtitle="System-wide restaurant records — no geo radius or consumer discovery." />
          <div className="owner-responsive-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(160px, 1fr))", gap: 12, minWidth: 0 }}>
            <FilterInput label="Restaurant / chain" value={draft.q} onChange={(v) => setDraft((c) => ({ ...c, q: v }))} />
            <FilterInput label="City" value={draft.city} onChange={(v) => setDraft((c) => ({ ...c, city: v }))} />
            <FilterInput label="State" value={draft.state} onChange={(v) => setDraft((c) => ({ ...c, state: v }))} />
            <MarketFilterSelect value={draft.market} onChange={(v) => setDraft((c) => ({ ...c, market: v }))} options={marketOptions} />
            <FilterSelect label="Cuisine" value={draft.cuisine} onChange={(v) => setDraft((c) => ({ ...c, cuisine: v }))} options={cuisineOptions} />
            <FilterSelect label="Chain only" value={draft.chain} onChange={(v) => setDraft((c) => ({ ...c, chain: v }))} options={[["", "Any"], ["independent", "Independent"], ["true", "Chain / franchise"]]} />
            <FilterSelect label="Menu status" value={draft.menu_status} onChange={(v) => setDraft((c) => ({ ...c, menu_status: v }))} options={[["", "Any"], ["active", "Active menu"], ["draft", "Draft menu"], ["pending", "Pending menu"], ["none", "No menu"]]} />
            <FilterSelect label="Claim status" value={draft.claim_status} onChange={(v) => setDraft((c) => ({ ...c, claim_status: v }))} options={[["", "Any"], ["claimed", "Claimed"], ["verified", "Verified"], ["unclaimed", "Unclaimed"]]} />
            <FilterSelect label="Source" value={draft.source} onChange={(v) => setDraft((c) => ({ ...c, source: v }))} options={[["", "Any"], ["seed", "Seed"], ["manual", "Manual"], ["owner", "Owner-created"], ["google", "Google Places"], ["osm", "OSM"]]} />
            <FilterSelect label="Missing data" value={draft.missing} onChange={(v) => setDraft((c) => ({ ...c, missing: v }))} options={[["", "Any"], ["phone", "No phone"], ["website", "No website"], ["latlng", "No lat/lng"], ["menu", "No menu"], ["slug", "No slug"]]} />
            <FilterSelect label="Sort" value={draft.sort} onChange={(v) => setDraft((c) => ({ ...c, sort: v }))} options={[["updated_at", "Last updated"], ["name", "Name"], ["city", "City"], ["state", "State"], ["menu_status", "Menu status"]]} />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap", marginTop: 16 }}>
            <button type="button" onClick={resetFilters} style={secondaryBtnStyle}>Reset</button>
            <button type="submit" style={primaryBtnStyle}>Apply Filters</button>
          </div>
        </form>
      </PageCard>

      {showBrandBreakdown ? (
        <PageCard style={{ padding: 18, marginBottom: 16 }}>
          <SectionTitle title={breakdown.query} subtitle="Filtered chain / brand summary" />
          <div className="owner-responsive-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(140px, 1fr))", gap: 12 }}>
            <MetricCard label="Total locations" value={breakdown.total_locations} />
            <MetricCard label="Active menus" value={breakdown.active_menus} />
            <MetricCard label="Pending menus" value={breakdown.pending_menus} />
            <MetricCard label="No menu" value={breakdown.no_menu} />
          </div>
          {results.length > 0 ? (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: OWNER_COLORS.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                Open a location
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {results.slice(0, 8).map((row) => (
                  <LocationActionRow key={row.restaurant_id} row={row} onDetail={openDetail} />
                ))}
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 12, fontSize: 13, color: OWNER_COLORS.muted }}>
              Summary only — scroll to the results table below or widen filters to list individual locations.
            </div>
          )}
        </PageCard>
      ) : null}

      <PageCard style={{ padding: 18, marginBottom: 16 }}>
        <SectionTitle
          title="Restaurants"
          subtitle={`${pagination.total || 0} matches — select a row to manage menus or edit profile`}
        />
        {loading ? (
          <div style={{ padding: 24, textAlign: "center", color: OWNER_COLORS.muted }}>Loading…</div>
        ) : !results.length ? (
          <EmptyState>
            {hasActiveSearch
              ? "No restaurants match the current filters."
              : "Enter a name, city, state, or ID above and click Apply Filters."}
          </EmptyState>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
                <thead>
                  <tr>
                    {["Restaurant", "Chain", "City", "State", "Market", "Menu", "Claim", "Source", "Updated", "Actions"].map((label) => (
                      <th key={label} style={thStyle}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((row) => (
                    <tr key={row.restaurant_id} style={{ cursor: "pointer" }} onClick={() => openDetail(row.restaurant_id)}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 700 }}>{row.restaurant_name}</div>
                        <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>#{row.restaurant_id}</div>
                        {row.missing_flags?.length ? (
                          <div style={{ marginTop: 4, fontSize: 11, color: "#9f3a22" }}>
                            Missing: {row.missing_flags.join(", ")}
                          </div>
                        ) : null}
                      </td>
                      <td style={tdStyle}>{row.chain_name || (row.is_chain_location ? "Chain" : "—")}</td>
                      <td style={tdStyle}>{row.city || "—"}</td>
                      <td style={tdStyle}>{row.state || "—"}</td>
                      <td style={tdStyle}>{row.market || "—"}</td>
                      <td style={tdStyle}>
                        <StatusPill value={row.menu_status} />
                        <div style={{ fontSize: 11, color: OWNER_COLORS.muted, marginTop: 4 }}>
                          A{row.active_menu_count} / P{row.pending_menu_count} / D{row.draft_menu_count}
                        </div>
                      </td>
                      <td style={tdStyle}>{row.claim_status}</td>
                      <td style={tdStyle}>{row.data_origin || row.signup_source || "—"}</td>
                      <td style={tdStyle}>{formatDate(row.last_updated)}</td>
                      <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                        <RowActions row={row} onDetail={openDetail} onCrm={handleAddToCrm} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={pagination.page} totalPages={totalPages} onChange={goToPage} />
          </>
        )}
      </PageCard>

      <PageCard style={{ padding: 18, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setShowAnalytics((v) => !v)}
          style={{
            ...secondaryBtnStyle,
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{showAnalytics ? "Hide" : "Show"} portfolio analytics</span>
          <span style={{ color: OWNER_COLORS.muted, fontWeight: 600 }}>{showAnalytics ? "▲" : "▼"}</span>
        </button>
      </PageCard>

      {showAnalytics ? (
        <>
      <div className="owner-responsive-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
        <MetricCard label="Total restaurants" value={summary?.total_restaurants} loading={loading} />
        <MetricCard label="Independent restaurants" value={summary?.total_independent} loading={loading} />
        <MetricCard label="Independent claimed" value={summary?.independent_claimed} loading={loading} />
        <MetricCard label="Independent verified" value={summary?.independent_verified} loading={loading} />
        <MetricCard label="Chain / franchise locations" value={summary?.total_chain_locations} loading={loading} />
        <MetricCard label="Chain claimed" value={summary?.chain_claimed} loading={loading} />
        <MetricCard label="Active menus" value={summary?.total_active_menus} loading={loading} />
        <MetricCard label="No menu" value={summary?.total_no_menu} loading={loading} />
        <MetricCard label="Results (filter)" value={summary?.results_count ?? pagination.total} loading={loading} />
        <MetricCard label="Missing lat/lng" value={summary?.missing_latlng} loading={loading} />
        <MetricCard label="Missing phone" value={summary?.missing_phone} loading={loading} />
      </div>

      <div className="owner-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: 16, marginBottom: 16 }}>
        <PageCard style={{ padding: 18 }}>
          <SectionTitle title="Top chains" subtitle="By location count for current filters" />
          <SimpleTable rows={summary?.top_chains || []} columns={[["Chain", "chain_name"], ["Locations", "location_count"]]} emptyLabel="No chain grouping for current filters." />
        </PageCard>
        <PageCard style={{ padding: 18 }}>
          <SectionTitle title="By state" />
          <SimpleTable rows={(summary?.counts_by_state || []).slice(0, 10)} columns={[["State", "state"], ["Count", "count"]]} emptyLabel="No state counts." />
        </PageCard>
      </div>
        </>
      ) : null}

      {detail || detailLoading ? (
        <DetailDrawer
          loading={detailLoading}
          restaurant={detail}
          onClose={() => setDetail(null)}
          onCrm={handleAddToCrm}
        />
      ) : null}
      </div>
    </OwnerLayout>
  );
}

function LocationActionRow({ row, onDetail }) {
  const name = row.restaurant_name || "Restaurant";
  const location = [row.city, row.state].filter(Boolean).join(", ");
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", padding: "12px 14px", borderRadius: 10, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff" }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
        <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 4 }}>
          #{row.restaurant_id}{location ? ` · ${location}` : ""}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <ActionLink href={`/owner/menu-manager?restaurant=${row.restaurant_id}`} label="Open Menu Manager" primary />
        <button type="button" style={linkBtnStyle} onClick={() => onDetail(row.restaurant_id)}>Details</button>
      </div>
    </div>
  );
}

function RowActions({ row, onDetail, onCrm }) {
  const publicUrl = row.public_url;
  const menuUrl = publicUrl ? `${publicUrl}/menu` : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <ActionLink href={`/owner/menu-manager?restaurant=${row.restaurant_id}`} label="Open Menu Manager" primary />
      <button type="button" style={linkBtnStyle} onClick={() => onDetail(row.restaurant_id)}>View details</button>
      {publicUrl ? <ActionLink href={publicUrl} label="Public page" external /> : null}
      {menuUrl ? <ActionLink href={menuUrl} label="Public menu" external /> : null}
      {row.crm_lead_id ? (
        <ActionLink href={`/crm/leads/${row.crm_lead_id}`} label="CRM lead" />
      ) : (
        <button type="button" style={linkBtnStyle} onClick={() => onCrm(row.restaurant_id)}>Add to CRM</button>
      )}
    </div>
  );
}

function DetailDrawer({ loading, restaurant, onClose, onCrm }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(16,24,40,0.45)",
        zIndex: 50,
        display: "flex",
        justifyContent: "flex-end",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "min(520px, 100%)",
          maxWidth: "100%",
          height: "100%",
          boxSizing: "border-box",
          background: "#fffdf8",
          borderLeft: `1px solid ${OWNER_COLORS.line}`,
          padding: 24,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Restaurant record</h3>
          <button type="button" onClick={onClose} style={secondaryBtnStyle}>Close</button>
        </div>
        {loading ? <div style={{ color: OWNER_COLORS.muted }}>Loading…</div> : null}
        {!loading && restaurant ? (
          <div style={{ display: "grid", gap: 12, fontSize: 14 }}>
            <div><strong>{restaurant.restaurant_name}</strong> (#{restaurant.restaurant_id})</div>
            <div>{restaurant.city}, {restaurant.state}</div>
            <div>Menu: <StatusPill value={restaurant.menu_status} /></div>
            <div>Claim: {restaurant.claim_status} · Source: {restaurant.data_origin || restaurant.signup_source || "—"}</div>
            <div>Missing: {(restaurant.missing_flags || []).join(", ") || "none"}</div>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Menus ({restaurant.menus?.length || 0})</div>
              {(restaurant.menus || []).map((menu) => (
                <div key={menu.id} style={{ padding: "8px 0", borderTop: `1px solid ${OWNER_COLORS.line}` }}>
                  {menu.display_name || menu.name} — {menu.status}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <ActionLink href={`/owner/menu-manager?restaurant=${restaurant.restaurant_id}`} label="Open Menu Manager" primary />
              {restaurant.public_url ? <ActionLink href={restaurant.public_url} label="Public page" external /> : null}
              {restaurant.crm_lead_id ? (
                <ActionLink href={`/crm/leads/${restaurant.crm_lead_id}`} label="Open CRM lead" />
              ) : (
                <button type="button" style={primaryBtnStyle} onClick={() => onCrm(restaurant.restaurant_id)}>Add to CRM</button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FilterInput({ label, value, onChange }) {
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 12, fontWeight: 700, minWidth: 0 }}>
      {label}
      <input
        type="search"
        name="owner_restaurant_intelligence_q"
        value={value}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-lpignore="true"
        data-1p-ignore="true"
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, width: "100%", maxWidth: "100%", boxSizing: "border-box" }}
      />
    </label>
  );
}

function formatMarketOptionLabel(market) {
  const shortName = String(market?.name || "").split(",")[0].trim() || market?.name || "Market";
  const count = Number(market?.restaurant_count || 0).toLocaleString();
  return `${shortName} (${count})`;
}

function MarketFilterSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [panelRect, setPanelRect] = useState(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);

  const selectedLabel = options.find(([val]) => val === value)?.[1] || options[0]?.[1] || "Any market";
  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? options.filter(([, text]) => text.toLowerCase().includes(needle))
    : options;

  const updatePanelRect = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const margin = 8;
    const panelWidth = Math.min(320, window.innerWidth - margin * 2);
    let left = rect.left;
    if (left + panelWidth > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - panelWidth - margin);
    }
    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const openBelow = spaceBelow >= 160 || spaceBelow >= spaceAbove;
    const maxListHeight = Math.min(280, Math.max(120, openBelow ? spaceBelow - 52 : spaceAbove - 52));
    setPanelRect({
      left,
      width: panelWidth,
      top: openBelow ? rect.bottom + 4 : undefined,
      bottom: openBelow ? undefined : window.innerHeight - rect.top + 4,
      maxListHeight,
    });
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    updatePanelRect();
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target) && !event.target.closest?.("[data-market-panel]")) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("resize", updatePanelRect);
    window.addEventListener("scroll", updatePanelRect, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("resize", updatePanelRect);
      window.removeEventListener("scroll", updatePanelRect, true);
    };
  }, [open, updatePanelRect, query]);

  const panel = open && panelRect ? createPortal(
    <div
      data-market-panel
      role="listbox"
      style={{
        position: "fixed",
        left: panelRect.left,
        top: panelRect.top,
        bottom: panelRect.bottom,
        width: panelRect.width,
        zIndex: 200,
        background: "#fff",
        border: `1px solid ${OWNER_COLORS.line}`,
        borderRadius: 12,
        boxShadow: "0 12px 32px rgba(16, 24, 40, 0.16)",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div style={{ padding: 8, borderBottom: `1px solid ${OWNER_COLORS.line}` }}>
        <input
          type="search"
          value={query}
          placeholder="Search markets…"
          autoComplete="off"
          onChange={(e) => setQuery(e.target.value)}
          style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
        />
      </div>
      <div style={{ maxHeight: panelRect.maxListHeight, overflowY: "auto", overflowX: "hidden" }}>
        {filtered.length ? filtered.map(([val, text]) => (
          <button
            key={val || "any"}
            type="button"
            role="option"
            aria-selected={val === value}
            title={text}
            onClick={() => {
              onChange(val);
              setOpen(false);
              setQuery("");
            }}
            style={{
              display: "block",
              width: "100%",
              padding: "10px 12px",
              border: "none",
              borderBottom: `1px solid ${OWNER_COLORS.line}`,
              background: val === value ? "#faf3ec" : "#fff",
              textAlign: "left",
              fontSize: 13,
              cursor: "pointer",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              boxSizing: "border-box",
            }}
          >
            {text}
          </button>
        )) : (
          <div style={{ padding: "12px", color: OWNER_COLORS.muted, fontSize: 13 }}>No markets match.</div>
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <label ref={rootRef} style={{ display: "grid", gap: 6, fontSize: 12, fontWeight: 700, minWidth: 0, position: "relative" }}>
      Market
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((cur) => !cur)}
        style={{
          ...inputStyle,
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          textAlign: "left",
          cursor: "pointer",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {selectedLabel}
      </button>
      {panel}
    </label>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 12, fontWeight: 700, minWidth: 0 }}>
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
        style={{ ...inputStyle, width: "100%", maxWidth: "100%", boxSizing: "border-box" }}
      >
        {options.map(([val, text]) => <option key={val || "any"} value={val}>{text}</option>)}
      </select>
    </label>
  );
}

function MetricCard({ label, value, loading }) {
  return (
    <PageCard style={{ padding: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, marginTop: 8 }}>{loading ? "…" : (value ?? "0")}</div>
    </PageCard>
  );
}

function StatusPill({ value }) {
  const colors = {
    active: { bg: "#d4edda", fg: "#155724" },
    draft: { bg: "#fff3cd", fg: "#856404" },
    pending: { bg: "#fce6dd", fg: "#9f3a22" },
    none: { bg: "#f1e3d8", fg: "#667085" },
  };
  const palette = colors[value] || colors.none;
  return (
    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 99, background: palette.bg, color: palette.fg, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
      {value || "none"}
    </span>
  );
}

function SimpleTable({ rows, columns, emptyLabel }) {
  if (!rows.length) return <EmptyState>{emptyLabel}</EmptyState>;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead><tr>{columns.map(([label]) => <th key={label} style={thStyle}>{label}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={row.chain_name || row.state || index}>{columns.map(([label, key]) => <td key={label} style={tdStyle}>{row[key] ?? "—"}</td>)}</tr>)}</tbody>
    </table>
  );
}

function Pagination({ page, totalPages, onChange }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
      <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}>Page {page} of {totalPages}</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" style={secondaryBtnStyle} disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
        <button type="button" style={secondaryBtnStyle} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Next</button>
      </div>
    </div>
  );
}

function ActionLink({ href, label, external = false, primary = false }) {
  const style = primary
    ? { ...primaryBtnStyle, textDecoration: "none", display: "inline-block", fontSize: 12, padding: "8px 12px" }
    : { ...linkBtnStyle, textDecoration: "none", display: "inline-block" };
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" style={style}>
        {label}
      </a>
    );
  }
  return (
    <Link to={href} style={style}>
      {label}
    </Link>
  );
}

function ErrorBanner({ message }) {
  return <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: "#fff1ef", color: "#8b2e1a" }}>{message}</div>;
}

function InfoBanner({ message }) {
  return <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: "#eef8f0", color: "#155724" }}>{message}</div>;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

const inputStyle = { padding: "10px 12px", borderRadius: 12, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", fontSize: 14 };
const thStyle = { textAlign: "left", padding: "0 0 12px", fontSize: 12, color: OWNER_COLORS.muted };
const tdStyle = { padding: "12px 8px 12px 0", borderTop: `1px solid ${OWNER_COLORS.line}`, fontSize: 13, verticalAlign: "top" };
const primaryBtnStyle = { padding: "10px 14px", borderRadius: 12, border: "none", background: OWNER_COLORS.accent, color: "#fff", fontWeight: 700, cursor: "pointer" };
const secondaryBtnStyle = { padding: "10px 14px", borderRadius: 12, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", fontWeight: 700, cursor: "pointer" };
const linkBtnStyle = { padding: 0, border: "none", background: "none", color: OWNER_COLORS.accent, fontWeight: 700, cursor: "pointer", fontSize: 12, textAlign: "left" };
