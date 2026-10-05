import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { normalizeLocationLabel } from "../../lib/locationUtils.js";
import { clusterDirectoryPath } from "../../lib/clusterUrl.js";
import {
  SEARCH_ALL_CLUSTERS_LABEL,
  clusterNavDescriptor,
  clusterNavHref,
  marketFromLocationLabel,
  sameMarket,
} from "../../lib/clusterNavigation.js";
import HomeNextClusterPill from "./HomeNextClusterPill.jsx";

const SESSION_LOCATION_KEY = "grubbid.discovery.location";
const RECENT_LOCATIONS_KEY = "grubbid.recent.locations";
const MAX_RECENT = 3;

function loadRecentLocations() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(RECENT_LOCATIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecentLocation(label) {
  if (typeof window === "undefined" || !label) return;
  try {
    const existing = loadRecentLocations().filter((l) => l !== label);
    window.localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify([label, ...existing].slice(0, MAX_RECENT)));
  } catch {
    // ignore
  }
}

function removeRecentLocation(label) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      RECENT_LOCATIONS_KEY,
      JSON.stringify(loadRecentLocations().filter((l) => l !== label))
    );
  } catch {
    // ignore
  }
}

export default function HomeNextLocationSelector({
  autoLocation,
  appliedLocation,
  onApplyLocation,
  locating = false,
  collapseSignal = 0,
  clusters = [],
  clusterMarket = null,
}) {
  const location = useLocation();
  const [showEditor, setShowEditor] = useState(false);
  const [locationInput, setLocationInput] = useState(() => appliedLocation || "");
  const [recentLocations, setRecentLocations] = useState(() => loadRecentLocations());
  const editorRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setLocationInput(appliedLocation || "");
  }, [appliedLocation]);

  useEffect(() => {
    setShowEditor(false);
  }, [collapseSignal]);

  useEffect(() => {
    if (!showEditor) return undefined;
    const rafId = window.requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      inputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [showEditor]);

  const summaryLabel = appliedLocation || autoLocation.label
    ? appliedLocation || autoLocation.label
    : locating
      ? "Detecting location…"
      : "Set your location";

  function applyLocation(rawValue) {
    const nextLocation = normalizeLocationLabel(String(rawValue ?? locationInput).trim());
    if (typeof window !== "undefined") {
      if (nextLocation) {
        window.sessionStorage.setItem(SESSION_LOCATION_KEY, nextLocation);
      } else {
        window.sessionStorage.removeItem(SESSION_LOCATION_KEY);
      }
    }
    if (nextLocation) {
      saveRecentLocation(nextLocation);
      setRecentLocations(loadRecentLocations());
    }
    onApplyLocation(nextLocation);
    setShowEditor(false);
  }

  const clusterExitTo = `${location.pathname}${location.search}`;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "nowrap", minWidth: 0 }}>
        <button
          type="button"
          onClick={() => setShowEditor((prev) => !prev)}
          aria-expanded={showEditor}
          aria-controls="home-next-location-editor"
          title="Change location"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            maxWidth: "100%",
            minWidth: 0,
            minHeight: 34,
            padding: "4px 12px",
            margin: "-4px -12px",
            borderRadius: 999,
            border: "1px solid rgba(34,197,94,0.25)",
            background: showEditor ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.06)",
            color: "#15803d",
            cursor: "pointer",
          }}
        >
          <span aria-hidden="true">📍</span>
          <span
            style={{
              minWidth: 0,
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {summaryLabel}
          </span>
          <span aria-hidden="true" style={{ opacity: 0.65, fontSize: 11 }}>▾</span>
        </button>
        <HomeNextClusterPill clusters={clusters} collapseSignal={collapseSignal} />
      </div>

      {showEditor && (
        <div
          id="home-next-location-editor"
          ref={editorRef}
          style={{
            marginTop: 12,
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid #E5E7EB",
            padding: 16,
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          }}
        >
          <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#374151" }}>
            Location preference
          </p>

          {recentLocations.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
              {recentLocations.map((label) => {
                const nestedClusters =
                  clusters.length > 0 && sameMarket(marketFromLocationLabel(label), clusterMarket) ? clusters : [];
                return (
                  <div key={label}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: "1px solid #E5E7EB",
                        background: locationInput === label ? "rgba(34,197,94,0.08)" : "#F9FAFB",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setLocationInput(label);
                          applyLocation(label);
                        }}
                        style={{
                          border: "none",
                          background: "transparent",
                          padding: 0,
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#111827",
                          cursor: "pointer",
                          textAlign: "left",
                          flex: 1,
                        }}
                      >
                        {label}
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${label}`}
                        onClick={() => {
                          removeRecentLocation(label);
                          setRecentLocations(loadRecentLocations());
                        }}
                        style={{
                          border: "none",
                          background: "transparent",
                          padding: "0 0 0 8px",
                          color: "#9CA3AF",
                          fontSize: 16,
                          cursor: "pointer",
                        }}
                      >
                        ×
                      </button>
                    </div>
                    {nestedClusters.length > 0 && (
                      <ul
                        aria-label={`Clusters in ${label}`}
                        style={{ listStyle: "none", margin: "4px 0 0", padding: "0 0 0 16px", display: "grid", gap: 2 }}
                      >
                        {nestedClusters.map((cluster) => {
                          const href = clusterNavHref(cluster, clusterExitTo);
                          if (!href) return null;
                          const descriptor = clusterNavDescriptor(cluster);
                          return (
                            <li key={cluster.slug}>
                              <Link
                                to={href}
                                style={{
                                  display: "block",
                                  padding: "6px 10px",
                                  borderLeft: "2px solid rgba(34,197,94,0.35)",
                                  color: "#111827",
                                  textDecoration: "none",
                                }}
                              >
                                <span style={{ display: "block", fontSize: 13, fontWeight: 600 }}>{cluster.name}</span>
                                {descriptor ? (
                                  <span style={{ display: "block", fontSize: 12, color: "#6B7280" }}>{descriptor}</span>
                                ) : null}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <input
            ref={inputRef}
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyLocation();
            }}
            placeholder="City, state or zip code"
            style={{
              width: "100%",
              height: 42,
              borderRadius: 12,
              border: "1px solid #D1D5DB",
              padding: "0 12px",
              fontSize: 14,
              background: "#ffffff",
              color: "#111827",
              boxSizing: "border-box",
            }}
          />

          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => applyLocation()}
              style={{
                height: 38,
                padding: "0 16px",
                borderRadius: 10,
                border: "none",
                background: "#22C55E",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Apply
            </button>
            {autoLocation.label && (
              <button
                type="button"
                onClick={() => {
                  setLocationInput(autoLocation.label);
                  applyLocation(autoLocation.label);
                }}
                style={{
                  height: 38,
                  padding: "0 16px",
                  borderRadius: 10,
                  border: "1px solid #D1D5DB",
                  background: "#ffffff",
                  color: "#111827",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Use current location
              </button>
            )}
            {appliedLocation && (
              <button
                type="button"
                onClick={() => {
                  setLocationInput("");
                  applyLocation("");
                }}
                style={{
                  height: 38,
                  padding: "0 16px",
                  borderRadius: 10,
                  border: "1px solid #E5E7EB",
                  background: "#F9FAFB",
                  color: "#6B7280",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            )}
          </div>

          <Link
            to={clusterDirectoryPath()}
            style={{
              display: "inline-block",
              marginTop: 12,
              fontSize: 13,
              fontWeight: 700,
              color: "#15803d",
              textDecoration: "none",
            }}
          >
            {SEARCH_ALL_CLUSTERS_LABEL} →
          </Link>
        </div>
      )}
    </div>
  );
}
