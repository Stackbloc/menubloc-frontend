/**
 * Account: post and manage quick Diner Status signals.
 */

import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import ImEatingComposer from "../../components/foodActivity/ImEatingComposer.jsx";
import GuestContributeNextStep from "../../components/foodActivity/GuestContributeNextStep.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { listMyDinerStatuses, deleteMyDinerStatus } from "../../lib/consumerApi.js";
import { createPublicDinerStatus } from "../../lib/dinerStatusApi.js";
import { readOptionalReporterCoords } from "../../lib/guestReporterSession.js";

const EXPRESSIONS = [
  { key: "wait_long", emoji: "🔴", label: "30+ min wait" },
  { key: "wait_medium", emoji: "🟡", label: "10–20 min" },
  { key: "seating_full", emoji: "🚫", label: "Seating full" },
  { key: "sold_out", emoji: "❌", label: "Sold out" },
  { key: "busy", emoji: "⏳", label: "Busy" },
  { key: "fire", emoji: "🔥", label: "Fire" },
  { key: "love", emoji: "❤️", label: "Love" },
];

export default function DinerStatusPage() {
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItem, setMenuItem] = useState(null);
  const [expression, setExpression] = useState("wait_long");
  const [text, setText] = useState("");
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await listMyDinerStatuses();
      setStatuses(data.statuses || []);
    } catch (err) {
      setError(err.message || "Unable to load statuses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      load();
    }
    if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, load]);

  async function handlePost(e) {
    e.preventDefault();
    if (!restaurant?.restaurant_id) {
      setError("Choose a restaurant.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const coords = await readOptionalReporterCoords();
      const data = await createPublicDinerStatus({
        restaurant_id: restaurant.restaurant_id,
        menu_item_id: menuItem?.menu_item_id || null,
        expression,
        status_text: text.trim() || null,
        visibility: "public",
        lat: coords.lat,
        lng: coords.lng,
      });
      setNotice(data.notice || "Status posted.");
      setText("");
      setRestaurant(null);
      setMenuItem(null);
      if (isAuthenticated) await load();
    } catch (err) {
      setError(err.message || "Unable to post status");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    setBusy(true);
    setError("");
    try {
      await deleteMyDinerStatus(id);
      await load();
    } catch (err) {
      setError(err.message || "Unable to delete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <StickyPageHeader title="Diner Status" />
      <div style={styles.page}>
        <p style={styles.lead}>
          Post a live wait, seating, or sold-out update — no account required. This is not a star rating. Join Me and personal history need a Menuply account.
        </p>
        {error ? <p style={styles.error}>{error}</p> : null}
        {notice ? <p style={styles.notice}>{notice}</p> : null}

        <section style={styles.section}>
          <h2 style={styles.h2}>Post a status</h2>
          <ImEatingComposer
            restaurant={restaurant}
            menuItem={menuItem}
            onRestaurantChange={setRestaurant}
            onMenuItemChange={setMenuItem}
            comment={text}
            onCommentChange={setText}
            visibility="public"
            onVisibilityChange={() => {}}
            disabled={busy}
            isAuthenticated={isAuthenticated}
          />
          <div style={styles.emojiRow}>
            {EXPRESSIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                style={expression === opt.key ? styles.emojiActive : styles.emojiBtn}
                onClick={() => setExpression(opt.key)}
                disabled={busy}
              >
                {opt.emoji} {opt.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            style={styles.primaryBtn}
            disabled={busy || !restaurant?.restaurant_id}
            onClick={handlePost}
          >
            Post diner status
          </button>
        </section>

        {notice && !isAuthenticated ? (
          <GuestContributeNextStep identityAction="Join Me and a personal history" />
        ) : null}

        {isAuthenticated ? (
        <section style={styles.section}>
          <h2 style={styles.h2}>Your statuses</h2>
          {loading ? <p style={styles.muted}>Loading…</p> : null}
          {!loading && statuses.length === 0 ? (
            <p style={styles.muted}>No statuses yet.</p>
          ) : (
            <ul style={styles.list}>
              {statuses.map((s) => (
                <li key={s.id} style={styles.card}>
                  <div>
                    <strong>
                      {s.expression_emoji} {s.display_line}
                    </strong>
                    <div style={styles.muted}>{s.restaurant_name}</div>
                  </div>
                  <button
                    type="button"
                    style={styles.secondaryBtn}
                    disabled={busy}
                    onClick={() => handleDelete(s.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        ) : null}

        <p style={{ marginTop: 24 }}>
          <Link to="/account/im-eating" style={styles.link}>
            I&apos;m Eating
          </Link>
          {" · "}
          <Link to="/account" style={styles.link}>
            Account
          </Link>
        </p>
      </div>
      <BottomNav />
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--gb-color-page, #f8fafc)",
    fontFamily: "Inter, Arial, sans-serif",
    padding: "16px 16px calc(var(--bottom-nav-h, 72px) + 16px)",
    maxWidth: 720,
    margin: "0 auto",
  },
  lead: { fontSize: 14, color: "#334155", lineHeight: 1.5 },
  muted: { fontSize: 13, color: "#64748b" },
  error: { color: "#b91c1c", fontWeight: 700, fontSize: 13 },
  notice: { color: "#14532d", fontWeight: 600, fontSize: 13 },
  section: { marginTop: 20 },
  h2: { fontSize: 16, margin: "0 0 10px", color: "#0f172a" },
  list: { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 },
  card: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    padding: "12px 14px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
  },
  emojiRow: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 },
  emojiBtn: {
    border: "1px solid #cbd5e1",
    background: "#fff",
    borderRadius: 10,
    padding: "8px 10px",
    cursor: "pointer",
  },
  emojiActive: {
    border: "1px solid #15803d",
    background: "#dcfce7",
    borderRadius: 10,
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: 700,
  },
  primaryBtn: {
    marginTop: 12,
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryBtn: {
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "8px 12px",
    background: "#fff",
    cursor: "pointer",
  },
  link: { color: "#0f766e", fontWeight: 600, textDecoration: "none" },
};
