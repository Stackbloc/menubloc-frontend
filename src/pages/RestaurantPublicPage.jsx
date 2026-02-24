// menubloc-frontend/src/pages/RestaurantPublicPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

function safeText(v) {
  return String(v ?? "").trim();
}

export default function RestaurantPublicPage() {
  const { slug } = useParams();
  const slugOrId = safeText(slug);

  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API}/public/restaurants/${encodeURIComponent(slugOrId)}`);
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status} ${txt}`.trim());
        }
        const data = await res.json();
        if (!alive) return;
        setRestaurant(data);
      } catch (e) {
        if (!alive) return;
        setRestaurant(null);
        setError(e?.message || "Failed to load restaurant.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    if (slugOrId) run();
    else {
      setLoading(false);
      setRestaurant(null);
      setError("Missing restaurant identifier.");
    }

    return () => {
      alive = false;
    };
  }, [slugOrId]);

  const name = restaurant?.name || restaurant?.restaurant_name || "Restaurant";
  const id = restaurant?.id ?? null;
  const address = restaurant?.address || restaurant?.address_line1 || "";
  const phone = restaurant?.phone || restaurant?.phone_number || "";
  const city = restaurant?.city || "";
  const state = restaurant?.state || "";
  const metaLine = [address, [city, state].filter(Boolean).join(", ")].filter(Boolean).join(" • ");

  const menuLink = useMemo(() => {
    const rid = id ?? slugOrId;
    return `/menu/${encodeURIComponent(String(rid))}`;
  }, [id, slugOrId]);

  if (loading) {
    return <div style={{ padding: 20 }}>Loading…</div>;
  }

  if (!restaurant) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ fontWeight: 900, fontSize: 18 }}>Restaurant not found</div>
        <div style={{ marginTop: 8, color: "#666" }}>{error || "No data returned."}</div>
        <div style={{ marginTop: 16 }}>
          <Link to="/">Back home</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 20 }}>
      <div style={{ fontSize: 26, fontWeight: 900 }}>{name}</div>
      {metaLine ? <div style={{ marginTop: 8, color: "#666" }}>{metaLine}</div> : null}
      {phone ? <div style={{ marginTop: 6 }}>{phone}</div> : null}

      <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link to={menuLink} style={{ fontWeight: 900 }}>
          View Menu →
        </Link>
      </div>
    </div>
  );
}