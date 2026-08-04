import React, { useEffect, useState } from "react";
import VenueLayout, { PageCard, SectionTitle, VENUE_COLORS } from "./VenueLayout.jsx";
import {
  createAdInventory,
  deleteAdInventory,
  getVenueClusters,
  getVenueMeta,
  listAdInventory,
  updateAdInventory,
} from "../../lib/venueApi.js";

const emptyForm = {
  cluster_id: "",
  name: "",
  inventory_key: "",
  description: "",
  inventory_type: "Hero Banner",
  page_region: "cluster_landing_hero",
  width: "",
  height: "",
  device_type: "all",
  max_advertisements: 1,
  active: true,
};

export default function VenueInventoryPage() {
  const [rows, setRows] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [meta, setMeta] = useState({ inventory_types: [], page_regions: [], device_types: [] });
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function reload() {
    const [inv, cl, m] = await Promise.all([
      listAdInventory(),
      getVenueClusters(),
      getVenueMeta(),
    ]);
    setRows(inv.inventory || []);
    setClusters(cl.clusters || []);
    setMeta(m);
  }

  useEffect(() => {
    reload().catch((err) => setError(err.message || "Failed to load inventory"));
  }, []);

  function startCreate() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      cluster_id: clusters[0]?.id || "",
      inventory_type: meta.inventory_types?.[0] || "Hero Banner",
      page_region: meta.page_regions?.[0] || "cluster_landing_hero",
    });
    setShowForm(true);
    setError("");
  }

  function startEdit(row) {
    setEditingId(row.id);
    setForm({
      cluster_id: row.cluster_id,
      name: row.name || "",
      inventory_key: row.inventory_key || "",
      description: row.description || "",
      inventory_type: row.inventory_type,
      page_region: row.page_region,
      width: row.width ?? "",
      height: row.height ?? "",
      device_type: row.device_type || "all",
      max_advertisements: row.max_advertisements || 1,
      active: row.active !== false,
    });
    setShowForm(true);
    setError("");
  }

  async function handleSave(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = {
        ...form,
        cluster_id: Number(form.cluster_id),
        width: form.width === "" ? null : Number(form.width),
        height: form.height === "" ? null : Number(form.height),
        max_advertisements: Number(form.max_advertisements) || 1,
      };
      if (editingId) {
        await updateAdInventory(editingId, body);
      } else {
        await createAdInventory(body);
      }
      setShowForm(false);
      await reload();
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this inventory slot?")) return;
    setBusy(true);
    try {
      await deleteAdInventory(id);
      await reload();
    } catch (err) {
      setError(err.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <VenueLayout
      title="Advertising Inventory"
      actions={
        <button
          type="button"
          onClick={startCreate}
          style={{
            border: "none",
            background: VENUE_COLORS.accent,
            color: "#fff",
            borderRadius: 10,
            padding: "10px 14px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          New inventory
        </button>
      }
    >
      <PageCard>
        <SectionTitle
          title="Inventory"
          subtitle="Define advertising locations within your clusters. Frontend requests ads by inventory key."
        />
        {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}

        {showForm ? (
          <form
            onSubmit={handleSave}
            style={{
              display: "grid",
              gap: 12,
              marginBottom: 24,
              padding: 16,
              border: `1px solid ${VENUE_COLORS.line}`,
              borderRadius: 14,
              background: "#fff",
            }}
          >
            <label>
              Cluster
              <select
                required
                disabled={Boolean(editingId)}
                value={form.cluster_id}
                onChange={(e) => setForm((f) => ({ ...f, cluster_id: e.target.value }))}
                style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
              >
                <option value="">Select cluster</option>
                {clusters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Name
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
              />
            </label>
            <label>
              Inventory key
              <input
                required
                value={form.inventory_key}
                onChange={(e) => setForm((f) => ({ ...f, inventory_key: e.target.value }))}
                placeholder="LALIVE_HOME_HERO"
                style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
              />
            </label>
            <label>
              Description
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
                rows={2}
              />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label>
                Inventory type
                <select
                  value={form.inventory_type}
                  onChange={(e) => setForm((f) => ({ ...f, inventory_type: e.target.value }))}
                  style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
                >
                  {(meta.inventory_types || []).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Page region
                <select
                  value={form.page_region}
                  onChange={(e) => setForm((f) => ({ ...f, page_region: e.target.value }))}
                  style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
                >
                  {(meta.page_regions || []).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              <label>
                Width
                <input
                  type="number"
                  value={form.width}
                  onChange={(e) => setForm((f) => ({ ...f, width: e.target.value }))}
                  style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
                />
              </label>
              <label>
                Height
                <input
                  type="number"
                  value={form.height}
                  onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))}
                  style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
                />
              </label>
              <label>
                Device
                <select
                  value={form.device_type}
                  onChange={(e) => setForm((f) => ({ ...f, device_type: e.target.value }))}
                  style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
                >
                  {(meta.device_types || ["all", "desktop", "mobile"]).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Max ads
                <input
                  type="number"
                  min={1}
                  value={form.max_advertisements}
                  onChange={(e) => setForm((f) => ({ ...f, max_advertisements: e.target.value }))}
                  style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
                />
              </label>
            </div>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              Active
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={busy} style={{ padding: "10px 14px", fontWeight: 700 }}>
                {busy ? "Saving…" : editingId ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{ padding: "10px 14px" }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        {rows.length === 0 ? (
          <p style={{ color: VENUE_COLORS.muted }}>No inventory yet. Create your first slot.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: `1px solid ${VENUE_COLORS.line}` }}>
                  <th style={{ padding: 8 }}>Name</th>
                  <th style={{ padding: 8 }}>Key</th>
                  <th style={{ padding: 8 }}>Cluster</th>
                  <th style={{ padding: 8 }}>Type</th>
                  <th style={{ padding: 8 }}>Region</th>
                  <th style={{ padding: 8 }}>Active</th>
                  <th style={{ padding: 8 }} />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} style={{ borderBottom: `1px solid ${VENUE_COLORS.line}` }}>
                    <td style={{ padding: 8 }}>{row.name}</td>
                    <td style={{ padding: 8 }}>
                      <code>{row.inventory_key}</code>
                    </td>
                    <td style={{ padding: 8 }}>{row.cluster_name}</td>
                    <td style={{ padding: 8 }}>{row.inventory_type}</td>
                    <td style={{ padding: 8 }}>{row.page_region}</td>
                    <td style={{ padding: 8 }}>{row.active ? "Yes" : "No"}</td>
                    <td style={{ padding: 8, whiteSpace: "nowrap" }}>
                      <button type="button" onClick={() => startEdit(row)} style={{ marginRight: 8 }}>
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(row.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageCard>
    </VenueLayout>
  );
}
