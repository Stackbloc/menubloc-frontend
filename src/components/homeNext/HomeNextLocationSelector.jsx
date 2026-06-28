import { useEffect, useRef, useState } from "react";
import { normalizeLocationLabel } from "../../lib/locationUtils.js";

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
}) {
  const [showEditor, setShowEditor] = useState(false);
  const [locationInput, setLocationInput] = useState(() => appliedLocation || "");
  const [recentLocations, setRecentLocations] = useState(() => loadRecentLocations());
  const editorRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setLocationInput(appliedLocation || "");
  }, [appliedLocation]);

  useEffect(() => {
    if (!showEditor) return undefined;
    const rafId = window.requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      inputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [showEditor]);

  const summaryLabel = appliedLocation || autoLocation.label
    ? `Near ${appliedLocation || autoLocation.label}`
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

  return (
    <div style={{ marginBottom: 14 }}>
      <button
        type="button"
        onClick={() => setShowEditor((prev) => !prev)}
        aria-expanded={showEditor}
        aria-controls="home-next-location-editor"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          maxWidth: "100%",
          minHeight: 34,
          padding: "0 12px",
          borderRadius: 999,
          border: "1px solid rgba(34,197,94,0.2)",
          background: showEditor ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.08)",
          color: "#15803d",
          cursor: "pointer",
        }}
      >
        <span aria-hidden="true">📍</span>
        <span
          style={{
            minWidth: 0,
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {summaryLabel}
        </span>
        <span aria-hidden="true" style={{ opacity: 0.65 }}>▾</span>
      </button>

      {showEditor && (
        <div
          id="home-next-location-editor"
          ref={editorRef}
          style={{
            marginTop: 12,
            background: "var(--gb-color-surface-strong)",
            borderRadius: 16,
            border: "1px solid var(--gb-color-border)",
            padding: 16,
          }}
        >
          {recentLocations.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 10 }}>
              {recentLocations.map((label) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--gb-color-border)",
                    background: locationInput === label ? "rgba(45,106,79,0.1)" : "var(--gb-color-surface)",
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
                      color: "var(--gb-color-ink)",
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
                      color: "#6B7280",
                      fontSize: 16,
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
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
              border: "1px solid var(--gb-color-border-strong)",
              padding: "0 12px",
              fontSize: 14,
              background: "var(--gb-color-surface-strong)",
              color: "var(--gb-color-ink)",
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
                border: "1px solid var(--gb-color-border-strong)",
                background: "var(--gb-color-surface-strong)",
                color: "var(--gb-color-ink)",
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
                  border: "1px solid var(--gb-color-border-strong)",
                  background: "var(--gb-color-surface-strong)",
                  color: "var(--gb-color-ink)",
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Use Current Location
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
