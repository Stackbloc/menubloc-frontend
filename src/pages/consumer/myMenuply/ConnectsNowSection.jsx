/**
 * My Menuply → Connects, things to do (Andre approved 2026-10-28, menuply-mobile docs/15, Phase C).
 * Same section as the app's Profile: only rows with a button; empty groups hidden.
 *   Pending connect requests — Accept / Decline right here; always shown, with a line when there are
 *     none, so diners know where requests land (Andre 2026-10-30)
 *   Needs your answer — "Ask to Join" on my plans → Yes / Not this time (Phase B)
 *   Right now — live Join Me → Join; live vibe → Invite (Invite to Eat)
 *   Coming up — Connects' plans I can see, Wish List / Fav matches first →
 *     Join · Ask to Join · Requested ✓ · Going ✓ (SocialPlanActionButton)
 * GET /api/consumer/social-plans/connects. Owner view only; quiet if it can't load.
 * Andre 2026-10-30: lives at the top of the Connects page (`onPage`: no heading or All Connects link,
 * the list is right below), reached from the Connects pill on Profile.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { acceptConnection, answerSocialPlanJoinRequest, declineConnection, getConnectsNow } from "../../../lib/consumerApi.js";
import SocialPlanActionButton from "./SocialPlanActionButton.jsx";
import PlanTag from "./PlanTag.jsx";
import * as s from "./myMenuplyStyles.js";

const SHOWN = 4;

function timeLeft(expiresAt, now) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const mins = Math.ceil(ms / 60000);
  const h = Math.floor(mins / 60);
  return h ? `${h} h ${mins % 60} m` : `${mins} m`;
}

function planWhen(p) {
  if (!p?.date) return "Day not set";
  const day = new Date(`${p.date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  if (!p.time) return day;
  const [h, m] = p.time.split(":").map(Number);
  return `${day} · ${new Date(2000, 0, 1, h, m).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

export default function ConnectsNowSection({ onPage = false }) {
  const [data, setData] = useState(null);
  const [now, setNow] = useState(0);
  const [answered, setAnswered] = useState(() => new Set());

  useEffect(() => {
    let alive = true;
    getConnectsNow()
      .then((d) => {
        if (!alive) return;
        setNow(Date.now());
        setData(d);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  if (!data) return null;
  const open = (data.needs_answer || []).filter((a) => !answered.has(a.key));
  const connectRequests = open.filter((a) => a.type === "connect_request");
  const asks = open.filter((a) => a.type === "join_request");
  const answer = async (a, approve) => {
    try {
      if (a.type === "connect_request") {
        await (approve ? acceptConnection : declineConnection)(a.connection_id);
      } else {
        await answerSocialPlanJoinRequest(a.request_id, approve);
      }
      setAnswered((prev) => new Set(prev).add(a.key));
      if (a.type === "connect_request" && approve) {
        setData((d) => (d ? { ...d, connection_count: (d.connection_count || 0) + 1 } : d));
      }
    } catch {
      /* stays in the list; they can try again */
    }
  };
  // A vibe can run out between the server answering and the page showing.
  const rightNow = (data.right_now || []).filter(
    (r) => r.type !== "vibe" || !r.vibe?.expires_at || timeLeft(r.vibe.expires_at, now)
  );
  const comingUp = data.coming_up || [];
  const nothing = !connectRequests.length && !asks.length && !rightNow.length && !comingUp.length;

  return (
    <section style={s.section} data-testid="connects-now">
      <div style={styles.card}>
        {onPage ? null : <h2 style={styles.heading}>Connects</h2>}

        <Group title="Pending connect requests" testId="connects-pending-requests">
          {connectRequests.length ? null : (
            <p style={s.muted} data-testid="connects-pending-none">
              No pending connect requests.
            </p>
          )}
          {connectRequests.map((a) => (
            <div key={a.key} style={styles.row} data-testid={`connects-request-${a.connection_id}`}>
              <Avatar peer={a.peer} />
              <div style={styles.text}>
                <strong style={styles.name}>{a.peer?.name || "A diner"}</strong>
                <span style={styles.line}>Wants to connect</span>
              </div>
              <button
                type="button"
                style={{ ...styles.buttonQuiet, border: "none", cursor: "pointer" }}
                onClick={() => answer(a, false)}
                data-testid={`connects-request-${a.connection_id}-decline`}
              >
                Decline
              </button>
              <button
                type="button"
                style={{ ...styles.button, border: "none", cursor: "pointer" }}
                onClick={() => answer(a, true)}
                data-testid={`connects-request-${a.connection_id}-accept`}
              >
                Accept
              </button>
            </div>
          ))}
        </Group>

        {asks.length ? (
          <Group title="Needs your answer" testId="connects-needs-answer">
            {asks.map((a) => (
              <div key={a.key} style={styles.row} data-testid={`connects-row-${a.key}`}>
                <Avatar peer={a.peer} />
                <div style={styles.text}>
                  <strong style={styles.name}>{a.peer?.name || "A diner"}</strong>
                  <span style={styles.line}>
                    {`Wants to join · ${a.plan_title}${a.message ? ` · “${a.message}”` : ""}`}
                  </span>
                </div>
                <button type="button" style={{ ...styles.buttonQuiet, border: "none", cursor: "pointer" }} onClick={() => answer(a, false)}>
                  Not this time
                </button>
                <button type="button" style={{ ...styles.button, border: "none", cursor: "pointer" }} onClick={() => answer(a, true)}>
                  Yes
                </button>
              </div>
            ))}
          </Group>
        ) : null}

        {rightNow.length ? (
          <Group title="Right now" testId="connects-right-now">
            {rightNow.slice(0, SHOWN).map((r) =>
              r.type === "join_me" ? (
                <Row
                  key={r.key}
                  peer={r.peer}
                  line={`On Join Me${r.place?.name ? ` · ${r.place.name}` : ""}`}
                  to={r.href}
                  button="Join"
                  testId={r.key}
                />
              ) : (
                <Row
                  key={r.key}
                  peer={r.peer}
                  line={[r.vibe?.label, timeLeft(r.vibe?.expires_at, now) ? `${timeLeft(r.vibe.expires_at, now)} left` : null]
                    .filter(Boolean)
                    .join(" · ")}
                  to="/account/invite-to-eat"
                  button="Invite"
                  testId={r.key}
                />
              )
            )}
          </Group>
        ) : null}

        {comingUp.length ? (
          <Group title="Coming up" testId="connects-coming-up">
            {comingUp.slice(0, SHOWN).map((p) => (
              <div key={p.key} style={styles.row} data-testid={`connects-plan-${p.key}`}>
                <div style={styles.text}>
                  <span style={styles.when}>
                    <PlanTag plan={p} />
                    {planWhen(p)}
                  </span>
                  <strong style={styles.name}>
                    {p.peer?.name ? `${p.peer.name}: ` : ""}
                    {p.title}
                  </strong>
                  <span style={styles.muted}>
                    {[
                      p.place?.name && p.place.name !== p.title ? p.place.name : null,
                      p.going_count > 1 ? `${p.going_count} going` : null,
                      p.match === "wish_list" ? "On your Wish List" : p.match === "fav" ? "One of your Favs" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
                <SocialPlanActionButton plan={p} testId={`connects-plan-${p.key}-action`} />
              </div>
            ))}
          </Group>
        ) : null}

        {nothing ? (
          <p style={s.muted} data-testid="connects-quiet">
            {data.connection_count ? "Nothing going on with your Connects right now." : "No Connects yet."}
          </p>
        ) : null}

        <div style={styles.footer}>
          {onPage ? null : (
            <Link to="/feed/connects" style={styles.all}>
              All Connects{data.connection_count ? ` · ${data.connection_count}` : ""} ›
            </Link>
          )}
          {/* Where diners meet new people (Andre 2026-10-30): visible, not behind All Connects. */}
          <Link to="/account/find-diners" style={styles.find} data-testid="profile-find-diners">
            Find Connects
          </Link>
        </div>
      </div>
    </section>
  );
}

function Group({ title, testId, children }) {
  return (
    <div style={styles.group} data-testid={testId}>
      <span style={styles.groupTitle}>{title}</span>
      {children}
    </div>
  );
}

function Avatar({ peer }) {
  return peer?.avatar_url ? (
    <img src={peer.avatar_url} alt="" style={styles.avatar} />
  ) : (
    <span style={{ ...styles.avatar, ...styles.initial }} aria-hidden>
      {String(peer?.name || "?").slice(0, 1).toUpperCase()}
    </span>
  );
}

function Row({ peer, line, to, button, testId }) {
  return (
    <div style={styles.row} data-testid={`connects-row-${testId}`}>
      <Avatar peer={peer} />
      <div style={styles.text}>
        <strong style={styles.name}>{peer?.name || "A diner"}</strong>
        <span style={styles.line}>{line}</span>
      </div>
      {to ? (
        <Link to={to} style={styles.button}>
          {button}
        </Link>
      ) : null}
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    border: "1px solid #d1fae5",
    borderRadius: 16,
    padding: 14,
    display: "grid",
    gap: 12,
  },
  heading: { margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" },
  group: { display: "grid", gap: 6 },
  groupTitle: { fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4 },
  row: { display: "flex", alignItems: "center", gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, objectFit: "cover", flexShrink: 0 },
  initial: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#dcfce7",
    color: s.GREEN,
    fontWeight: 800,
  },
  text: { flex: 1, minWidth: 0, display: "grid", gap: 1 },
  name: { fontSize: 15, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  line: { fontSize: 13, color: s.GREEN_BRIGHT },
  when: { fontSize: 12, fontWeight: 700, color: s.GREEN_BRIGHT },
  muted: { fontSize: 13, color: "#64748b" },
  button: {
    padding: "6px 14px",
    borderRadius: 999,
    background: s.GREEN_BRIGHT,
    color: "#fff",
    fontWeight: 700,
    fontSize: 13,
    textDecoration: "none",
    flexShrink: 0,
  },
  buttonQuiet: {
    padding: "6px 14px",
    borderRadius: 999,
    background: "#dcfce7",
    color: s.GREEN,
    fontWeight: 700,
    fontSize: 13,
    textDecoration: "none",
    flexShrink: 0,
  },
  footer: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  find: { background: "#0f7a24", color: "#fff", borderRadius: 999, padding: "8px 14px", fontSize: 13, fontWeight: 700, textDecoration: "none" },
  all: { fontSize: 13, fontWeight: 700, color: s.GREEN_BRIGHT, textDecoration: "none" },
};
