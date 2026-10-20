import { useState } from "react";
import { DAY_PRESETS, DAY_SHORT, WEEK_ORDER } from "../../lib/weeklyHours.js";

/**
 * "Set several days at once": pick days (or Mon–Fri / Sat–Sun / Every day), choose hours,
 * Open 24 hrs or Closed, then Apply. The parent's schedule changes; it still saves as before.
 */
export default function HoursBulkSet({ onApply, accent = "#16a34a", inputStyle = {} }) {
  const [days, setDays] = useState([1, 2, 3, 4, 5]);
  const [mode, setMode] = useState("hours");
  const [opens, setOpens] = useState("09:00");
  const [closes, setCloses] = useState("21:00");
  const [applied, setApplied] = useState("");

  function toggleDay(d) {
    setApplied("");
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  const chip = (active) => ({
    padding: "5px 10px",
    borderRadius: 999,
    border: `1px solid ${active ? accent : "#d6d3d1"}`,
    background: active ? accent : "#fff",
    color: active ? "#fff" : "#1f2937",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  });
  const radio = { display: "flex", gap: 6, alignItems: "center", fontSize: 13, cursor: "pointer" };

  function apply() {
    if (!days.length) return;
    onApply(days, { mode, opens_at: opens, closes_at: closes });
    const names = WEEK_ORDER.filter((d) => days.includes(d)).map((d) => DAY_SHORT[d]).join(", ");
    setApplied(`Applied to ${names}. Save hours to publish.`);
  }

  return (
    <div
      data-testid="hours-bulk-set"
      style={{ border: "1px dashed #d6d3d1", borderRadius: 10, padding: 12, marginBottom: 12, background: "#fafaf9" }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8, color: "#1f2937" }}>Set several days at once</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        {DAY_PRESETS.map((p) => {
          const active = p.days.length === days.length && p.days.every((d) => days.includes(d));
          return (
            <button key={p.key} type="button" data-testid={`hours-preset-${p.key}`} onClick={() => { setDays(p.days); setApplied(""); }} style={chip(active)}>
              {p.label}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {WEEK_ORDER.map((d) => (
          <button key={d} type="button" data-testid={`hours-day-${d}`} onClick={() => toggleDay(d)} style={chip(days.includes(d))}>
            {DAY_SHORT[d]}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", marginBottom: 10, color: "#1f2937" }}>
        <label style={radio}>
          <input type="radio" name="hours-bulk-mode" checked={mode === "hours"} onChange={() => setMode("hours")} />
          Hours
        </label>
        {mode === "hours" ? (
          <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input type="time" value={opens} onChange={(e) => setOpens(e.target.value)} style={{ ...inputStyle, width: 120 }} aria-label="Opens" />
            <span style={{ fontSize: 12, color: "#6b7280" }}>to</span>
            <input type="time" value={closes} onChange={(e) => setCloses(e.target.value)} style={{ ...inputStyle, width: 120 }} aria-label="Closes" />
          </span>
        ) : null}
        <label style={radio}>
          <input type="radio" name="hours-bulk-mode" data-testid="hours-bulk-open24" checked={mode === "open24"} onChange={() => setMode("open24")} />
          Open 24 hrs
        </label>
        <label style={radio}>
          <input type="radio" name="hours-bulk-mode" checked={mode === "closed"} onChange={() => setMode("closed")} />
          Closed
        </label>
      </div>
      <button
        type="button"
        data-testid="hours-bulk-apply"
        disabled={!days.length}
        onClick={apply}
        style={{ ...chip(true), padding: "7px 14px", opacity: days.length ? 1 : 0.5, cursor: days.length ? "pointer" : "default" }}
      >
        Apply to {days.length} day{days.length === 1 ? "" : "s"}
      </button>
      {applied ? <span style={{ marginLeft: 10, fontSize: 12, color: "#166534" }}>{applied}</span> : null}
    </div>
  );
}
