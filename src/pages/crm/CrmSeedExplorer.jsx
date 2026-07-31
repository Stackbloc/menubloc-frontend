import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  addCrmSeedRestaurantLead,
  getCrmSeedCampusRestaurants,
  getCrmSeedCampuses,
  getCrmSeedMarkets,
  getCrmSeedRestaurants,
} from "../../lib/crmApi.js";
import { Badge, CrmCard, CrmPage, DataTable, ErrorBanner } from "./CrmShared.jsx";

const PAGE_SIZE = 500;
const MARKET_PAGE_SIZE = 50;

const DEFAULT_CAMPUSES = [
  "USC",
  "UCLA",
  "Cal State LA",
  "Loyola (LMU)",
  "LATTC",
  "LA City College",
];

export default function CrmSeedExplorer() {
  const [mode, setMode] = useState("campus");
  const [campuses, setCampuses] = useState(DEFAULT_CAMPUSES.map((name) => ({ name })));
  const [selectedCampuses, setSelectedCampuses] = useState(() => new Set(DEFAULT_CAMPUSES));
  const [markets, setMarkets] = useState([]);
  const [filters, setFilters] = useState({
    market_id: "",
    search: "",
    page: 1,
    page_size: PAGE_SIZE,
    radius_miles: 3,
  });
  const [data, setData] = useState({ restaurants: [], pagination: { page: 1, page_size: PAGE_SIZE, total: 0 } });
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const [error, setError] = useState("");

  const campusParam = useMemo(
    () => Array.from(selectedCampuses).join(","),
    [selectedCampuses]
  );

  useEffect(() => {
    getCrmSeedCampuses()
      .then((json) => {
        const next = json.campuses?.length ? json.campuses : DEFAULT_CAMPUSES.map((name) => ({ name }));
        setCampuses(next);
        setSelectedCampuses(new Set(next.map((c) => c.name)));
      })
      .catch(() => {});
    getCrmSeedMarkets()
      .then((json) => {
        const nextMarkets = json.markets || [];
        setMarkets(nextMarkets);
        if (nextMarkets[0]) setFilters((current) => ({ ...current, market_id: String(nextMarkets[0].id) }));
      })
      .catch((err) => setError(err.message || "Unable to load markets"));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    const request = mode === "campus"
      ? getCrmSeedCampusRestaurants({
          campus: campusParam,
          search: filters.search,
          page: filters.page,
          page_size: PAGE_SIZE,
          radius_miles: filters.radius_miles,
        })
      : filters.market_id
        ? getCrmSeedRestaurants({
            market_id: filters.market_id,
            search: filters.search,
            page: filters.page,
            page_size: MARKET_PAGE_SIZE,
          })
        : Promise.resolve({ restaurants: [], pagination: { page: 1, page_size: MARKET_PAGE_SIZE, total: 0 } });

    request
      .then((json) => { if (active) setData(json); })
      .catch((err) => { if (active) setError(err.message || "Unable to load restaurants"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [mode, campusParam, filters.market_id, filters.search, filters.page, filters.radius_miles]);

  function toggleCampus(name) {
    setSelectedCampuses((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next.size ? next : new Set(current);
    });
    setFilters((current) => ({ ...current, page: 1 }));
  }

  async function addLead(restaurantId) {
    setAddingId(restaurantId);
    setError("");
    try {
      const result = await addCrmSeedRestaurantLead(restaurantId);
      setData((current) => ({
        ...current,
        restaurants: current.restaurants.map((restaurant) => restaurant.restaurant_id === restaurantId
          ? { ...restaurant, crm_lead_id: result.lead_id, crm_status: restaurant.crm_status || "new", crm_pipeline_stage: restaurant.crm_pipeline_stage || "new" }
          : restaurant),
      }));
    } catch (err) {
      setError(err.message || "Unable to add lead");
    } finally {
      setAddingId(null);
    }
  }

  const campusColumns = [
    {
      key: "restaurant_name",
      label: "Restaurant",
      render: (row) => (
        row.slug
          ? <a href={`/restaurants/${encodeURIComponent(row.slug)}`} target="_blank" rel="noreferrer" style={linkStyle}>{row.restaurant_name}</a>
          : <strong>{row.restaurant_name}</strong>
      ),
    },
    { key: "nearest_campus", label: "Campus" },
    {
      key: "miles_to_campus",
      label: "Miles",
      render: (row) => (row.miles_to_campus != null ? Number(row.miles_to_campus).toFixed(2) : "—"),
    },
    { key: "city", label: "City" },
    { key: "menu_status", label: "Menu Status", render: (row) => <Badge type="account" value={menuStatus(row)} /> },
    { key: "claim_status", label: "Claim Status", render: (row) => <Badge type="account" value={row.claim_status} /> },
    { key: "crm_status", label: "CRM Status", render: (row) => row.crm_status ? <Badge type="status" value={row.crm_status} /> : "Not added" },
    { key: "actions", label: "Actions", render: (row) => <SeedAction row={row} addingId={addingId} onAdd={addLead} /> },
  ];

  const marketColumns = [
    { key: "restaurant_name", label: "Restaurant", render: (row) => <strong>{row.restaurant_name}</strong> },
    { key: "market_name", label: "Market" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "ownership_type", label: "Franchise / Independent", render: renderOwnership },
    { key: "menu_status", label: "Menu Status", render: (row) => <Badge type="account" value={menuStatus(row)} /> },
    { key: "claim_status", label: "Claim Status", render: (row) => <Badge type="account" value={row.claim_status} /> },
    { key: "crm_status", label: "CRM Status", render: (row) => row.crm_status ? <Badge type="status" value={row.crm_status} /> : "Not added" },
    { key: "actions", label: "Actions", render: (row) => <SeedAction row={row} addingId={addingId} onAdd={addLead} /> },
  ];

  return (
    <CrmPage title="Seed Explorer">
      <ErrorBanner message={error} />
      <CrmCard
        title="Seeded restaurants"
        subtitle={mode === "campus"
          ? "Browse restaurants by campus proximity. Select campuses, then add leads to the CRM pipeline."
          : "Browse core restaurant data by geo market. Restaurants enter the CRM pipeline only when Add Lead is selected."}
      >
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <button type="button" onClick={() => setMode("campus")} style={mode === "campus" ? primaryChipStyle : chipButtonStyle}>Campus proximity</button>
          <button type="button" onClick={() => setMode("market")} style={mode === "market" ? primaryChipStyle : chipButtonStyle}>Geo market</button>
        </div>

        <div style={filterStyle}>
          {mode === "campus" ? (
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ ...labelStyle, marginBottom: 8 }}>Campuses (multi-select)</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {campuses.map((campus) => {
                  const active = selectedCampuses.has(campus.name);
                  return (
                    <button
                      key={campus.name}
                      type="button"
                      onClick={() => toggleCampus(campus.name)}
                      style={active ? primaryChipStyle : chipButtonStyle}
                    >
                      {campus.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : markets.length > 1 ? (
            <label style={labelStyle}>
              Market
              <select
                value={filters.market_id}
                onChange={(event) => setFilters({ ...filters, market_id: event.target.value, page: 1 })}
                style={inputStyle}
              >
                {markets.map((market) => (
                  <option key={market.id} value={market.id}>{market.name}, {market.state} ({market.restaurant_count})</option>
                ))}
              </select>
            </label>
          ) : (
            <div style={{ color: "#64748b", fontSize: 13 }}>
              {markets.length === 1
                ? `Only one geo market available (${markets[0].name}). Use Campus proximity for multi-campus browse.`
                : "No active geo markets. Use Campus proximity."}
            </div>
          )}
          <label style={labelStyle}>
            Restaurant name
            <input
              type="search"
              value={filters.search}
              onChange={(event) => setFilters({ ...filters, search: event.target.value, page: 1 })}
              placeholder="Search restaurants"
              style={inputStyle}
            />
          </label>
        </div>

        <div style={{ marginTop: 18, maxHeight: "70vh", overflow: "auto" }}>
          <DataTable
            rows={data.restaurants || []}
            keyField="restaurant_id"
            emptyLabel={loading ? "Loading restaurants…" : "No restaurants match these filters."}
            columns={mode === "campus" ? campusColumns : marketColumns}
          />
        </div>

        <Pagination
          pagination={data.pagination}
          onPageChange={(page) => setFilters({ ...filters, page })}
        />
      </CrmCard>
    </CrmPage>
  );
}

function renderOwnership(row) {
  const ownership = String(row.ownership_type || "unknown").replaceAll("_", " ");
  return row.chain_name ? `${ownership} · ${row.chain_name}` : ownership;
}

function menuStatus(row) {
  if (!Number(row.menu_count)) {
    const restaurantStatus = String(row.restaurant_menu_status || "").trim();
    return restaurantStatus && restaurantStatus.toLowerCase() !== "none" ? restaurantStatus : "No menu";
  }
  const statuses = Array.isArray(row.menu_statuses) ? row.menu_statuses.filter(Boolean) : [];
  if (statuses.length) return statuses.join(", ");
  return row.restaurant_menu_status || `${row.menu_count} menu${Number(row.menu_count) === 1 ? "" : "s"}`;
}

function SeedAction({ row, addingId, onAdd }) {
  if (row.crm_lead_id) return <Link to={`/crm/leads/${row.crm_lead_id}`} style={linkStyle}>{row.already_customer ? "Already Customer" : "View Lead"}</Link>;
  if (row.already_customer) return <span style={{ color: "#166534", fontWeight: 700 }}>Already Customer</span>;
  return (
    <button type="button" onClick={() => onAdd(row.restaurant_id)} disabled={addingId === row.restaurant_id} style={buttonStyle}>
      {addingId === row.restaurant_id ? "Adding…" : "+ Add Lead"}
    </button>
  );
}

function Pagination({ pagination, onPageChange }) {
  const pageSize = pagination?.page_size || PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil((pagination?.total || 0) / pageSize));
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
      <span style={{ color: "#64748b", fontSize: 13 }}>{pagination?.total || 0} restaurants · Page {pagination?.page || 1} of {totalPages}</span>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" disabled={(pagination?.page || 1) <= 1} onClick={() => onPageChange(pagination.page - 1)} style={pagerStyle}>Previous</button>
        <button type="button" disabled={(pagination?.page || 1) >= totalPages} onClick={() => onPageChange(pagination.page + 1)} style={pagerStyle}>Next</button>
      </div>
    </div>
  );
}

const filterStyle = { display: "grid", gridTemplateColumns: "minmax(220px, 1fr) minmax(280px, 2fr)", gap: 14 };
const labelStyle = { display: "grid", gap: 6, color: "#334155", fontSize: 12, fontWeight: 700 };
const inputStyle = { width: "100%", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: 10, padding: "10px 12px", background: "#fff", color: "#0f1720" };
const linkStyle = { color: "#194b3a", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" };
const buttonStyle = { border: 0, borderRadius: 10, padding: "8px 11px", background: "#194b3a", color: "#fff", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" };
const pagerStyle = { border: "1px solid #cbd5e1", borderRadius: 9, padding: "8px 11px", background: "#fff", color: "#334155", fontWeight: 700 };
const chipButtonStyle = { border: "1px solid #cbd5e1", borderRadius: 999, padding: "8px 12px", background: "#fff", color: "#334155", fontWeight: 700, cursor: "pointer" };
const primaryChipStyle = { ...chipButtonStyle, background: "#194b3a", color: "#fff", borderColor: "#194b3a" };
