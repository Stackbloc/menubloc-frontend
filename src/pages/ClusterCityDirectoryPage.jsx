/**
 * Path: menubloc-frontend/src/pages/ClusterCityDirectoryPage.jsx
 * Purpose: Cluster City parent page — city-wide place discovery (Los Angeles pilot).
 * Modified: 2026-07-11
 */

import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import { BrandLogo } from "../components/BrandLogo.jsx";
import ClusterDirectoryCard, { CLUSTER_DIRECTORY_GRID_STYLE } from "../components/cluster/ClusterDirectoryCard.jsx";
import ClusterBackButton from "../components/cluster/ClusterBackButton.jsx";
import { ClusterDirectoryBreadcrumb } from "../components/cluster/ClusterBreadcrumbs.jsx";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { fetchClusterCityPage, searchClusterCity, submitClusterContribution } from "../lib/clusterApi.js";
import { toConsumerErrorMessage } from "../lib/api.js";
import { clusterLifecycleLabel, groupClustersForCitySections } from "../lib/clusterCityPresentation.js";
import { clusterMatchesMarket, resolveClusterMarketFromStoredLocation } from "../lib/clusterLocation.js";
import { clusterDirectoryPath, stateDisplayName, CLUSTER_VIEW_PROMPTS } from "../lib/clusterUrl.js";

const TYPE_ACCENTS = {
  university: { border: "#8b5cf6", bg: "#f5f3ff" },
  airport: { border: "#0ea5e9", bg: "#ecfeff" },
  downtown: { border: "#f97316", bg: "#fff7ed" },
  entertainment_complex: { border: "#ec4899", bg: "#fdf2f8" },
  tourist_destination: { border: "#16a34a", bg: "#f0fdf4" },
  stadium: { border: "#2563eb", bg: "#eff6ff" },
  convention_district: { border: "#14b8a6", bg: "#f0fdfa" },
  historic_district: { border: "#a16207", bg: "#fefce8" },
  waterfront: { border: "#0891b2", bg: "#ecfeff" },
  casino: { border: "#b91c1c", bg: "#fef2f2" },
  theme_park: { border: "#7c3aed", bg: "#f5f3ff" },
  business_district: { border: "#4b5563", bg: "#f9fafb" },
};

const sectionShellStyle = {
  border: "1px solid #dbe7df",
  background: "#fff",
  borderRadius: 18,
  padding: "1rem 1.1rem",
  marginBottom: "1rem",
};

function clusterAccent(cluster) {
  const type = String(cluster?.type || "").toLowerCase();
  return TYPE_ACCENTS[type] || { border: "#d1d5db", bg: "#f9fafb" };
}

function renderClusterCard(cluster, { hideLocation = true } = {}) {
  const lifecycle = clusterLifecycleLabel(cluster);
  return (
    <ClusterDirectoryCard
      key={cluster.slug}
      cluster={cluster}
      accent={clusterAccent(cluster)}
      statusLabel={lifecycle.statusLabel}
      statusTitle={lifecycle.statusTitle}
      starterChecklist={cluster.starter_checklist}
      hideLocation={hideLocation}
    />
  );
}

function ClusterCitySection({ title, description, children, id }) {
  if (!children) return null;
  return (
    <section id={id} style={sectionShellStyle}>
      <h2 style={{ margin: "0 0 0.35rem", fontSize: "1.15rem", lineHeight: 1.25 }}>{title}</h2>
      {description ? (
        <p style={{ margin: "0 0 0.85rem", color: "#64748b", fontSize: "0.92rem", lineHeight: 1.45 }}>
          {description}
        </p>
      ) : null}
      {children}
    </section>
  );
}

export default function ClusterCityDirectoryPage() {
  const { stateSlug, citySlug } = useParams();
  const { isAuthenticated } = useConsumer();
  const storedMarket = useMemo(() => resolveClusterMarketFromStoredLocation(), []);
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [searchStatus, setSearchStatus] = useState("idle");
  const [searchClusters, setSearchClusters] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestText, setSuggestText] = useState("");
  const [suggestStatus, setSuggestStatus] = useState("idle");
  const [suggestMessage, setSuggestMessage] = useState("");

  const cityLabel = page?.city || citySlug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  const stateLabel = page?.state ? stateDisplayName(page.state) : stateSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const isUsersCity = Boolean(
    page?.city &&
      page?.state &&
      storedMarket &&
      clusterMatchesMarket({ city: page.city, state: page.state }, storedMarket)
  );

  const { live: liveClusters, starter: starterClusters } = useMemo(() => {
    if (Array.isArray(page?.live_clusters) && page.live_clusters.length > 0) {
      return {
        live: page.live_clusters,
        starter: Array.isArray(page?.starter_clusters) ? page.starter_clusters : [],
      };
    }
    return groupClustersForCitySections(page?.all_clusters || []);
  }, [page?.live_clusters, page?.starter_clusters, page?.all_clusters]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    fetchClusterCityPage(stateSlug, citySlug, { signal: controller.signal })
      .then((json) => {
        if (!json?.ok) throw new Error(json?.error || "Could not load this Cluster City.");
        setPage(json);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(toConsumerErrorMessage(err, "Could not load this Cluster City."));
        setLoading(false);
      });

    return () => controller.abort();
  }, [stateSlug, citySlug]);

  useEffect(() => {
    document.title = `Explore ${cityLabel} | Menuply`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        `Explore Clusters across ${cityLabel}. Each Cluster brings together food from restaurants around a place people visit, making it easy to discover everything available in one area.`
      );
    }
    const canonicalPath = `/clusters/${stateSlug}/${citySlug}`;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `${window.location.origin}${canonicalPath}`);
  }, [cityLabel, stateSlug, citySlug]);

  useEffect(() => {
    if (!submittedSearch.trim()) {
      setSearchClusters([]);
      setSearchStatus("idle");
      return undefined;
    }

    const controller = new AbortController();
    setSearchStatus("loading");
    setSearchError("");

    searchClusterCity(stateSlug, citySlug, {
      q: submittedSearch.trim(),
      limit: 48,
      signal: controller.signal,
    })
      .then((data) => {
        if (!data?.ok) throw new Error(data?.error || "Search failed");
        setSearchClusters(Array.isArray(data.clusters) ? data.clusters : []);
        setSearchStatus("ok");
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setSearchError(toConsumerErrorMessage(err, "Could not search clusters in this city."));
        setSearchStatus("error");
      });

    return () => controller.abort();
  }, [stateSlug, citySlug, submittedSearch]);

  function handleSearchSubmit(event) {
    event.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed) return;
    setSubmittedSearch(trimmed);
  }

  function clearSearch() {
    setSearchInput("");
    setSubmittedSearch("");
  }

  async function handleSuggestSubmit(event) {
    event.preventDefault();
    const trimmed = suggestText.trim();
    if (!trimmed) return;
    if (!isAuthenticated) {
      setSuggestMessage("Sign in to suggest a new Cluster.");
      return;
    }
    setSuggestStatus("loading");
    setSuggestMessage("");
    try {
      await submitClusterContribution({
        contribution_type: "suggest_cluster",
        state_slug: stateSlug,
        city_slug: citySlug,
        submitted_value: trimmed,
        notes: `Suggested place for ${cityLabel}, ${stateLabel}`,
      });
      setSuggestStatus("ok");
      setSuggestMessage("Thanks — your suggestion was submitted for review.");
      setSuggestText("");
    } catch (err) {
      setSuggestStatus("error");
      setSuggestMessage(toConsumerErrorMessage(err, "Could not submit suggestion."));
    }
  }

  const searchActive = Boolean(submittedSearch.trim());

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
        padding: "1.25rem 1rem 5rem",
        width: "100%",
        boxSizing: "border-box",
        overflowX: "clip",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto", width: "100%", minWidth: 0 }}>
        <header
          style={{
            border: "1px solid #dbe7df",
            background: "#ffffff",
            borderRadius: 18,
            padding: "1rem 1.1rem",
            marginBottom: "1rem",
            boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
          }}
        >
          <ClusterBackButton fallbackTo={clusterDirectoryPath()} label="All clusters" />
          <BrandLogo height={36} radius={10} matchPageBackground={false} />
          <ClusterDirectoryBreadcrumb state={page?.state || stateSlug} city={cityLabel} />
          <h1 style={{ margin: "0.5rem 0 0.4rem", fontSize: "1.7rem", lineHeight: 1.2 }}>
            {cityLabel}
          </h1>
          <p style={{ margin: 0, color: "#475569", maxWidth: 760, lineHeight: 1.55 }}>
            Explore Clusters across {cityLabel}. Each Cluster brings together food from restaurants around a
            place people visit, making it easy to discover everything available in one area.
          </p>
          <p style={{ margin: "0.65rem 0 0", color: "#111827", fontWeight: 600, fontSize: "1.05rem" }}>
            {CLUSTER_VIEW_PROMPTS.clusterCity}
          </p>
        </header>

        {isUsersCity ? (
          <section
            style={{
              border: "1px solid #bfdbfe",
              background: "#eff6ff",
              borderRadius: 14,
              padding: "0.85rem 1rem",
              marginBottom: "1rem",
            }}
          >
            <p style={{ margin: 0, color: "#1e3a8a", fontSize: "0.95rem", lineHeight: 1.45 }}>
              <a href="#clusters" style={{ color: "#1d4ed8", fontWeight: 700, textDecoration: "none" }}>
                Continue exploring {cityLabel}
              </a>
            </p>
          </section>
        ) : null}

        {error ? <p style={{ color: "#b91c1c" }} role="alert">{error}</p> : null}

        <section style={{ ...sectionShellStyle, marginBottom: "1rem" }}>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem" }}>Find a Cluster</h2>
          <p style={{ margin: "0 0 0.75rem", color: "#64748b", fontSize: "0.92rem", lineHeight: 1.45 }}>
            Search airports, campuses, stadiums, and neighborhoods. Food search starts after you open a
            Cluster.
          </p>
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-start" }}>
            <div style={{ flex: "1 1 220px", minWidth: 0 }}>
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search clusters — airport, university, downtown…"
                aria-label={`Search clusters in ${cityLabel}`}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "0.65rem 0.75rem",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  fontSize: "1rem",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!searchInput.trim()}
              style={{
                padding: "0.65rem 1rem",
                borderRadius: 8,
                border: "none",
                background: searchInput.trim() ? "#111827" : "#9ca3af",
                color: "#fff",
                cursor: searchInput.trim() ? "pointer" : "not-allowed",
                alignSelf: "flex-start",
              }}
            >
              Search
            </button>
            {searchActive ? (
              <button
                type="button"
                onClick={clearSearch}
                style={{
                  padding: "0.65rem 1rem",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  cursor: "pointer",
                  alignSelf: "flex-start",
                }}
              >
                Clear
              </button>
            ) : null}
          </form>

          {searchActive && searchStatus === "loading" ? (
            <p style={{ color: "#666", margin: "0.85rem 0 0" }} aria-live="polite">
              Searching for “{submittedSearch}”…
            </p>
          ) : null}
          {searchActive && searchStatus === "error" ? (
            <p style={{ color: "#b91c1c", margin: "0.85rem 0 0" }} role="alert">{searchError}</p>
          ) : null}
          {searchActive && searchStatus === "ok" && searchClusters.length === 0 ? (
            <p style={{ color: "#888", margin: "0.85rem 0 0" }}>
              No clusters in {cityLabel} match “{submittedSearch}”.
            </p>
          ) : null}
          {searchActive && searchClusters.length > 0 ? (
            <div style={{ ...CLUSTER_DIRECTORY_GRID_STYLE, marginTop: "0.85rem" }}>
              {searchClusters.map((cluster) => renderClusterCard(cluster))}
            </div>
          ) : null}
        </section>

        {loading ? <p style={{ color: "#64748b" }}>Loading clusters…</p> : null}

        {!loading && !page ? (
          <section style={sectionShellStyle}>
            <p style={{ margin: 0, color: "#475569" }}>
              Menuply does not have a Cluster City for this location yet.
            </p>
            <Link to={clusterDirectoryPath()} style={{ color: "#1d4ed8", marginTop: "0.75rem", display: "inline-block" }}>
              View all clusters →
            </Link>
          </section>
        ) : null}

        {!loading && page && !searchActive ? (
          <>
            <ClusterCitySection
              id="clusters"
              title="Live Clusters"
              description="Established Clusters with full coverage across this city."
            >
              {liveClusters.length > 0 ? (
                <div style={CLUSTER_DIRECTORY_GRID_STYLE}>
                  {liveClusters.map((cluster) => renderClusterCard(cluster))}
                </div>
              ) : null}
            </ClusterCitySection>

            <ClusterCitySection
              title="Starter Clusters"
              description="Useful now and still growing — community contributions welcome."
            >
              {starterClusters.length > 0 ? (
                <div style={CLUSTER_DIRECTORY_GRID_STYLE}>
                  {starterClusters.map((cluster) => renderClusterCard(cluster))}
                </div>
              ) : null}
            </ClusterCitySection>

            {liveClusters.length === 0 && starterClusters.length === 0 ? (
              <ClusterCitySection id="clusters" title={`Clusters in ${cityLabel}`}>
                <p style={{ margin: 0, color: "#64748b" }}>No public clusters here yet.</p>
              </ClusterCitySection>
            ) : null}

            <section style={sectionShellStyle}>
              <h2 style={{ margin: "0 0 0.35rem", fontSize: "1.1rem" }}>Suggest a Cluster</h2>
              <p style={{ margin: "0 0 0.75rem", color: "#64748b", fontSize: "0.92rem", lineHeight: 1.45 }}>
                Missing a campus, airport, neighborhood, or venue? Suggest it for review — we will not create it
                until it is approved.
              </p>
              {suggestOpen ? (
                <form onSubmit={handleSuggestSubmit} style={{ display: "grid", gap: "0.5rem" }}>
                  <label htmlFor="cluster-suggest-text" style={{ display: "grid", gap: "0.35rem", fontSize: "0.9rem", color: "#334155" }}>
                    Your suggestion
                    <textarea
                      id="cluster-suggest-text"
                      value={suggestText}
                      onChange={(event) => setSuggestText(event.target.value)}
                      rows={3}
                      placeholder="e.g. Koreatown dining district"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "0.65rem 0.75rem",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        fontSize: "0.95rem",
                      }}
                    />
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button
                      type="submit"
                      disabled={!suggestText.trim() || suggestStatus === "loading"}
                      style={{
                        padding: "0.55rem 0.9rem",
                        borderRadius: 8,
                        border: "none",
                        background: "#111827",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      {suggestStatus === "loading" ? "Submitting…" : "Submit for review"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSuggestOpen(false)}
                      style={{
                        padding: "0.55rem 0.9rem",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        background: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                  {suggestMessage ? (
                    <p
                      style={{ margin: 0, color: suggestStatus === "error" ? "#b91c1c" : "#15803d", fontSize: "0.9rem" }}
                      role="status"
                    >
                      {suggestMessage}
                    </p>
                  ) : null}
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setSuggestOpen(true)}
                  style={{
                    padding: "0.55rem 0.9rem",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    background: "#fff",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Suggest a Cluster
                </button>
              )}
            </section>
          </>
        ) : null}
      </div>
      <BottomNav />
    </div>
  );
}
