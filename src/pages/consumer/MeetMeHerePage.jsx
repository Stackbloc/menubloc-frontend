/**
 * Meet Me Here — temporary contextual QR → existing Invite to Eat.
 * Route: /account/meet-me-here
 */

import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import ShareModal from "../../components/share/ShareModal.jsx";
import DiningCrewFoodEntityPicker from "../../components/diningCrews/DiningCrewFoodEntityPicker.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { createMeetMeHere, CONSUMER_API_BASE } from "../../lib/consumerApi.js";
import { normalizeConsumerShareUrl } from "../../components/share/shareUtils.js";

function todayIsoDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function MeetMeHerePage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [restaurant, setRestaurant] = useState(null);
  const [scheduleMode, setScheduleMode] = useState("organizer");
  const [date, setDate] = useState(todayIsoDate);
  const [time, setTime] = useState("19:30");
  const [restaurantNegotiable, setRestaurantNegotiable] = useState(true);
  const [scheduleNegotiable, setScheduleNegotiable] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent("/account/meet-me-here")}`, {
        replace: true,
      });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const qrImageSrc = useMemo(() => {
    const token = created?.qr?.token;
    if (!token) return "";
    const path = `/d/${encodeURIComponent(String(token))}/image`;
    if (import.meta.env.DEV) return `${CONSUMER_API_BASE}${path}`;
    return path;
  }, [created]);

  const shareData = useMemo(() => {
    if (!created?.qr?.scan_url) return null;
    const place = created.invitation?.restaurant_name || "a restaurant";
    const url = normalizeConsumerShareUrl(created.qr.scan_url);
    return {
      title: "Meet Me Here on Menuply",
      text: `Meet me at ${place} — scan this Menuply QR or open the link.`,
      url,
    };
  }, [created]);

  async function onCreate(e) {
    e.preventDefault();
    setError("");
    const restaurantId = restaurant?.restaurant_id || restaurant?.id;
    if (!restaurantId) {
      setError("Pick a restaurant.");
      return;
    }
    setBusy(true);
    try {
      const body = {
        restaurant_id: restaurantId,
        schedule_mode: scheduleMode,
        message: "Meet Me Here",
        restaurant_negotiable: restaurantNegotiable,
        schedule_negotiable: scheduleMode === "recipient_chooses" ? true : scheduleNegotiable,
      };
      if (scheduleMode === "organizer") {
        body.scheduled_date = date;
        body.scheduled_time = time;
      }
      const data = await createMeetMeHere(body);
      setCreated(data);
    } catch (err) {
      setError(err.message || "Unable to create Meet Me Here");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setCreated(null);
    setError("");
  }

  return (
    <>
      <StickyPageHeader title="Meet Me Here" />
      <div style={styles.page}>
        <p style={styles.lead}>
          Show a temporary QR so someone nearby can join your invite — without your phone number,
          email, or username. Uses your normal Invite to Eat flow (accept / counter).
        </p>

        {error ? <p style={styles.error}>{error}</p> : null}

        {authLoading ? (
          <p style={styles.muted}>Loading…</p>
        ) : created?.qr ? (
          <section style={styles.card} aria-label="Meet Me Here QR">
            <p style={styles.place}>{created.invitation?.restaurant_name || "Restaurant"}</p>
            <p style={styles.when}>
              {created.invitation?.schedule_mode === "recipient_chooses"
                ? "They can choose the date & time"
                : `${created.invitation?.scheduled_date || ""} · ${String(
                    created.invitation?.scheduled_time || ""
                  ).slice(0, 5)}`}
            </p>
            {qrImageSrc ? (
              <img
                src={qrImageSrc}
                alt="Meet Me Here QR code"
                width={280}
                height={280}
                style={styles.qr}
              />
            ) : null}
            <p style={styles.cta}>Scan to join on Menuply</p>
            <p style={styles.muted}>
              Expires {created.qr.expires_at ? new Date(created.qr.expires_at).toLocaleString() : "soon"}.
              This is not your permanent Diner QR.
            </p>
            <div style={styles.actions}>
              <button
                type="button"
                style={styles.primaryBtn}
                disabled={!shareData}
                onClick={() => setShareOpen(true)}
              >
                Share link
              </button>
              <button type="button" style={styles.secondaryBtn} onClick={reset}>
                Create another
              </button>
            </div>
            <p style={styles.back}>
              <Link
                to={`/invite/${encodeURIComponent(String(created.invitation?.invitation_token || ""))}`}
                style={styles.link}
              >
                Open invitation page
              </Link>
            </p>
          </section>
        ) : (
          <form onSubmit={onCreate} style={styles.form}>
            <label style={styles.label}>
              Restaurant
              <DiningCrewFoodEntityPicker
                messageType="restaurant"
                onMessageTypeChange={() => {}}
                selected={restaurant}
                onSelectedChange={setRestaurant}
                note=""
                onNoteChange={() => {}}
                disabled={busy}
                hideNote
                forceRestaurantOnly
              />
            </label>

            <fieldset style={styles.fieldset}>
              <legend style={styles.legend}>When</legend>
              <label style={styles.radioRow}>
                <input
                  type="radio"
                  name="mmh-schedule"
                  checked={scheduleMode === "organizer"}
                  onChange={() => setScheduleMode("organizer")}
                />
                Tonight / I&apos;ll pick date &amp; time
              </label>
              {scheduleMode === "organizer" ? (
                <div style={styles.row2}>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={styles.input} />
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required style={styles.input} />
                </div>
              ) : null}
              <label style={styles.radioRow}>
                <input
                  type="radio"
                  name="mmh-schedule"
                  checked={scheduleMode === "recipient_chooses"}
                  onChange={() => setScheduleMode("recipient_chooses")}
                />
                Let them choose date &amp; time
              </label>
            </fieldset>

            <label style={styles.check}>
              <input
                type="checkbox"
                checked={restaurantNegotiable}
                onChange={(e) => setRestaurantNegotiable(e.target.checked)}
              />
              Allow restaurant counter-proposals
            </label>
            {scheduleMode === "organizer" ? (
              <label style={styles.check}>
                <input
                  type="checkbox"
                  checked={scheduleNegotiable}
                  onChange={(e) => setScheduleNegotiable(e.target.checked)}
                />
                Allow date/time counter-proposals
              </label>
            ) : null}

            <button type="submit" style={styles.primaryBtn} disabled={busy || !restaurant}>
              {busy ? "Creating…" : "Show Meet Me Here QR"}
            </button>
          </form>
        )}

        <p style={styles.back}>
          <Link to="/account" style={styles.link}>
            ← Account Settings
          </Link>
          {" · "}
          <Link to="/account/diner-qr" style={styles.link}>
            Permanent Diner QR
          </Link>
        </p>
      </div>

      {shareData ? (
        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          shareData={shareData}
          variant="menu"
          modalTitle="Share Meet Me Here"
        />
      ) : null}
      <BottomNav />
    </>
  );
}

const styles = {
  page: {
    maxWidth: 480,
    margin: "0 auto",
    padding: "16px 16px 96px",
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
  },
  lead: { color: "#475569", fontSize: 14, lineHeight: 1.45, marginBottom: 16 },
  muted: { color: "#64748b", fontSize: 13, lineHeight: 1.4 },
  error: { color: "#b91c1c", fontSize: 14, fontWeight: 600 },
  form: { display: "grid", gap: 14 },
  label: { display: "grid", gap: 6, fontSize: 13, fontWeight: 700, color: "#1c1917" },
  fieldset: { margin: 0, padding: 0, border: "none", display: "grid", gap: 8 },
  legend: { fontSize: 12, fontWeight: 700, marginBottom: 4 },
  radioRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    fontSize: 13,
    fontWeight: 600,
  },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  input: {
    height: 44,
    borderRadius: 10,
    border: "1px solid #d6d3d1",
    padding: "0 10px",
    fontSize: 14,
  },
  check: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    fontSize: 13,
    color: "#44403c",
  },
  card: {
    background: "#0f172a",
    color: "#f8fafc",
    borderRadius: 16,
    padding: 20,
    textAlign: "center",
  },
  place: { fontSize: 20, fontWeight: 800, margin: "0 0 4px" },
  when: { fontSize: 14, color: "#94a3b8", margin: "0 0 12px" },
  qr: {
    width: 280,
    height: 280,
    maxWidth: "100%",
    background: "#fff",
    borderRadius: 12,
    margin: "0 auto 12px",
    display: "block",
  },
  cta: { fontWeight: 700, margin: "0 0 8px" },
  actions: { display: "grid", gap: 8, marginTop: 12 },
  primaryBtn: {
    height: 48,
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(180deg,#22c55e,#16a34a)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 15,
    cursor: "pointer",
  },
  secondaryBtn: {
    height: 44,
    borderRadius: 12,
    border: "1px solid #334155",
    background: "transparent",
    color: "#e2e8f0",
    fontWeight: 700,
    cursor: "pointer",
  },
  back: { marginTop: 20, fontSize: 14 },
  link: { color: "#166534", fontWeight: 700 },
};
