/**
 * Quick diner / dining-hall / venue reports — guests welcome.
 * Identity is not required to contribute a live signal.
 */

import React, { useState } from "react";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { createPublicDinerStatus } from "../../lib/dinerStatusApi.js";
import { readOptionalReporterCoords } from "../../lib/guestReporterSession.js";
import GuestContributeNextStep from "../foodActivity/GuestContributeNextStep.jsx";

const VIBE = [
  { key: "fire", emoji: "🔥", label: "Fire" },
  { key: "mind_blown", emoji: "🤯", label: "Mind-blown" },
  { key: "love", emoji: "❤️", label: "Love" },
  { key: "worth_trying", emoji: "✨", label: "Worth trying" },
];

const RESTAURANT_OPS = [
  { key: "wait_short", emoji: "🟢", label: "Short wait" },
  { key: "wait_medium", emoji: "🟡", label: "10–20 min" },
  { key: "wait_long", emoji: "🔴", label: "30+ min wait" },
  { key: "seating_open", emoji: "🪑", label: "Seating open" },
  { key: "seating_full", emoji: "🚫", label: "Seating full" },
  { key: "sold_out", emoji: "❌", label: "Sold out" },
  { key: "busy", emoji: "⏳", label: "Busy" },
];

const HALL_OPS = [
  { key: "crowded", emoji: "👥", label: "Very crowded" },
  { key: "long_line", emoji: "🚶", label: "Long line" },
  { key: "seating_open", emoji: "🪑", label: "Seating available" },
  { key: "sold_out", emoji: "❌", label: "Station sold out" },
  { key: "food_available", emoji: "🍽️", label: "Food available" },
  { key: "busy", emoji: "⏳", label: "Busy" },
];

const VENUE_OPS = [
  { key: "security_line", emoji: "🛂", label: "Long security line" },
  { key: "gate_crowded", emoji: "🚪", label: "Gate crowded" },
  { key: "concession_short", emoji: "🍿", label: "Short concession line" },
  { key: "parking_full", emoji: "🅿️", label: "Parking full" },
  { key: "restroom_crowded", emoji: "🚻", label: "Restroom crowded" },
  { key: "busy", emoji: "⏳", label: "Busy" },
];

export default function DinerStatusComposer({
  restaurantId,
  menuItemId = null,
  restaurantName = "",
  menuItemName = null,
  onPosted = null,
  compact = false,
  experienceMode = false,
  venueMode = false,
}) {
  const { isAuthenticated } = useConsumer();
  const expressionOptions = experienceMode
    ? HALL_OPS
    : venueMode
      ? [...VENUE_OPS, ...VIBE.slice(0, 2)]
      : [...RESTAURANT_OPS, ...VIBE];
  const [expression, setExpression] = useState(expressionOptions[0]?.key || "busy");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [posted, setPosted] = useState(false);

  if (!restaurantId) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const coords = await readOptionalReporterCoords();
      const data = await createPublicDinerStatus({
        restaurant_id: restaurantId,
        menu_item_id: experienceMode ? undefined : menuItemId || undefined,
        expression,
        status_text: text.trim() || undefined,
        visibility: "public",
        lat: coords.lat,
        lng: coords.lng,
      });
      setNotice(data.notice || "Status posted.");
      setText("");
      setPosted(true);
      if (onPosted) onPosted(data.status);
    } catch (err) {
      setError(err.message || "Unable to post status");
    } finally {
      setBusy(false);
    }
  }

  const target = venueMode
    ? restaurantName || "this venue"
    : menuItemName || restaurantName || "this place";
  const placeholder = experienceMode
    ? "What's tasting good? How's the line?"
    : venueMode
      ? "West gate is slow…"
      : "Birria tacos sold out…";

  return (
    <div
      data-testid="diner-status-composer"
      data-experience-mode={experienceMode ? "true" : "false"}
      data-venue-mode={venueMode ? "true" : "false"}
      style={{
        marginTop: compact ? 8 : 12,
        padding: compact ? "10px 0 0" : "12px 0 0",
        borderTop: "1px solid #e7e5e4",
      }}
    >
      <div style={styles.title}>
        {experienceMode
          ? "Post what's good today."
          : venueMode
            ? "What's happening here?"
            : "What's happening now"}
      </div>
      {experienceMode ? null : (
        <p style={styles.hint}>
          {venueMode
            ? `How's it going at ${target}?`
            : `How's the wait at ${target}? Seating? Anything sold out?`}
        </p>
      )}
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.emojiRow} role="group" aria-label="Status expression">
          {expressionOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              data-testid={`diner-status-expr-${opt.key}`}
              disabled={busy}
              onClick={() => setExpression(opt.key)}
              style={expression === opt.key ? styles.emojiActive : styles.emojiBtn}
              title={opt.label}
            >
              <span aria-hidden="true">{opt.emoji}</span>
              <span style={styles.emojiLabel}>{opt.label}</span>
            </button>
          ))}
        </div>
        <input
          style={styles.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={200}
          placeholder={placeholder}
          disabled={busy}
        />
        <button type="submit" style={styles.primaryBtn} disabled={busy}>
          {experienceMode ? "Post what's good today" : "Post update"}
        </button>
      </form>
      {error ? (
        <p style={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      {notice ? <p style={styles.notice}>{notice}</p> : null}
      {posted && !isAuthenticated ? (
        <GuestContributeNextStep identityAction="Join Me, Dining Crew, and a personal history" />
      ) : null}
    </div>
  );
}

const styles = {
  title: { fontSize: 13, fontWeight: 800, color: "#1c1917", marginBottom: 4 },
  hint: { margin: "0 0 8px", fontSize: 12, color: "#78716c", lineHeight: 1.4 },
  form: { display: "grid", gap: 8 },
  emojiRow: { display: "flex", flexWrap: "wrap", gap: 6 },
  emojiBtn: {
    border: "1px solid #d6d3d1",
    background: "#fff",
    borderRadius: 10,
    padding: "6px 10px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 13,
  },
  emojiActive: {
    border: "1px solid #15803d",
    background: "#dcfce7",
    borderRadius: 10,
    padding: "6px 10px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 13,
    fontWeight: 700,
  },
  emojiLabel: { fontSize: 11, color: "#44403c" },
  input: {
    border: "1px solid #d6d3d1",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
  },
  primaryBtn: {
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    justifySelf: "start",
  },
  error: { color: "#b91c1c", fontSize: 12, fontWeight: 700, margin: "6px 0 0" },
  notice: { color: "#14532d", fontSize: 12, fontWeight: 600, margin: "6px 0 0" },
};
