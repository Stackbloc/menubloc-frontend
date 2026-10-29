/**
 * My Menuply → My Social Calendar (Andre 2026-10-28, same as the app's Profile card): this week as a
 * strip with a colored dot per plan (click a day to open it on the calendar), the next three plans,
 * and Open calendar. Owner view only; quiet if it can't load.
 */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listMySocialPlans } from "../../../lib/consumerApi.js";
import { ymdOf } from "../../../lib/socialPlanTags.js";
import { WeekStrip } from "./PlanCalendar.jsx";
import PlanTag from "./PlanTag.jsx";
import * as s from "./myMenuplyStyles.js";

const SHOWN = 3;

function when(p, today) {
  if (p.time_open || !p.date) return "Pick a day & time ›";
  const day = p.date === today ? "Today" : new Date(`${p.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  if (!p.time) return day;
  const [h, m] = p.time.split(":").map(Number);
  return `${day} · ${new Date(2000, 0, 1, h, m).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

export default function SocialCalendarCard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    listMySocialPlans("upcoming")
      .then((r) => setData({ plans: r.plans || [], today: r.today || null }))
      .catch(() => setData(null));
  }, []);

  if (!data) return null;
  const today = data.today || ymdOf(new Date());
  const next = data.plans.slice(0, SHOWN);
  return (
    <section style={s.section} data-testid="my-social-calendar">
      <div style={styles.card}>
        <div style={styles.head}>
          <strong style={{ fontSize: 18, color: "#0f172a" }}>
            📅 My Social Calendar{data.plans.length ? ` · ${data.plans.length}` : ""}
          </strong>
          <Link to="/account/social-plans" style={styles.link} data-testid="my-social-calendar-open">
            Open calendar ›
          </Link>
        </div>
        <WeekStrip plans={data.plans} today={today} onSelect={(day) => navigate(`/account/social-plans?day=${day}`)} />
        {next.map((p) => (
          <Link key={p.key} to={p.time_open ? "/account/social-plans" : p.href || "/account/social-plans"} style={styles.row} data-testid={`my-social-calendar-${p.key}`}>
            <span style={styles.when}>
              <PlanTag plan={p} />
              {when(p, today)}
            </span>
            <strong style={{ fontSize: 15 }}>{p.title}</strong>
          </Link>
        ))}
        {!next.length ? (
          <Link to="/account/social-plans?new=1" style={{ ...styles.link, fontWeight: 600 }}>
            Nothing planned yet. Add a plan ›
          </Link>
        ) : null}
      </div>
    </section>
  );
}

const styles = {
  card: { background: "#fff", border: "1px solid #d1fae5", borderRadius: 16, padding: 14, display: "grid", gap: 10 },
  head: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  link: { fontSize: 13, fontWeight: 700, color: "#15803d", textDecoration: "none" },
  row: { display: "grid", gap: 2, paddingTop: 8, borderTop: "1px solid #f1f5f9", color: "#0f172a", textDecoration: "none" },
  when: { fontSize: 12, fontWeight: 700, color: "#15803d" },
};
