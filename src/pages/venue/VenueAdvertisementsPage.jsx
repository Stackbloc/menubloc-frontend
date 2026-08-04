import React, { useEffect, useState } from "react";
import VenueLayout, { PageCard, SectionTitle, VENUE_COLORS } from "./VenueLayout.jsx";
import {
  createAdvertisement,
  deleteAdvertisement,
  listAdInventory,
  listAdvertisements,
  updateAdvertisement,
  uploadAdImage,
} from "../../lib/venueApi.js";

const emptyForm = {
  inventory_id: "",
  name: "",
  headline: "",
  description: "",
  image_url: "",
  mobile_image_url: "",
  destination_url: "",
  cta_text: "",
  priority: 0,
  start_date: "",
  end_date: "",
  active: true,
};

export default function VenueAdvertisementsPage() {
  const [rows, setRows] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function reload() {
    const [ads, inv] = await Promise.all([listAdvertisements(), listAdInventory()]);
    setRows(ads.advertisements || []);
    setInventory(inv.inventory || []);
  }

  useEffect(() => {
    reload().catch((err) => setError(err.message || "Failed to load advertisements"));
  }, []);

  function startCreate() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      inventory_id: inventory[0]?.id || "",
    });
    setShowForm(true);
    setError("");
  }

  function startEdit(row) {
    setEditingId(row.id);
    setForm({
      inventory_id: row.inventory_id,
      name: row.name || "",
      headline: row.headline || "",
      description: row.description || "",
      image_url: row.image_url || "",
      mobile_image_url: row.mobile_image_url || "",
      destination_url: row.destination_url || "",
      cta_text: row.cta_text || "",
      priority: row.priority ?? 0,
      start_date: row.start_date ? String(row.start_date).slice(0, 10) : "",
      end_date: row.end_date ? String(row.end_date).slice(0, 10) : "",
      active: row.active !== false,
    });
    setShowForm(true);
    setError("");
  }

  async function handleUpload(field, file) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const result = await uploadAdImage(file);
      setForm((f) => ({ ...f, [field]: result.photo_url }));
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = {
        ...form,
        inventory_id: Number(form.inventory_id),
        priority: Number(form.priority) || 0,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      };
      if (editingId) {
        await updateAdvertisement(editingId, body);
      } else {
        await createAdvertisement(body);
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
    if (!window.confirm("Delete this advertisement?")) return;
    setBusy(true);
    try {
      await deleteAdvertisement(id);
      await reload();
    } catch (err) {
      setError(err.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <VenueLayout
      title="Advertisements"
      actions={
        <button
          type="button"
          onClick={startCreate}
          disabled={!inventory.length}
          style={{
            border: "none",
            background: VENUE_COLORS.accent,
            color: "#fff",
            borderRadius: 10,
            padding: "10px 14px",
            fontWeight: 700,
            cursor: inventory.length ? "pointer" : "not-allowed",
            opacity: inventory.length ? 1 : 0.5,
          }}
        >
          New advertisement
        </button>
      }
    >
      <PageCard>
        <SectionTitle
          title="Advertisements"
          subtitle="Manually create ads and assign them to inventory. Highest priority wins; ties rotate randomly."
        />
        {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
        {!inventory.length ? (
          <p style={{ color: VENUE_COLORS.muted }}>
            Create advertising inventory first, then add advertisements.
          </p>
        ) : null}

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
              Inventory
              <select
                required
                value={form.inventory_id}
                onChange={(e) => setForm((f) => ({ ...f, inventory_id: e.target.value }))}
                style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
              >
                <option value="">Select inventory</option>
                {inventory.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.inventory_key})
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
              Headline (optional)
              <input
                value={form.headline}
                onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
              />
            </label>
            <label>
              Description (optional)
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
                rows={2}
              />
            </label>
            <label>
              Desktop image URL
              <input
                required
                value={form.image_url}
                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
              />
            </label>
            <label>
              Upload desktop image
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleUpload("image_url", e.target.files?.[0])}
                style={{ display: "block", marginTop: 4 }}
              />
            </label>
            <label>
              Mobile image URL (optional)
              <input
                value={form.mobile_image_url}
                onChange={(e) => setForm((f) => ({ ...f, mobile_image_url: e.target.value }))}
                style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
              />
            </label>
            <label>
              Upload mobile image
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleUpload("mobile_image_url", e.target.files?.[0])}
                style={{ display: "block", marginTop: 4 }}
              />
            </label>
            <label>
              Destination URL
              <input
                type="url"
                value={form.destination_url}
                onChange={(e) => setForm((f) => ({ ...f, destination_url: e.target.value }))}
                style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
              />
            </label>
            <label>
              CTA text (optional)
              <input
                value={form.cta_text}
                onChange={(e) => setForm((f) => ({ ...f, cta_text: e.target.value }))}
                style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
              />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <label>
                Priority
                <input
                  type="number"
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
                />
              </label>
              <label>
                Start date
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                  style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
                />
              </label>
              <label>
                End date
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
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
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 14px" }}>
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        {rows.length === 0 ? (
          <p style={{ color: VENUE_COLORS.muted }}>No advertisements yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: `1px solid ${VENUE_COLORS.line}` }}>
                  <th style={{ padding: 8 }}>Name</th>
                  <th style={{ padding: 8 }}>Inventory</th>
                  <th style={{ padding: 8 }}>Priority</th>
                  <th style={{ padding: 8 }}>Dates</th>
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
                    <td style={{ padding: 8 }}>{row.priority}</td>
                    <td style={{ padding: 8 }}>
                      {row.start_date || "—"} → {row.end_date || "—"}
                    </td>
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
