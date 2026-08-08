import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import { fetchDestinationVenueDirectory } from "../lib/destinationVenueApi.js";

const css = {
  page: {
    minHeight: "100dvh",
    background: "linear-gradient(165deg, #0c1620 0%, #152a3a 45%, #1a3344 100%)",
    color: "#f2f5f7",
    fontFamily: '"DM Sans", "Segoe UI", system-ui, sans-serif',
    paddingBottom: 96,
  },
  header: {
    padding: "24px 20px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  eyebrow: {
    margin: 0,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "rgba(61,214,140,0.9)",
  },
  title: {
    margin: "8px 0 0",
    fontSize: "clamp(28px, 7vw, 36px)",
    fontWeight: 800,
    letterSpacing: "-0.03em",
    lineHeight: 1.1,
  },
  subtitle: {
    margin: "8px 0 0",
    fontSize: 15,
    color: "rgba(242,245,247,0.65)",
    maxWidth: 420,
    lineHeight: 1.4,
  },
  search: {
    width: "100%",
    boxSizing: "border-box",
    marginTop: 14,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: 16,
    padding: "13px 14px",
    outline: "none",
  },
  body: { padding: "12px 16px 24px" },
  count: {
    margin: "0 0 10px",
    fontSize: 13,
    color: "rgba(242,245,247,0.5)",
    fontWeight: 600,
  },
  card: {
    display: "block",
    textDecoration: "none",
    color: "inherit",
    borderRadius: 16,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "14px 14px 12px",
    marginBottom: 10,
    minHeight: 72,
  },
  stadium: {
    margin: 0,
    fontSize: 17,
    fontWeight: 800,
    letterSpacing: "-0.015em",
  },
  teams: {
    margin: "6px 0 0",
    fontSize: 14,
    fontWeight: 700,
    color: "#3dd68c",
  },
  place: {
    margin: "4px 0 0",
    fontSize: 13,
    color: "rgba(242,245,247,0.55)",
  },
  empty: {
    textAlign: "center",
    padding: "40px 16px",
    color: "rgba(242,245,247,0.55)",
  },
};

function teamLabel(teams) {
  if (!teams?.length) return "NFL";
  return teams
    .map((t) => t.name || t.short_name || t.abbreviation)
    .filter(Boolean)
    .join(" · ");
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
    <div style={css.page}>
      <header style={css.header}>
        <p style={css.eyebrow}>NFL</p>
        <h1 style={css.title}>Stadiums</h1>
        <p style={css.subtitle}>
          Explore food & drink at every NFL stadium. Shared venues list both home
          teams.
        </p>
        <input
          style={css.search}
          type="search"
          enterKeyHint="search"
          placeholder="Search team or stadium…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search NFL stadiums or teams"
        />
      </header>

      <main style={css.body}>
        {loading ? <div style={css.empty}>Loading stadiums…</div> : null}
        {error ? <div style={css.empty}>{error}</div> : null}
        {!loading && !error ? (
          <>
            <p style={css.count}>
              {filtered.length} stadium{filtered.length === 1 ? "" : "s"}
            </p>
            {filtered.map((v) => (
              <Link
                key={v.slug}
                to={`/destination-venues/${encodeURIComponent(v.slug)}`}
                style={css.card}
              >
                <h2 style={css.stadium}>{v.name}</h2>
                <p style={css.teams}>{teamLabel(v.teams)}</p>
                <p style={css.place}>
                  {v.city}, {v.state}
                </p>
              </Link>
            ))}
            {filtered.length === 0 ? (
              <div style={css.empty}>No stadiums match that search.</div>
            ) : null}
          </>
        ) : null}
      </main>
      <BottomNav />
    </div>
  );
}
