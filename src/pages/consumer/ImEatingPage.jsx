/**
 * I'm Eating — share canonical food activity (not verified purchase/order).
 */

import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import ImEatingComposer from "../../components/foodActivity/ImEatingComposer.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  createImEating,
  listMyFoodActivity,
  deleteMyFoodActivity,
} from "../../lib/consumerApi.js";

export default function ImEatingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItem, setMenuItem] = useState(null);
  const [comment, setComment] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await listMyFoodActivity();
      setActivities(data.activities || []);
    } catch (err) {
      setError(err.message || "Unable to load activity");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent("/account/im-eating")}`, {
        replace: true,
      });
      return;
    }
    if (!authLoading && isAuthenticated) {
      load();
    }
  }, [authLoading, isAuthenticated, navigate, load]);

  async function handleShare(e) {
    e.preventDefault();
    if (!restaurant?.restaurant_id || !menuItem?.menu_item_id) {
      setError("Choose a restaurant and a menu item.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const data = await createImEating({
        restaurant_id: restaurant.restaurant_id,
        menu_item_id: menuItem.menu_item_id,
        menu_id: menuItem.menu_id || null,
        comment: comment.trim() || null,
        visibility,
      });
      setNotice(
        data.notice ||
          "Shared as user-reported food activity. Menuply does not verify that you purchased this item."
      );
      setRestaurant(null);
      setMenuItem(null);
      setComment("");
      setVisibility("public");
      await load();
    } catch (err) {
      setError(err.message || "Unable to share");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    setBusy(true);
    setError("");
    try {
      await deleteMyFoodActivity(id);
      await load();
    } catch (err) {
      setError(err.message || "Unable to remove");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <StickyPageHeader title="I'm Eating" />
      <div style={styles.page}>
        <p style={styles.lead}>
          Share what you&apos;re eating as{" "}
          <strong>user-reported food activity</strong> — not a verified order. Public shares
          may appear on restaurant and cluster surfaces.
        </p>

        {error ? <p style={styles.error}>{error}</p> : null}
        {notice ? <p style={styles.notice}>{notice}</p> : null}

        <form onSubmit={handleShare} style={styles.form}>
          <ImEatingComposer
            restaurant={restaurant}
            menuItem={menuItem}
            onRestaurantChange={setRestaurant}
            onMenuItemChange={setMenuItem}
            comment={comment}
            onCommentChange={setComment}
            visibility={visibility}
            onVisibilityChange={setVisibility}
            disabled={busy}
          />
          <button type="submit" style={styles.primary} disabled={busy}>
            {busy ? "Sharing…" : "Share I'm Eating"}
          </button>
        </form>

        <section style={styles.section}>
          <h2 style={styles.h2}>Your recent activity</h2>
          {loading ? (
            <p style={styles.muted}>Loading…</p>
          ) : activities.length === 0 ? (
            <p style={styles.muted}>No activity yet.</p>
          ) : (
            <ul style={styles.list}>
              {activities.map((a) => (
                <li key={a.id} style={styles.card}>
                  <div>
                    <strong>{a.item_name || "Menu item"}</strong>
                    <div style={styles.muted}>
                      at{" "}
                      {a.restaurant_slug || a.restaurant_id ? (
                        <Link
                          to={`/restaurants/${a.restaurant_slug || a.restaurant_id}`}
                          style={styles.link}
                        >
                          {a.restaurant_name || "Restaurant"}
                        </Link>
                      ) : (
                        a.restaurant_name || "Restaurant"
                      )}
                    </div>
                    {a.comment ? <p style={styles.comment}>{a.comment}</p> : null}
                    <div style={styles.meta}>
                      {a.visibility} · {a.created_at ? new Date(a.created_at).toLocaleString() : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    style={styles.remove}
                    disabled={busy}
                    onClick={() => handleDelete(a.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <BottomNav />
    </>
  );
}

const styles = {
  page: {
    maxWidth: 560,
    margin: "0 auto",
    padding: "16px 16px 96px",
    display: "grid",
    gap: 16,
  },
  lead: { margin: 0, fontSize: 14, lineHeight: 1.5, color: "#475569" },
  form: { display: "grid", gap: 12 },
  primary: {
    border: "none",
    borderRadius: 12,
    padding: "12px 16px",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
  },
  section: { display: "grid", gap: 10 },
  h2: { margin: 0, fontSize: 18, color: "#0f172a" },
  list: { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 },
  card: {
    display: "flex",
    gap: 12,
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    background: "#fff",
  },
  comment: { margin: "6px 0 0", fontSize: 14, color: "#334155" },
  meta: { marginTop: 6, fontSize: 12, color: "#94a3b8" },
  muted: { fontSize: 13, color: "#64748b" },
  link: { color: "#2563eb", textDecoration: "none" },
  remove: {
    border: "none",
    background: "transparent",
    color: "#b91c1c",
    fontSize: 13,
    cursor: "pointer",
    flexShrink: 0,
  },
  error: { margin: 0, color: "#b91c1c", fontSize: 14 },
  notice: { margin: 0, color: "#14532d", fontSize: 14, fontWeight: 600 },
};
