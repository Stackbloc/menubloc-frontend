import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import { fetchDestinationVenueInventory } from "../lib/destinationVenueApi.js";

/** Hub landing aligned with LA Live / ClustersDirectory light destination chrome. */
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
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
    padding: "0 1rem 5rem",
    width: "100%",
    boxSizing: "border-box",
    color: "#111827",
    fontFamily: '"DM Sans", "Segoe UI", system-ui, sans-serif',
  };

  if (loading) {
    return (
      <div style={shell}>
        <div style={{ maxWidth: 900, margin: "0 auto", paddingTop: "2rem", textAlign: "center", color: "#6b7280" }}>
          Loading stadium…
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error || !inventory?.venue) {
    return (
      <div style={shell}>
        <div style={{ maxWidth: 900, margin: "0 auto", paddingTop: "2rem", textAlign: "center", color: "#6b7280" }}>
          {error || "Stadium not found"}
        </div>
        <BottomNav />
      </div>
    );
  }

  const venue = inventory.venue;
  const summary = inventory.summary || {};
  const teams = venue.teams || [];

  return (
    <div style={shell}>
      <div style={{ maxWidth: 900, margin: "0 auto", width: "100%", paddingTop: "1.25rem" }}>
        <header
          style={{
            border: "1px solid #dbe7df",
            background: "#ffffff",
            borderRadius: 18,
            padding: "1.1rem 1.15rem",
            boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
            display: "grid",
            gap: "0.65rem",
          }}
        >
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
          <p style={{ margin: 0, color: "#4b5563", fontSize: "0.95rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Stadium
          </p>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "0.95rem", lineHeight: 1.45 }}>
            {venue.city}, {venue.state}
            {teams.length
              ? ` · ${teams.map((t) => t.short_name || t.name).join(" · ")}`
              : ""}
          </p>
          <p style={{ margin: 0, color: "#4b5563", fontSize: "0.92rem", lineHeight: 1.5, maxWidth: 520 }}>
            Food & Drink — search the stadium for items, vendors, and where to get them.
            {summary.item_count != null
              ? ` ${summary.item_count} menu items · ${summary.vendor_count} vendors.`
              : ""}
          </p>
          <Link
            to={`/destination-venues/${encodeURIComponent(slug)}/food`}
            style={{
              fontWeight: 700,
              color: "#2563eb",
              fontSize: "1rem",
              textDecoration: "none",
              marginTop: 4,
            }}
          >
            Explore →
          </Link>
        </header>
      </div>
      <BottomNav />
    </div>
  );
}
