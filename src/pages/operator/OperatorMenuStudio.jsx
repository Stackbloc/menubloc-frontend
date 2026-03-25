/**
 * OperatorMenuStudio.jsx
 * Path: menubloc-frontend/src/pages/operator/OperatorMenuStudio.jsx
 * Date: 2026-03-24
 *
 * Pro-only Menu Studio dashboard.
 * Tabs: Menus  |  Scheduler  |  Outputs
 *
 * Revisions (2026-03-24):
 *   - AdobeUsageBanner: persistent usage visibility across all tabs
 *   - ResolutionPanel: explains why a given menu is currently active
 *   - Cache hit indicators on output records
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";

// ── Design tokens ──────────────────────────────────────────────────────────

const card = {
  background: "#fff",
  border: "1px solid #e4e9f0",
  borderRadius: 12,
  padding: "20px 24px",
  marginBottom: 16,
};

const btn = (variant = "primary") => ({
  padding: "8px 18px",
  fontSize: 13,
  fontWeight: 600,
  borderRadius: 8,
  border: variant === "primary" ? "none" : "1px solid #e4e9f0",
  background: variant === "primary" ? "#1F4E3D" : "#fff",
  color: variant === "primary" ? "#fff" : "#4a5568",
  cursor: "pointer",
  lineHeight: 1,
});

const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #e4e9f0",
  borderRadius: 8,
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle = { fontSize: 12, fontWeight: 600, color: "#4a5568", marginBottom: 4, display: "block" };

const statusBadge = (status) => {
  const map = {
    pending:    { bg: "#f0f9ff", color: "#0369a1" },
    generating: { bg: "#fefce8", color: "#854d0e" },
    ready:      { bg: "#f0fdf4", color: "#166534" },
    failed:     { bg: "#fef2f2", color: "#991b1b" },
    expired:    { bg: "#f9fafb", color: "#6b7280" },
  };
  const s = map[status] || map.expired;
  return {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
    background: s.bg,
    color: s.color,
  };
};

// ── AdobeUsageBanner ───────────────────────────────────────────────────────
// Shown above all tabs. Color-coded by warning level.

function warningColor(pct, overLimit) {
  if (overLimit)  return { bar: "#ef4444", text: "#991b1b", bg: "#fef2f2", border: "#fca5a5" };
  if (pct >= 95)  return { bar: "#f97316", text: "#9a3412", bg: "#fff7ed", border: "#fdba74" };
  if (pct >= 80)  return { bar: "#eab308", text: "#854d0e", bg: "#fefce8", border: "#fde047" };
  return          { bar: "#22c55e", text: "#166534", bg: "#f0fdf4", border: "#bbf7d0" };
}

function UsageProgressBar({ label, used, limit, overLimit, overage_cost }) {
  const pct    = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const colors = warningColor(pct, overLimit);

  return (
    <div style={{ flex: 1, minWidth: 120 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#4a5568", textTransform: "capitalize" }}>
          {label}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: colors.text }}>
          {used}/{limit}
        </span>
      </div>
      <div style={{ height: 6, background: "#e4e9f0", borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: colors.bar,
          borderRadius: 4,
          transition: "width 0.3s",
        }} />
      </div>
      {overLimit && overage_cost > 0 && (
        <div style={{ fontSize: 10, color: colors.text, marginTop: 3 }}>
          +${(overage_cost / 100).toFixed(2)}/additional
        </div>
      )}
    </div>
  );
}

function AdobeUsageBanner({ summary, loading }) {
  if (loading || !summary) return null;

  const { breakdown = {}, totals = {}, config = {}, period = {}, overall_warning } = summary;
  const relevantTypes = Object.entries(breakdown).filter(([, d]) => d.limit > 0);
  if (relevantTypes.length === 0) return null;

  // Overall banner style based on warning level
  const overallPct    = totals.max_monthly_spend_cents > 0
    ? Math.round((totals.estimated_total_value_cents / totals.max_monthly_spend_cents) * 100)
    : 0;
  const hasOverLimit  = relevantTypes.some(([, d]) => d.over_limit);
  const bannerColors  = warningColor(overallPct, hasOverLimit);

  return (
    <div style={{
      background: bannerColors.bg,
      border: `1px solid ${bannerColors.border}`,
      borderRadius: 10,
      padding: "14px 20px",
      marginBottom: 20,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 800, color: bannerColors.text, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Adobe Usage
          </span>
          <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 10 }}>
            {period.start} – {period.end}
          </span>
        </div>
        {overall_warning !== "none" && (
          <span style={{
            fontSize: 11, fontWeight: 700, color: bannerColors.text,
            background: "#fff", padding: "2px 10px", borderRadius: 10,
            border: `1px solid ${bannerColors.border}`,
          }}>
            {hasOverLimit ? "Over limit" : overall_warning === "soft" ? "Approaching limit" : ""}
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {relevantTypes.map(([type, d]) => (
          <UsageProgressBar
            key={type}
            label={type + "s"}
            used={d.used}
            limit={d.limit}
            overLimit={d.over_limit}
            overage_cost={d.price_per_overage_unit_cents}
          />
        ))}
      </div>

      {hasOverLimit && config.overage_allowed && (
        <div style={{
          marginTop: 12, padding: "8px 12px",
          background: "#fff3cd", border: "1px solid #fde68a",
          borderRadius: 8, fontSize: 12, color: "#92400e",
        }}>
          <strong>Overage billing active.</strong> Additional actions are charged per unit.
          {totals.overage_value_cents > 0 && (
            <span> Current overage exposure: <strong>${(totals.overage_value_cents / 100).toFixed(2)}</strong></span>
          )}
        </div>
      )}

      {hasOverLimit && !config.overage_allowed && (
        <div style={{
          marginTop: 12, padding: "8px 12px",
          background: "#fef2f2", border: "1px solid #fca5a5",
          borderRadius: 8, fontSize: 12, color: "#991b1b",
        }}>
          Monthly limit reached. Adobe actions are blocked until the next billing period.
        </div>
      )}
    </div>
  );
}

// ── ResolutionPanel ───────────────────────────────────────────────────────
// Shows why the current menu is active — with clear override/scheduled/fallback context.

const SOURCE_ICON = {
  manual_override:          "⚡",
  one_time:                 "📅",
  date_range:               "📆",
  recurring_weekly:         "🔄",
  time_window:              "🕐",
  always:                   "∞",
  primary_fallback:         "★",
  first_published_fallback: "→",
  none:                     "—",
};

function ResolutionPanel({ menu, resolution, schedule }) {
  if (!menu) return null;

  const icon = SOURCE_ICON[resolution?.source] || "✦";
  const isFallback = resolution?.is_fallback;
  const bg = resolution?.source === "manual_override" ? "#fff7ed" : isFallback ? "#f9fafb" : "#f0fdf4";
  const border = resolution?.source === "manual_override" ? "#fdba74" : isFallback ? "#e4e9f0" : "#bbf7d0";
  const color  = resolution?.source === "manual_override" ? "#9a3412" : isFallback ? "#6b7280" : "#166534";

  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "14px 18px", marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 16 }}>{icon}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f1720" }}>{menu.name}</span>
            {isFallback && (
              <span style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", background: "#e5e7eb", padding: "2px 8px", borderRadius: 8 }}>
                FALLBACK
              </span>
            )}
            {resolution?.source === "manual_override" && (
              <span style={{ fontSize: 10, fontWeight: 700, color: "#9a3412", background: "#fde68a", padding: "2px 8px", borderRadius: 8 }}>
                OVERRIDE
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color, fontWeight: 500 }}>{resolution?.summary}</div>

          {resolution?.details?.days && resolution.details.days.length > 0 && (
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
              Days: {resolution.details.days.map(d => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d]).join(", ")}
              {resolution.details.times && ` · ${resolution.details.times}`}
              {resolution.details.timezone && ` (${resolution.details.timezone})`}
            </div>
          )}

          {(resolution?.details?.from || resolution?.details?.to) && (
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
              {resolution.details.from} → {resolution.details.to}
              {resolution.details.timezone && ` (${resolution.details.timezone})`}
            </div>
          )}

          {resolution?.details?.times && !resolution.details.days && (
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
              {resolution.details.times}
              {resolution.details.timezone && ` (${resolution.details.timezone})`}
            </div>
          )}

          {resolution?.details?.note && (
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4, fontStyle: "italic" }}>
              {resolution.details.note}
            </div>
          )}
        </div>

        {resolution?.schedule_id && (
          <div style={{ fontSize: 10, color: "#8a9ab0", marginLeft: 12, whiteSpace: "nowrap" }}>
            Rule #{resolution.schedule_id}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Menus ─────────────────────────────────────────────────────────────

function MenusTab({ rid }) {
  const [menus, setMenus]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [resolution, setResolution] = useState(null);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [duplicating, setDuplicating] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [menusRes, activeRes] = await Promise.allSettled([
        api.getMenus(rid),
        api.getActiveMenu(rid),
      ]);
      if (menusRes.status === "fulfilled") setMenus(menusRes.value.menus || []);
      if (activeRes.status === "fulfilled") {
        setActiveMenu(activeRes.value.menu);
        setResolution(activeRes.value.resolution || null);
        setActiveSchedule(activeRes.value.active_schedule || null);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [rid]);

  useEffect(() => { load(); }, [load]);

  async function handleActivateNow(mid) {
    try {
      await api.activateMenuNow(rid, mid);
      await load();
    } catch (e) { alert(e.message); }
  }

  async function handleClearOverride() {
    try {
      await api.clearMenuOverride(rid);
      await load();
    } catch (e) { alert(e.message); }
  }

  async function handleDuplicate(mid) {
    setDuplicating(mid);
    try {
      await api.duplicateMenu(rid, mid);
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setDuplicating(null);
    }
  }

  if (loading) return <p style={{ color: "#8a9ab0" }}>Loading menus…</p>;
  if (error)   return <p style={{ color: "#c0392b" }}>{error}</p>;

  return (
    <div>
      {/* ── Currently Active — Why is this menu showing? ── */}
      <div style={{ ...card, background: "#f8fafc", border: "1px solid #e4e9f0", marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f1720", marginBottom: 10 }}>
          Currently Active Menu
        </div>
        {activeMenu ? (
          <>
            <ResolutionPanel menu={activeMenu} resolution={resolution} schedule={activeSchedule} />
            {resolution?.source === "manual_override" && (
              <div style={{ marginTop: 10 }}>
                <button onClick={handleClearOverride} style={btn("secondary")}>
                  Clear Override
                </button>
              </div>
            )}
          </>
        ) : (
          <p style={{ color: "#8a9ab0", margin: 0, fontSize: 13 }}>No published menus. Publish a menu to see it here.</p>
        )}
      </div>

      {menus.length === 0 && (
        <p style={{ color: "#8a9ab0" }}>No menus yet. Create one in Menu Editor.</p>
      )}

      {menus.map((m) => (
        <div key={m.id} style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f1720" }}>{m.name}</div>
              <div style={{ fontSize: 12, color: "#8a9ab0", marginTop: 2 }}>
                {m.menu_type} · {m.schedule_type || "always"} · {m.status}
                {m.item_count != null && ` · ${m.item_count} items`}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {m.status === "published" && (
                <button onClick={() => handleActivateNow(m.id)} style={btn("primary")}>
                  Activate Now
                </button>
              )}
              <button
                onClick={() => handleDuplicate(m.id)}
                disabled={duplicating === m.id}
                style={btn("secondary")}
              >
                {duplicating === m.id ? "Duplicating…" : "Duplicate"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tab: Scheduler ─────────────────────────────────────────────────────────

const SCHEDULE_TYPES = [
  { value: "recurring_weekly", label: "Weekly (recurring days)" },
  { value: "date_range",       label: "Date range" },
  { value: "one_time",         label: "One-time event" },
  { value: "time_window",      label: "Daily time window" },
  { value: "always",           label: "Always active" },
];

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function SchedulerTab({ rid }) {
  const [menus, setMenus]                   = useState([]);
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [schedules, setSchedules]           = useState([]);
  const [activeMenu, setActiveMenu]         = useState(null);
  const [resolution, setResolution]         = useState(null);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [loading, setLoading]               = useState(true);
  const [form, setForm] = useState({
    schedule_type: "recurring_weekly",
    days_of_week: [],
    start_time: "",
    end_time: "",
    start_date: "",
    end_date: "",
    timezone: "America/New_York",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.allSettled([api.getMenus(rid), api.getActiveMenu(rid)]).then(([menuRes, activeRes]) => {
      if (menuRes.status === "fulfilled") {
        const published = (menuRes.value.menus || []).filter(m => m.status === "published");
        setMenus(published);
        if (published.length) setSelectedMenuId(published[0].id);
      }
      if (activeRes.status === "fulfilled") {
        setActiveMenu(activeRes.value.menu);
        setResolution(activeRes.value.resolution || null);
        setActiveSchedule(activeRes.value.active_schedule || null);
      }
      setLoading(false);
    });
  }, [rid]);

  useEffect(() => {
    if (!selectedMenuId) return;
    api.getMenuSchedules(rid, selectedMenuId).then(r => setSchedules(r.schedules || [])).catch(() => {});
  }, [rid, selectedMenuId]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!selectedMenuId) return;
    setSaving(true);
    try {
      const body = { ...form };
      if (body.schedule_type !== "recurring_weekly") body.days_of_week = null;
      if (!body.start_time) body.start_time = null;
      if (!body.end_time) body.end_time = null;
      if (!body.start_date) body.start_date = null;
      if (!body.end_date) body.end_date = null;
      await api.createMenuSchedule(rid, selectedMenuId, body);
      const r = await api.getMenuSchedules(rid, selectedMenuId);
      setSchedules(r.schedules || []);
      setForm({ schedule_type: "recurring_weekly", days_of_week: [], start_time: "", end_time: "", start_date: "", end_date: "", timezone: "America/New_York" });
      // Refresh active menu resolution
      const ar = await api.getActiveMenu(rid).catch(() => null);
      if (ar) { setActiveMenu(ar.menu); setResolution(ar.resolution || null); setActiveSchedule(ar.active_schedule || null); }
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(sid) {
    if (!confirm("Delete this schedule rule?")) return;
    await api.deleteMenuSchedule(rid, selectedMenuId, sid);
    const r = await api.getMenuSchedules(rid, selectedMenuId);
    setSchedules(r.schedules || []);
    const ar = await api.getActiveMenu(rid).catch(() => null);
    if (ar) { setActiveMenu(ar.menu); setResolution(ar.resolution || null); setActiveSchedule(ar.active_schedule || null); }
  }

  function toggleDow(d) {
    setForm(f => ({
      ...f,
      days_of_week: f.days_of_week.includes(d)
        ? f.days_of_week.filter(x => x !== d)
        : [...f.days_of_week, d].sort((a, b) => a - b),
    }));
  }

  if (loading) return <p style={{ color: "#8a9ab0" }}>Loading…</p>;
  if (!menus.length) return <p style={{ color: "#8a9ab0" }}>No published menus. Publish a menu first.</p>;

  return (
    <div>
      {/* Active menu resolution */}
      <div style={{ ...card, background: "#f8fafc", border: "1px solid #e4e9f0", marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f1720", marginBottom: 10 }}>
          Why is this menu currently active?
        </div>
        {activeMenu
          ? <ResolutionPanel menu={activeMenu} resolution={resolution} schedule={activeSchedule} />
          : <p style={{ color: "#8a9ab0", margin: 0, fontSize: 13 }}>No published menus.</p>
        }
      </div>

      {/* Menu selector */}
      <div style={{ marginBottom: 20 }}>
        <span style={labelStyle}>Configure schedules for</span>
        <select
          value={selectedMenuId || ""}
          onChange={e => setSelectedMenuId(Number(e.target.value))}
          style={{ ...inputStyle, width: "auto", minWidth: 200 }}
        >
          {menus.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      {/* Existing schedules */}
      {schedules.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {schedules.map(s => {
            const isActiveRule = s.id === resolution?.schedule_id;
            return (
              <div key={s.id} style={{
                ...card,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px",
                border: isActiveRule ? "1px solid #86efac" : "1px solid #e4e9f0",
                background: isActiveRule ? "#f0fdf4" : "#fff",
              }}>
                <div>
                  {isActiveRule && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#166534", background: "#bbf7d0", padding: "1px 8px", borderRadius: 8, marginRight: 8 }}>
                      ACTIVE NOW
                    </span>
                  )}
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0f1720" }}>
                    {s.schedule_type.replace(/_/g, " ")}
                  </span>
                  {s.days_of_week?.length > 0 && (
                    <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 8 }}>
                      {s.days_of_week.map(d => DOW_LABELS[d]).join(", ")}
                    </span>
                  )}
                  {s.start_time && (
                    <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 8 }}>
                      {s.start_time} – {s.end_time}
                    </span>
                  )}
                  {s.start_date && (
                    <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 8 }}>
                      {s.start_date}{s.end_date && s.end_date !== s.start_date ? ` to ${s.end_date}` : ""}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: "#8a9ab0", marginLeft: 8 }}>({s.timezone})</span>
                  {!s.is_active && <span style={{ fontSize: 11, color: "#ef4444", marginLeft: 8 }}>(inactive)</span>}
                </div>
                <button
                  onClick={() => handleDelete(s.id)}
                  style={{ ...btn("secondary"), padding: "4px 12px", fontSize: 12, color: "#ef4444" }}
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add schedule form */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "#0f1720" }}>Add Schedule Rule</div>
        <form onSubmit={handleAdd}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <span style={labelStyle}>Schedule Type</span>
              <select
                value={form.schedule_type}
                onChange={e => setForm(f => ({ ...f, schedule_type: e.target.value }))}
                style={inputStyle}
              >
                {SCHEDULE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <span style={labelStyle}>Timezone</span>
              <input
                value={form.timezone}
                onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
                style={inputStyle}
                placeholder="America/New_York"
              />
            </div>
          </div>

          {form.schedule_type === "recurring_weekly" && (
            <div style={{ marginBottom: 16 }}>
              <span style={labelStyle}>Days of Week</span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {DOW_LABELS.map((d, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDow(i)}
                    style={{
                      padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                      border: "1px solid #e4e9f0",
                      background: form.days_of_week.includes(i) ? "#1F4E3D" : "#fff",
                      color: form.days_of_week.includes(i) ? "#fff" : "#4a5568",
                      cursor: "pointer",
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {["recurring_weekly", "time_window", "date_range"].includes(form.schedule_type) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <span style={labelStyle}>Start Time</span>
                <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <span style={labelStyle}>End Time</span>
                <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} style={inputStyle} />
              </div>
            </div>
          )}

          {["date_range", "one_time"].includes(form.schedule_type) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <span style={labelStyle}>Start Date</span>
                <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <span style={labelStyle}>End Date</span>
                <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} style={inputStyle} />
              </div>
            </div>
          )}

          <button type="submit" disabled={saving} style={btn("primary")}>
            {saving ? "Adding…" : "Add Rule"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Tab: Outputs ───────────────────────────────────────────────────────────

const OUTPUT_TYPES = [
  { value: "pdf",           label: "PDF Menu" },
  { value: "adobe_export",  label: "Adobe Export" },
  { value: "social_post",   label: "Social Post" },
  { value: "story",         label: "Story / Reel" },
  { value: "flyer",         label: "Print Flyer" },
  { value: "grubbid_live",  label: "Grubbid Live" },
];

function OutputsTab({ rid, usageSummary }) {
  const [outputs, setOutputs]       = useState([]);
  const [menus, setMenus]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [form, setForm] = useState({ menu_id: "", output_type: "pdf", variant_key: "full_menu" });
  const [creating, setCreating]     = useState(false);
  const [exporting, setExporting]   = useState({});

  const load = useCallback(async () => {
    try {
      const [outRes, menuRes] = await Promise.allSettled([
        api.getMenuOutputs(rid),
        api.getMenus(rid),
      ]);
      if (outRes.status === "fulfilled")  setOutputs(outRes.value.outputs || []);
      if (menuRes.status === "fulfilled") {
        const published = (menuRes.value.menus || []).filter(m => m.status === "published");
        setMenus(published);
        if (published.length && !form.menu_id) {
          setForm(f => ({ ...f, menu_id: String(published[0].id) }));
        }
      }
    } finally {
      setLoading(false);
    }
  }, [rid]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.createMenuOutput(rid, { ...form, menu_id: Number(form.menu_id) });
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleExport(oid) {
    setExporting(ex => ({ ...ex, [oid]: true }));
    try {
      await api.triggerMenuOutputExport(rid, oid);
      await load();
    } catch (e) {
      if (e.status === 402) {
        alert("Adobe limit reached. Upgrade or wait for next billing period.");
      } else {
        alert(e.message);
      }
    } finally {
      setExporting(ex => ({ ...ex, [oid]: false }));
    }
  }

  async function handleDelete(oid) {
    if (!confirm("Delete this output?")) return;
    await api.deleteMenuOutput(rid, oid);
    await load();
  }

  if (loading) return <p style={{ color: "#8a9ab0" }}>Loading…</p>;

  return (
    <div>
      {/* Create output form */}
      <div style={{ ...card, marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "#0f1720" }}>Request New Output</div>
        {menus.length === 0 ? (
          <p style={{ color: "#8a9ab0", margin: 0 }}>No published menus. Publish a menu first.</p>
        ) : (
          <form onSubmit={handleCreate} style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <span style={labelStyle}>Menu</span>
              <select value={form.menu_id} onChange={e => setForm(f => ({ ...f, menu_id: e.target.value }))} style={{ ...inputStyle, width: "auto", minWidth: 160 }}>
                {menus.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <span style={labelStyle}>Output Type</span>
              <select value={form.output_type} onChange={e => setForm(f => ({ ...f, output_type: e.target.value }))} style={{ ...inputStyle, width: "auto", minWidth: 140 }}>
                {OUTPUT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <span style={labelStyle}>Variant</span>
              <input value={form.variant_key} onChange={e => setForm(f => ({ ...f, variant_key: e.target.value }))} style={{ ...inputStyle, width: 120 }} placeholder="full_menu" />
            </div>
            <button type="submit" disabled={creating} style={btn("primary")}>
              {creating ? "Creating…" : "Create"}
            </button>
          </form>
        )}
      </div>

      {/* Output list */}
      {outputs.length === 0 && <p style={{ color: "#8a9ab0" }}>No outputs yet.</p>}
      {outputs.map(o => (
        <div key={o.id} style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0f1720" }}>
                {OUTPUT_TYPES.find(t => t.value === o.output_type)?.label || o.output_type}
              </span>
              <span style={{ ...statusBadge(o.status), marginLeft: 10 }}>{o.status}</span>
              {o.cache_hit && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#0369a1", background: "#e0f2fe", padding: "2px 8px", borderRadius: 8, marginLeft: 6 }}>
                  CACHE HIT
                </span>
              )}
              <div style={{ fontSize: 11, color: "#8a9ab0", marginTop: 3 }}>
                {o.menu_name} · {o.variant_key} · {new Date(o.created_at).toLocaleDateString()}
              </div>
              {o.filename && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{o.filename}</div>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {(o.status === "pending" || o.status === "failed") && (
                <button onClick={() => handleExport(o.id)} disabled={exporting[o.id]} style={btn("primary")}>
                  {exporting[o.id] ? "Generating…" : "Generate"}
                </button>
              )}
              {o.status === "ready" && (
                <button onClick={() => handleExport(o.id)} disabled={exporting[o.id]} style={btn("secondary")}>
                  {exporting[o.id] ? "Re-generating…" : "Regenerate"}
                </button>
              )}
              <button onClick={() => handleDelete(o.id)} style={{ ...btn("secondary"), color: "#ef4444" }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

const TABS = [
  { key: "menus",     label: "Menus" },
  { key: "scheduler", label: "Scheduler" },
  { key: "outputs",   label: "Outputs" },
];

export default function OperatorMenuStudio() {
  const { selectedRestaurant } = useOperator();
  const [tab, setTab] = useState("menus");
  const [usageSummary, setUsageSummary]   = useState(null);
  const [usageLoading, setUsageLoading]   = useState(true);

  const rid = selectedRestaurant?.id;

  // Load Adobe usage summary for the banner — available on all tabs
  useEffect(() => {
    if (!rid) return;
    setUsageLoading(true);
    api.getAdobeUsageSummary(rid)
      .then(r => setUsageSummary(r))
      .catch(() => setUsageSummary(null))
      .finally(() => setUsageLoading(false));
  }, [rid]);

  if (!rid) {
    return (
      <OperatorLayout title="Menu Studio">
        <p style={{ color: "#8a9ab0" }}>Select a restaurant to get started.</p>
      </OperatorLayout>
    );
  }

  return (
    <OperatorLayout title="Menu Studio">
      {/* Persistent Adobe usage banner */}
      <AdobeUsageBanner summary={usageSummary} loading={usageLoading} />

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid #e4e9f0" }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: tab === t.key ? 700 : 500,
              border: "none",
              background: "transparent",
              color: tab === t.key ? "#1F4E3D" : "#6b7280",
              borderBottom: tab === t.key ? "2px solid #1F4E3D" : "2px solid transparent",
              cursor: "pointer",
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "menus"     && <MenusTab     rid={rid} />}
      {tab === "scheduler" && <SchedulerTab rid={rid} />}
      {tab === "outputs"   && <OutputsTab   rid={rid} usageSummary={usageSummary} />}
    </OperatorLayout>
  );
}
