import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { OWNER_COLORS } from "./OwnerLayout.jsx";
import OwnerHoursWeek, { fullWeek, hoursForSave, hoursSummary } from "./OwnerHoursWeek.jsx";
import {
  applyOwnerRestaurantBulk,
  getOwnerRestaurantBulkOps,
  getOwnerRestaurantCuisines,
  previewOwnerRestaurantBulk,
  undoOwnerRestaurantBulk,
} from "../../lib/ownerApi.js";

/**
 * Owner → Restaurant Management → Bulk edit (plan 42 step 4).
 * Preview first (nothing written), then Apply runs as one transaction on the exact list the
 * preview counted. Claimed restaurants are left alone. Undo restores only what is still as we
 * left it; anything changed since is reported, not overwritten.
 */

const LABEL = { cuisine: "Cuisine", dine_in: "Dine-in", pickup: "Pickup", delivery: "Delivery", active: "Active", hours: "Hours" };
const BOOLS = ["dine_in", "pickup", "delivery", "active"];

const show = (k, v) => {
  if (k === "hours") return hoursSummary(v);
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return v == null || v === "" ? "none" : String(v);
};

export function describeChange(change = {}) {
  const parts = Object.entries(change.fields || {}).map(([k, v]) => `${LABEL[k] || k}: ${show(k, v)}`);
  if (change.hours) parts.push("Hours: set");
  return parts.join(" · ") || "No change";
}

function Panel({ title, subtitle, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return createPortal(
    <div role="dialog" aria-label={title} style={backdrop} onClick={onClose}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{title}</div>
            {subtitle ? <div style={muted}>{subtitle}</div> : null}
          </div>
          <button type="button" style={linkBtn} onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

/** Undo one applied bulk edit, with a confirm step. Calls onDone(result). */
function UndoLink({ opId, onDone }) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!asking) return <button type="button" style={linkBtn} onClick={() => setAsking(true)}>Undo</button>;
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 13 }}>Put these restaurants back? Anything someone changed since stays as it is.</div>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <button
          type="button"
          style={darkBtn}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              onDone(await undoOwnerRestaurantBulk(opId));
              setAsking(false);
            } catch (err) {
              setError(err?.message || "Could not undo");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Undoing…" : "Undo bulk edit"}
        </button>
        <button type="button" style={linkBtn} onClick={() => setAsking(false)}>Cancel</button>
      </div>
      {error ? <div style={errorText}>{error}</div> : null}
    </div>
  );
}

function undoText(c = {}) {
  const parts = [`${c.undone || 0} put back`];
  if (c.undo_partial) parts.push(`${c.undo_partial} partly (someone changed some fields since)`);
  if (c.undo_conflict) parts.push(`${c.undo_conflict} left alone (changed since)`);
  return parts.join(" · ");
}

export default function OwnerRestaurantBulkPanel({ selection, count, onClose, onApplied }) {
  const [on, setOn] = useState({});
  const [fields, setFields] = useState({ cuisine: "", dine_in: true, pickup: true, delivery: true, active: true });
  const [hours, setHours] = useState(() => fullWeek([1, 2, 3, 4, 5, 6, 0].map((d) => ({ day_of_week: d, opens_at: "09:00", closes_at: "21:00", is_closed: false }))));
  const [cuisines, setCuisines] = useState([]);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [undone, setUndone] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getOwnerRestaurantCuisines()
      .then((r) => setCuisines((r?.cuisines || []).map((c) => (typeof c === "string" ? c : c.label || c.value)).filter(Boolean)))
      .catch(() => setCuisines([]));
  }, []);

  const toggle = (k) => {
    setPreview(null);
    setOn((o) => ({ ...o, [k]: !o[k] }));
  };
  const setField = (k, v) => {
    setPreview(null);
    setFields((f) => ({ ...f, [k]: v }));
  };
  const change = () => {
    const out = { fields: {} };
    for (const k of ["cuisine", ...BOOLS]) if (on[k]) out.fields[k] = k === "cuisine" ? fields.cuisine.trim() : fields[k];
    if (on.hours) out.hours = hoursForSave(hours);
    return out;
  };
  const anyOn = Object.values(on).some(Boolean);

  async function runPreview() {
    setBusy(true);
    setError("");
    try {
      setPreview(await previewOwnerRestaurantBulk({ selection, change: change() }));
    } catch (err) {
      setError(err?.message || "Could not preview");
    } finally {
      setBusy(false);
    }
  }
  async function runApply() {
    setBusy(true);
    setError("");
    try {
      const res = await applyOwnerRestaurantBulk(preview.op_id);
      setResult(res);
      onApplied?.();
    } catch (err) {
      setError(err?.message || "Could not apply");
    } finally {
      setBusy(false);
    }
  }

  const subtitle = `${count.toLocaleString()} restaurant${count === 1 ? "" : "s"} selected`;

  if (result) {
    return (
      <Panel title="Bulk edit" subtitle={subtitle} onClose={onClose}>
        <div style={{ marginTop: 18, fontSize: 15, fontWeight: 700 }}>
          {undone ? "Undone." : `Changed ${result.counts.changed.toLocaleString()} restaurant${result.counts.changed === 1 ? "" : "s"}.`}
        </div>
        <div style={{ ...muted, marginTop: 4 }}>{describeChange(preview.change)}</div>
        {result.counts.skipped_claimed ? <div style={{ ...muted, marginTop: 4 }}>{result.counts.skipped_claimed} claimed left alone.</div> : null}
        <div style={{ marginTop: 16 }}>
          {undone ? (
            <div style={{ fontSize: 13 }}>{undoText(undone.undo_counts)}</div>
          ) : (
            <UndoLink
              opId={result.op_id}
              onDone={(u) => {
                setUndone(u);
                onApplied?.();
              }}
            />
          )}
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Bulk edit" subtitle={subtitle} onClose={onClose}>
      <div style={{ ...muted, marginTop: 12 }}>Tick what to change. Everything else stays as it is.</div>
      <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
        <Toggle label="Cuisine" on={on.cuisine} onToggle={() => toggle("cuisine")}>
          <input style={input} list="owner-bulk-cuisines" value={fields.cuisine} onChange={(e) => setField("cuisine", e.target.value)} placeholder="Leave empty to clear" />
          <datalist id="owner-bulk-cuisines">
            {cuisines.map((c) => <option key={c} value={c} />)}
          </datalist>
        </Toggle>
        {BOOLS.map((k) => (
          <Toggle key={k} label={k === "active" ? "Active (shown to diners)" : LABEL[k]} on={on[k]} onToggle={() => toggle(k)}>
            <select style={{ ...input, width: 120 }} value={fields[k] ? "yes" : "no"} onChange={(e) => setField(k, e.target.value === "yes")}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Toggle>
        ))}
        <Toggle label="Hours" on={on.hours} onToggle={() => toggle("hours")}>
          <OwnerHoursWeek
            hours={hours}
            onChange={(next) => {
              setPreview(null);
              setHours(next);
            }}
          />
          <div style={muted}>Replaces the whole week. Saved as a person's hours, so Hours Bot won't replace them.</div>
        </Toggle>
      </div>

      {!preview ? (
        <div style={{ marginTop: 20 }}>
          <button type="button" style={{ ...darkBtn, opacity: anyOn && !busy ? 1 : 0.4 }} disabled={!anyOn || busy} onClick={runPreview}>
            {busy ? "Checking…" : "Preview"}
          </button>
          <span style={{ ...muted, marginLeft: 12 }}>Nothing is saved until you apply.</span>
        </div>
      ) : (
        <div style={{ marginTop: 20, borderTop: `1px solid ${OWNER_COLORS.line}`, paddingTop: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{describeChange(preview.change)}</div>
          {preview.moved ? <div style={{ fontSize: 13, marginTop: 6 }}>The list changed since you counted it: {preview.counts.selected.toLocaleString()} match now.</div> : null}
          <ul style={{ listStyle: "none", padding: 0, margin: "10px 0 0", display: "grid", gap: 4, fontSize: 13 }}>
            <li><b>{preview.counts.changed.toLocaleString()}</b> will change</li>
            {preview.counts.unchanged ? <li>{preview.counts.unchanged.toLocaleString()} already set this way</li> : null}
            {preview.counts.skipped_claimed ? (
              <li>
                {preview.counts.skipped_claimed.toLocaleString()} claimed, left alone (their owner manages them)
                <div style={muted}>{preview.claimed.map((c) => c.restaurant_name).join(", ")}{preview.counts.skipped_claimed > preview.claimed.length ? "…" : ""}</div>
              </li>
            ) : null}
            {preview.counts.skipped_missing ? <li>{preview.counts.skipped_missing} not found</li> : null}
          </ul>
          {preview.sample.length ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ ...muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", fontSize: 11 }}>
                Examples{preview.counts.changed > preview.sample.length ? ` (${preview.sample.length} of ${preview.counts.changed})` : ""}
              </div>
              <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
                {preview.sample.map((s) => (
                  <div key={s.restaurant_id} style={{ fontSize: 12 }}>
                    <b>{s.restaurant_name}</b> #{s.restaurant_id}
                    {Object.keys(s.after).map((k) => (
                      <div key={k} style={muted}>
                        {LABEL[k] || k}: {show(k, s.before[k])} → {show(k, s.after[k])}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 16 }}>
            <button
              type="button"
              style={{ ...darkBtn, opacity: preview.counts.changed && !busy ? 1 : 0.4 }}
              disabled={!preview.counts.changed || busy}
              onClick={runApply}
            >
              {busy ? "Applying…" : `Apply to ${preview.counts.changed.toLocaleString()}`}
            </button>
            <button type="button" style={linkBtn} onClick={() => setPreview(null)}>Change the edit</button>
          </div>
          <div style={{ ...muted, marginTop: 8 }}>All or nothing: if one restaurant fails, none change. You can undo it afterwards.</div>
        </div>
      )}
      {error ? <div style={{ ...errorText, marginTop: 12 }}>{error}</div> : null}
    </Panel>
  );
}

/** Recent applied/undone bulk edits, newest first, with Undo. */
export function OwnerRestaurantBulkHistory({ onClose, onChanged }) {
  const [ops, setOps] = useState(null);
  const [error, setError] = useState("");
  const load = () =>
    getOwnerRestaurantBulkOps()
      .then((r) => setOps(r?.ops || []))
      .catch((err) => setError(err?.message || "Could not load bulk edits"));
  useEffect(() => {
    load();
  }, []);
  return (
    <Panel title="Recent bulk edits" subtitle="Newest first" onClose={onClose}>
      {error ? <div style={{ ...errorText, marginTop: 14 }}>{error}</div> : null}
      {!ops ? <div style={{ ...muted, marginTop: 14 }}>Loading…</div> : null}
      {ops && !ops.length ? <div style={{ ...muted, marginTop: 14 }}>No bulk edits yet.</div> : null}
      <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
        {(ops || []).map((op) => (
          <div key={op.id} style={{ borderBottom: `1px solid ${OWNER_COLORS.line}`, paddingBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{describeChange(op.change)}</div>
            <div style={muted}>
              #{op.id} · {new Date(op.applied_at || op.created_at).toLocaleString()} · {op.operator_email || "owner"} ·{" "}
              {op.counts?.changed ?? 0} changed{op.counts?.skipped_claimed ? `, ${op.counts.skipped_claimed} claimed left alone` : ""}
            </div>
            <div style={{ marginTop: 6 }}>
              {op.status === "undone" ? (
                <div style={{ fontSize: 13 }}>Undone: {undoText(op.undo_counts)}</div>
              ) : (
                <UndoLink
                  opId={op.id}
                  onDone={() => {
                    load();
                    onChanged?.();
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Toggle({ label, on, onToggle, children }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
        <input type="checkbox" checked={!!on} onChange={onToggle} />
        {label}
      </label>
      {on ? <div style={{ display: "grid", gap: 6, paddingLeft: 24 }}>{children}</div> : null}
    </div>
  );
}

const muted = { fontSize: 12, color: OWNER_COLORS.muted };
const errorText = { color: "#9f3a22", fontSize: 13 };
const backdrop = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", justifyContent: "flex-end", zIndex: 1000 };
const panel = { width: "min(520px, 100%)", height: "100%", overflowY: "auto", background: "#fff", padding: 20, boxShadow: "-8px 0 24px rgba(0,0,0,0.12)", color: OWNER_COLORS.ink, boxSizing: "border-box" };
const input = { padding: "7px 8px", borderRadius: 10, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", fontSize: 13, width: "100%", boxSizing: "border-box" };
const linkBtn = { padding: 0, border: "none", background: "none", color: OWNER_COLORS.accent, fontWeight: 700, cursor: "pointer", fontSize: 13 };
const darkBtn = { padding: "8px 18px", borderRadius: 10, border: "none", background: OWNER_COLORS.ink, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" };
