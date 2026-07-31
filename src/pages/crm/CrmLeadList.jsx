import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  addCrmSeedRestaurantLead,
  createCrmLead,
  getCrmGeoCities,
  getCrmLeads,
  searchCrmRestaurants,
} from "../../lib/crmApi.js";
import { US_STATE_OPTIONS } from "../../lib/locationEntryPolicy.js";
import {
  Badge,
  CrmCard,
  CrmPage,
  DataTable,
  ErrorBanner,
  FilterLink,
  SuccessBanner,
  formatDateTime,
} from "./CrmShared.jsx";

const DEFAULT_FILTERS = {
  search: "",
  status: "",
  pipeline_stage: "",
  pipeline_stages: "",
  source: "",
  campus: "",
  priority: "",
  city: "",
  state: "",
  overdue_only: "",
  open_only: "",
  won_this_month: "",
  lost_this_month: "",
  sort: "updated_at_desc",
  page: 1,
  page_size: 25,
};

const FILTER_KEYS = Object.keys(DEFAULT_FILTERS);
const LIVE_SEARCH_MIN = 2;
const SEARCH_DEBOUNCE_MS = 300;

function filtersFromSearchParams(searchParams) {
  const next = { ...DEFAULT_FILTERS };
  for (const key of FILTER_KEYS) {
    const value = searchParams.get(key);
    if (value === null || value === "") continue;
    if (key === "page" || key === "page_size") {
      const n = Number.parseInt(value, 10);
      next[key] = Number.isFinite(n) && n > 0 ? n : DEFAULT_FILTERS[key];
    } else {
      next[key] = value;
    }
  }
  // Campus proximity lists default to closest-first unless sort was explicit in the URL.
  if (next.campus && !searchParams.get("sort")) {
    next.sort = "miles_to_campus_asc";
  }
  return next;
}

function searchParamsFromFilters(filters) {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = filters[key];
    if (value === undefined || value === null || value === "") continue;
    if (key === "page" && Number(value) === 1) continue;
    if (key === "page_size" && Number(value) === DEFAULT_FILTERS.page_size) continue;
    if (key === "sort" && value === DEFAULT_FILTERS.sort) continue;
    params.set(key, String(value));
  }
  return params;
}

function filtersEqual(a, b) {
  return FILTER_KEYS.every((key) => String(a[key] ?? "") === String(b[key] ?? ""));
}

export default function CrmLeadList({ mode = "leads" }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilters = useMemo(() => filtersFromSearchParams(searchParams), []);
  const [filters, setFilters] = useState(initialFilters);
  const [debouncedSearch, setDebouncedSearch] = useState(String(initialFilters.search || "").trim());
  const [data, setData] = useState({ leads: [], restaurants: [], pagination: { page: 1, total: 0, page_size: 25 } });
  const [cities, setCities] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [addingId, setAddingId] = useState(null);
  const [newLead, setNewLead] = useState({ lead_name: "", source: "manual", priority: "normal" });

  const campusLeadMode = Boolean(filters.campus) || filters.source === "campus_proximity";
  const liveMode = !campusLeadMode && String(debouncedSearch || "").trim().length >= LIVE_SEARCH_MIN;

  useEffect(() => {
    const fromUrl = filtersFromSearchParams(searchParams);
    setFilters((current) => (filtersEqual(current, fromUrl) ? current : fromUrl));
  }, [searchParams]);

  useEffect(() => {
    const nextParams = searchParamsFromFilters(filters);
    const current = searchParams.toString();
    const next = nextParams.toString();
    if (current !== next) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [filters, searchParams, setSearchParams]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(String(filters.search || "").trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [filters.search]);

  useEffect(() => {
    if (!filters.state) {
      setCities([]);
      return;
    }
    let active = true;
    getCrmGeoCities(filters.state)
      .then((json) => {
        if (!active) return;
        setCities(json.cities || []);
      })
      .catch(() => {
        if (active) setCities([]);
      });
    return () => { active = false; };
  }, [filters.state]);

  useEffect(() => {
    const queryFilters = { ...filters, search: debouncedSearch };
    const useLive = !campusLeadMode && String(debouncedSearch || "").trim().length >= LIVE_SEARCH_MIN;
    if (useLive) {
      loadRestaurants(queryFilters);
    } else {
      loadLeads({ ...filters, search: debouncedSearch });
    }
  }, [
    debouncedSearch,
    filters.status,
    filters.pipeline_stage,
    filters.pipeline_stages,
    filters.source,
    filters.campus,
    filters.priority,
    filters.city,
    filters.state,
    filters.overdue_only,
    filters.open_only,
    filters.won_this_month,
    filters.lost_this_month,
    filters.sort,
    filters.page,
    filters.page_size,
  ]);

  async function loadLeads(nextFilters) {
    try {
      setError("");
      const json = await getCrmLeads(nextFilters);
      setData({
        leads: json.leads || [],
        restaurants: [],
        pagination: json.pagination || { page: 1, total: 0, page_size: 25 },
      });
    } catch (err) {
      setError(err.message || "Unable to load leads");
    }
  }

  async function loadRestaurants(nextFilters) {
    try {
      setError("");
      const json = await searchCrmRestaurants({
        q: nextFilters.search,
        city: nextFilters.city,
        state: nextFilters.state,
        page: nextFilters.page,
        page_size: nextFilters.page_size,
      });
      setData({
        leads: [],
        restaurants: json.restaurants || [],
        pagination: json.pagination || { page: 1, total: 0, page_size: 25 },
      });
    } catch (err) {
      setError(err.message || "Unable to search restaurants");
    }
  }

  function updateFilters(patch) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  async function handleCreateLead(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      await createCrmLead(newLead);
      setNewLead({ lead_name: "", source: "manual", priority: "normal" });
      setSuccess("Lead created.");
      if (liveMode) {
        loadRestaurants({ ...filters, search: debouncedSearch });
      } else {
        loadLeads({ ...filters, search: "" });
      }
    } catch (err) {
      setError(err.message || "Unable to create lead");
    }
  }

  async function handleAddRestaurantLead(restaurantId) {
    setAddingId(restaurantId);
    setError("");
    setSuccess("");
    try {
      const result = await addCrmSeedRestaurantLead(restaurantId);
      setSuccess(result.created ? "Lead created from restaurant profile." : "Opened existing lead for restaurant.");
      setData((current) => ({
        ...current,
        restaurants: (current.restaurants || []).map((row) => (
          row.restaurant_id === restaurantId
            ? {
              ...row,
              crm_lead_id: result.lead_id,
              crm_status: row.crm_status || "new",
              crm_pipeline_stage: row.crm_pipeline_stage || "new",
            }
            : row
        )),
      }));
    } catch (err) {
      setError(err.message || "Unable to add lead");
    } finally {
      setAddingId(null);
    }
  }

  const activeDrilldown = [
    filters.open_only === "true" ? "Open leads only" : null,
    filters.won_this_month === "true" ? "Won this month" : null,
    filters.lost_this_month === "true" ? "Lost this month" : null,
    filters.pipeline_stages ? `Stages: ${filters.pipeline_stages}` : null,
  ].filter(Boolean);

  const showCampusCols = Boolean(filters.campus) || filters.source === "campus_proximity";

  const listTitle = liveMode
    ? "Live restaurant profiles"
    : (mode === "companies" ? "Restaurant List" : "Lead List");
  const listSubtitle = liveMode
    ? `${data.pagination.total || 0} matching restaurants`
    : `${data.pagination.total || 0} total ${mode === "companies" ? "restaurants" : "leads"}`;

  return (
    <CrmPage title={mode === "companies" ? "CRM Restaurants" : "CRM Leads"}>
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      {activeDrilldown.length ? (
        <div style={{ marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {activeDrilldown.map((label) => (
            <span key={label} style={chipStyle}>{label}</span>
          ))}
          <button
            type="button"
            onClick={() => updateFilters({
              open_only: "",
              won_this_month: "",
              lost_this_month: "",
              pipeline_stages: "",
              page: 1,
            })}
            style={secondaryButtonStyle}
          >
            Clear drill-down
          </button>
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: mode === "companies" ? "1fr" : "minmax(0, 1.6fr) minmax(0, 1fr)", gap: 18, marginBottom: 18 }}>
        <CrmCard title="Lead Filters">
          <div style={filterGridStyle}>
            <input
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value, page: 1 })}
              placeholder={campusLeadMode ? "Search leads by name / phone / email" : "Search live restaurants (2+ chars)"}
              style={inputStyle}
            />
            <select value={filters.pipeline_stage} onChange={(e) => updateFilters({ pipeline_stage: e.target.value, pipeline_stages: "", page: 1 })} style={inputStyle}>
              <option value="">All stages</option>
              {["new", "qualified", "outreach", "engaged", "demo", "trial", "negotiation", "won", "lost"].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <select value={filters.status} onChange={(e) => updateFilters({ status: e.target.value, open_only: "", page: 1 })} style={inputStyle}>
              <option value="">All statuses</option>
              {["new", "contacted", "interested", "demo_scheduled", "trial", "won", "lost", "inactive"].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <label style={filterLabelStyle}>
              Source
              <select
                value={filters.source}
                onChange={(e) => updateFilters({
                  source: e.target.value,
                  campus: e.target.value === "campus_proximity" ? filters.campus : "",
                  page: 1,
                })}
                style={inputStyle}
              >
                <option value="">All sources</option>
                <option value="campus_proximity">campus_proximity</option>
                <option value="seed_explorer">seed_explorer</option>
                <option value="manual">manual</option>
                <option value="restaurant_snapshot">restaurant_snapshot</option>
              </select>
            </label>
            <label style={filterLabelStyle}>
              Campus
              <select
                value={filters.campus}
                onChange={(e) => updateFilters({
                  campus: e.target.value,
                  source: e.target.value ? "campus_proximity" : (filters.source === "campus_proximity" ? "" : filters.source),
                  sort: e.target.value
                    ? (filters.sort === "updated_at_desc" || !filters.sort ? "miles_to_campus_asc" : filters.sort)
                    : (filters.sort === "miles_to_campus_asc" || filters.sort === "miles_to_campus_desc" ? "updated_at_desc" : filters.sort),
                  page: 1,
                })}
                style={inputStyle}
              >
                <option value="">All campuses</option>
                {["USC", "UCLA", "Cal State LA", "Loyola (LMU)", "LATTC", "LA City College"].map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </label>
            <select value={filters.priority} onChange={(e) => updateFilters({ priority: e.target.value, page: 1 })} style={inputStyle}>
              <option value="">All priorities</option>
              {["low", "normal", "high", "urgent"].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <label style={filterLabelStyle}>
              State
              <select
                value={filters.state}
                onChange={(e) => updateFilters({ state: e.target.value, city: "", page: 1 })}
                style={inputStyle}
              >
                <option value="">All states</option>
                {US_STATE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>
            <label style={filterLabelStyle}>
              City
              <select
                value={filters.city}
                onChange={(e) => updateFilters({ city: e.target.value, page: 1 })}
                style={inputStyle}
                disabled={!filters.state}
              >
                <option value="">{filters.state ? (cities.length ? "All cities" : "No cities found") : "Choose a state first"}</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </label>
            <select value={filters.overdue_only} onChange={(e) => updateFilters({ overdue_only: e.target.value, page: 1 })} style={inputStyle}>
              <option value="">Any follow-up status</option>
              <option value="true">Overdue only</option>
            </select>
            <label style={filterLabelStyle}>
              Sort
              <select value={filters.sort} onChange={(e) => updateFilters({ sort: e.target.value, page: 1 })} style={inputStyle}>
                <option value="miles_to_campus_asc">Closest to campus</option>
                <option value="miles_to_campus_desc">Farthest from campus</option>
                <option value="updated_at_desc">Recently updated</option>
                <option value="created_at_desc">Newest created</option>
                <option value="next_follow_up_at_asc">Next follow-up first</option>
                <option value="priority_desc">Highest priority first</option>
              </select>
            </label>
          </div>
        </CrmCard>

        {mode !== "companies" ? <CrmCard title="Quick Create Lead" subtitle="Manual internal lead entry">
          <form onSubmit={handleCreateLead} style={{ display: "grid", gap: 10 }}>
            <input value={newLead.lead_name} onChange={(e) => setNewLead({ ...newLead, lead_name: e.target.value })} placeholder="Lead name" style={inputStyle} />
            <input value={newLead.contact_name || ""} onChange={(e) => setNewLead({ ...newLead, contact_name: e.target.value })} placeholder="Contact name" style={inputStyle} />
            <input value={newLead.email || ""} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} placeholder="Email" style={inputStyle} />
            <input value={newLead.phone || ""} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} placeholder="Phone" style={inputStyle} />
            <button type="submit" style={primaryButtonStyle}>Create lead</button>
          </form>
        </CrmCard> : null}
      </div>

      <CrmCard title={listTitle} subtitle={listSubtitle}>
        {liveMode ? (
          <DataTable
            rows={data.restaurants || []}
            keyField="restaurant_id"
            emptyLabel="No live restaurants found for the current filters."
            columns={[
              {
                key: "restaurant_name",
                label: "Restaurant",
                render: (row) => <strong>{row.restaurant_name}</strong>,
              },
              {
                key: "market",
                label: "Market",
                render: (row) => [row.city, row.state].filter(Boolean).join(", ") || "—",
              },
              {
                key: "claim_status",
                label: "Claim",
                render: (row) => <Badge type="account" value={row.claim_status || "unclaimed"} />,
              },
              {
                key: "restaurant_menu_status",
                label: "Menu",
                render: (row) => row.restaurant_menu_status || "—",
              },
              {
                key: "crm_status",
                label: "CRM",
                render: (row) => (row.crm_status
                  ? <Badge type="status" value={row.crm_status} />
                  : "Not added"),
              },
              {
                key: "actions",
                label: "Actions",
                render: (row) => (
                  row.crm_lead_id
                    ? <Link to={`/crm/leads/${row.crm_lead_id}`} style={linkStyle}>Open lead</Link>
                    : (
                      <button
                        type="button"
                        disabled={addingId === row.restaurant_id}
                        onClick={() => handleAddRestaurantLead(row.restaurant_id)}
                        style={secondaryButtonStyle}
                      >
                        {addingId === row.restaurant_id ? "Adding…" : "Add lead"}
                      </button>
                    )
                ),
              },
            ]}
          />
        ) : (
          <DataTable
            rows={data.leads || []}
            emptyLabel="No CRM leads found for the current filters."
            columns={[
              {
                key: "lead_name",
                label: "Restaurant",
                render: (row) => (
                  <div>
                    <Link to={`/crm/leads/${row.id}`} style={linkStyle}>{row.restaurant_name || row.lead_name}</Link>
                    {row.restaurant_name && row.lead_name && row.restaurant_name !== row.lead_name ? (
                      <div style={{ marginTop: 4, fontSize: 12 }}>
                        <Link to={`/crm/leads/${row.id}`} style={{ ...linkStyle, fontWeight: 600, color: "#64748b" }}>{row.lead_name}</Link>
                      </div>
                    ) : null}
                  </div>
                ),
              },
              ...(showCampusCols ? [
                {
                  key: "nearest_campus",
                  label: "Campus",
                  render: (row) => row.nearest_campus || "—",
                },
                {
                  key: "miles_to_campus",
                  label: "Miles",
                  render: (row) => (row.miles_to_campus != null ? Number(row.miles_to_campus).toFixed(2) : "—"),
                },
              ] : []),
              {
                key: "email",
                label: "Contact email",
                render: (row) => (row.email
                  ? <a href={`mailto:${row.email}`} style={linkStyle}>{row.email}</a>
                  : "—"),
              },
              {
                key: "market",
                label: "Market",
                render: (row) => {
                  const label = row.market_name || row.market_code || [row.account_city, row.account_state].filter(Boolean).join(", ") || "—";
                  if (label === "—") return "—";
                  const params = new URLSearchParams();
                  if (row.account_city) params.set("city", row.account_city);
                  if (row.account_state) params.set("state", row.account_state);
                  if (!params.toString() && row.market_name) params.set("search", row.market_name);
                  return params.toString()
                    ? <FilterLink to={`/crm/leads?${params.toString()}`}>{label}</FilterLink>
                    : label;
                },
              },
              {
                key: "status",
                label: "Status",
                render: (row) => (row.status
                  ? (
                    <FilterLink to={`/crm/leads?status=${encodeURIComponent(row.status)}`}>
                      <Badge type="status" value={row.status} />
                    </FilterLink>
                  )
                  : "—"),
              },
              {
                key: "source",
                label: "Source",
                render: (row) => (row.source
                  ? <FilterLink to={`/crm/leads?source=${encodeURIComponent(row.source)}`}>{row.source}</FilterLink>
                  : "—"),
              },
              {
                key: "last_activity_at",
                label: "Last activity",
                render: (row) => (
                  <FilterLink to={`/crm/leads/${row.id}`}>
                    {formatDateTime(row.last_activity_at || row.updated_at)}
                  </FilterLink>
                ),
              },
              {
                key: "next_follow_up_at",
                label: "Next follow-up",
                render: (row) => (
                  <FilterLink to={`/crm/leads/${row.id}`}>
                    {formatDateTime(row.next_follow_up_at)}
                  </FilterLink>
                ),
              },
              {
                key: "subscription_plan",
                label: "Plan",
                render: (row) => {
                  const plan = row.subscription_plan || row.subscription_plan_code;
                  if (!plan) return "—";
                  return <FilterLink to="/crm/subscriptions">{plan}</FilterLink>;
                },
              },
            ]}
          />
        )}

        <Pagination pagination={data.pagination} onPageChange={(page) => updateFilters({ page })} />
      </CrmCard>
    </CrmPage>
  );
}

function Pagination({ pagination, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil((pagination?.total || 0) / (pagination?.page_size || 25)));
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
      <div style={{ color: "#64748b", fontSize: 13 }}>
        Page {pagination?.page || 1} of {totalPages}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button disabled={(pagination?.page || 1) <= 1} onClick={() => onPageChange((pagination?.page || 1) - 1)} style={secondaryButtonStyle}>Previous</button>
        <button disabled={(pagination?.page || 1) >= totalPages} onClick={() => onPageChange((pagination?.page || 1) + 1)} style={secondaryButtonStyle}>Next</button>
      </div>
    </div>
  );
}

const filterLabelStyle = {
  display: "grid",
  gap: 6,
  color: "#334155",
  fontSize: 12,
  fontWeight: 700,
};

const filterGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 10,
};

const inputStyle = {
  width: "100%",
  border: "1px solid #d9e0ea",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  background: "#fff",
  color: "#0f1720",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const primaryButtonStyle = {
  background: "#194b3a",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  background: "#fff",
  color: "#0f1720",
  border: "1px solid #d9e0ea",
  borderRadius: 10,
  padding: "8px 14px",
  fontSize: 13,
  cursor: "pointer",
};

const linkStyle = {
  color: "#194b3a",
  fontWeight: 700,
  textDecoration: "none",
};

const chipStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 999,
  background: "#eaf4f0",
  color: "#194b3a",
  fontSize: 12,
  fontWeight: 700,
};
