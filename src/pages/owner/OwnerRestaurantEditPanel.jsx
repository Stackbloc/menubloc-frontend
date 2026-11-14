import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { OWNER_COLORS } from "./OwnerLayout.jsx";
import { getOwnerRestaurantCuisines, getOwnerRestaurantEdit, saveOwnerRestaurantEdit } from "../../lib/ownerApi.js";
import { WEEK_ORDER, isOpen24, setOpen24 } from "../../lib/weeklyHours.js";

/**
 * Owner → Restaurant Management → Edit (plan 42 step 3). One restaurant.
 * Saves through the existing writers in one transaction and logs before/after.
 * Claimed restaurants ask for a second tap; a stale editor is told to reload.
 */

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SERVICE = [
  ["dine_in", "Dine-in"],
  ["pickup", "Pickup"],
  ["delivery", "Delivery"],
];

function fullWeek(rows) {
  const byDay = new Map((rows || []).map((r) => [Number(r.day_of_week), r]));
  return Array.from({ length: 7 }, (_, d) => {
    const r = byDay.get(d);
    if (!r) return { day_of_week: d, opens_at: "09:00", closes_at: "21:00", is_closed: true, label: null };
    return { day_of_week: d, opens_at: r.opens_at || "09:00", closes_at: r.closes_at || "21:00", is_closed: r.is_closed === true, label: r.label || null };
  });
}
const hoursKey = (rows) =>
  rows.map((r) => (r.is_closed ? `${r.day_of_week}:closed` : `${r.day_of_week}:${r.opens_at}-${r.closes_at}:${r.label || ""}`)).join("|");

export default function OwnerRestaurantEditPanel({ restaurant, onClose, onSaved }) {
  const id = restaurant.restaurant_id;
  const [loaded, setLoaded] = useState(null);
  const [fields, setFields] = useState(null);
  const [hours, setHours] = useState(null);
  const [hadHours, setHadHours] = useState(false);
  const [cuisines, setCuisines] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [askClaimed, setAskClaimed] = useState(false);

  function load() {
    setError("");
    setAskClaimed(false);
    return getOwnerRestaurantEdit(id)
      .then((res) => {
        setLoaded(res);
        setFields(res.fields);
        setHours(fullWeek(res.hours));
        setHadHours(res.hours.length > 0);
      })
      .catch((err) => setError(err?.message || "Could not load this restaurant"));
  }

  useEffect(() => {
    load();
    getOwnerRestaurantCuisines()
      .then((r) => setCuisines((r?.cuisines || []).map((c) => (typeof c === "string" ? c : c.label || c.value)).filter(Boolean)))
      .catch(() => setCuisines([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const baseHours = useMemo(() => (loaded ? fullWeek(loaded.hours) : null), [loaded]);
  const changedFields = useMemo(() => {
    if (!loaded || !fields) return {};
    const out = {};
    for (const [k, v] of Object.entries(fields)) {
      const a = k === "cuisine" ? (String(v || "").trim() || null) : v;
      if (a !== loaded.fields[k]) out[k] = a;
    }
    return out;
  }, [fields, loaded]);
  const hoursChanged = Boolean(hours && baseHours && hoursKey(hours) !== hoursKey(baseHours));
  const dirty = Object.keys(changedFields).length > 0 || hoursChanged;

  async function save(confirmClaimed = false) {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const body = { fields: changedFields, before: loaded.fields };
      if (hoursChanged) {
        body.hours = hours.map((d) => ({ ...d, opens_at: d.is_closed ? null : d.opens_at, closes_at: d.is_closed ? null : d.closes_at }));
        body.hours_before = loaded.hours;
      }
      if (confirmClaimed) body.confirm_claimed = true;
      const res = await saveOwnerRestaurantEdit(id, body);
      setAskClaimed(false);
      setLoaded(res.restaurant);
      setFields(res.restaurant.fields);
      setHours(fullWeek(res.restaurant.hours));
      setHadHours(res.restaurant.hours.length > 0);
      setMessage(res.changed.length ? "Saved." : "Nothing changed.");
      if (res.changed.length) onSaved?.();
    } catch (err) {
      const code = err?.payload?.code;
      if (code === "claimed_confirm") setAskClaimed(true);
      else setError(err?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  }

  const setField = (k, v) => {
    setMessage("");
    setFields((f) => ({ ...f, [k]: v }));
  };
  const setDay = (d, row) => {
    setMessage("");
    setHours((h) => h.map((x) => (x.day_of_week === d ? row : x)));
  };
  function copyMondayToWeekdays() {
    const mon = hours.find((x) => x.day_of_week === 1);
    setHours((h) => h.map((x) => ([2, 3, 4, 5].includes(x.day_of_week) ? { ...mon, day_of_week: x.day_of_week } : x)));
  }

  const muted = { fontSize: 12, color: OWNER_COLORS.muted };

  return createPortal(
    <div role="dialog" aria-label={`Edit ${restaurant.restaurant_name}`} style={backdrop} onClick={onClose}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Edit restaurant</div>
            <div style={muted}>
              {restaurant.restaurant_name} · #{id}
              {loaded?.claimed ? " · Claimed" : ""}
            </div>
          </div>
          <button type="button" style={linkBtn} onClick={onClose}>Close</button>
        </div>

        {!fields ? (
          <div style={{ ...muted, marginTop: 18 }}>{error || "Loading…"}</div>
        ) : (
          <>
            {loaded.claimed ? (
              <div style={{ marginTop: 14, fontSize: 13 }}>Claimed: the owner manages this restaurant. Change it only to fix a clear mistake.</div>
            ) : null}

            <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
              <Field label="Cuisine">
                <input style={input} list="owner-edit-cuisines" value={fields.cuisine || ""} onChange={(e) => setField("cuisine", e.target.value)} />
                <datalist id="owner-edit-cuisines">
                  {cuisines.map((c) => <option key={c} value={c} />)}
                </datalist>
              </Field>

              <Field label="Service">
                <div style={{ display: "flex", gap: 16 }}>
                  {SERVICE.map(([k, l]) => (
                    <label key={k} style={check}>
                      <input type="checkbox" checked={fields[k] === true} onChange={(e) => setField(k, e.target.checked)} />
                      {l}
                    </label>
                  ))}
                </div>
              </Field>

              <Field label="Status">
                <label style={check}>
                  <input type="checkbox" checked={fields.active === true} onChange={(e) => setField("active", e.target.checked)} />
                  Active (shown to diners)
                </label>
              </Field>

              <Field label="Hours">
                {!hadHours ? <div style={{ ...muted, textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>No hours on file yet.</div> : null}
                <div style={{ display: "grid", gap: 6 }}>
                  {WEEK_ORDER.map((d) => {
                    const day = hours.find((x) => x.day_of_week === d);
                    const allDay = isOpen24(day);
                    return (
                      <div key={d} style={{ display: "grid", gridTemplateColumns: "84px 62px 72px 1fr 1fr", gap: 6, alignItems: "center", textTransform: "none", letterSpacing: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: OWNER_COLORS.ink }}>{DAY_NAMES[d]}</span>
                        <label style={check}>
                          <input type="checkbox" checked={!day.is_closed} onChange={(e) => setDay(d, { ...day, is_closed: !e.target.checked })} />
                          Open
                        </label>
                        <label style={{ ...check, opacity: day.is_closed ? 0.4 : 1 }}>
                          <input type="checkbox" disabled={day.is_closed} checked={allDay} onChange={(e) => setDay(d, setOpen24(day, e.target.checked))} />
                          24 hrs
                        </label>
                        <input type="time" style={input} disabled={day.is_closed || allDay} value={day.opens_at} onChange={(e) => setDay(d, { ...day, opens_at: e.target.value })} />
                        <input type="time" style={input} disabled={day.is_closed || allDay} value={day.closes_at} onChange={(e) => setDay(d, { ...day, closes_at: e.target.value })} />
                      </div>
                    );
                  })}
                </div>
                <div>
                  <button type="button" style={{ ...linkBtn, fontSize: 12 }} onClick={copyMondayToWeekdays}>Copy Monday to Tue–Fri</button>
                </div>
              </Field>
            </div>

            <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 20 }}>
              {askClaimed ? (
                <>
                  <span style={{ fontSize: 13 }}>Change a claimed restaurant?</span>
                  <button type="button" style={saveBtn} disabled={saving} onClick={() => save(true)}>Save anyway</button>
                  <button type="button" style={linkBtn} onClick={() => setAskClaimed(false)}>Cancel</button>
                </>
              ) : (
                <>
                  <button type="button" style={{ ...saveBtn, opacity: dirty && !saving ? 1 : 0.4 }} disabled={!dirty || saving} onClick={() => save(false)}>
                    {saving ? "Saving…" : "Save"}
                  </button>
                  {dirty ? (
                    <button type="button" style={linkBtn} onClick={() => { setFields(loaded.fields); setHours(fullWeek(loaded.hours)); }}>Undo changes</button>
                  ) : null}
                </>
              )}
            </div>
            {message ? <div style={{ ...muted, marginTop: 10 }}>{message}</div> : null}
            {error ? (
              <div style={{ color: "#9f3a22", fontSize: 13, marginTop: 10 }}>
                {error}{" "}
                <button type="button" style={{ ...linkBtn, fontSize: 13 }} onClick={load}>Reload</button>
              </div>
            ) : null}
            <div style={{ ...muted, marginTop: 16 }}>Hours saved here count as a person's hours: Hours Bot won't replace them on its own.</div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "grid", gap: 6, fontSize: 11, fontWeight: 700, color: OWNER_COLORS.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {label}
      {children}
    </div>
  );
}

const backdrop = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", justifyContent: "flex-end", zIndex: 1000 };
const panel = { width: "min(520px, 100%)", height: "100%", overflowY: "auto", background: "#fff", padding: 20, boxShadow: "-8px 0 24px rgba(0,0,0,0.12)", color: OWNER_COLORS.ink, boxSizing: "border-box" };
const input = { padding: "7px 8px", borderRadius: 10, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", fontSize: 13, width: "100%", boxSizing: "border-box" };
const check = { display: "flex", gap: 6, whiteSpace: "nowrap", alignItems: "center", fontSize: 13, fontWeight: 400, color: OWNER_COLORS.ink, textTransform: "none", letterSpacing: 0, cursor: "pointer" };
const linkBtn = { padding: 0, border: "none", background: "none", color: OWNER_COLORS.accent, fontWeight: 700, cursor: "pointer", fontSize: 13 };
const saveBtn = { padding: "8px 18px", borderRadius: 10, border: "none", background: OWNER_COLORS.ink, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" };
