/**
 * Profile → Connects box (Andre 2026-11-01, same as the app): Connects got a box the size of My Social
 * Calendar where the little Connects pill was. Requests and asks waiting, Who's Available (up to 3),
 * the next Social Plan (click for who's going), your Connects' faces; quiet + Find Connects if nothing's on.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getConnectsNow, listConnections } from "../../../lib/consumerApi.js";
import { groupAvailable, PlanPeople } from "./ConnectsNowSection.jsx";
import PlanTag from "./PlanTag.jsx";
import * as s from "./myMenuplyStyles.js";

const AVAILABLE_SHOWN = 3;
const FACES_SHOWN = 6;
const ALL = "/feed/connects";

function planWhen(p) {
  if (!p?.date) return "Day not set";
  const day = new Date(`${p.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  if (!p.time) return day;
  const [h, m] = p.time.split(":").map(Number);
  return `${day} · ${new Date(2000, 0, 1, h, m).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

function Face({ name, url, size = 28 }) {
  return url ? (
    <img src={url} alt="" style={{ ...styles.face, width: size, height: size }} />
  ) : (
    <span style={{ ...styles.face, ...styles.initial, width: size, height: size }} aria-hidden>
      {String(name || "?").slice(0, 1).toUpperCase()}
    </span>
  );
}

export default function ProfileConnectsBox() {
  const [now, setNow] = useState(null);
  const [accepted, setAccepted] = useState([]);
  const [incoming, setIncoming] = useState(0);
  const [planOpen, setPlanOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    getConnectsNow()
      .then((d) => alive && setNow(d || {}))
      .catch(() => alive && setNow({}));
    listConnections()
      .then((l) => {
        if (!alive) return;
        setAccepted(l?.accepted || []);
        setIncoming((l?.pending_incoming || []).length);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const needs = now?.needs_answer || [];
  const requests = Math.max(incoming, needs.filter((a) => a.type === "connect_request").length);
  const asks = needs.filter((a) => a.type === "join_request").length;
  const t = Date.now();
  const rightNow = (now?.right_now || []).filter((r) => r.type !== "vibe" || !r.vibe?.expires_at || new Date(r.vibe.expires_at).getTime() > t);
  // One row per person, colored by their first vibe group.
  const seen = new Set();
  const available = [];
  for (const { group, rows } of groupAvailable(rightNow)) {
    for (const r of rows) {
      const id = r.peer?.id ?? r.key;
      if (seen.has(id)) continue;
      seen.add(id);
      available.push({ r, group });
    }
  }
  const nextPlan = (now?.coming_up || [])[0] || null;
  const count = accepted.length || now?.connection_count || 0;
  const live = Boolean(requests || asks || available.length || nextPlan);

  return (
    <section style={s.section} data-testid="profile-connects-box">
      <div style={styles.card}>
        <div style={styles.head}>
          <strong style={{ fontSize: 18, color: "#0f172a" }}>Connects{count ? ` · ${count}` : ""}</strong>
          <Link to={ALL} style={styles.link} data-testid="profile-connects-pill">
            See all ›
          </Link>
        </div>

        {requests ? (
          <Link to={ALL} style={styles.row} data-testid="profile-connects-requests">
            <span style={styles.badge} aria-label={`${requests} new ${requests === 1 ? "request" : "requests"}`}>
              {requests}
            </span>
            <strong style={styles.rowText}>{`${requests} connect ${requests === 1 ? "request" : "requests"} waiting`}</strong>
            <span style={styles.link}>›</span>
          </Link>
        ) : null}
        {asks ? (
          <Link to={ALL} style={styles.row} data-testid="profile-connects-asks">
            <span style={styles.badge}>{asks}</span>
            <strong style={styles.rowText}>{`${asks} ${asks === 1 ? "ask" : "asks"} to join your plans`}</strong>
            <span style={styles.link}>›</span>
          </Link>
        ) : null}

        {available.length ? (
          <div style={styles.block} data-testid="profile-connects-available">
            <span style={styles.blockTitle}>Who's Available</span>
            {available.slice(0, AVAILABLE_SHOWN).map(({ r, group }) => (
              <Link
                key={r.key}
                to={r.type === "join_me" || !r.peer?.id ? ALL : `/account/connections/${r.peer.id}`}
                style={styles.person}
                data-testid={`profile-connects-available-${r.key}`}
              >
                <span style={{ ...styles.dot, background: group.color }} aria-hidden />
                <Face name={r.peer?.name} url={r.peer?.avatar_url} />
                <span style={styles.rowText}>
                  <strong>{r.peer?.name || "A diner"}</strong>
                  <span style={{ color: group.color, fontWeight: 700 }}>{` · ${group.label}`}</span>
                </span>
              </Link>
            ))}
            {available.length > AVAILABLE_SHOWN ? (
              <Link to={ALL} style={styles.link}>{`+ ${available.length - AVAILABLE_SHOWN} more available ›`}</Link>
            ) : null}
          </div>
        ) : null}

        {nextPlan ? (
          <div style={styles.block} data-testid="profile-connects-next-plan">
            <span style={styles.blockTitle}>Next Social Plan</span>
            <button
              type="button"
              style={styles.planOpen}
              aria-expanded={planOpen}
              aria-label={`${nextPlan.title}, see who's going`}
              onClick={() => setPlanOpen((v) => !v)}
              data-testid="profile-connects-next-plan-open"
            >
              <span style={styles.when}>
                <PlanTag plan={nextPlan} />
                {planWhen(nextPlan)}
              </span>
              <strong style={{ fontSize: 15, color: "#0f172a" }}>
                {nextPlan.peer?.name ? `${nextPlan.peer.name}: ` : ""}
                {nextPlan.title}
              </strong>
            </button>
            {planOpen ? <PlanPeople plan={nextPlan} /> : null}
          </div>
        ) : null}

        <div style={styles.footer}>
          <Link to={ALL} style={styles.faces} aria-label="All Connects" data-testid="profile-connects-faces">
            {accepted.slice(0, FACES_SHOWN).map((c, i) => (
              <span key={c.peer?.id ?? i} style={{ marginLeft: i ? -8 : 0, display: "inline-flex" }}>
                <Face name={c.peer?.display_name} url={c.peer?.avatar_url} />
              </span>
            ))}
            {now && !live ? (
              <span style={{ ...s.muted, marginLeft: accepted.length ? 8 : 0 }} data-testid="profile-connects-quiet">
                {accepted.length ? "Nothing going on right now." : "No Connects yet."}
              </span>
            ) : null}
          </Link>
          {now && !live ? (
            <Link to="/account/find-diners" style={styles.find} data-testid="profile-connects-find">
              Find Connects
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

const styles = {
  card: { background: "#fff", border: "1px solid #d1fae5", borderRadius: 16, padding: 14, display: "grid", gap: 10 },
  head: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  link: { fontSize: 13, fontWeight: 700, color: "#15803d", textDecoration: "none" },
  row: { display: "flex", alignItems: "center", gap: 10, paddingTop: 8, borderTop: "1px solid #f1f5f9", color: "#0f172a", textDecoration: "none" },
  rowText: { flex: 1, minWidth: 0, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    padding: "0 6px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#dc2626",
    color: "#fff",
    fontSize: 12,
    fontWeight: 800,
  },
  block: { display: "grid", gap: 6, paddingTop: 8, borderTop: "1px solid #f1f5f9" },
  blockTitle: { fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4 },
  person: { display: "flex", alignItems: "center", gap: 8, color: "#0f172a", textDecoration: "none" },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  face: { borderRadius: 999, objectFit: "cover", border: "2px solid #fff", flexShrink: 0 },
  initial: { display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#dcfce7", color: s.GREEN, fontWeight: 800, fontSize: 12 },
  planOpen: { display: "grid", gap: 2, padding: 0, border: "none", background: "transparent", textAlign: "left", cursor: "pointer", font: "inherit" },
  when: { fontSize: 12, fontWeight: 700, color: "#15803d" },
  footer: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, paddingTop: 8, borderTop: "1px solid #f1f5f9" },
  faces: { display: "flex", alignItems: "center", minWidth: 0, textDecoration: "none" },
  find: { background: "#0f7a24", color: "#fff", borderRadius: 999, padding: "8px 14px", fontSize: 13, fontWeight: 700, textDecoration: "none", flexShrink: 0 },
};
