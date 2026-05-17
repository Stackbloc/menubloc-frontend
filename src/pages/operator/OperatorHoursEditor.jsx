/**
 * src/pages/operator/OperatorHoursEditor.jsx
 *
 * Route: /operator/hours
 *
 * Two sections:
 *   1. Weekly schedule — 7 rows, open/close times, closed toggle
 *   2. Exceptions       — holiday / special closure dates
 */

import React, { useState, useEffect } from "react";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const INPUT = {
  padding: "7px 10px",
  fontSize: 13,
  border: "1.5px solid #e4e9f0",
  borderRadius: 8,
  outline: "none",
  color: "#0f1720",
  background: "#fff",
  fontFamily: "inherit",
};

const BTN = (variant) => ({
  padding: "8px 18px",
  fontSize: 13,
  fontWeight: 600,
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontFamily: "inherit",
  ...(variant === "primary" && { background: "#1F4E3D", color: "#fff" }),
  ...(variant === "ghost"   && { background: "#f4f3ef", color: "#5b6675" }),
  ...(variant === "danger"  && { background: "transparent", color: "#b91c1c", border: "1.5px solid #fecaca" }),
});

function buildDefaultSchedule() {
  return DAYS.map((_, i) => ({
    day_of_week: i,
    is_closed:   i === 0 || i === 6, // Sun + Sat closed by default
    opens_at:    "11:00",
    closes_at:   "21:00",
  }));
}

export default function OperatorHoursEditor() {
  const { selectedRestaurant } = useOperator();
  const rid = selectedRestaurant?.id;

  const [schedule, setSchedule]     = useState(buildDefaultSchedule());
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState("");

  // Exception form
  const [showExcForm, setShowExcForm] = useState(false);
  const [excForm, setExcForm] = useState({ exception_date: "", label: "", is_closed: true, opens_at: "", closes_at: "" });
  const [savingExc, setSavingExc] = useState(false);

  useEffect(() => {
    if (!rid) return;
    setLoading(true);
    Promise.all([
      api.getHours(rid),
      api.getExceptions(rid),
    ])
      .then(([hoursData, excData]) => {
        if (hoursData.schedule?.length) {
          // Map API schedule (may be sparse) onto all 7 days
          const byDay = {};
          hoursData.schedule.forEach(d => { byDay[d.day_of_week] = d; });
          setSchedule(buildDefaultSchedule().map(d => ({
            ...d,
            ...byDay[d.day_of_week] || {},
            opens_at:  byDay[d.day_of_week]?.opens_at?.slice(0,5)  || d.opens_at,
            closes_at: byDay[d.day_of_week]?.closes_at?.slice(0,5) || d.closes_at,
          })));
        }
        setExceptions(excData.exceptions || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [rid]);

  function updateRow(idx, key, val) {
    setSchedule(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: val };
      if (key === "is_closed" && val) {
        next[idx].opens_at = "";
        next[idx].closes_at = "";
      }
      return next;
    });
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await api.updateHours(rid, schedule);
      setSaved(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddException() {
    if (!excForm.exception_date) return;
    setSavingExc(true);
    try {
      const d = await api.upsertException(rid, excForm);
      setExceptions(prev => {
        const filtered = prev.filter(e => e.exception_date !== excForm.exception_date);
        return [...filtered, d.exception].sort((a,b) => a.exception_date.localeCompare(b.exception_date));
      });
      setShowExcForm(false);
      setExcForm({ exception_date: "", label: "", is_closed: true, opens_at: "", closes_at: "" });
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingExc(false);
    }
  }

  async function handleDeleteException(id) {
    if (!window.confirm("Remove this exception?")) return;
    try {
      await api.deleteException(rid, id);
      setExceptions(prev => prev.filter(e => e.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  if (!rid) {
    return <OperatorLayout title="Hours"><p style={{ color: "#8a9ab0" }}>Select a restaurant to manage its hours.</p></OperatorLayout>;
  }

  return (
    <OperatorLayout title="Hours">
      <div style={{ maxWidth: 680 }}>

        {error && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: 10, padding: "10px 14px",
            color: "#b91c1c", fontSize: 13, marginBottom: 20,
            display: "flex", justifyContent: "space-between",
          }}>
            {error}
            <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#b91c1c", fontWeight: 700 }}>✕</button>
          </div>
        )}

        {saved && (
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#16a34a", marginBottom: 20 }}>
            Hours saved ✓
          </div>
        )}

        {/* ── Weekly schedule ─────────────────────────────────────── */}
        <div style={{ background: "#fff", border: "1px solid #e4e9f0", borderRadius: 14, overflow: "hidden", marginBottom: 32 }}>
          {/* Header */}
          <div className="operator-hours-table-header" style={{
            display: "grid", gridTemplateColumns: "120px 80px 1fr 1fr",
            padding: "10px 16px", background: "#f8f7f4",
            borderBottom: "1px solid #e4e9f0",
          }}>
            {["Day", "Closed", "Opens", "Closes"].map(h => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#8a9ab0", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</div>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: "20px 16px", color: "#8a9ab0", fontSize: 13 }}>Loading…</div>
          ) : (
            schedule.map((row, idx) => (
              <div
                className="operator-hours-table-row"
                key={row.day_of_week}
                style={{
                  display: "grid", gridTemplateColumns: "120px 80px 1fr 1fr",
                  padding: "10px 16px", alignItems: "center",
                  borderBottom: idx < 6 ? "1px solid #f0f0ec" : "none",
                  background: row.is_closed ? "#fafafa" : "#fff",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: row.is_closed ? "#b0bbc8" : "#0f1720" }}>
                  {DAYS[row.day_of_week]}
                </div>

                {/* Closed toggle */}
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={row.is_closed}
                      onChange={e => updateRow(idx, "is_closed", e.target.checked)}
                      style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#1F4E3D" }}
                    />
                    <span style={{ fontSize: 12, color: "#8a9ab0" }}>Closed</span>
                  </label>
                </div>

                {/* Open time */}
                <div>
                  <div className="operator-hours-mobile-label">Opens</div>
                  <input
                    className="operator-hours-time-input"
                    type="time"
                    value={row.opens_at || ""}
                    onChange={e => updateRow(idx, "opens_at", e.target.value)}
                    disabled={row.is_closed}
                    style={{ ...INPUT, width: 110, opacity: row.is_closed ? 0.35 : 1 }}
                  />
                </div>

                {/* Close time */}
                <div>
                  <div className="operator-hours-mobile-label">Closes</div>
                  <input
                    className="operator-hours-time-input"
                    type="time"
                    value={row.closes_at || ""}
                    onChange={e => updateRow(idx, "closes_at", e.target.value)}
                    disabled={row.is_closed}
                    style={{ ...INPUT, width: 110, opacity: row.is_closed ? 0.35 : 1 }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || loading}
          style={{ ...BTN("primary"), opacity: saving ? 0.65 : 1, marginBottom: 40 }}
        >
          {saving ? "Saving…" : "Save hours"}
        </button>

        {/* ── Exceptions ──────────────────────────────────────────── */}
        <div className="operator-responsive-row" style={{ marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f1720" }}>Special hours & closures</h2>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#8a9ab0" }}>Holiday closures, early closings, special event hours.</p>
          </div>
          <button style={BTN("ghost")} onClick={() => setShowExcForm(v => !v)}>
            + Add exception
          </button>
        </div>

        {showExcForm && (
          <div className="operator-responsive-grid-3" style={{
            background: "#fff",
            border: "1.5px solid #1F4E3D",
            borderRadius: 12,
            padding: "16px 18px",
            marginBottom: 16,
            display: "grid",
            gridTemplateColumns: "1fr 1fr 80px",
            gap: 12,
            alignItems: "flex-end",
          }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#5b6675", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>Date *</label>
              <input type="date" style={{ ...INPUT, width: "100%" }} value={excForm.exception_date} onChange={e => setExcForm(p => ({ ...p, exception_date: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#5b6675", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>Label</label>
              <input style={{ ...INPUT, width: "100%" }} placeholder="e.g. Christmas" value={excForm.label} onChange={e => setExcForm(p => ({ ...p, label: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", marginBottom: 6 }}>
                <input type="checkbox" checked={excForm.is_closed} onChange={e => setExcForm(p => ({ ...p, is_closed: e.target.checked }))} style={{ accentColor: "#1F4E3D" }} />
                <span style={{ fontSize: 12, color: "#5b6675", fontWeight: 600 }}>Closed</span>
              </label>
            </div>
            {!excForm.is_closed && (
              <>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#5b6675", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>Opens</label>
                  <input type="time" style={{ ...INPUT, width: "100%" }} value={excForm.opens_at} onChange={e => setExcForm(p => ({ ...p, opens_at: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#5b6675", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>Closes</label>
                  <input type="time" style={{ ...INPUT, width: "100%" }} value={excForm.closes_at} onChange={e => setExcForm(p => ({ ...p, closes_at: e.target.value }))} />
                </div>
              </>
            )}
            <div className="operator-responsive-card-actions" style={{ gridColumn: "1 / -1", display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={BTN("ghost")} onClick={() => setShowExcForm(false)}>Cancel</button>
              <button style={{ ...BTN("primary"), opacity: savingExc ? 0.65 : 1 }} onClick={handleAddException} disabled={savingExc || !excForm.exception_date}>
                {savingExc ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        )}

        {/* Exceptions list */}
        {exceptions.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            {exceptions.map(exc => (
              <div key={exc.id} className="operator-responsive-row" style={{
                background: "#fff", border: "1px solid #e4e9f0",
                borderRadius: 10, padding: "10px 14px",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#0f1720", minWidth: 100 }}>
                  {new Date(exc.exception_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
                <div style={{ fontSize: 13, color: "#5b6675", flex: 1 }}>
                  {exc.label || ""}
                  {exc.is_closed
                    ? <span style={{ marginLeft: 8, fontSize: 11, background: "#fee2e2", color: "#b91c1c", borderRadius: 999, padding: "2px 7px", fontWeight: 700 }}>Closed</span>
                    : <span style={{ marginLeft: 8, fontSize: 12, color: "#8a9ab0" }}>{exc.opens_at?.slice(0,5)} – {exc.closes_at?.slice(0,5)}</span>
                  }
                </div>
                <button style={{ ...BTN("danger"), fontSize: 12, padding: "4px 10px" }} onClick={() => handleDeleteException(exc.id)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </OperatorLayout>
  );
}
