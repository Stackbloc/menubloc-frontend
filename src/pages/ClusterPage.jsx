import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import DiscoveryCard from "../components/discovery/DiscoveryCard.jsx";
import SearchResultCard from "../components/SearchResultCard.jsx";
import { fetchClusterMetadata, fetchClusterRestaurants, searchCluster } from "../lib/clusterApi.js";
import { clusterPath, clusterTypeLabel } from "../lib/clusterUrl.js";
import { CLUSTER_TABS, DEFAULT_CLUSTER_TAB } from "../components/cluster/clusterTabs.js";
import { toConsumerErrorMessage } from "../lib/api.js";

const CANONICAL_BASE = "https://menuply.com";

function ClusterOverviewTab({ cluster }) {
  if (!cluster) return null;

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <div style={{ color: "#666", fontSize: "0.95rem" }}>
        <p style={{ margin: 0 }}>
          {clusterTypeLabel(cluster.type)} in {cluster.city}, {cluster.state}
        </p>
        {cluster.address ? <p style={{ margin: "0.5rem 0 0" }}>{cluster.address}</p> : null}
        <p style={{ margin: "0.75rem 0 0" }}>
          {cluster.restaurant_count} restaurant{cluster.restaurant_count === 1 ? "" : "s"} in this destination
        </p>
      </div>
      <p style={{ margin: 0, color: "#444", lineHeight: 1.5 }}>
        Browse restaurants and search dishes across every venue in {cluster.name}.
        Open the Restaurants tab to see who is here, or Search This Cluster to find a specific dish.
      </p>
    </section>
  );
}

function ClusterRestaurantsTab({ clusterSlug, enabled }) {
  const [status, setStatus] = useState(enabled ? "loading" : "idle");
  const [restaurants, setRestaurants] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled || !clusterSlug) return undefined;

    const controller = new AbortController();
    setStatus("loading");
    setError("");

    fetchClusterRestaurants(clusterSlug, { signal: controller.signal })
      .then((data) => {
        if (!data?.ok) throw new Error(data?.error || "Could not load restaurants");
        setRestaurants(Array.isArray(data.restaurants) ? data.restaurants : []);
        setStatus("ok");
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(toConsumerErrorMessage(err, "Could not load restaurants for this cluster."));
        setStatus("error");
      });

    return () => controller.abort();
  }, [clusterSlug, enabled]);

  if (!enabled) {
    return <p style={{ color: "#888" }}>Open the Restaurants tab to load venues in this destination.</p>;
  }

  if (status === "loading") {
    return <p style={{ color: "#666" }}>Loading restaurants…</p>;
  }

  if (status === "error") {
    return <p style={{ color: "#b91c1c" }}>{error}</p>;
  }

  if (restaurants.length === 0) {
    return <p style={{ color: "#888" }}>No restaurants are assigned to this cluster yet.</p>;
  }

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      {restaurants.map((restaurant) => (
        <DiscoveryCard key={restaurant.restaurant_id} menu={restaurant} />
      ))}
    </div>
  );
}

function ClusterSearchTab({ clusterSlug, enabled }) {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [status, setStatus] = useState("idle");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled || !clusterSlug || !submittedQuery.trim()) return undefined;

    const controller = new AbortController();
    setStatus("loading");
    setError("");

    searchCluster(clusterSlug, { q: submittedQuery.trim(), signal: controller.signal })
      .then((data) => {
        if (!data?.ok) throw new Error(data?.error || "Search failed");
        const rows = Array.isArray(data.results) && data.results.length
          ? data.results
          : Array.isArray(data.menu_items)
            ? data.menu_items
            : [];
        setResults(rows);
        setStatus("ok");
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(toConsumerErrorMessage(err, "Could not search this cluster."));
        setStatus("error");
      });

    return () => controller.abort();
  }, [clusterSlug, enabled, submittedQuery]);

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setSubmittedQuery(trimmed);
  }

  if (!enabled) {
    return <p style={{ color: "#888" }}>Search runs only after you enter a query in this tab.</p>;
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search dishes and restaurants in this cluster"
          aria-label="Search this cluster"
          style={{
            flex: "1 1 220px",
            minWidth: 0,
            padding: "0.65rem 0.75rem",
            borderRadius: 8,
            border: "1px solid #d1d5db",
          }}
        />
        <button
          type="submit"
          disabled={!query.trim()}
          style={{
            padding: "0.65rem 1rem",
            borderRadius: 8,
            border: "none",
            background: query.trim() ? "#111827" : "#9ca3af",
            color: "#fff",
            cursor: query.trim() ? "pointer" : "not-allowed",
          }}
        >
          Search
        </button>
      </form>

      {status === "loading" ? <p style={{ color: "#666" }}>Searching {submittedQuery}…</p> : null}
      {status === "error" ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      {status === "ok" && submittedQuery ? (
        results.length === 0 ? (
          <p style={{ color: "#888" }}>No matches in this cluster for “{submittedQuery}”.</p>
        ) : (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {results.map((row, index) => (
              <SearchResultCard
                key={`${row.menu_item_id || row.restaurant_id || row.id || "row"}-${index}`}
                row={row}
              />
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}

export default function ClusterPage() {
  const { stateSlug, citySlug, clusterSlug } = useParams();
  const [activeTab, setActiveTab] = useState(DEFAULT_CLUSTER_TAB);
  const [status, setStatus] = useState("loading");
  const [cluster, setCluster] = useState(null);
  const [error, setError] = useState("");

  const canonicalPath = useMemo(
    () => clusterPath({ state: stateSlug, city: citySlug, slug: clusterSlug }),
    [stateSlug, citySlug, clusterSlug]
  );

  useEffect(() => {
    if (!clusterSlug) return undefined;

    const controller = new AbortController();
    setStatus("loading");
    setError("");

    fetchClusterMetadata(clusterSlug, {
      stateSlug,
      citySlug,
      signal: controller.signal,
    })
      .then((data) => {
        if (!data?.ok || !data.cluster) throw new Error(data?.error || "Cluster not found");
        setCluster(data.cluster);
        setStatus("ok");
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(toConsumerErrorMessage(err, "Could not load this destination."));
        setStatus("error");
      });

    return () => controller.abort();
  }, [clusterSlug, stateSlug, citySlug]);

  useEffect(() => {
    if (!canonicalPath) return;
    let link = document.querySelector("link[rel='canonical']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = `${CANONICAL_BASE}${canonicalPath}`;
  }, [canonicalPath]);

  useEffect(() => {
    if (cluster?.name) {
      document.title = `${cluster.name} — Menuply`;
    }
  }, [cluster?.name]);

  if (status === "loading") {
    return (
      <div style={{ padding: "2rem 1rem", textAlign: "center" }}>
        <p>Loading destination…</p>
      </div>
    );
  }

  if (status === "error" || !cluster) {
    return (
      <div style={{ padding: "2rem 1rem", textAlign: "center" }}>
        <p>{error || "Destination not found."}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.25rem 1rem 5rem" }}>
      <header style={{ marginBottom: "1.25rem" }}>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>
          {cluster.city}, {cluster.state}
        </p>
        <h1 style={{ margin: "0.25rem 0 0", fontSize: "1.75rem", lineHeight: 1.2 }}>{cluster.name}</h1>
      </header>

      <nav
        aria-label="Cluster sections"
        style={{
          display: "flex",
          gap: "0.5rem",
          overflowX: "auto",
          paddingBottom: "0.5rem",
          marginBottom: "1rem",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        {CLUSTER_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const disabled = !tab.enabled;
          return (
            <button
              key={tab.id}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (!disabled) setActiveTab(tab.id);
              }}
              style={{
                flex: "0 0 auto",
                padding: "0.5rem 0.85rem",
                borderRadius: 999,
                border: isActive ? "1px solid #111827" : "1px solid #d1d5db",
                background: isActive ? "#111827" : "#fff",
                color: disabled ? "#9ca3af" : isActive ? "#fff" : "#111827",
                cursor: disabled ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}
              title={tab.comingSoon ? "Coming soon" : undefined}
            >
              {tab.label}
              {tab.comingSoon ? " (soon)" : ""}
            </button>
          );
        })}
      </nav>

      <main>
        {activeTab === "overview" ? <ClusterOverviewTab cluster={cluster} /> : null}
        {activeTab === "restaurants" ? (
          <ClusterRestaurantsTab clusterSlug={cluster.slug} enabled={activeTab === "restaurants"} />
        ) : null}
        {activeTab === "search" ? (
          <ClusterSearchTab clusterSlug={cluster.slug} enabled={activeTab === "search"} />
        ) : null}
        {activeTab === "compare" || activeTab === "deals" || activeTab === "map" ? (
          <p style={{ color: "#888" }}>This tab is reserved for a future cluster release.</p>
        ) : null}
      </main>

      <BottomNav />
    </div>
  );
}
