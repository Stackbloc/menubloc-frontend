import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createCrmCluster, getCrmClusters } from "../../lib/crmApi.js";
import CrmClusterCloneModal from "./CrmClusterCloneModal.jsx";
import {
  Badge,
  CRM_COLORS,
  CrmCard,
  CrmPage,
  DataTable,
  ErrorBanner,
  SuccessBanner,
  formatDateTime,
} from "./CrmShared.jsx";

const DEFAULT_FILTERS = {
  q: "",
  type: "",
  city: "",
  state: "",
  sort: "updated_at",
  direction: "desc",
};

const EMPTY_CREATE = {
  name: "",
  slug: "",
  type: "university",
  city: "",
  state: "",
  address_line1: "",
  lat: "",
  lng: "",
  short_description: "",
  description: "",
  website: "",
  hero_image_url: "",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: `1px solid ${CRM_COLORS.line}`,
  background: "#fff",
  fontSize: 14,
};

const buttonStyle = {
  border: "none",
  background: CRM_COLORS.accent,
  color: "#fff",
  borderRadius: 12,
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/['‘’"`“”]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default function CrmClusterList() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [clusters, setClusters] = useState([]);
  const [types, setTypes] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_CREATE);
  const [cloneSource, setCloneSource] = useState(null);

  async function loadClusters(nextFilters = filters) {
    try {
      setError("");
      const json = await getCrmClusters(nextFilters);
      setClusters(Array.isArray(json.clusters) ? json.clusters : []);
      setTypes(Array.isArray(json.types) ? json.types : []);
    } catch (err) {
      setError(err.message || "Unable to load clusters");
    }
  }

  useEffect(() => {
    loadClusters(filters);
  }, [filters]);

  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "Cluster",
        render: (row) => (
          <div>
            <Link to={`/crm/clusters/${row.id}`} style={{ color: CRM_COLORS.accent, fontWeight: 700, textDecoration: "none" }}>
              {row.name}
            </Link>
            <div style={{ marginTop: 4, fontSize: 12, color: CRM_COLORS.muted }}>{row.slug}</div>
          </div>
        ),
      },
      {
        key: "type",
        label: "Type",
        render: (row) => <Badge type="account" value={row.type} />,
      },
      { key: "city", label: "City" },
      { key: "state", label: "State" },
      { key: "restaurant_count", label: "Restaurants" },
      {
        key: "status",
        label: "Status",
        render: (row) => (
          <Badge
            type="account"
            value={row.is_active === false ? "inactive" : row.is_public === false ? "private" : "active"}
          />
        ),
      },
      {
        key: "updated_at",
        label: "Last Updated",
        render: (row) => formatDateTime(row.updated_at),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) => (
          <button type="button" onClick={() => setCloneSource(row)} style={{ ...buttonStyle, padding: "8px 10px", fontSize: 12 }}>
            Clone
          </button>
        ),
      },
    ],
    []
  );

  async function handleCreate(event) {
    event.preventDefault();
    setCreating(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        ...form,
        slug: form.slug || slugify(form.name),
        lat: form.lat === "" ? null : Number(form.lat),
        lng: form.lng === "" ? null : Number(form.lng),
      };
      const json = await createCrmCluster(payload);
      setSuccess(`Created cluster “${json.cluster?.name || form.name}”.`);
      setForm(EMPTY_CREATE);
      await loadClusters(filters);
    } catch (err) {
      setError(err.message || "Unable to create cluster");
    } finally {
      setCreating(false);
    }
  }

  return (
    <CrmPage title="Cluster Manager">
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18, marginBottom: 18 }}>
        <CrmCard title="Clusters" subtitle="Create and maintain destination clusters without SQL.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, marginBottom: 16 }}>
            <input
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              placeholder="Search name, slug, city"
              style={inputStyle}
            />
            <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} style={inputStyle}>
              <option value="">All types</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              value={`${filters.sort}:${filters.direction}`}
              onChange={(e) => {
                const [sort, direction] = e.target.value.split(":");
                setFilters({ ...filters, sort, direction });
              }}
              style={inputStyle}
            >
              <option value="updated_at:desc">Recently updated</option>
              <option value="name:asc">Name</option>
              <option value="state:asc">State</option>
              <option value="city:asc">City</option>
              <option value="restaurant_count:desc">Restaurant count</option>
            </select>
            <input
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              placeholder="City"
              style={inputStyle}
            />
            <input
              value={filters.state}
              onChange={(e) => setFilters({ ...filters, state: e.target.value })}
              placeholder="State"
              style={inputStyle}
            />
          </div>
          <DataTable columns={columns} rows={clusters} emptyLabel="No clusters yet. Create one to get started." />
        </CrmCard>

        <CrmCard title="Create Cluster" subtitle="Required: name, city, state. Slug auto-fills from name.">
          <form onSubmit={handleCreate} style={{ display: "grid", gap: 10 }}>
            <input
              required
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  name: e.target.value,
                  slug: prev.slug && prev.slug !== slugify(prev.name) ? prev.slug : slugify(e.target.value),
                }))
              }
              placeholder="Name"
              style={inputStyle}
            />
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
              placeholder="Slug"
              style={inputStyle}
            />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={inputStyle}>
              {(types.length ? types : ["university", "entertainment_complex", "mall", "airport", "stadium", "casino", "other"]).map(
                (type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                )
              )}
            </select>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: 8 }}>
              <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" style={inputStyle} />
              <input required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase().slice(0, 2) })} placeholder="ST" style={inputStyle} />
            </div>
            <input value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} placeholder="Address" style={inputStyle} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="Latitude" style={inputStyle} />
              <input value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} placeholder="Longitude" style={inputStyle} />
            </div>
            <textarea
              value={form.short_description}
              onChange={(e) => setForm({ ...form, short_description: e.target.value })}
              placeholder="Short description"
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description"
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
            <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="Website" style={inputStyle} />
            <input
              value={form.hero_image_url}
              onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })}
              placeholder="Hero image URL (optional)"
              style={inputStyle}
            />
            <button type="submit" disabled={creating} style={buttonStyle}>
              {creating ? "Creating…" : "Create Cluster"}
            </button>
          </form>
        </CrmCard>
      </div>

      {cloneSource ? (
        <CrmClusterCloneModal
          source={cloneSource}
          types={types}
          onClose={() => setCloneSource(null)}
          onCreated={() => {
            setCloneSource(null);
            loadClusters(filters);
          }}
        />
      ) : null}
    </CrmPage>
  );
}
