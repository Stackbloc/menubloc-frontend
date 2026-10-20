import React, { useEffect, useState } from "react";
import { OWNER_COLORS } from "./OwnerLayout.jsx";
import { inputStyle } from "./ownerMenuEditorComponents.jsx";
import {
  addMenuConsoleMleLocation,
  listMenuConsoleAvailableClusters,
  listMenuConsoleMleLocations,
  removeMenuConsoleMleLocation,
  setMenuConsoleMleLocationClusters,
  setMenuConsoleMleMainLocation,
  updateMenuConsoleMleLocation,
} from "../../lib/ownerApi.js";

function clusterName(c) {
  const where = [c?.city, c?.state].filter(Boolean).join(", ");
  return where ? `${c.name} — ${where}` : c?.name || `Cluster #${c?.id}`;
}

/** Clusters this location is in, with add / remove. */
function LocationClusters({ location, options, disabled, onChange }) {
  const ids = (location.cluster_ids || []).map(Number);
  const byId = new Map(options.map((c) => [Number(c.id), c]));
  const addable = options.filter((c) => !ids.includes(Number(c.id)));
  return (
    <div data-testid="mle-location-clusters" style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 8 }}>
      {ids.map((id) => (
        <span
          key={id}
          data-testid="mle-location-cluster-chip"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 6px 3px 10px", borderRadius: 999, background: OWNER_COLORS.accentSoft, color: OWNER_COLORS.accent, fontSize: 12, fontWeight: 700 }}
        >
          {clusterName(byId.get(id) || { id })}
          <button
            type="button"
            disabled={disabled}
            aria-label="Remove from cluster"
            onClick={() => onChange(ids.filter((x) => x !== id))}
            style={{ border: "none", background: "none", color: OWNER_COLORS.accent, cursor: "pointer", fontSize: 14, lineHeight: 1, padding: "0 4px" }}
          >
            ×
          </button>
        </span>
      ))}
      <select
        value=""
        disabled={disabled || !addable.length}
        data-testid="mle-location-cluster-add"
        onChange={(e) => {
          const id = Number(e.target.value);
          if (id) onChange([...ids, id]);
        }}
        style={{ ...inputStyle, width: "auto", minWidth: 200, padding: "5px 8px", fontSize: 12 }}
      >
        <option value="">{ids.length ? "Add another cluster…" : "Add to cluster…"}</option>
        {addable.map((c) => (
          <option key={c.id} value={c.id}>{clusterName(c)}</option>
        ))}
      </select>
    </div>
  );
}

const FIELDS = [
  { key: "display_name", label: "Location name", placeholder: "e.g. Poké Me Westwood", wide: true },
  { key: "address_line1", label: "Street address *", wide: true },
  { key: "city", label: "City *" },
  { key: "state", label: "State *" },
  { key: "postal_code", label: "ZIP *" },
  { key: "phone", label: "Phone" },
];

const EMPTY = { display_name: "", address_line1: "", city: "", state: "", postal_code: "", phone: "" };

const label = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: OWNER_COLORS.muted,
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

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

function addressLine(l) {
  const cityLine = [l.city, [l.state, l.postal_code].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return [l.address_line1, cityLine].filter(Boolean).join(" · ");
}

function formFrom(l) {
  return Object.fromEntries(Object.keys(EMPTY).map((k) => [k, l?.[k] || ""]));
}

function LocationForm({ value, onChange, onSubmit, onCancel, busy, submitLabel }) {
  return (
    <div style={{ marginTop: 10, padding: 12, borderRadius: 10, background: "#f8fafc", border: `1px solid ${OWNER_COLORS.line}` }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
        {FIELDS.map((f) => (
          <div key={f.key} style={f.wide ? { gridColumn: "1 / -1" } : undefined}>
            <label style={label}>{f.label}</label>
            <input
              value={value[f.key]}
              placeholder={f.placeholder || ""}
              onChange={(e) => onChange({ ...value, [f.key]: e.target.value })}
              style={inputStyle}
              disabled={busy}
              data-testid={`mle-location-${f.key}`}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          type="button"
          disabled={busy}
          onClick={onSubmit}
          data-testid="mle-location-save"
          style={{ ...smallBtn, border: "none", background: OWNER_COLORS.accent, color: "#fff", cursor: busy ? "wait" : "pointer" }}
        >
          {busy ? "Saving…" : submitLabel}
        </button>
        <button type="button" disabled={busy} onClick={onCancel} style={smallBtn}>
          Cancel
        </button>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: OWNER_COLORS.muted }}>
        Map coordinates are looked up from the address.
      </div>
    </div>
  );
}

/**
 * MLE → its locations (kitchens). Add, edit, choose the main one, remove.
 * Lives in Restaurant Manager → Details under Business type.
 */
export default function OwnerMleLocations({ restaurant, onChanged }) {
  const rid = restaurant?.id;
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [clusterOptions, setClusterOptions] = useState([]);

  useEffect(() => {
    let cancelled = false;
    listMenuConsoleAvailableClusters({ limit: 500 })
      .then((d) => { if (!cancelled) setClusterOptions(d?.clusters || []); })
      .catch(() => { if (!cancelled) setClusterOptions([]); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!rid) return undefined;
    let cancelled = false;
    setLoading(true);
    setErr("");
    setNotice("");
    setAdding(false);
    setEditingId(null);
    listMenuConsoleMleLocations(rid)
      .then((d) => { if (!cancelled) setLocations(d?.locations || []); })
      .catch((ex) => { if (!cancelled) setErr(ex?.payload?.error || ex?.message || "Could not load locations."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [rid]);

  async function run(action, doneText) {
    setBusy(true);
    setErr("");
    setNotice("");
    try {
      const d = await action();
      setLocations(d?.locations || []);
      setNotice(d?.geocoded ? `${doneText} · map pin found` : doneText);
      setAdding(false);
      setEditingId(null);
      onChanged?.();
      return true;
    } catch (ex) {
      setErr(ex?.payload?.error || ex?.message || "Could not save.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function openAdd() {
    setEditingId(null);
    setForm({ ...EMPTY, state: restaurant?.state || "", city: restaurant?.city || "" });
    setAdding(true);
  }

  function openEdit(l) {
    setAdding(false);
    setForm(formFrom(l));
    setEditingId(l.location_id);
  }

  if (!rid) return null;

  return (
    <div
      data-testid="mle-locations-panel"
      style={{ marginTop: 10, border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 10, padding: 12 }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={label}>Locations</div>
          <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
            Every kitchen of this restaurant. They share one menu and one profile. Put each one in its own clusters.
          </div>
        </div>
        {!adding && (
          <button type="button" data-testid="mle-location-add" onClick={openAdd} disabled={busy} style={smallBtn}>
            + Add location
          </button>
        )}
      </div>

      {loading ? <div style={{ marginTop: 10, fontSize: 12, color: OWNER_COLORS.muted }}>Loading locations…</div> : null}

      <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
        {locations.map((l) => (
          <div
            key={l.location_id}
            data-testid="mle-location-row"
            style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: OWNER_COLORS.ink }}>
                  {l.display_name || restaurant.restaurant_name}
                  {l.is_primary ? (
                    <span style={{ marginLeft: 8, padding: "2px 8px", borderRadius: 999, background: OWNER_COLORS.accentSoft, color: OWNER_COLORS.accent, fontSize: 11 }}>
                      Main
                    </span>
                  ) : null}
                </div>
                <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 2 }}>
                  {addressLine(l) || "No address"}
                  {l.lat == null || l.lng == null ? " · no map pin" : ""}
                </div>
              </div>
              {editingId !== l.location_id && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button type="button" disabled={busy} onClick={() => openEdit(l)} style={smallBtn}>Edit</button>
                  {!l.is_primary && (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => run(() => setMenuConsoleMleMainLocation(rid, l.location_id), "Main location changed")}
                        style={smallBtn}
                      >
                        Make main
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        data-testid="mle-location-remove"
                        onClick={() => {
                          if (!window.confirm(`Remove ${l.display_name || "this location"}?`)) return;
                          run(() => removeMenuConsoleMleLocation(rid, l.location_id), "Location removed");
                        }}
                        style={{ ...smallBtn, color: "#991b1b", borderColor: "#fca5a5" }}
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            {editingId !== l.location_id && (
              <LocationClusters
                location={l}
                options={clusterOptions}
                disabled={busy}
                onChange={(ids) => run(() => setMenuConsoleMleLocationClusters(rid, l.location_id, ids), "Clusters saved")}
              />
            )}
            {editingId === l.location_id && (
              <LocationForm
                value={form}
                onChange={setForm}
                busy={busy}
                submitLabel="Save location"
                onCancel={() => setEditingId(null)}
                onSubmit={() => run(() => updateMenuConsoleMleLocation(rid, l.location_id, form), "Location saved")}
              />
            )}
          </div>
        ))}
        {!loading && !locations.length && !err ? (
          <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>No locations yet. Add the first kitchen.</div>
        ) : null}
      </div>

      {adding && (
        <LocationForm
          value={form}
          onChange={setForm}
          busy={busy}
          submitLabel="Add location"
          onCancel={() => setAdding(false)}
          onSubmit={() => run(() => addMenuConsoleMleLocation(rid, form), "Location added")}
        />
      )}

      {err ? <div style={{ marginTop: 8, fontSize: 12, color: "#991b1b" }}>{err}</div> : null}
      {notice ? <div data-testid="mle-location-notice" style={{ marginTop: 8, fontSize: 12, color: "#166534" }}>{notice}</div> : null}
    </div>
  );
}
