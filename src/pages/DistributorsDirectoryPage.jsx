/**
 * Public food distributors directory — /distributors
 * Lists controlled-list foodservice distributors; each card links to /distributors/:slug.
 */

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import { CLUSTER_DIRECTORY_GRID_STYLE } from "../components/cluster/ClusterDirectoryCard.jsx";
import { fetchPublicDistributors, toConsumerErrorMessage } from "../lib/api.js";

const DIRECTORY_PAGE_TITLE = "Food Distributors on Menuply";
const DIRECTORY_META_DESCRIPTION =
  "Browse Menuply profiles for major foodservice distributors. Tap a company to view its public profile.";
const CANONICAL_BASE = "https://menuply.com";

const DISTRIBUTOR_ACCENT = { border: "#0f766e", bg: "#f0fdfa" };

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
  borderColor: DISTRIBUTOR_ACCENT.border,
  background: DISTRIBUTOR_ACCENT.bg,
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

function claimBadge(distributor) {
  const status = String(distributor.profile_claim_status || "UNCLAIMED").toUpperCase();
  if (status === "VERIFIED" || distributor.is_verified) {
    return { label: "Verified", bg: "#ecfdf5", color: "#047857" };
  }
  if (status === "CLAIMED" || distributor.is_claimed) {
    return { label: "Claimed", bg: "#eff6ff", color: "#1d4ed8" };
  }
  if (status === "CLAIM_PENDING") {
    return { label: "Claim Pending", bg: "#fff7ed", color: "#c2410c" };
  }
  return { label: "Unclaimed", bg: "#f3f4f6", color: "#4b5563" };
}

function locationLine(distributor) {
  if (distributor.city && distributor.state) {
    return `${distributor.city}, ${distributor.state}`;
  }
  if (distributor.service_area_note) return distributor.service_area_note;
  return null;
}

function DistributorDirectoryCard({ distributor }) {
  const href = `/distributors/${encodeURIComponent(distributor.slug)}`;
  const badge = claimBadge(distributor);
  const location = locationLine(distributor);

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
            {distributor.display_name}
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
            {distributor.category_label || "Food Distributor"}
          </div>
          {location ? (
            <div style={{ color: "#6b7280", fontSize: "0.88rem", lineHeight: 1.4, overflowWrap: "anywhere" }}>
              {location}
            </div>
          ) : null}
          <span
            style={{
              display: "inline-flex",
              alignSelf: "flex-start",
              padding: "0.2rem 0.5rem",
              borderRadius: 999,
              fontSize: "0.72rem",
              fontWeight: 700,
              background: badge.bg,
              color: badge.color,
            }}
          >
            {badge.label}
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gap: "0.3rem",
            marginTop: "0.75rem",
            paddingTop: "0.75rem",
            borderTop: `1px solid ${DISTRIBUTOR_ACCENT.border}`,
          }}
        >
          <div style={{ fontWeight: 700, color: DISTRIBUTOR_ACCENT.border, fontSize: "0.92rem" }}>
            View profile →
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function DistributorsDirectoryPage() {
  const [distributors, setDistributors] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = DIRECTORY_PAGE_TITLE;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", DIRECTORY_META_DESCRIPTION);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `${CANONICAL_BASE}/distributors`);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPublicDistributors()
      .then((data) => {
        if (cancelled) return;
        if (!data?.ok) throw new Error(data?.error || "Failed to load distributors");
        setDistributors(Array.isArray(data.distributors) ? data.distributors : []);
      })
      .catch((err) => {
        if (!cancelled) setError(toConsumerErrorMessage(err) || "Failed to load distributors");
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
    if (!needle) return distributors;
    return distributors.filter((d) => {
      const hay = [d.display_name, d.city, d.state, d.service_area_note, d.slug]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [distributors, q]);

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
          <h1 style={{ margin: 0, fontSize: "1.65rem", fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>
            Food distributors
          </h1>
          <p style={{ margin: 0, color: "#4b5563", fontSize: "0.95rem", lineHeight: 1.5 }}>
            Menuply profiles for major foodservice distributors. Tap a card to open that company&apos;s
            public profile.
          </p>
          <input
            type="search"
            enterKeyHint="search"
            placeholder="Search distributors…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search food distributors"
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
            ? "Loading distributors…"
            : error
              ? error
              : `${filtered.length} distributor${filtered.length === 1 ? "" : "s"} — tap a card to view the profile.`}
        </p>

        {!loading && !error ? (
          <div style={CLUSTER_DIRECTORY_GRID_STYLE}>
            {filtered.map((d) => (
              <DistributorDirectoryCard key={d.slug || d.id} distributor={d} />
            ))}
          </div>
        ) : null}

        {!loading && !error && filtered.length === 0 ? (
          <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem 1rem" }}>
            No distributors match that search.
          </p>
        ) : null}
      </div>
      <BottomNav />
    </div>
  );
}
