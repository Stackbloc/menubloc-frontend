/**
 * Private order-linked diner feedback wizard.
 * Profile → Select order → Optional ratings + comment → Submit.
 */

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  getEligibleOrderFeedback,
  submitOrderFeedback,
} from "../../lib/consumerApi.js";
import OrderFeedbackMenuItemPicker from "../../components/consumer/OrderFeedbackMenuItemPicker.jsx";

const RATING_FIELDS = [
  { key: "taste_food_quality_rating", label: "Taste / Food Quality" },
  { key: "order_accuracy_rating", label: "Order Accuracy" },
  { key: "service_rating", label: "Service" },
  { key: "wait_time_rating", label: "Wait Time" },
  { key: "value_rating", label: "Value" },
  { key: "overall_rating", label: "Overall Experience" },
];

function formatOrderDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function StarRow({ label, value, onChange }) {
  return (
    <div style={styles.starRow}>
      <div style={styles.starLabel}>{label}</div>
      <div style={styles.stars} role="group" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value != null && n <= value;
          return (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              aria-pressed={value === n}
              onClick={() => onChange(value === n ? null : n)}
              style={{
                ...styles.starBtn,
                color: active ? "#f59e0b" : "#64748b",
              }}
            >
              ★
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ConsumerOrderFeedbackPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [ratings, setRatings] = useState({});
  const [comment, setComment] = useState("");
  const [items, setItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/account/login", {
        replace: true,
        state: { redirectTo: "/account/feedback" },
      });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    getEligibleOrderFeedback()
      .then((data) => {
        if (!cancelled) setOrders(data.orders || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Unable to load orders");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setError("");
    try {
      await submitOrderFeedback({
        order_id: selected.order_id,
        ...ratings,
        comment: comment.trim() || undefined,
        items: items.map((item) => ({
          canonical_menu_item_id: item.canonical_menu_item_id || undefined,
          unmatched_item_name: item.canonical_menu_item_id
            ? undefined
            : item.unmatched_item_name || item.display_name,
          display_name: item.display_name,
          source: item.source,
          rating: item.rating || undefined,
          comment: (item.comment || "").trim() || undefined,
        })),
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Unable to send feedback");
    } finally {
      setSubmitting(false);
    }
  }

  const hasSignal =
    RATING_FIELDS.some((f) => ratings[f.key] != null) ||
    comment.trim().length > 0 ||
    items.length > 0;

  return (
    <>
      <StickyPageHeader title="Send Feedback" />
      <div style={styles.page}>
        <div style={styles.inner}>
          <Link to="/account" style={styles.back}>
            ← Account
          </Link>
          <h1 style={styles.title}>Send Feedback</h1>
          <p style={styles.lede}>
            Private feedback about dishes you tried on a recent Menuply order.
            The restaurant sees your ratings and comments — this is not a public
            review.
          </p>

          {error ? <p style={styles.error}>{error}</p> : null}

          {success ? (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Thank you</h2>
              <p style={styles.muted}>
                Your feedback for {selected?.restaurant_name || "this order"} was
                sent to the restaurant.
              </p>
              <Link to="/account" style={styles.primaryBtn}>
                Back to account
              </Link>
            </div>
          ) : !selected ? (
            <section>
              <h2 style={styles.sectionTitle}>Select an order</h2>
              {loading ? (
                <p style={styles.muted}>Loading eligible orders…</p>
              ) : orders.length === 0 ? (
                <div style={styles.card}>
                  <p style={styles.muted}>
                    No completed orders from the last 45 days are available for
                    new feedback.
                  </p>
                </div>
              ) : (
                <div style={styles.list}>
                  {orders.map((order) => {
                    const summary = (order.items_summary || [])
                      .slice(0, 3)
                      .map((i) => i.name)
                      .filter(Boolean)
                      .join(", ");
                    return (
                      <button
                        key={order.order_id}
                        type="button"
                        style={styles.orderCard}
                        onClick={() => {
                          setSelected(order);
                          setRatings({});
                          setComment("");
                          setItems([]);
                          setError("");
                        }}
                      >
                        <div style={styles.orderName}>{order.restaurant_name}</div>
                        <div style={styles.orderMeta}>
                          {formatOrderDate(order.order_date)}
                          {order.fulfillment_type
                            ? ` · ${String(order.fulfillment_type).replace(/_/g, " ")}`
                            : ""}
                          {` · Order #${order.order_id}`}
                        </div>
                        {summary ? (
                          <div style={styles.orderSummary}>{summary}</div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          ) : (
            <form onSubmit={handleSubmit}>
              <button
                type="button"
                style={styles.textBtn}
                onClick={() => setSelected(null)}
              >
                ← Choose a different order
              </button>
              <div style={{ ...styles.card, marginBottom: 16 }}>
                <div style={styles.orderName}>{selected.restaurant_name}</div>
                <div style={styles.orderMeta}>
                  {formatOrderDate(selected.order_date)}
                  {selected.fulfillment_type
                    ? ` · ${String(selected.fulfillment_type).replace(/_/g, " ")}`
                    : ""}
                  {` · Order #${selected.order_id}`}
                </div>
              </div>

              <OrderFeedbackMenuItemPicker
                orderId={selected.order_id}
                initialItems={selected.items_summary || []}
                selected={items}
                onChange={setItems}
              />

              <h2 style={styles.sectionTitle}>How was your experience?</h2>
              <p style={styles.muted}>Rate only what you want — all categories are optional.</p>

              <div style={styles.card}>
                {RATING_FIELDS.map((field) => (
                  <StarRow
                    key={field.key}
                    label={field.label}
                    value={ratings[field.key] ?? null}
                    onChange={(n) =>
                      setRatings((prev) => ({ ...prev, [field.key]: n }))
                    }
                  />
                ))}
              </div>

              <label style={styles.commentLabel}>
                Anything else you&apos;d like the restaurant to know?
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="Optional"
                  style={styles.textarea}
                />
              </label>

              <button
                type="submit"
                disabled={submitting || !hasSignal}
                style={{
                  ...styles.primaryBtn,
                  opacity: submitting || !hasSignal ? 0.55 : 1,
                  border: "none",
                  width: "100%",
                  cursor: submitting || !hasSignal ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Sending…" : "Send Feedback"}
              </button>
            </form>
          )}
        </div>
      </div>
      <BottomNav />
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--gb-color-page, #0b1220)",
    color: "#e2e8f0",
    fontFamily: "Inter, Arial, sans-serif",
    padding: "16px 16px calc(var(--bottom-nav-h, 72px) + 24px)",
  },
  inner: {
    maxWidth: 560,
    margin: "0 auto",
  },
  back: {
    color: "#86efac",
    fontWeight: 700,
    textDecoration: "none",
    fontSize: 14,
  },
  title: {
    margin: "12px 0 8px",
    fontSize: 28,
    fontWeight: 800,
  },
  lede: {
    margin: "0 0 20px",
    color: "#94a3b8",
    lineHeight: 1.5,
    fontSize: 15,
  },
  sectionTitle: {
    margin: "0 0 10px",
    fontSize: 18,
    fontWeight: 800,
  },
  muted: {
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 1.5,
    margin: "0 0 12px",
  },
  error: {
    color: "#fca5a5",
    fontWeight: 600,
    marginBottom: 12,
  },
  list: {
    display: "grid",
    gap: 10,
  },
  orderCard: {
    textAlign: "left",
    padding: 16,
    borderRadius: 14,
    border: "1px solid #334155",
    background: "#111827",
    color: "inherit",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  card: {
    padding: 16,
    borderRadius: 14,
    border: "1px solid #334155",
    background: "#111827",
  },
  cardTitle: {
    margin: "0 0 8px",
    fontSize: 20,
  },
  orderName: {
    fontWeight: 800,
    fontSize: 17,
  },
  orderMeta: {
    marginTop: 4,
    color: "#94a3b8",
    fontSize: 13,
    textTransform: "capitalize",
  },
  orderSummary: {
    marginTop: 8,
    color: "#cbd5e1",
    fontSize: 13,
  },
  starRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: "10px 0",
    borderBottom: "1px solid #1e293b",
  },
  starLabel: {
    fontWeight: 700,
    fontSize: 14,
  },
  stars: {
    display: "flex",
    gap: 2,
  },
  starBtn: {
    background: "transparent",
    border: "none",
    fontSize: 26,
    lineHeight: 1,
    cursor: "pointer",
    padding: "0 2px",
  },
  commentLabel: {
    display: "grid",
    gap: 8,
    margin: "18px 0 16px",
    fontWeight: 700,
    fontSize: 14,
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 12,
    border: "1px solid #334155",
    background: "#0f172a",
    color: "#e2e8f0",
    padding: 12,
    fontFamily: "inherit",
    fontSize: 15,
    fontWeight: 500,
    resize: "vertical",
  },
  primaryBtn: {
    display: "inline-block",
    textAlign: "center",
    padding: "12px 18px",
    borderRadius: 999,
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#fff",
    fontWeight: 800,
    textDecoration: "none",
    fontSize: 15,
    fontFamily: "inherit",
  },
  textBtn: {
    background: "transparent",
    border: "none",
    color: "#86efac",
    fontWeight: 700,
    padding: 0,
    marginBottom: 12,
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
