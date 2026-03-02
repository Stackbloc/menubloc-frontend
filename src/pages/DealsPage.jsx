// ============================================================
// File: src/pages/DealsPage.jsx
// Purpose: Display active restaurant deals
// Safe, stable version (no broken ternaries)
// ============================================================

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:3001";

export default function DealsPage() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDeals() {
      try {
        const res = await fetch(`${API_BASE}/deals`);
        const data = await res.json();

        if (!data.ok) {
          throw new Error(data.error || "Failed to fetch deals");
        }

        setDeals(data.deals || []);
      } catch (err) {
        console.error("Deals fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDeals();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Deals</h2>
        <p>Loading deals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Deals</h2>
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 20 }}>Active Deals</h2>

      {deals.length === 0 ? (
        <p>No active deals available.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {deals.map((d) => (
            <li
              key={d.id}
              style={{
                marginBottom: 20,
                padding: 16,
                border: "1px solid #ddd",
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: "bold" }}>
                {d.title || "Untitled Deal"}
              </div>

              {d.description && (
                <div style={{ marginTop: 6 }}>{d.description}</div>
              )}

              {d.discount_value && (
                <div style={{ marginTop: 6, fontSize: 13 }}>
                  Discount: {d.discount_value}
                </div>
              )}

              {d.restaurant_id && (
                <div style={{ marginTop: 10 }}>
                  <Link to={`/restaurants/${d.restaurant_id}`}>
                    View Restaurant
                  </Link>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}