/**
 * My Social Calendar — every meal, event and invite the diner is going to, in one list
 * (Andre approved 2026-10-28, menuply-mobile docs/15). Phase B: who can see my calendar, and on
 * plans I host, Only me + how Connects join (Sharing ›).
 * Route: /account/social-plans
 */

import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { listMySocialPlans } from "../../lib/consumerApi.js";
import { CalendarWhoCard, PlanPanel } from "./myMenuply/SocialPlanSharing.jsx";
import NewPlanPanel from "./myMenuply/NewPlanPanel.jsx";
import PickPlanTime from "./myMenuply/PickPlanTime.jsx";
import PlanTag from "./myMenuply/PlanTag.jsx";
import { MonthGrid } from "./myMenuply/PlanCalendar.jsx";
import { ymdOf } from "../../lib/socialPlanTags.js";

const SOCIAL_PLAN_KIND_LABELS = {
  dine: "Meal",
  my_event: "Event",
  venue_event: "Venue event",
};

const STATUS_LABELS = {
  organizer: "You're hosting",
  going: "Going",
  maybe: "Maybe",
  declined: "Not going",
  interested: "Interested",
};

/** "Wed, Oct 29 · 7:30 PM", "Today · Noon", or "Day not set". */
function formatPlanWhen(plan, today) {
  if (!plan?.date) return "Day not set";
  const d = new Date(`${plan.date}T12:00:00`);
  const day =
    plan.date === today
      ? "Today"
      : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  if (!plan.time) return day;
  const [h, m] = plan.time.split(":").map(Number);
  if (h === 12 && m === 0) return `${day} · Noon`;
  const t = new Date(2000, 0, 1, h, m).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day} · ${t}`;
}

export default function SocialPlansPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [scope, setScope] = useState("upcoming");
  const [data, setData] = useState({ plans: [], today: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openKey, setOpenKey] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [picking, setPicking] = useState(null);
  // Month grid: dots for upcoming + the last 30 days; ?day=YYYY-MM-DD (from My Menuply's week strip).
  const [searchParams] = useSearchParams();
  const dayParam = searchParams.get("day");
  // ?new=1 (My Menuply's empty card, the X sheet) opens New plan.
  const [adding, setAdding] = useState(searchParams.get("new") != null);
  const [reload, setReload] = useState(0);
  const [day, setDay] = useState(/^\d{4}-\d{2}-\d{2}$/.test(dayParam || "") ? dayParam : null);
  const [month, setMonth] = useState(() => `${(day || ymdOf(new Date())).slice(0, 7)}-01`);
  const [calPlans, setCalPlans] = useState([]);
  const moveMonth = (delta) =>
    setMonth((m) => {
      const [y, mo] = m.split("-").map(Number);
      return ymdOf(new Date(y, mo - 1 + delta, 1));
    });
  const replacePlan = (next) => {
    setData((d) => ({ ...d, plans: d.plans.map((p) => (p.key === next.key ? next : p)) }));
    setCalPlans((list) => list.map((p) => (p.key === next.key ? next : p)));
  };

  const load = useCallback(async (sc) => {
    setLoading(true);
    setError("");
    try {
      const res = await listMySocialPlans(sc);
      setData({ plans: res.plans || [], today: res.today || null });
    } catch (err) {
      setError(err.message || "Unable to load your Social Plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent("/account/social-plans")}`, { replace: true });
      return;
    }
    if (!authLoading && isAuthenticated) load(scope);
  }, [authLoading, isAuthenticated, navigate, load, scope, reload]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    Promise.all([listMySocialPlans("upcoming"), listMySocialPlans("past")])
      .then(([up, past]) => setCalPlans([...(past.plans || []), ...(up.plans || [])]))
      .catch(() => setCalPlans([]));
  }, [authLoading, isAuthenticated, reload]);

  const shown = day ? calPlans.filter((p) => p.date === day) : data.plans;
  const today = data.today || ymdOf(new Date());
  // My plan → its panel; an undated invite to me → pick a time; anything else → open it.
  const onPlanClick = (e, p) => {
    if (p.is_organizer && p.source !== "venue_event") {
      e.preventDefault();
      setOpenKey((k) => (k === p.key ? null : p.key));
    } else if (p.time_open) {
      e.preventDefault();
      setPicking((k) => (k === p.key ? null : p.key));
    }
  };

  return (
    <>
      <StickyPageHeader title="My Social Calendar" />
      <div style={styles.page} data-testid="social-plans-page">
        {/* Calendar first (Andre 2026-10-28): + adds a plan, ⚙︎ holds Who sees my calendar. */}
        <div style={styles.toolbar}>
          <button type="button" onClick={() => setSettingsOpen((v) => !v)} aria-expanded={settingsOpen} aria-label="Who sees my calendar" style={styles.iconButton} data-testid="social-plans-settings">
            ⚙︎
          </button>
          <button type="button" onClick={() => setAdding(true)} style={styles.addButton} data-testid="social-plans-add">
            + New plan
          </button>
        </div>
        {settingsOpen ? <CalendarWhoCard /> : null}
        {adding ? (
          <NewPlanPanel
            day={day && day >= today ? day : today}
            initialKind={searchParams.get("new")}
            onClose={() => setAdding(false)}
            onAdded={() => setReload((n) => n + 1)}
          />
        ) : null}

        <MonthGrid
          month={month}
          plans={calPlans}
          today={data.today || ymdOf(new Date())}
          selected={day}
          onSelect={(d) => setDay((cur) => (cur === d ? null : d))}
          onMonth={moveMonth}
        />

        {day ? (
          <div style={styles.dayHead} data-testid="social-plans-day">
            <strong>{new Date(`${day}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</strong>
            <span style={{ display: "flex", gap: 14 }}>
              {day >= today ? (
                <button type="button" onClick={() => setAdding(true)} style={styles.sharing} data-testid="social-plans-day-add">
                  + Plan something
                </button>
              ) : null}
              <button type="button" onClick={() => setDay(null)} style={styles.sharing} data-testid="social-plans-day-clear">
                Show all plans
              </button>
            </span>
          </div>
        ) : null}

        <div role="tablist" style={{ ...styles.tabs, ...(day ? { display: "none" } : null) }}>
          {[
            ["upcoming", "Coming up"],
            ["past", "Past"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={scope === id}
              onClick={() => setScope(id)}
              style={{ ...styles.tab, ...(scope === id ? styles.tabOn : null) }}
              data-testid={`social-plans-tab-${id}`}
            >
              {label}
            </button>
          ))}
        </div>

        {error ? <p style={styles.error}>{error}</p> : null}
        {loading || authLoading ? (
          <p style={styles.muted}>Loading…</p>
        ) : shown.length === 0 ? (
          <p style={styles.muted} data-testid="social-plans-empty">
            {day
              ? "Nothing planned that day."
              : scope === "upcoming"
                ? "Nothing planned yet. Click + New plan or a day to add one."
                : "No plans in the last 30 days."}
          </p>
        ) : (
          <ul style={styles.list}>
            {shown.map((p) => (
              <li key={p.key}>
                {/* "Day not set" / "You pick a time": pick it here instead of opening the restaurant. */}
                <Link
                  to={p.href || "#"}
                  onClick={(e) => onPlanClick(e, p)}
                  style={styles.row}
                  data-testid={`social-plan-${p.key}`}
                >
                  <span style={styles.when}>
                    <PlanTag plan={p} testId={`social-plan-${p.key}-tag`} />
                    {p.time_open ? "Pick a day & time ›" : formatPlanWhen(p, data.today)}
                  </span>
                  <strong style={styles.title}>{p.title}</strong>
                  <span style={styles.meta}>
                    {[
                      SOCIAL_PLAN_KIND_LABELS[p.kind],
                      p.place?.name && p.place.name !== p.title ? p.place.name : null,
                      p.organizer_name && !p.is_organizer ? `From ${p.organizer_name}` : null,
                      STATUS_LABELS[p.my_status],
                      p.going_count > 1 ? `${p.going_count} going` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </Link>
                {picking === p.key ? (
                  <PickPlanTime
                    plan={p}
                    onSaved={(next) => {
                      replacePlan(next);
                      setPicking(null);
                    }}
                  />
                ) : null}
                {openKey === p.key ? (
                  <PlanPanel
                    plan={p}
                    onSaved={replacePlan}
                    onPickTime={() => setPicking(p.key)}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
      <BottomNav />
    </>
  );
}

const styles = {
  page: {
    maxWidth: 520,
    margin: "0 auto",
    padding: "16px 16px 96px",
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
  },
  toolbar: { display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10 },
  iconButton: { border: "1px solid #e2e8f0", background: "#fff", borderRadius: 10, padding: "8px 11px", fontSize: 16, cursor: "pointer", color: "#15803d" },
  addButton: { border: "none", background: "#0f172a", color: "#fff", borderRadius: 10, padding: "9px 14px", fontWeight: 700, cursor: "pointer" },
  primary: {
    flex: 1,
    textAlign: "center",
    padding: "12px 14px",
    borderRadius: 12,
    background: "#0f172a",
    color: "#fff",
    fontWeight: 700,
    textDecoration: "none",
  },
  secondary: {
    flex: 1,
    textAlign: "center",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    color: "#0f172a",
    fontWeight: 700,
    textDecoration: "none",
  },
  tabs: { display: "flex", gap: 6, marginTop: 16 },
  tab: {
    padding: "8px 14px",
    borderRadius: 999,
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#475569",
    fontWeight: 600,
    cursor: "pointer",
  },
  tabOn: { background: "#0f172a", color: "#fff", borderColor: "#0f172a" },
  error: { color: "#b91c1c", fontWeight: 600 },
  muted: { color: "#64748b", fontSize: 13, marginTop: 16 },
  list: { listStyle: "none", padding: 0, margin: "12px 0 0", display: "grid", gap: 8 },
  row: {
    display: "grid",
    gap: 2,
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 12,
    background: "#fff",
    color: "#0f172a",
    textDecoration: "none",
  },
  when: { fontSize: 12, fontWeight: 700, color: "#7c3aed" },
  title: { fontSize: 15 },
  meta: { fontSize: 13, color: "#64748b" },
  dayHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, fontSize: 15, color: "#0f172a" },
  sharing: {
    background: "none",
    border: "none",
    padding: "4px 2px",
    color: "#7c3aed",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },
};
