/**
 * Diner social event detail — My Events card deep link.
 * Name, description, members (RSVPs), activity timeline.
 */

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import ShareModal from "../../components/share/ShareModal.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  ensureDinerSocialEventShareLink,
  getDinerSocialEvent,
} from "../../lib/consumerApi.js";
import { buildSocialEventJoinShareData } from "../../lib/diningCrewInviteShare.js";
import { MY_MENUPLY_PROFILE_PATH } from "../../lib/myMenuplyRoutes.js";

function formatWhen(ev) {
  const d = String(ev?.event_date || "").trim();
  const t = String(ev?.start_time || "").trim();
  if (!d) return t || null;
  try {
    const dt = new Date(`${d}T12:00:00`);
    const day = dt.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    return t ? `${day} · ${t}` : day;
  } catch {
    return [d, t].filter(Boolean).join(" · ");
  }
}

export default function DinerSocialEventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [event, setEvent] = useState(null);
  const [members, setMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareData, setShareData] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent(`/account/social-events/${eventId}`)}`);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getDinerSocialEvent(eventId)
      .then((data) => {
        if (cancelled) return;
        setEvent(data.event || null);
        setMembers(Array.isArray(data.members) ? data.members : []);
        setActivities(Array.isArray(data.activities) ? data.activities : []);
        setError("");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || "Unable to load event");
        setEvent(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, eventId, navigate]);

  async function onInvite() {
    try {
      const data = await ensureDinerSocialEventShareLink(eventId);
      const token =
        data?.invitation_token ||
        data?.event?.invitation_token ||
        event?.invitation_token;
      if (!token) throw new Error("Unable to create invite link");
      setShareData(
        buildSocialEventJoinShareData({
          title: event?.title,
          joinPath: `/join-event/${encodeURIComponent(String(token))}`,
        })
      );
      setShareOpen(true);
    } catch (err) {
      setError(err?.message || "Unable to create invite link");
    }
  }

  const when = formatWhen(event);
  const going = members.filter((m) => m.response_status === "going");
  const maybe = members.filter((m) => m.response_status === "maybe");

  return (
    <>
      <StickyPageHeader />
      <div style={styles.page} data-testid="diner-social-event-detail">
        <Link to={MY_MENUPLY_PROFILE_PATH} style={styles.back}>
          ← My Menuply
        </Link>

        {loading ? <p style={styles.muted}>Loading…</p> : null}
        {error ? <p style={styles.error}>{error}</p> : null}

        {event ? (
          <>
            <p style={styles.eyebrow}>My Event</p>
            <h1 style={styles.title}>{event.title}</h1>
            {when ? <p style={styles.meta}>{when}</p> : null}
            {event.location_label ? <p style={styles.meta}>{event.location_label}</p> : null}
            {event.description ? <p style={styles.description}>{event.description}</p> : null}

            <div style={styles.actions}>
              <button type="button" style={styles.primary} onClick={onInvite}>
                Invite people
              </button>
            </div>

            <section style={styles.section} data-testid="event-members">
              <h2 style={styles.h2}>
                Members
                <span style={styles.count}>
                  {going.length} going
                  {maybe.length ? ` · ${maybe.length} maybe` : ""}
                </span>
              </h2>
              {members.length === 0 ? (
                <p style={styles.muted}>No RSVPs yet — invite people to join.</p>
              ) : (
                <ul style={styles.list}>
                  {members.map((m) => (
                    <li key={m.id} style={styles.memberRow}>
                      <span style={styles.memberName}>{m.display_name}</span>
                      <span style={styles.badge}>{m.response_status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section style={styles.section} data-testid="event-activities">
              <h2 style={styles.h2}>Activity</h2>
              {activities.length === 0 ? (
                <p style={styles.muted}>No activity yet.</p>
              ) : (
                <ul style={styles.list}>
                  {activities.map((a) => (
                    <li key={a.id} style={styles.activityRow}>
                      <span>{a.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </div>
      <BottomNav />
      {shareOpen && shareData ? (
        <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} shareData={shareData} />
      ) : null}
    </>
  );
}

const styles = {
  page: {
    maxWidth: 560,
    margin: "0 auto",
    padding: "16px 16px calc(var(--bottom-nav-h, 72px) + 24px)",
    fontFamily: "Inter, Arial, sans-serif",
  },
  back: {
    display: "inline-block",
    marginBottom: 12,
    color: "#166534",
    fontWeight: 700,
    textDecoration: "none",
    fontSize: 14,
  },
  eyebrow: {
    margin: "0 0 6px",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#b45309",
  },
  title: {
    margin: "0 0 8px",
    fontSize: 28,
    fontWeight: 800,
    color: "#14532d",
    fontFamily: 'Georgia, "Times New Roman", serif',
    letterSpacing: "-0.02em",
  },
  meta: { margin: "0 0 4px", color: "#64748b", fontSize: 14, fontWeight: 600 },
  description: {
    margin: "12px 0 0",
    color: "#0f172a",
    fontSize: 15,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
  },
  actions: { marginTop: 16, display: "flex", gap: 8 },
  primary: {
    appearance: "none",
    border: "none",
    borderRadius: 999,
    padding: "10px 16px",
    background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  section: { marginTop: 28 },
  h2: {
    margin: "0 0 10px",
    fontSize: 16,
    fontWeight: 800,
    color: "#14532d",
    display: "flex",
    alignItems: "baseline",
    gap: 8,
  },
  count: { fontSize: 12, fontWeight: 600, color: "#64748b" },
  list: { listStyle: "none", margin: 0, padding: 0 },
  memberRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #e5e7eb",
  },
  memberName: { fontWeight: 700, color: "#0f172a" },
  badge: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "#166534",
    background: "#ecfdf5",
    borderRadius: 999,
    padding: "4px 8px",
  },
  activityRow: {
    padding: "8px 0",
    borderBottom: "1px solid #f1f5f9",
    color: "#334155",
    fontSize: 14,
  },
  muted: { color: "#64748b", fontSize: 14 },
  error: { color: "#b91c1c", fontWeight: 600 },
};
