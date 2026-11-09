import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DinerAvatar from "../social/DinerAvatar.jsx";
import { blockDiner, reportDinerAbuse } from "../../lib/consumerApi.js";
import { formatInviteDateLabel, formatInviteTimeLabel } from "../../lib/eatInviteShareCopy.js";
import {
  answerWent,
  cancelOpenInvite,
  getOpenInvite,
  joinOpenInvite,
  leaveOpenInvite,
  removeJoiner,
  spotsText,
} from "../../lib/openInvitesApi.js";

const STATUS_TEXT = {
  full: "This invite is full.",
  canceled: "This invite was canceled.",
  expired: "This meal has passed.",
};

const REASONS = [
  ["harassment", "Harassment"],
  ["spam", "Spam"],
  ["impersonation", "Impersonation"],
  ["inappropriate", "Inappropriate content"],
  ["other", "Other"],
];

/** The invite page for an Open Invite: same content as the app. */
export default function OpenInviteDetail({ initial }) {
  const navigate = useNavigate();
  const [inv, setInv] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reporting, setReporting] = useState(null);
  const [reason, setReason] = useState("harassment");

  async function run(action) {
    setBusy(true);
    setError("");
    try {
      await action();
      setInv(await getOpenInvite(inv.token));
    } catch (err) {
      setError(err?.message || "That didn’t work. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  async function report(block) {
    setBusy(true);
    setError("");
    try {
      await reportDinerAbuse(reporting.user_id, { reason });
      if (block) {
        await blockDiner(reporting.user_id);
        navigate(-1);
        return;
      }
      setNotice("Report sent to Menuply.");
      setReporting(null);
    } catch (err) {
      setError(err?.message || "That didn’t work. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  const location = [inv.restaurant_address_line1, inv.restaurant_city, inv.restaurant_state].filter(Boolean).join(", ");
  const when = [formatInviteDateLabel(inv.scheduled_date), formatInviteTimeLabel(inv.scheduled_time)].filter(Boolean).join(" · ");
  const canManage = inv.is_host && (inv.status === "open" || inv.status === "full");
  const ReportButton = ({ person, id }) => (
    <button type="button" style={styles.small} onClick={() => setReporting(person)} data-testid={id}>
      Report
    </button>
  );

  return (
    <div style={styles.page} data-testid="open-invite-page">
      <section style={styles.card}>
        <div style={styles.kicker}>{inv.is_host ? "Your Open Invite" : "Open Invite"}</div>
        <h1 style={styles.title}>{inv.restaurant_name}</h1>
        {location ? <div style={styles.muted}>{location}</div> : null}
        <div style={styles.when} data-testid="open-invite-when">{when}</div>
        {inv.note ? <em style={styles.muted}>“{inv.note}”</em> : null}
        <div data-testid="open-invite-spots">{STATUS_TEXT[inv.status] || spotsText(inv.spots_left)}</div>
        <div style={styles.muted} data-testid="open-invite-audience">Who can join: {inv.audience_label}</div>
        {inv.restaurant_id ? <Link to={`/restaurants/${inv.restaurant_id}`} style={styles.link}>See the restaurant ›</Link> : null}
      </section>

      <section style={styles.card} data-testid="open-invite-people">
        <div style={styles.label}>Who’s going</div>
        <div style={styles.person}>
          <DinerAvatar avatarUrl={inv.host.avatar_url} displayName={inv.host.name} size={36} />
          <div style={styles.flex}>
            <strong>{inv.host.name}</strong>
            <div style={styles.muted}>{["Host", inv.host.school_badge ? `✓ ${inv.host.school_badge}` : null].filter(Boolean).join(" · ")}</div>
          </div>
          {inv.is_host ? null : <ReportButton person={inv.host} id="open-invite-report-host" />}
        </div>
        {inv.joiners.map((p) => (
          <div key={p.user_id} style={styles.person} data-testid={`open-invite-joiner-${p.user_id}`}>
            <DinerAvatar avatarUrl={p.avatar_url} displayName={p.name} size={36} />
            <strong style={styles.flex}>{p.name}</strong>
            {canManage ? (
              <button type="button" style={styles.small} disabled={busy} onClick={() => run(() => removeJoiner(inv.token, p.user_id))} data-testid={`open-invite-remove-${p.user_id}`}>
                Remove
              </button>
            ) : null}
            <ReportButton person={p} id={`open-invite-report-${p.user_id}`} />
          </div>
        ))}
        {inv.joiners.length ? null : <div style={styles.muted}>No one has joined yet.</div>}
      </section>

      {reporting ? (
        <section style={styles.card} data-testid="open-invite-report">
          <div style={styles.label}>Report {reporting.name}</div>
          <select value={reason} onChange={(e) => setReason(e.target.value)} style={styles.select}>
            {REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <div style={styles.actions}>
            <button type="button" style={styles.pill} onClick={() => setReporting(null)}>Not now</button>
            <button type="button" style={styles.pill} disabled={busy} onClick={() => report(false)}>Report</button>
            <button type="button" style={styles.pill} disabled={busy} onClick={() => report(true)}>Block &amp; report</button>
          </div>
        </section>
      ) : null}

      {inv.can_answer_went ? (
        <section style={styles.card} data-testid="open-invite-went">
          <div style={styles.label}>Did you go?</div>
          <div style={styles.actions}>
            <button type="button" style={inv.went === true ? styles.pillOn : styles.pill} disabled={busy} onClick={() => run(() => answerWent(inv.token, true))}>Yes</button>
            <button type="button" style={inv.went === false ? styles.pillOn : styles.pill} disabled={busy} onClick={() => run(() => answerWent(inv.token, false))}>No</button>
          </div>
        </section>
      ) : null}

      {error ? <div role="alert" style={styles.error}>{error}</div> : null}
      {notice ? <div style={styles.muted}>{notice}</div> : null}

      <div style={styles.actions}>
        {inv.can_join ? <button type="button" style={styles.pillOn} disabled={busy} onClick={() => run(() => joinOpenInvite(inv.token))} data-testid="open-invite-join">Join</button> : null}
        {inv.can_leave ? <button type="button" style={styles.pill} disabled={busy} onClick={() => run(() => leaveOpenInvite(inv.token))} data-testid="open-invite-leave">Leave</button> : null}
        {canManage ? (
          <>
            <Link to={`/account/open-invite?edit=${encodeURIComponent(inv.token)}`} style={styles.pill} data-testid="open-invite-edit">Edit</Link>
            <button type="button" style={styles.pill} disabled={busy} onClick={() => run(() => cancelOpenInvite(inv.token))} data-testid="open-invite-cancel">Cancel invite</button>
          </>
        ) : null}
      </div>
      <div style={styles.muted}>Meet at the restaurant, in public.</div>
    </div>
  );
}

const pill = { border: "1px solid #d1d5db", borderRadius: 999, padding: "8px 16px", background: "#fff", color: "#111827", fontWeight: 700, fontSize: 14, cursor: "pointer", textDecoration: "none" };
const styles = {
  page: { maxWidth: 560, margin: "0 auto", padding: 16, display: "grid", gap: 12, color: "#111827" },
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, display: "grid", gap: 8 },
  kicker: { fontSize: 13, fontWeight: 700, color: "#15803d" },
  title: { fontSize: 24, fontWeight: 800, margin: 0 },
  when: { fontSize: 17, fontWeight: 700 },
  label: { fontSize: 13, fontWeight: 700, color: "#6b7280" },
  muted: { fontSize: 13, color: "#6b7280" },
  link: { fontSize: 13, fontWeight: 700, color: "#15803d" },
  error: { color: "#b91c1c" },
  flex: { flex: 1, minWidth: 0 },
  person: { display: "flex", alignItems: "center", gap: 8 },
  small: { border: "none", background: "none", color: "#6b7280", fontSize: 13, cursor: "pointer", padding: 4 },
  select: { padding: 8, borderRadius: 8, border: "1px solid #d1d5db", fontSize: 16 },
  actions: { display: "flex", flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center", gap: 8 },
  pill,
  pillOn: { ...pill, background: "#111827", borderColor: "#111827", color: "#fff" },
};
