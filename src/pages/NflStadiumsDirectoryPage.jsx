import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import { CLUSTER_DIRECTORY_GRID_STYLE } from "../components/cluster/ClusterDirectoryCard.jsx";
import { fetchDestinationVenueDirectory } from "../lib/destinationVenueApi.js";

/** Same accent as ClustersDirectoryPage TYPE_ACCENTS.stadium */
const STADIUM_ACCENT = { border: "#2563eb", bg: "#eff6ff" };

const CARD_SHELL = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  minHeight: 220,
  aspectRatio: "1 / 1",
  padding: "1.1rem",
  borderRadius: 6,
  borderWidth: 2,
  borderStyle: "solid",
  borderColor: STADIUM_ACCENT.border,
  background: STADIUM_ACCENT.bg,
  boxSizing: "border-box",
  boxShadow: "0 2px 0 rgba(15, 23, 42, 0.08)",
  overflow: "hidden",
  color: "inherit",
};

function clampLines(maxLines) {
  return {
    display: "-webkit-box",
    WebkitLineClamp: maxLines,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };
}

function teamLabel(teams) {
  if (!teams?.length) return "NFL";
  return teams
    .map((t) => t.name || t.short_name || t.abbreviation)
    .filter(Boolean)
    .join(" · ");
}

function StadiumDirectoryCard({ venue }) {
  const href = `/destination-venues/${encodeURIComponent(venue.slug)}`;
  const teams = teamLabel(venue.teams);

  return (
    <Link
      to={href}
      style={{ display: "block", color: "inherit", textDecoration: "none", minWidth: 0, maxWidth: "100%" }}
    >
      <article style={CARD_SHELL}>
        <div style={{ display: "grid", gap: "0.55rem", minHeight: 0, minWidth: 0 }}>
          <div
            style={{
              ...clampLines(3),
              fontSize: "1.05rem",
              fontWeight: 700,
              color: "#111827",
              lineHeight: 1.3,
              overflowWrap: "anywhere",
            }}
          >
            {venue.name}
          </div>
          <div
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#4b5563",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              overflowWrap: "anywhere",
            }}
          >
            Stadium
          </div>
          {venue.city && venue.state ? (
            <div style={{ color: "#6b7280", fontSize: "0.88rem", lineHeight: 1.4, overflowWrap: "anywhere" }}>
              {venue.city}, {venue.state}
            </div>
          ) : null}
          <div style={{ ...clampLines(3), color: "#4b5563", fontSize: "0.84rem", lineHeight: 1.45 }}>
            {teams}
            {" — food, drinks, and menus at the venue."}
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gap: "0.3rem",
            marginTop: "0.75rem",
            paddingTop: "0.75rem",
            borderTop: `1px solid ${STADIUM_ACCENT.border}`,
          }}
        >
          <div style={{ fontWeight: 700, color: STADIUM_ACCENT.border, fontSize: "0.92rem" }}>
            Explore →
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function NflStadiumsDirectoryPage() {
  const [venues, setVenues] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDestinationVenueDirectory({ league: "nfl" })
      .then((data) => {
        if (cancelled) return;
        if (!data?.ok) throw new Error(data?.error || "Failed to load stadiums");
        setVenues(data.venues || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load stadiums");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return venues;
    return venues.filter((v) => {
      const hay = [
        v.name,
        v.city,
        v.state,
        ...(v.teams || []).flatMap((t) => [
          t.name,
          t.short_name,
          t.abbreviation,
        ]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [venues, q]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
        padding: "0 1rem 5rem",
        width: "100%",
        boxSizing: "border-box",
        overflowX: "clip",
      }}
    >
      <StickyPageHeader />
      <div style={{ maxWidth: 1080, margin: "0 auto", width: "100%", minWidth: 0, paddingTop: "1rem" }}>
        <header
          style={{
            border: "1px solid #dbe7df",
            background: "#ffffff",
            borderRadius: 18,
            padding: "1rem 1.1rem",
            marginBottom: "1rem",
            boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
            display: "grid",
            gap: "0.75rem",
          }}
        >
          <div>
            <Link
              to="/clusters"
              style={{
                color: "#374151",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.9rem",
              }}
            >
              ← All clusters
            </Link>
          </div>
          <h1 style={{ margin: 0, fontSize: "1.65rem", fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>
            NFL stadiums
          </h1>
          <p style={{ margin: 0, color: "#4b5563", fontSize: "0.95rem", lineHeight: 1.5 }}>
            Explore food and drink at every NFL stadium — same Menuply destination
            format as L.A. Live. Tap a card to open that venue.
          </p>
          <input
            type="search"
            enterKeyHint="search"
            placeholder="Search team or stadium…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search NFL stadiums or teams"
            style={{
              width: "100%",
              boxSizing: "border-box",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              background: "#fff",
              color: "#111827",
              fontSize: "1rem",
              padding: "0.65rem 0.75rem",
            }}
          />
        </header>

        <p style={{ margin: "0 0 0.75rem", color: "#6b7280", fontSize: "0.9rem", fontWeight: 600 }}>
          {loading
            ? "Loading stadiums…"
            : error
              ? error
              : `${filtered.length} stadium${filtered.length === 1 ? "" : "s"} — tap a card to explore.`}
        </p>

        {!loading && !error ? (
          <div style={CLUSTER_DIRECTORY_GRID_STYLE}>
            {filtered.map((v) => (
              <StadiumDirectoryCard key={v.slug} venue={v} />
            ))}
          </div>
        ) : null}

        {!loading && !error && filtered.length === 0 ? (
          <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem 1rem" }}>
            No stadiums match that search.
          </p>
        ) : null}
      </div>
      <BottomNav />
    </div>
  );
}
