/**
 * Restaurant Recent Feedback — private order-linked diner feedback.
 */

import React, { useEffect, useState } from "react";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import { getRestaurantOrderFeedback } from "../../lib/operatorApi.js";

const CATEGORIES = [
  { key: "overall_rating", label: "Overall" },
  { key: "taste_food_quality_rating", label: "Taste / Food Quality" },
  { key: "order_accuracy_rating", label: "Order Accuracy" },
  { key: "service_rating", label: "Service" },
  { key: "wait_time_rating", label: "Wait Time" },
  { key: "value_rating", label: "Value" },
];

function stars(n) {
  if (n == null) return "—";
  const filled = "★".repeat(n);
  const empty = "☆".repeat(Math.max(0, 5 - n));
  return `${filled}${empty}`;
}

function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export default function OperatorOrderFeedbackPage() {
  const { selectedRestaurant } = useOperator();
  const rid = selectedRestaurant?.id;
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!rid) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    getRestaurantOrderFeedback(rid)
      .then((data) => {
        if (!cancelled) setRows(data.feedback || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load feedback");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [rid]);

  return (
    <OperatorLayout title="Recent Feedback">
      <p style={{ color: "#64748b", marginTop: 0, marginBottom: 16 }}>
        Private feedback from diners about completed Menuply orders. Not shown
        publicly.
      </p>
      {error ? <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div> : null}
      {!rid ? (
        <p>Select a restaurant to view feedback.</p>
      ) : loading ? (
        <p>Loading…</p>
      ) : rows.length === 0 ? (
        <div
          style={{
            padding: 20,
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            background: "#fff",
            color: "#64748b",
          }}
        >
          No diner feedback yet for this restaurant.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {rows.map((row) => (
            <article
              key={row.id}
              style={{
                padding: 18,
                borderRadius: 14,
                border: "1px solid #e2e8f0",
                background: "#fff",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 15 }}>
                Order #{row.order_id}
              </div>
              <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
                Order {fmtDate(row.order_date)}
                {row.fulfillment_type
                  ? ` · ${String(row.fulfillment_type).replace(/_/g, " ")}`
                  : ""}
                {" · Submitted "}
                {fmtDate(row.created_at)}
              </div>
              <dl
                style={{
                  margin: "14px 0 0",
                  display: "grid",
                  gap: 6,
                }}
              >
                {CATEGORIES.map((cat) => (
                  <div
                    key={cat.key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      fontSize: 14,
                    }}
                  >
                    <dt style={{ color: "#475569", fontWeight: 600 }}>{cat.label}</dt>
                    <dd style={{ margin: 0, color: "#b45309", fontWeight: 700 }}>
                      {stars(row[cat.key])}
                    </dd>
                  </div>
                ))}
              </dl>
              {Array.isArray(row.items) && row.items.length ? (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#334155" }}>
                    Dishes they tried
                  </div>
                  <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                    {row.items.map((item) => (
                      <li key={item.id || item.display_name} style={{ marginBottom: 8, fontSize: 14 }}>
                        <strong>{item.display_name}</strong>
                        {item.canonical_menu_item_id ? "" : " (not matched to menu)"}
                        {item.rating != null ? ` · ${stars(item.rating)}` : ""}
                        {item.comment ? (
                          <div style={{ color: "#475569", marginTop: 2 }}>{item.comment}</div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {row.comment ? (
                <blockquote
                  style={{
                    margin: "14px 0 0",
                    padding: "12px 14px",
                    borderLeft: "3px solid #22c55e",
                    background: "#f8fafc",
                    color: "#0f172a",
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}
                >
                  {row.comment}
                </blockquote>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </OperatorLayout>
  );
}
