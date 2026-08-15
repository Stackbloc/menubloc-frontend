/**
 * Quick Diner Status composer — emoji signals, not ratings or reviews.
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { createDinerStatus } from "../../lib/consumerApi.js";

const EXPRESSIONS = [
  { key: "fire", emoji: "🔥", label: "Fire" },
  { key: "mind_blown", emoji: "🤯", label: "Mind-blown" },
  { key: "love", emoji: "❤️", label: "Love" },
  { key: "worth_trying", emoji: "✨", label: "Worth trying" },
  { key: "busy", emoji: "⏳", label: "Busy" },
];

const EXPERIENCE_EXPRESSIONS = [
  { key: "busy", emoji: "⏳", label: "Busy" },
  { key: "fire", emoji: "🔥", label: "Fire" },
  { key: "love", emoji: "❤️", label: "Love" },
  { key: "worth_trying", emoji: "✨", label: "Worth trying" },
  { key: "mind_blown", emoji: "🤯", label: "Mind-blown" },
];

export default function DinerStatusComposer({
  restaurantId,
  menuItemId = null,
  restaurantName = "",
  menuItemName = null,
  onPosted = null,
  compact = false,
  /** Dining halls: experience reports only (lines, vibe) — not dish menus. */
  experienceMode = false,
}) {
  const { isAuthenticated } = useConsumer();
  const [expression, setExpression] = useState(experienceMode ? "busy" : "fire");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  if (!restaurantId) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isAuthenticated) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const data = await createDinerStatus({
        restaurant_id: restaurantId,
        // Dining halls never attach menu items — experience is place-level.
        menu_item_id: experienceMode ? undefined : menuItemId || undefined,
        expression,
        status_text: text.trim() || undefined,
        visibility: "public",
      });
      setNotice(data.notice || "Status posted.");
      setText("");
      if (onPosted) onPosted(data.status);
    } catch (err) {
      setError(err.message || "Unable to post status");
    } finally {
      setBusy(false);
    }
  }

  const target = experienceMode
    ? restaurantName || "this dining hall"
    : menuItemName || restaurantName || "this place";
  const expressionOptions = experienceMode ? EXPERIENCE_EXPRESSIONS : EXPRESSIONS;
  const placeholder = experienceMode
    ? "Optional note (e.g. Long lines today, pizza is good)"
    : "Optional note (e.g. The chicken sandwich)";

  return (
    <div
      data-testid="diner-status-composer"
      data-experience-mode={experienceMode ? "true" : "false"}
      style={{
        marginTop: compact ? 8 : 12,
        padding: compact ? "10px 0 0" : "12px 0 0",
        borderTop: "1px solid #e7e5e4",
      }}
    >
      <div style={styles.title}>
        {experienceMode ? "Dining hall update" : "Quick diner status"}
      </div>
      <p style={styles.hint}>
        {experienceMode
          ? `Not a rating or menu — a fast campus signal about ${target}.`
          : `Not a star rating — just a fast signal about ${target}.`}
      </p>
      {!isAuthenticated ? (
        <p style={styles.hint}>
          <Link to="/account/login" style={styles.link}>
            Sign in
          </Link>{" "}
          to post a status.
        </p>
      ) : (
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.emojiRow} role="group" aria-label="Status expression">
            {expressionOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                data-testid={`diner-status-expr-${opt.key}`}
                disabled={busy}
                onClick={() => setExpression(opt.key)}
                style={
                  expression === opt.key ? styles.emojiActive : styles.emojiBtn
                }
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
            Post status
          </button>
        </form>
      )}
      {error ? (
        <p style={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      {notice ? <p style={styles.notice}>{notice}</p> : null}
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
  link: { color: "#0f766e", fontWeight: 600 },
  error: { color: "#b91c1c", fontSize: 12, fontWeight: 700, margin: "6px 0 0" },
  notice: { color: "#14532d", fontSize: 12, fontWeight: 600, margin: "6px 0 0" },
};
