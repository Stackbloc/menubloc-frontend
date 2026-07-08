import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  addCrmClusterRestaurant,
  checkCrmClusterDuplicates,
  getCrmCluster,
  getCrmClusterPreview,
  previewCrmClusterRadius,
  removeCrmClusterRestaurant,
  reorderCrmClusterRestaurants,
  replaceCrmClusterRestaurants,
  searchCrmClusterRestaurants,
  updateCrmCluster,
} from "../../lib/crmApi.js";
import CrmClusterCloneModal from "./CrmClusterCloneModal.jsx";
import {
  Badge,
  CRM_COLORS,
  CrmCard,
  CrmPage,
  ErrorBanner,
  StatTile,
  SuccessBanner,
  formatDateTime,
} from "./CrmShared.jsx";

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

const secondaryButtonStyle = {
  ...buttonStyle,
  background: "#fff",
  color: CRM_COLORS.ink,
  border: `1px solid ${CRM_COLORS.line}`,
};

export default function CrmClusterDetail() {
  const { id } = useParams();
  const [cluster, setCluster] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [stats, setStats] = useState(null);
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const [radiusMiles, setRadiusMiles] = useState("0.5");
  const [radiusCandidates, setRadiusCandidates] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [previewing, setPreviewing] = useState(false);

  const [manualQuery, setManualQuery] = useState("");
  const [manualMenuStatus, setManualMenuStatus] = useState("");
  const [manualResults, setManualResults] = useState([]);
  const [duplicateWarnings, setDuplicateWarnings] = useState([]);
  const [preview, setPreview] = useState(null);
  const [showClone, setShowClone] = useState(false);

  async function load() {
    setError("");
    const json = await getCrmCluster(id);
    setCluster(json.cluster);
    setRestaurants(Array.isArray(json.restaurants) ? json.restaurants : []);
    setStats(json.stats || null);
    setTypes(Array.isArray(json.types) ? json.types : []);
    setForm({
      name: json.cluster?.name || "",
      slug: json.cluster?.slug || "",
      type: json.cluster?.type || "other",
      city: json.cluster?.city || "",
      state: json.cluster?.state || "",
      address_line1: json.cluster?.address_line1 || "",
      lat: json.cluster?.lat ?? "",
      lng: json.cluster?.lng ?? "",
      short_description: json.cluster?.short_description || "",
      description: json.cluster?.description || "",
      website: json.cluster?.website || "",
      hero_image_url: json.cluster?.hero_image_url || "",
      legal_display_name: json.cluster?.legal_display_name || "",
      disclaimer_override: json.cluster?.disclaimer_override || "",
      is_public: json.cluster?.is_public !== false,
      is_active: json.cluster?.is_active !== false,
    });
    setSelectedIds(new Set((json.restaurants || []).map((row) => Number(row.restaurant_id))));
  }

  useEffect(() => {
    load().catch((err) => setError(err.message || "Unable to load cluster"));
  }, [id]);

  const orderedIds = useMemo(
    () => restaurants.map((row) => Number(row.restaurant_id)),
    [restaurants]
  );

  function toggleSelected(restaurantId, checked) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(Number(restaurantId));
      else next.delete(Number(restaurantId));
      return next;
    });
  }

  async function handleSaveMetadata(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        ...form,
        lat: form.lat === "" ? null : Number(form.lat),
        lng: form.lng === "" ? null : Number(form.lng),
      };
      const json = await updateCrmCluster(id, payload);
      setCluster(json.cluster);
      setSuccess("Cluster details saved.");
      await load();
    } catch (err) {
      setError(err.message || "Unable to save cluster");
    } finally {
      setSaving(false);
    }
  }

  async function handleRadiusPreview() {
    setPreviewing(true);
    setError("");
    try {
      const json = await previewCrmClusterRadius(id, { radius_miles: Number(radiusMiles) });
      setRadiusCandidates(Array.isArray(json.candidates) ? json.candidates : []);
      const next = new Set(selectedIds);
      for (const row of json.candidates || []) {
        if (row.already_assigned) next.add(Number(row.restaurant_id));
      }
      setSelectedIds(next);
    } catch (err) {
      setError(err.message || "Unable to preview radius");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleConfirmRadiusSelection() {
    setError("");
    setSuccess("");
    try {
      const ids = Array.from(selectedIds);
      const dup = await checkCrmClusterDuplicates(id, ids);
      setDuplicateWarnings(dup.warnings || []);
      const json = await replaceCrmClusterRestaurants(id, ids);
      setRestaurants(json.restaurants || []);
      setDuplicateWarnings(json.duplicate_warnings || dup.warnings || []);
      setSuccess(`Saved ${json.restaurants?.length || 0} assigned restaurants.`);
      await load();
    } catch (err) {
      setError(err.message || "Unable to save restaurant assignments");
    }
  }

  async function handleManualSearch(event) {
    event.preventDefault();
    setError("");
    try {
      const json = await searchCrmClusterRestaurants(id, {
        q: manualQuery,
        menu_status: manualMenuStatus || undefined,
        city: cluster?.city,
        state: cluster?.state,
      });
      setManualResults(Array.isArray(json.restaurants) ? json.restaurants : []);
    } catch (err) {
      setError(err.message || "Unable to search restaurants");
    }
  }

  async function handleAddRestaurant(restaurantId) {
    setError("");
    setSuccess("");
    try {
      const json = await addCrmClusterRestaurant(id, restaurantId);
      setRestaurants(json.restaurants || []);
      setDuplicateWarnings(json.duplicate_warnings || []);
      setSuccess("Restaurant added.");
      await load();
    } catch (err) {
      setError(err.message || "Unable to add restaurant");
    }
  }

  async function handleRemoveRestaurant(restaurantId) {
    setError("");
    setSuccess("");
    try {
      const json = await removeCrmClusterRestaurant(id, restaurantId);
      setRestaurants(json.restaurants || []);
      setSuccess("Restaurant removed.");
      await load();
    } catch (err) {
      setError(err.message || "Unable to remove restaurant");
    }
  }

  async function moveRestaurant(index, direction) {
    const next = [...orderedIds];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const tmp = next[index];
    next[index] = next[target];
    next[target] = tmp;
    setError("");
    try {
      const json = await reorderCrmClusterRestaurants(id, next);
      setRestaurants(json.restaurants || []);
      setSuccess("Featured order saved.");
    } catch (err) {
      setError(err.message || "Unable to reorder restaurants");
    }
  }

  async function loadPreview() {
    setError("");
    try {
      const json = await getCrmClusterPreview(id);
      setPreview(json);
    } catch (err) {
      setError(err.message || "Unable to load preview");
    }
  }

  if (!form || !cluster) {
    return (
      <CrmPage title="Cluster Manager">
        <ErrorBanner message={error} />
        <div style={{ color: CRM_COLORS.muted }}>Loading cluster…</div>
      </CrmPage>
    );
  }

  return (
    <CrmPage
      title={cluster.name}
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => setShowClone(true)} style={secondaryButtonStyle}>
            Clone Cluster
          </button>
          <Link to="/clusters/admin" style={{ ...secondaryButtonStyle, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
            Back to list
          </Link>
          {preview?.cluster?.public_path ? (
            <a href={preview.cluster.public_path} target="_blank" rel="noreferrer" style={{ ...secondaryButtonStyle, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
              Open public page
            </a>
          ) : null}
        </div>
      }
    >
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      {duplicateWarnings.length > 0 ? (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 12, background: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa" }}>
          <strong>Duplicate overlap warning</strong>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
            {duplicateWarnings.map((warning) => (
              <li key={warning.cluster_id}>{warning.message}</li>
            ))}
          </ul>
          <div style={{ marginTop: 6, fontSize: 13 }}>Creation/assignment is not blocked — review before publishing.</div>
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 12, marginBottom: 18 }}>
        <StatTile label="Restaurants" value={stats?.restaurant_count ?? restaurants.length} />
        <StatTile label="Published Menus" value={stats?.published_menus ?? "—"} />
        <StatTile label="Menu Items" value={stats?.menu_items ?? "—"} />
        <StatTile label="Avg Items / Restaurant" value={stats?.average_menu_items_per_restaurant ?? "—"} />
        <StatTile label="Last Updated" value={formatDateTime(stats?.last_updated || cluster.updated_at)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18, marginBottom: 18 }}>
        <CrmCard title="Edit Cluster" subtitle="Updates metadata only. Restaurant membership is managed below.">
          <form onSubmit={handleSaveMetadata} style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" style={inputStyle} />
              <input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Slug" style={inputStyle} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 90px", gap: 8 }}>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={inputStyle}>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" style={inputStyle} />
              <input required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase().slice(0, 2) })} placeholder="ST" style={inputStyle} />
            </div>
            <input value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} placeholder="Address" style={inputStyle} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="Latitude" style={inputStyle} />
              <input value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} placeholder="Longitude" style={inputStyle} />
            </div>
            <input value={form.legal_display_name} onChange={(e) => setForm({ ...form, legal_display_name: e.target.value })} placeholder="Legal display name" style={inputStyle} />
            <textarea value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} placeholder="Short description" rows={2} style={{ ...inputStyle, resize: "vertical" }} />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="Website" style={inputStyle} />
            <input value={form.hero_image_url} onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })} placeholder="Hero image URL" style={inputStyle} />
            <textarea value={form.disclaimer_override} onChange={(e) => setForm({ ...form, disclaimer_override: e.target.value })} placeholder="Disclaimer override (optional)" rows={2} style={{ ...inputStyle, resize: "vertical" }} />
            <div style={{ display: "flex", gap: 16, fontSize: 14 }}>
              <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" checked={form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })} />
                Public
              </label>
              <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Active
              </label>
            </div>
            <button type="submit" disabled={saving} style={buttonStyle}>
              {saving ? "Saving…" : "Save Cluster"}
            </button>
          </form>
        </CrmCard>

        <CrmCard
          title="Cluster Preview"
          subtitle="Informational preview of public membership and metadata."
          action={
            <button type="button" onClick={loadPreview} style={secondaryButtonStyle}>
              Refresh Preview
            </button>
          }
        >
          {preview ? (
            <div style={{ display: "grid", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{preview.cluster?.area_name || preview.cluster?.name}</div>
                <div style={{ color: CRM_COLORS.muted, marginTop: 4 }}>
                  {preview.cluster?.type} · {preview.cluster?.city}, {preview.cluster?.state}
                </div>
              </div>
              <div style={{ fontSize: 14, color: CRM_COLORS.ink, lineHeight: 1.5 }}>
                {preview.cluster?.short_description || preview.cluster?.description || "No description yet."}
              </div>
              <div style={{ fontSize: 13, color: CRM_COLORS.muted }}>
                {preview.stats?.restaurant_count || 0} restaurants · {preview.stats?.published_menus || 0} published menus ·{" "}
                {preview.stats?.menu_items || 0} menu items
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                {(preview.restaurants || []).slice(0, 8).map((row) => (
                  <div key={row.restaurant_id} style={{ fontSize: 13, borderBottom: `1px solid ${CRM_COLORS.line}`, paddingBottom: 6 }}>
                    {row.restaurant_name}
                    <span style={{ color: CRM_COLORS.muted }}> · {row.published_menu ? "menu ready" : "no published menu"}</span>
                  </div>
                ))}
              </div>
              {preview.cluster?.public_path ? (
                <a href={preview.cluster.public_path} target="_blank" rel="noreferrer" style={{ color: CRM_COLORS.accent, fontWeight: 700 }}>
                  {preview.cluster.public_path}
                </a>
              ) : null}
            </div>
          ) : (
            <div style={{ color: CRM_COLORS.muted }}>Click Refresh Preview to load public-facing cluster summary.</div>
          )}
        </CrmCard>
      </div>

      <CrmCard title="Automatic Assignment" subtitle="Enter a radius, preview candidates, then confirm before saving.">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <input
            value={radiusMiles}
            onChange={(e) => setRadiusMiles(e.target.value)}
            placeholder="Radius miles"
            style={{ ...inputStyle, maxWidth: 140 }}
          />
          <button type="button" onClick={handleRadiusPreview} disabled={previewing} style={buttonStyle}>
            {previewing ? "Previewing…" : "Preview restaurants"}
          </button>
          <button type="button" onClick={handleConfirmRadiusSelection} style={secondaryButtonStyle}>
            Confirm selected ({selectedIds.size})
          </button>
        </div>
        {radiusCandidates.length === 0 ? (
          <div style={{ color: CRM_COLORS.muted }}>No preview loaded yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["", "Restaurant", "Distance", "Address", "Published Menu"].map((label) => (
                    <th key={label} style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, color: CRM_COLORS.muted, borderBottom: `1px solid ${CRM_COLORS.line}` }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {radiusCandidates.map((row) => (
                  <tr key={row.restaurant_id} style={{ borderBottom: `1px solid ${CRM_COLORS.line}` }}>
                    <td style={{ padding: 10 }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(Number(row.restaurant_id))}
                        onChange={(e) => toggleSelected(row.restaurant_id, e.target.checked)}
                      />
                    </td>
                    <td style={{ padding: 10, fontWeight: 650 }}>{row.restaurant_name}</td>
                    <td style={{ padding: 10 }}>{row.distance_miles} mi</td>
                    <td style={{ padding: 10 }}>{[row.address_line1, row.city, row.state].filter(Boolean).join(", ")}</td>
                    <td style={{ padding: 10 }}>
                      <Badge type="account" value={row.published_menu ? "published" : "missing"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CrmCard>

      <div style={{ height: 18 }} />

      <CrmCard title="Manual Assignment" subtitle="Search CK restaurants and add/remove individually.">
        <form onSubmit={handleManualSearch} style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <input
            value={manualQuery}
            onChange={(e) => setManualQuery(e.target.value)}
            placeholder="Search name, address, city, slug"
            style={{ ...inputStyle, maxWidth: 360 }}
          />
          <select value={manualMenuStatus} onChange={(e) => setManualMenuStatus(e.target.value)} style={{ ...inputStyle, maxWidth: 180 }}>
            <option value="">Any menu status</option>
            <option value="published">Published / menu ready</option>
            <option value="unpublished">No published menu</option>
          </select>
          <button type="submit" style={buttonStyle}>
            Search
          </button>
        </form>
        {manualResults.length === 0 ? (
          <div style={{ color: CRM_COLORS.muted }}>Search to find restaurants to assign.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {manualResults.map((row) => (
              <div
                key={row.restaurant_id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: `1px solid ${CRM_COLORS.line}`,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{row.restaurant_name}</div>
                  <div style={{ fontSize: 13, color: CRM_COLORS.muted }}>
                    {[row.address_line1, row.city, row.state].filter(Boolean).join(", ")} · {row.slug}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Badge type="account" value={row.published_menu ? "published" : "missing"} />
                  {row.already_assigned ? (
                    <button type="button" onClick={() => handleRemoveRestaurant(row.restaurant_id)} style={secondaryButtonStyle}>
                      Remove
                    </button>
                  ) : (
                    <button type="button" onClick={() => handleAddRestaurant(row.restaurant_id)} style={buttonStyle}>
                      Add
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CrmCard>

      <div style={{ height: 18 }} />

      <CrmCard title="Featured Order" subtitle="Up/down controls persist sort_order used by public cluster restaurant lists.">
        {restaurants.length === 0 ? (
          <div style={{ color: CRM_COLORS.muted }}>No restaurants assigned yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {restaurants.map((row, index) => (
              <div
                key={row.restaurant_id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "70px 1fr auto",
                  gap: 12,
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: `1px solid ${CRM_COLORS.line}`,
                }}
              >
                <div style={{ display: "flex", gap: 6 }}>
                  <button type="button" onClick={() => moveRestaurant(index, -1)} disabled={index === 0} style={secondaryButtonStyle}>
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveRestaurant(index, 1)}
                    disabled={index === restaurants.length - 1}
                    style={secondaryButtonStyle}
                  >
                    ↓
                  </button>
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {index + 1}. {row.restaurant_name}
                  </div>
                  <div style={{ fontSize: 13, color: CRM_COLORS.muted }}>
                    {[row.address_line1, row.city, row.state].filter(Boolean).join(", ")}
                  </div>
                </div>
                <button type="button" onClick={() => handleRemoveRestaurant(row.restaurant_id)} style={secondaryButtonStyle}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </CrmCard>

      {showClone ? (
        <CrmClusterCloneModal
          source={cluster}
          types={types}
          onClose={() => setShowClone(false)}
          onCreated={() => setShowClone(false)}
        />
      ) : null}
    </CrmPage>
  );
}
