import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import ClusterDirectoryCard from "../components/cluster/ClusterDirectoryCard.jsx";
import { fetchClustersDirectory } from "../lib/clusterApi.js";
import { toConsumerErrorMessage } from "../lib/api.js";
import { reverseGeocode } from "../lib/locationUtils.js";
import {
  CLUSTER_DESTINATION_TYPES,
  clusterDestinationCategoryLabel,
  groupClustersByStateAndType,
  resolveFeaturedClusters,
  stateDisplayName,
} from "../lib/clusterUrl.js";

const BENEFIT_CARDS = [
  {
    title: "Discover",
    body: "Explore restaurants by destination instead of searching one restaurant at a time.",
  },
  {
    title: "Compare",
    body: "Browse menus from multiple nearby restaurants from one destination.",
  },
  {
    title: "Share",
    body: "Share destinations with friends before you meet, travel, attend an event, or explore a city.",
  },
];

function emptyTypeMessage(type, globalTypeCounts) {
  const globalCount = globalTypeCounts.get(type) || 0;
  return globalCount > 0 ? "No Community Clusters Yet" : "Coming Soon";
}

export default function ClustersDirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [clusters, setClusters] = useState([]);
  const [featuredClusters, setFeaturedClusters] = useState([]);
  const [typeCounts, setTypeCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState(() => String(searchParams.get("q") || ""));
  const [typeFilter, setTypeFilter] = useState(() => String(searchParams.get("type") || ""));
  const [expandedStates, setExpandedStates] = useState(() => {
    const state = String(searchParams.get("state") || "").trim().toUpperCase();
    return state ? new Set([state]) : new Set();
  });
  const [detectedState, setDetectedState] = useState(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return undefined;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const geo = await reverseGeocode(position.coords.latitude, position.coords.longitude);
          const state = String(geo?.state || "").trim().toUpperCase();
          if (!cancelled && state) {
            setDetectedState(state);
            setExpandedStates((current) => {
              if (current.size > 0) return current;
              return new Set([state]);
            });
          }
        } catch {
          // Location is optional — browsing remains unrestricted.
        }
      },
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const json = await fetchClustersDirectory({
          q: query.trim() || undefined,
          type: typeFilter || undefined,
          limit: 200,
          signal: controller.signal,
        });
        setClusters(Array.isArray(json.clusters) ? json.clusters : []);
        setFeaturedClusters(Array.isArray(json.featured_clusters) ? json.featured_clusters : []);
        setTypeCounts(Array.isArray(json.type_counts) ? json.type_counts : []);
      } catch (err) {
        if (err?.name === "AbortError") return;
        setError(toConsumerErrorMessage(err, "Could not load clusters."));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [query, typeFilter]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (typeFilter) params.set("type", typeFilter);
    const expanded = [...expandedStates][0];
    if (expanded) params.set("state", expanded);
    setSearchParams(params, { replace: true });
  }, [query, typeFilter, expandedStates, setSearchParams]);

  const globalTypeCounts = useMemo(() => {
    const map = new Map();
    for (const entry of typeCounts) {
      map.set(String(entry.type || "").toLowerCase(), Number(entry.count) || 0);
    }
    if (map.size === 0 && clusters.length > 0) {
      for (const cluster of clusters) {
        const key = String(cluster.type || "").trim().toLowerCase();
        if (!key) continue;
        map.set(key, (map.get(key) || 0) + 1);
      }
    }
    return map;
  }, [typeCounts, clusters]);

  const featured = useMemo(
    () => resolveFeaturedClusters(featuredClusters, clusters),
    [featuredClusters, clusters]
  );

  const stateGroups = useMemo(
    () => groupClustersByStateAndType(clusters, { destinationTypes: CLUSTER_DESTINATION_TYPES }),
    [clusters]
  );

  const visibleStateGroups = useMemo(() => {
    if (!typeFilter) return stateGroups;
    return stateGroups
      .map((stateEntry) => ({
        ...stateEntry,
        destinationTypes: stateEntry.destinationTypes.filter((entry) => entry.type === typeFilter),
        clusterCount: stateEntry.destinationTypes
          .filter((entry) => entry.type === typeFilter)
          .reduce((sum, entry) => sum + entry.count, 0),
      }))
      .filter((stateEntry) => stateEntry.clusterCount > 0 || expandedStates.has(stateEntry.state));
  }, [stateGroups, typeFilter, expandedStates]);

  function toggleState(state) {
    setExpandedStates((current) => {
      const next = new Set(current);
      if (next.has(state)) next.delete(state);
      else next.add(state);
      return next;
    });
  }

  const showSearchResults = Boolean(query.trim());

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "1.25rem 1rem 5rem" }}>
      <header style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.85rem", lineHeight: 1.2 }}>
          Explore Menuply Clusters
        </h1>
        <p style={{ margin: 0, color: "#4b5563", lineHeight: 1.55, maxWidth: 720 }}>
          Clusters organize restaurants around the places people actually go—universities, downtowns,
          airports, entertainment districts, tourist destinations, and more. Explore multiple
          restaurants, compare menus, and discover dining options from a single destination page.
        </p>
      </header>

      <section style={{ marginBottom: "1.25rem" }}>
        <label htmlFor="cluster-search" style={{ display: "block", fontSize: 13, color: "#374151", marginBottom: 6 }}>
          Search clusters by name, city, state, or destination type
        </label>
        <input
          id="cluster-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try USC, Los Angeles, California, or university"
          style={{
            width: "100%",
            border: "1px solid #d1d5db",
            borderRadius: 10,
            padding: "0.7rem 0.85rem",
            fontSize: 16,
          }}
        />
      </section>

      <section
        aria-label="Cluster benefits"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "0.75rem",
          marginBottom: "1.5rem",
        }}
      >
        {BENEFIT_CARDS.map((card) => (
          <article
            key={card.title}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: "0.85rem 0.95rem",
              background: "#fafafa",
            }}
          >
            <h2 style={{ margin: "0 0 0.35rem", fontSize: "1rem" }}>{card.title}</h2>
            <p style={{ margin: 0, color: "#6b7280", fontSize: 14, lineHeight: 1.45 }}>{card.body}</p>
          </article>
        ))}
      </section>

      {featured.length > 0 ? (
        <section style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.2rem" }}>Featured Clusters</h2>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {featured.map((cluster) => (
              <ClusterDirectoryCard key={cluster.id || cluster.slug} cluster={cluster} />
            ))}
          </div>
        </section>
      ) : null}

      <section style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#6b7280", marginRight: 4 }}>Filter by type:</span>
          <button
            type="button"
            onClick={() => setTypeFilter("")}
            style={{
              borderRadius: 999,
              border: `1px solid ${typeFilter ? "#d1d5db" : "#111827"}`,
              background: typeFilter ? "#fff" : "#111827",
              color: typeFilter ? "#111827" : "#fff",
              padding: "0.3rem 0.7rem",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            All types
          </button>
          {CLUSTER_DESTINATION_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(typeFilter === type ? "" : type)}
              style={{
                borderRadius: 999,
                border: `1px solid ${typeFilter === type ? "#111827" : "#d1d5db"}`,
                background: typeFilter === type ? "#111827" : "#fff",
                color: typeFilter === type ? "#fff" : "#111827",
                padding: "0.3rem 0.7rem",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {clusterDestinationCategoryLabel(type)}
            </button>
          ))}
        </div>
      </section>

      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      {loading ? <p style={{ color: "#6b7280" }}>Loading clusters…</p> : null}

      {showSearchResults && !loading ? (
        <section style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.15rem" }}>
            Search results ({clusters.length})
          </h2>
          {clusters.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No clusters matched your search.</p>
          ) : (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {clusters.map((cluster) => (
                <ClusterDirectoryCard key={cluster.id || cluster.slug} cluster={cluster} />
              ))}
            </div>
          )}
        </section>
      ) : null}

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ margin: "0 0 0.35rem", fontSize: "1.2rem" }}>United States</h2>
        <p style={{ margin: "0 0 1rem", color: "#6b7280", fontSize: 14 }}>
          Browse every state using the same destination categories.
          {detectedState ? ` ${stateDisplayName(detectedState)} is expanded based on your location.` : ""}
        </p>

        <div style={{ display: "grid", gap: "0.65rem" }}>
          {visibleStateGroups.map((stateEntry) => {
            const isExpanded = expandedStates.has(stateEntry.state);
            return (
              <div
                key={stateEntry.state}
                style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}
              >
                <button
                  type="button"
                  onClick={() => toggleState(stateEntry.state)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    background: isExpanded ? "#f9fafb" : "#fff",
                    padding: "0.8rem 0.95rem",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{stateEntry.stateLabel}</span>
                  <span style={{ color: "#6b7280", fontSize: 13 }}>
                    {stateEntry.clusterCount} cluster{stateEntry.clusterCount === 1 ? "" : "s"}
                    {isExpanded ? " ▾" : " ▸"}
                  </span>
                </button>

                {isExpanded ? (
                  <div style={{ padding: "0 0.95rem 0.95rem", display: "grid", gap: "0.85rem" }}>
                    {stateEntry.destinationTypes.map((typeEntry) => (
                      <div key={`${stateEntry.state}-${typeEntry.type}`}>
                        <h3 style={{ margin: "0 0 0.45rem", fontSize: "0.98rem" }}>{typeEntry.label}</h3>
                        {typeEntry.clusters.length > 0 ? (
                          <div style={{ display: "grid", gap: "0.65rem" }}>
                            {typeEntry.clusters.map((cluster) => (
                              <ClusterDirectoryCard key={cluster.id || cluster.slug} cluster={cluster} />
                            ))}
                          </div>
                        ) : (
                          <p style={{ margin: 0, color: "#9ca3af", fontSize: 14 }}>
                            {emptyTypeMessage(typeEntry.type, globalTypeCounts)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section
        style={{
          border: "1px solid #fcd34d",
          background: "#fffbeb",
          borderRadius: 14,
          padding: "1rem 1.1rem",
        }}
      >
        <h2 style={{ margin: "0 0 0.35rem", fontSize: "1.1rem" }}>Can&apos;t find your destination?</h2>
        <p style={{ margin: "0 0 0.75rem", color: "#4b5563", lineHeight: 1.5 }}>
          Create a Community Cluster and help expand Menuply. Registered users with verified email
          addresses can publish immediately as a 🟡 Community Cluster.
        </p>
        <Link
          to="/clusters/community/new"
          style={{
            display: "inline-block",
            background: "#111827",
            color: "#fff",
            textDecoration: "none",
            borderRadius: 10,
            padding: "0.55rem 0.9rem",
            fontWeight: 600,
          }}
        >
          Create Community Cluster
        </Link>
      </section>

      <BottomNav />
    </div>
  );
}
