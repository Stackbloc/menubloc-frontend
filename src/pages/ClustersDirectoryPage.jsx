import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import ClusterDirectoryCard from "../components/cluster/ClusterDirectoryCard.jsx";
import { fetchClustersDirectory } from "../lib/clusterApi.js";
import { groupClustersByStateCity, stateDisplayName } from "../lib/clusterUrl.js";
import { toConsumerErrorMessage } from "../lib/api.js";

function filterClustersLocally(clusters, query) {
  const needle = String(query || "").trim().toLowerCase();
  if (!needle) return clusters;

  return clusters.filter((cluster) => {
    const haystack = [
      cluster.name,
      cluster.slug,
      cluster.city,
      cluster.state,
      cluster.type,
      cluster.area_name,
      cluster.short_description,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

export default function ClustersDirectoryPage() {
  const [searchParams] = useSearchParams();
  const stateFilter = searchParams.get("state") || "";
  const cityFilter = searchParams.get("city") || "";

  const [status, setStatus] = useState("loading");
  const [clusters, setClusters] = useState([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.title = "Restaurant Clusters | Menuply";
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setError("");

    fetchClustersDirectory({
      state: stateFilter || undefined,
      city: cityFilter || undefined,
      limit: 200,
      signal: controller.signal,
    })
      .then((data) => {
        if (!data?.ok) throw new Error(data?.error || "Could not load clusters");
        setClusters(Array.isArray(data.clusters) ? data.clusters : []);
        setStatus("ok");
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(toConsumerErrorMessage(err, "Could not load cluster directory."));
        setStatus("error");
      });

    return () => controller.abort();
  }, [stateFilter, cityFilter]);

  const visibleClusters = useMemo(
    () => filterClustersLocally(clusters, query),
    [clusters, query]
  );

  const grouped = useMemo(
    () => groupClustersByStateCity(visibleClusters),
    [visibleClusters]
  );

  const activeFilterLabel = useMemo(() => {
    if (cityFilter && stateFilter) {
      const cityName = visibleClusters[0]?.city || cityFilter.replace(/-/g, " ");
      return `${cityName}, ${stateDisplayName(stateFilter)}`;
    }
    if (stateFilter) return stateDisplayName(stateFilter);
    return null;
  }, [cityFilter, stateFilter, visibleClusters]);

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "1.25rem 1rem 5rem" }}>
      <header style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ margin: "0 0 0.35rem", fontSize: "1.75rem", lineHeight: 1.2 }}>
          Restaurant Clusters
        </h1>
        <p style={{ margin: 0, color: "#6b7280", lineHeight: 1.5 }}>
          Browse destination areas — malls, campuses, entertainment districts, and more.
        </p>
        {activeFilterLabel ? (
          <p style={{ margin: "0.75rem 0 0", color: "#374151", fontSize: "0.95rem" }}>
            Showing clusters in {activeFilterLabel}
          </p>
        ) : null}
      </header>

      <div style={{ marginBottom: "1.25rem" }}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search clusters by name, city, state, or type"
          aria-label="Search clusters"
          style={{
            width: "100%",
            padding: "0.75rem 0.85rem",
            borderRadius: 10,
            border: "1px solid #d1d5db",
            fontSize: "1rem",
          }}
        />
      </div>

      {status === "loading" ? <p style={{ color: "#666" }}>Loading clusters…</p> : null}
      {status === "error" ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}

      {status === "ok" && visibleClusters.length === 0 ? (
        <p style={{ color: "#888" }}>No clusters match your search yet.</p>
      ) : null}

      {status === "ok" && grouped.length > 0 ? (
        <div style={{ display: "grid", gap: "1.5rem" }}>
          {grouped.map((stateGroup) => (
            <section key={stateGroup.state}>
              <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.2rem" }}>{stateGroup.stateLabel}</h2>
              <div style={{ display: "grid", gap: "1rem" }}>
                {stateGroup.cities.map((cityGroup) => (
                  <div key={`${stateGroup.state}-${cityGroup.city}`}>
                    <h3 style={{ margin: "0 0 0.65rem", fontSize: "1rem", color: "#374151" }}>
                      {cityGroup.city}
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gap: "0.75rem",
                        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                      }}
                    >
                      {cityGroup.clusters.map((cluster) => (
                        <ClusterDirectoryCard key={cluster.slug} cluster={cluster} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      <BottomNav />
    </div>
  );
}
