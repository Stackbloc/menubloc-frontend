// menubloc-frontend/src/pages/MenuPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { HomeButton } from "../components/NavButton.jsx";
import GrubbidMenuView from "../GrubbidMenuView.jsx";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

function safeText(v) {
  return String(v ?? "").trim();
}

export default function MenuPage() {
  const { restaurantId } = useParams();
  const rid = safeText(restaurantId);

  const [loading, setLoading] = useState(true);
  const [menuData, setMenuData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setErr("");
      setMenuData(null);
      try {
        const res = await fetch(`${API}/public/restaurants/${encodeURIComponent(rid)}/menu`, {
          credentials: "include",
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status} ${txt}`.trim());
        }
        const json = await res.json();
        if (!alive) return;
        setMenuData(json);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Failed to load menu.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    if (rid) run();
    else {
      setLoading(false);
      setErr("Missing restaurant id.");
    }

    return () => {
      alive = false;
    };
  }, [rid]);

  if (loading) return <div style={{ padding: 20 }}>Loading menu…</div>;

  if (err) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ fontWeight: 900 }}>Menu unavailable</div>
        <div style={{ marginTop: 8, color: "#666" }}>{err}</div>
        <div style={{ marginTop: 16 }}>
          <HomeButton />
        </div>
      </div>
    );
  }

  // Pass live menuData into GrubbidMenuView
  return <GrubbidMenuView restaurantId={rid || null} menuData={menuData} />;
}