import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { OWNER_COLORS } from "./OwnerLayout.jsx";
import { getOwnerRestaurantTodayCheck } from "../../lib/ownerApi.js";

/**
 * Owner → Restaurant Management → Check Today (plan 42 step 2). Read-only.
 * "Would Today suggest this to a diner standing here, on this date, at this meal?"
 * The point is where a diner stands; a cluster is just a handy spot. Today is never cluster-based.
 */

const MEALS = [
  ["", "Now"],
  ["breakfast", "Breakfast"],
  ["lunch", "Lunch"],
  ["dinner", "Dinner"],
  ["late", "Late night"],
];
const MODES = [
  ["", "Any"],
  ["dine_in", "Dine-in"],
  ["pickup", "Pickup"],
  ["delivery", "Delivery"],
];
const STATUS = {
  shown: { label: "Shown", color: OWNER_COLORS.ink },
  eligible_not_shown: { label: "Eligible, not shown", color: OWNER_COLORS.ink },
  excluded: { label: "Not shown here", color: "#9f3a22" },
  never: { label: "Never on Today", color: "#9f3a22" },
};
const MISSING = { hours: "hours", cuisine: "cuisine", coordinates: "map location", dishes: "dishes", type: "restaurant type" };

export default function OwnerTodayCheckPanel({ restaurant, clusters = [], onClose }) {
  const [where, setWhere] = useState("restaurant");
  const [custom, setCustom] = useState("");
  const [date, setDate] = useState("");
  const [meal, setMeal] = useState("");
  const [mode, setMode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const point = useMemo(() => {
    if (where === "restaurant") return {};
    if (where === "custom") {
      const [lat, lng] = custom.split(",").map((s) => Number(s.trim()));
      return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
    }
    const c = clusters.find((x) => String(x.id) === where);
    return c && c.lat != null && c.lng != null ? { lat: c.lat, lng: c.lng } : null;
  }, [where, custom, clusters]);

  useEffect(() => {
    if (!point) return undefined;
    let live = true;
    setLoading(true);
    setError("");
    const params = { ...point };
    if (date) params.date = date;
    if (meal) params.window = meal;
    if (mode) params.mode = mode;
    getOwnerRestaurantTodayCheck(restaurant.restaurant_id, params)
      .then((res) => live && setResult(res))
      .catch((err) => live && setError(err?.message || "Could not check Today"))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [restaurant.restaurant_id, point, date, meal, mode]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const status = result ? STATUS[result.status] || STATUS.excluded : null;
  const muted = { fontSize: 12, color: OWNER_COLORS.muted };

  return createPortal(
    <div role="dialog" aria-label={`Check Today for ${restaurant.restaurant_name}`} style={backdrop} onClick={onClose}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Check Today</div>
            <div style={muted}>{restaurant.restaurant_name} · #{restaurant.restaurant_id}</div>
          </div>
          <button type="button" style={linkBtn} onClick={onClose}>Close</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
          <Field label="Diner standing at">
            <select style={input} value={where} onChange={(e) => setWhere(e.target.value)}>
              <option value="restaurant">The restaurant</option>
              {clusters.filter((c) => c.lat != null && c.lng != null).map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
              <option value="custom">A spot (lat, lng)</option>
            </select>
          </Field>
          {where === "custom" ? (
            <Field label="Lat, lng">
              <input style={input} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="34.0224, -118.2851" />
            </Field>
          ) : (
            <div />
          )}
          <Field label="Date">
            <input style={input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Meal">
            <select style={input} value={meal} onChange={(e) => setMeal(e.target.value)}>
              {MEALS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Service type">
            <select style={input} value={mode} onChange={(e) => setMode(e.target.value)}>
              {MODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
        </div>

        <div style={{ marginTop: 18, opacity: loading ? 0.5 : 1 }}>
          {!point ? <div style={muted}>Enter a spot as “lat, lng”.</div> : null}
          {error ? <div style={{ color: "#9f3a22", fontSize: 13 }}>{error}</div> : null}
          {result && point ? (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: status.color }}>{status.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{result.verdict}</div>
              <div style={{ ...muted, marginTop: 4 }}>
                {result.window.label} · {result.date} at {result.time}
                {result.point?.at_restaurant ? " · standing at the restaurant" : ""}
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "14px 0 0", display: "grid", gap: 6 }}>
                {result.checks.map((c) => (
                  <li key={c.key} style={{ display: "flex", gap: 8, fontSize: 13 }}>
                    <span aria-hidden="true" style={{ width: 14, color: c.ok ? OWNER_COLORS.ink : "#9f3a22", fontWeight: 800 }}>{c.ok ? "✓" : "✕"}</span>
                    <span>{c.text}</span>
                  </li>
                ))}
              </ul>

              {result.missing.length ? (
                <div style={{ marginTop: 12, fontSize: 13, color: "#9f3a22" }}>Missing: {result.missing.map((m) => MISSING[m] || m).join(", ")}</div>
              ) : null}
              {result.conflicts.map((c) => (
                <div key={c} style={{ marginTop: 8, fontSize: 13 }}>{c}</div>
              ))}
              <div style={{ marginTop: 14, display: "grid", gap: 4 }}>
                {result.notes.map((n) => <div key={n} style={muted}>{n}</div>)}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 4, fontSize: 11, fontWeight: 700, color: OWNER_COLORS.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {label}
      {children}
    </label>
  );
}

const backdrop = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", justifyContent: "flex-end", zIndex: 1000 };
const panel = { width: "min(480px, 100%)", height: "100%", overflowY: "auto", background: "#fff", padding: 20, boxShadow: "-8px 0 24px rgba(0,0,0,0.12)", color: OWNER_COLORS.ink };
const input = { padding: "8px 10px", borderRadius: 10, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", fontSize: 13, width: "100%", boxSizing: "border-box" };
const linkBtn = { padding: 0, border: "none", background: "none", color: OWNER_COLORS.accent, fontWeight: 700, cursor: "pointer", fontSize: 13 };
