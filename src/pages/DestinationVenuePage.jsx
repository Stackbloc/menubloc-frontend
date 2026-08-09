import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import { fetchDestinationVenueInventory } from "../lib/destinationVenueApi.js";

/** Hub landing aligned with LA Live / ClusterPage light destination chrome. */
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

  const shell = {
    maxWidth: 900,
    margin: "0 auto",
    padding: "1.25rem 1rem 5rem",
    width: "100%",
    boxSizing: "border-box",
    minHeight: "100dvh",
    background: "#fff",
    color: "#111827",
    fontFamily: '"DM Sans", "Segoe UI", system-ui, sans-serif',
  };

  if (loading) {
    return (
      <div style={shell}>
        <div style={{ textAlign: "center", padding: 48, color: "#6b7280" }}>Loading stadium…</div>
        <BottomNav />
      </div>
    );
  }

  if (error || !inventory?.venue) {
    return (
      <div style={shell}>
        <div style={{ textAlign: "center", padding: 48, color: "#6b7280" }}>{error || "Stadium not found"}</div>
        <BottomNav />
      </div>
    );
  }

  const venue = inventory.venue;
  const summary = inventory.summary || {};
  const teams = venue.teams || [];

  return (
    <div style={shell}>
      <header style={{ display: "grid", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <Link
          to="/clusters/stadiums/nfl"
          style={{
            color: "#374151",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.9rem",
          }}
        >
          ← All NFL stadiums
        </Link>
        <h1
          style={{
            margin: 0,
            fontSize: "1.85rem",
            lineHeight: 1.15,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          {venue.name}
        </h1>
        <p style={{ margin: 0, color: "#4b5563", fontSize: "1rem", lineHeight: 1.45, maxWidth: 520 }}>
          Food & Drink
          {venue.city ? ` · ${venue.city}, ${venue.state}` : ""}
          {teams.length
            ? ` · ${teams.map((t) => t.short_name || t.name).join(" · ")}`
            : ""}
        </p>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "0.92rem", lineHeight: 1.5, maxWidth: 520 }}>
          Search the entire stadium — find an item, then see the vendor and where to get it.
          {summary.item_count != null
            ? ` ${summary.item_count} menu items · ${summary.vendor_count} vendors.`
            : ""}
        </p>
        <Link
          to={`/destination-venues/${encodeURIComponent(slug)}/food`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "flex-start",
            minHeight: 48,
            marginTop: 8,
            padding: "0 1.25rem",
            borderRadius: 10,
            background: "#111827",
            color: "#fff",
            fontSize: "1rem",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Explore Food & Drink
        </Link>
      </header>
      <BottomNav />
    </div>
  );
}
