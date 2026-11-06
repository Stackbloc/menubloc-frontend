import React, { useEffect, useState } from "react";
import WallBlockTile from "../../components/clusterWall/WallBlockTile.jsx";
import { getOwnerWallHouse, saveOwnerWallHouse } from "../../lib/ownerContentReportsApi.js";
import { formatApiErrorForDisplay } from "../../lib/apiErrorDisplay.js";
import { WALL_FONTS, WALL_INKS, WALL_SIZES, WALL_THEMES } from "../../lib/clusterWallStyles.js";
import "../../components/clusterWall/clusterWall.css";

const field = { display: "grid", gap: 4, fontSize: 13, fontWeight: 700, color: "#374151" };
const input = { border: "1px solid #d1d5db", borderRadius: 4, padding: "7px 9px", font: "14px system-ui" };
const btn = { borderRadius: 4, padding: "7px 14px", fontSize: 14, fontWeight: 700, cursor: "pointer", background: "#111827", color: "#fff", border: 0 };

/**
 * Owner → Reports → the official Menuply brick on the USC Wall (Andre 2026-11-06, mig 0395).
 * One per Wall; shows once among community posts on menuply.com/clusters/walls/usc and in the app's
 * full Wall; a tap opens USC food. Edit the words and look here; switch it off without deleting it.
 */
export default function OwnerWallHouseBrick({ slug = "usc" }) {
  const [form, setForm] = useState(null);
  const [meta, setMeta] = useState({ migrationPending: false, foodPath: "", updatedAt: null, updatedBy: null });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getOwnerWallHouse(slug)
      .then((d) => {
        const s = d.settings || {};
        setForm({ active: s.active !== false, body: s.body || "", size: s.size || "medium", style: s.style || {}, link_path: s.link_path || "" });
        setMeta({ migrationPending: Boolean(s.migration_pending), foodPath: d.food_path || "", updatedAt: s.updated_at, updatedBy: s.updated_by });
      })
      .catch((err) => setError(formatApiErrorForDisplay(err)));
  }, [slug]);

  if (!form) return error ? <p role="alert" style={{ color: "#b42318" }}>{error}</p> : null;

  const setStyle = (key, value) => setForm((f) => ({ ...f, style: { ...f.style, [key]: value } }));
  const preview = { public_id: `menuply-${slug}`, house: true, kind: "text", size: form.size, body: form.body || " ", style: form.style, tag: "MENUPLY", author: {} };

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const out = await saveOwnerWallHouse(slug, { ...form, link_path: form.link_path.trim() || null });
      setMeta((m) => ({ ...m, updatedAt: out.settings?.updated_at, updatedBy: out.settings?.updated_by }));
      setStatus(form.active ? "Saved. It shows on the Wall now." : "Saved. The Menuply brick is off.");
    } catch (err) {
      setError(formatApiErrorForDisplay(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section data-testid="owner-wall-house" style={{ marginBottom: 20, border: "1px solid #e5e7eb", borderRadius: 4, padding: 14 }}>
      <h2 style={{ fontSize: 18, margin: "0 0 4px" }}>Menuply brick on the {slug.toUpperCase()} Wall</h2>
      <p style={{ color: "#5c665f", margin: "0 0 12px", fontSize: 14 }}>
        One official brick, shown once among students&apos; posts at a random spot. A tap opens{" "}
        {form.link_path || meta.foodPath || "the USC food page"}.
      </p>
      {meta.migrationPending ? (
        <p role="status" style={{ color: "#92400e", fontSize: 14 }}>
          The Wall shows the default brick below. Saving changes needs migration 0395.
        </p>
      ) : null}
      <form onSubmit={save} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 240px", gap: 16, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 10 }}>
          <label style={{ ...field, display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
            Show the Menuply brick on the Wall
          </label>
          <label style={field}>
            Words
            <textarea rows={3} maxLength={400} style={input} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
          </label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <label style={field}>
              Size
              <select style={input} value={form.size} onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}>
                {WALL_SIZES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </label>
            <label style={field}>
              Surface
              <select style={input} value={form.style.theme || "slate"} onChange={(e) => setStyle("theme", e.target.value)}>
                {Object.entries(WALL_THEMES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
              </select>
            </label>
            <label style={field}>
              Letters
              <select style={input} value={form.style.font || "loud"} onChange={(e) => setStyle("font", e.target.value)}>
                {Object.entries(WALL_FONTS).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}
              </select>
            </label>
            <label style={field}>
              Paint
              <select style={input} value={form.style.ink || "auto"} onChange={(e) => setStyle("ink", e.target.value)}>
                {Object.entries(WALL_INKS).map(([k, i]) => <option key={k} value={k}>{i.label}</option>)}
              </select>
            </label>
          </div>
          <label style={field}>
            Link (optional, a Menuply page)
            <input style={input} placeholder={meta.foodPath || "/clusters/california/los-angeles/usc"} value={form.link_path} onChange={(e) => setForm((f) => ({ ...f, link_path: e.target.value }))} />
          </label>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="submit" style={btn} disabled={saving || meta.migrationPending}>{saving ? "Saving…" : "Save"}</button>
            {status ? <span role="status" style={{ color: "#374151", fontSize: 14 }}>{status}</span> : null}
            {meta.updatedAt ? (
              <span style={{ color: "#6b7280", fontSize: 12 }}>
                Last saved {new Date(meta.updatedAt).toLocaleString()}{meta.updatedBy ? ` by ${meta.updatedBy}` : ""}
              </span>
            ) : null}
          </div>
          {error ? <p role="alert" style={{ color: "#b42318", margin: 0 }}>{error}</p> : null}
        </div>
        <div aria-label="Preview" style={{ opacity: form.active ? 1 : 0.45 }}>
          <div className="cw-mosaic" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            <WallBlockTile block={preview} onOpen={() => {}} />
          </div>
        </div>
      </form>
    </section>
  );
}
