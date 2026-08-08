import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import { fetchDestinationVenueInventory } from "../lib/destinationVenueApi.js";

const css = {
  page: {
    minHeight: "100dvh",
    background: "linear-gradient(165deg, #0c1620 0%, #152a3a 45%, #1a3344 100%)",
    color: "#f2f5f7",
    fontFamily: '"DM Sans", "Segoe UI", system-ui, sans-serif',
    paddingBottom: 96,
  },
  hero: {
    padding: "28px 20px 20px",
    minHeight: "52dvh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  eyebrow: {
    margin: 0,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "rgba(61,214,140,0.9)",
  },
  title: {
    margin: "10px 0 0",
    fontSize: "clamp(32px, 8vw, 42px)",
    fontWeight: 800,
    letterSpacing: "-0.03em",
    lineHeight: 1.05,
  },
  subtitle: {
    margin: "10px 0 0",
    fontSize: 16,
    color: "rgba(242,245,247,0.7)",
    lineHeight: 1.4,
    maxWidth: 360,
  },
  cta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
    minHeight: 54,
    borderRadius: 16,
    background: "#3dd68c",
    color: "#0b1a12",
    fontSize: 17,
    fontWeight: 800,
    textDecoration: "none",
    boxShadow: "0 10px 28px rgba(61,214,140,0.25)",
  },
  panel: { padding: "8px 20px 24px" },
  meta: {
    margin: 0,
    fontSize: 14,
    color: "rgba(242,245,247,0.55)",
  },
  empty: {
    textAlign: "center",
    padding: "48px 16px",
    color: "rgba(242,245,247,0.55)",
  },
};

export default function DestinationVenuePage() {
  const { slug } = useParams();
  const [inventory, setInventory] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDestinationVenueInventory(slug)
      .then((data) => {
        if (cancelled) return;
        if (!data?.ok) throw new Error(data?.error || "Stadium not found");
        setInventory(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Stadium not found");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div style={css.page}>
        <div style={css.empty}>Loading stadium…</div>
        <BottomNav />
      </div>
    );
  }

  if (error || !inventory?.venue) {
    return (
      <div style={css.page}>
        <div style={css.empty}>{error || "Stadium not found"}</div>
        <BottomNav />
      </div>
    );
  }

  const venue = inventory.venue;
  const summary = inventory.summary || {};
  const teams = venue.teams || [];

  return (
    <div style={css.page}>
      <header style={css.hero}>
        <Link
          to="/nfl/stadiums"
          style={{
            ...css.meta,
            display: "inline-block",
            marginBottom: 12,
            color: "rgba(242,245,247,0.7)",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          ← All NFL stadiums
        </Link>
        <p style={css.eyebrow}>Stadium</p>
        <h1 style={css.title}>{venue.name}</h1>
        <p style={css.subtitle}>
          {venue.city}, {venue.state}
          {teams.length
            ? ` · ${teams.map((t) => t.short_name || t.name).join(" · ")}`
            : ""}
        </p>
        <Link to={`/destination-venues/${encodeURIComponent(slug)}/food`} style={css.cta}>
          Explore Food & Drink
        </Link>
      </header>
      <section style={css.panel}>
        <p style={css.meta}>
          {summary.item_count != null
            ? `${summary.item_count} menu items · ${summary.vendor_count} vendors`
            : "Food & drink across the venue"}
        </p>
        <p style={{ ...css.meta, marginTop: 8 }}>
          Search the entire stadium — find an item, then see the vendor and where to get it.
        </p>
      </section>
      <BottomNav />
    </div>
  );
}
