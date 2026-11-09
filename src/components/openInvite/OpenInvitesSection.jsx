import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DinerAvatar from "../social/DinerAvatar.jsx";
import { formatInviteDateLabel, formatInviteTimeLabel } from "../../lib/eatInviteShareCopy.js";
import { filterOpenInvites, joinOpenInvite, spotsText } from "../../lib/openInvitesApi.js";

const MEALS = [
  ["breakfast", "Breakfast"],
  ["lunch", "Lunch"],
  ["dinner", "Dinner"],
  ["late", "Late"],
];

/** Open Invites inside the search Social view, same as the app. */
export default function OpenInvitesSection({ invites }) {
  const [meal, setMeal] = useState(null);
  const [place, setPlace] = useState(null);
  const meals = useMemo(() => MEALS.filter(([v]) => invites.some((i) => i.meal_period === v)), [invites]);
  const places = useMemo(() => [...new Set(invites.map((i) => i.restaurant_name))], [invites]);
  const shown = filterOpenInvites(invites, meal, place);
  const chip = (label, on, onClick, id) => (
    <button key={id} type="button" onClick={onClick} style={on ? styles.chipOn : styles.chip} data-testid={id}>{label}</button>
  );
  return (
    <div style={styles.card} data-testid="search-social-open-invites">
      <strong>Open Invites</strong>
      {meals.length > 1 ? (
        <div style={styles.chips}>{meals.map(([v, l]) => chip(l, meal === v, () => setMeal(meal === v ? null : v), `open-invite-meal-${v}`))}</div>
      ) : null}
      {places.length > 1 ? (
        <div style={styles.chips}>{places.map((p) => chip(p, place === p, () => setPlace(place === p ? null : p), `open-invite-place-${p}`))}</div>
      ) : null}
      {shown.map((i) => <OpenCard key={i.token} invite={i} />)}
    </div>
  );
}

function OpenCard({ invite: i }) {
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function join() {
    setBusy(true);
    setError("");
    try {
      await joinOpenInvite(i.token);
      setJoined(true);
    } catch (err) {
      setError(err?.message || "That didn’t work.");
    } finally {
      setBusy(false);
    }
  }
  const when = [formatInviteDateLabel(i.scheduled_date), formatInviteTimeLabel(i.scheduled_time)].filter(Boolean).join(" · ");
  return (
    <div style={styles.row} data-testid={`open-invite-card-${i.token}`}>
      <Link to={`/invite/${encodeURIComponent(i.token)}`} style={styles.main}>
        <DinerAvatar avatarUrl={i.host.avatar_url} displayName={i.host.name} size={36} />
        <div>
          <strong>{i.host.name}{i.host.school_badge ? ` · ✓ ${i.host.school_badge}` : ""}</strong>
          <div>{i.restaurant_name}</div>
          <div style={styles.muted}>{[when, spotsText(i.spots_left)].filter(Boolean).join(" · ")}</div>
          <div style={styles.muted}>{i.audience_label}</div>
          {error ? <div style={styles.error}>{error}</div> : null}
        </div>
      </Link>
      {joined ? <span style={styles.muted}>You’re in</span> : (
        <button type="button" disabled={busy} onClick={join} style={styles.chipOn} data-testid={`open-invite-card-join-${i.token}`}>Join</button>
      )}
    </div>
  );
}

const chip = { border: "1px solid #d1d5db", borderRadius: 999, padding: "4px 12px", background: "#fff", color: "#111827", fontSize: 13, cursor: "pointer" };
const styles = {
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, display: "grid", gap: 8, color: "#111827" },
  chips: { display: "flex", flexWrap: "wrap", gap: 6 },
  chip,
  chipOn: { ...chip, background: "#111827", borderColor: "#111827", color: "#fff", fontWeight: 700 },
  row: { display: "flex", alignItems: "center", gap: 8 },
  main: { flex: 1, minWidth: 0, display: "flex", gap: 8, color: "inherit", textDecoration: "none" },
  muted: { fontSize: 13, color: "#6b7280" },
  error: { fontSize: 13, color: "#b91c1c" },
};
