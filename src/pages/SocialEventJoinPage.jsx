/**
 * Diner social event Join Me landing — future event anyone can accept.
 */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useConsumer } from "../context/ConsumerContext.jsx";
import ShareModal from "../components/share/ShareModal.jsx";
import {
  fetchPublicSocialEventJoin,
  respondToSocialEventJoin,
} from "../lib/consumerApi.js";
import {
  getEatInviteGuestDisplayName,
  getOrCreateEatInviteGuestKey,
  setEatInviteGuestDisplayName,
} from "../lib/eatInviteGuestIdentity.js";
import { buildSocialEventJoinShareData } from "../lib/diningCrewInviteShare.js";

const RESPONSES = [
  { status: "going", label: "I'm in" },
  { status: "maybe", label: "Maybe" },
  { status: "declined", label: "Can't" },
];

function formatWhen(event) {
  const parts = [event?.event_date, event?.start_time].filter(Boolean);
  return parts.join(" · ");
}

export default function SocialEventJoinPage() {
  const { token } = useParams();
  const { isAuthenticated } = useConsumer();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [event, setEvent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [responded, setResponded] = useState(null);
  const [guestName, setGuestName] = useState(() => getEatInviteGuestDisplayName());
  const [shareOpen, setShareOpen] = useState(false);

  async function reload() {
    const guestKey = getOrCreateEatInviteGuestKey();
    const data = await fetchPublicSocialEventJoin(token, { guestKey });
    const ev = data?.event;
    if (!ev) throw new Error(data?.error || "Event not found");
    setEvent(ev);
    return ev;
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    reload()
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || "Event not found");
          setEvent(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const shareData =
    event?.invitation_token || token
      ? buildSocialEventJoinShareData({
          title: event?.title,
          joinPath: `/join-event/${encodeURIComponent(String(token))}`,
        })
      : null;

  async function respond(status) {
    setBusy(true);
    setError("");
    try {
      if (guestName.trim()) setEatInviteGuestDisplayName(guestName.trim());
      const data = await respondToSocialEventJoin(token, {
        status,
        guest_key: isAuthenticated ? undefined : getOrCreateEatInviteGuestKey(),
      });
      setEvent(data?.event || event);
      setResponded(status);
    } catch (err) {
      setError(err.message || "Unable to respond");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.page} data-testid="social-event-join-loading">
        <p style={styles.muted}>Loading…</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div style={styles.page} data-testid="social-event-join-error">
        <h1 style={styles.h1}>Event not found</h1>
        <p style={styles.muted}>{error || "This link may have expired."}</p>
        <Link to="/" style={styles.link}>
          Back to Menuply
        </Link>
      </div>
    );
  }

  const organizer = event.organizer_display_name || "A diner";
  const joinClosed = !event.join_me_open;

  return (
    <div style={styles.page} data-testid="social-event-join-landing">
      <div style={styles.card}>
        <p style={styles.kicker}>Join Me · My Events</p>
        <h1 style={styles.h1}>{event.title}</h1>
        <p style={styles.meta}>
          {[organizer, formatWhen(event), event.location_label].filter(Boolean).join(" · ")}
        </p>
        {event.description ? <p style={styles.body}>{event.description}</p> : null}
        {event.going_count != null ? (
          <p style={styles.muted} data-testid="social-event-going-count">
            {event.going_count} {event.going_count === 1 ? "person" : "people"} in
          </p>
        ) : null}

        {joinClosed ? (
          <p style={styles.notice}>Join Me is not open for this event. You can still view the details.</p>
        ) : responded ? (
          <p style={styles.success} data-testid="social-event-responded">
            Thanks — you responded {responded}.
          </p>
        ) : (
          <>
            {!isAuthenticated ? (
              <label style={styles.label}>
                Your name (optional)
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  maxLength={80}
                  style={styles.input}
                  data-testid="social-event-guest-name"
                />
              </label>
            ) : null}
            <div style={styles.actions}>
              {RESPONSES.map((opt) => (
                <button
                  key={opt.status}
                  type="button"
                  disabled={busy}
                  style={styles.btn}
                  data-testid={`social-event-respond-${opt.status}`}
                  onClick={() => respond(opt.status)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}

        {shareData ? (
          <button
            type="button"
            style={styles.shareBtn}
            onClick={() => setShareOpen(true)}
            data-testid="social-event-share"
          >
            Share event link
          </button>
        ) : null}
      </div>

      {shareOpen && shareData ? (
        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          shareData={shareData}
          modalTitle="Share event"
        />
      ) : null}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "60vh",
    padding: "24px 16px 80px",
    fontFamily: "Inter, Arial, sans-serif",
    background: "#f8fafc",
  },
  card: {
    maxWidth: 480,
    margin: "0 auto",
    background: "#fff",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 8px 30px rgba(15,23,42,0.08)",
  },
  kicker: { margin: "0 0 6px", fontSize: 12, fontWeight: 800, color: "#1F4E3D", letterSpacing: "0.04em" },
  h1: { margin: "0 0 8px", fontSize: 22, fontWeight: 900, color: "#0f172a" },
  meta: { margin: "0 0 12px", fontSize: 14, color: "#64748b", lineHeight: 1.45 },
  body: { margin: "0 0 12px", fontSize: 15, color: "#334155", lineHeight: 1.5 },
  muted: { margin: "8px 0 0", fontSize: 13, color: "#64748b" },
  notice: { margin: "12px 0 0", fontSize: 14, color: "#92400e", background: "#fffbeb", padding: 10, borderRadius: 10 },
  success: { margin: "12px 0 0", fontSize: 14, fontWeight: 700, color: "#166534" },
  label: { display: "flex", flexDirection: "column", gap: 6, marginTop: 12, fontSize: 12, fontWeight: 700, color: "#475467" },
  input: {
    minHeight: 40,
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    fontSize: 15,
  },
  actions: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 },
  btn: {
    appearance: "none",
    border: "none",
    borderRadius: 999,
    padding: "10px 16px",
    background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
    color: "#0B0F0C",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
  },
  shareBtn: {
    marginTop: 16,
    appearance: "none",
    border: "1px solid #d1d5db",
    borderRadius: 999,
    padding: "8px 14px",
    background: "#fff",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  link: { color: "#1F4E3D", fontWeight: 700 },
};
