/**
 * Feed ☰ location row (2026-11-23, Andre): "Change" drops down right here with a field to type a city
 * (matching cities appear as you type), the last 3 places and "Use my current location". It no longer opens Search.
 * Picking a place saves it and the Feed reloads for that city in place.
 */

import { useEffect, useRef, useState } from "react";
import AppIcon from "../../icons/AppIcon.jsx";
import { feedHeaderLocationLabel } from "./FeedMobileHeader.jsx";
import {
  applyFeedLocation,
  cityQuery,
  cityRowToPlace,
  loadRecentLocations,
  removeRecentLocation,
  resolveTypedLocation,
  useFeedLocationVersion,
} from "../../../lib/feedLocationChange.js";
import { reverseGeocode, formatLocationLabel } from "../../../lib/locationUtils.js";
import { searchUsCities } from "../../../lib/locationReferenceApi.js";

function storage() {
  return typeof window !== "undefined" ? window.localStorage : null;
}

export default function FeedMenuLocationRow({ onDone }) {
  useFeedLocationVersion();
  const place = feedHeaderLocationLabel(storage());
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [recent, setRecent] = useState(() => loadRecentLocations(storage()));
  const [suggestions, setSuggestions] = useState([]);
  const inputRef = useRef(null);

  // Matching cities as you type (our US city table), after a short pause.
  useEffect(() => {
    const query = open ? cityQuery(text) : null;
    if (!query) {
      setSuggestions([]);
      return undefined;
    }
    let live = true;
    const t = setTimeout(() => {
      searchUsCities(query.q, query.state, 5)
        .then((rows) => live && setSuggestions(rows.map(cityRowToPlace).filter(Boolean)))
        .catch(() => live && setSuggestions([]));
    }, 200);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [open, text]);

  useEffect(() => {
    if (!open) return;
    setText("");
    setError("");
    setRecent(loadRecentLocations(storage()));
    inputRef.current?.focus();
  }, [open]);

  function finish(resolved) {
    if (!resolved || !applyFeedLocation(resolved)) {
      setError("We couldn't find that city. Try City, ST (e.g. Austin, TX).");
      return;
    }
    setOpen(false);
    onDone?.();
  }

  async function submit(value) {
    const raw = String(value ?? text).trim();
    if (!raw || busy) return;
    setBusy(true);
    setError("");
    try {
      finish(await resolveTypedLocation(raw));
    } finally {
      setBusy(false);
    }
  }

  function useCurrent() {
    if (busy || typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Location isn't available in this browser.");
      return;
    }
    setBusy(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const rev = await reverseGeocode(lat, lng).catch(() => null);
        setBusy(false);
        const city = String(rev?.city || "").trim();
        const state = String(rev?.state || "").trim().toUpperCase();
        finish(city && state ? { label: formatLocationLabel(city, state), city, state, lat, lng, confidence: "high" } : null);
      },
      () => {
        setBusy(false);
        setError("Allow location in your browser, or type a city.");
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }

  return (
    <div style={s.wrap} data-testid="feed-more-location-wrap">
      <button
        type="button"
        style={s.row}
        data-testid="feed-more-location"
        aria-expanded={open}
        aria-controls="feed-location-dropdown"
        aria-label={`Location: ${place}. Change location`}
        onClick={() => setOpen((v) => !v)}
      >
        <AppIcon name="pin" size={18} color="#5eead4" />
        <span style={s.text}>{place}</span>
        <span style={s.change}>Change {open ? "▴" : "▾"}</span>
      </button>
      {open ? (
        <div id="feed-location-dropdown" style={s.panel} data-testid="feed-location-dropdown">
          <form
            style={s.form}
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
              }}
              placeholder="City, state"
              aria-label="Type a city"
              data-testid="feed-location-input"
              autoComplete="off"
              style={s.input}
            />
            <button type="submit" style={s.go} disabled={busy || !text.trim()} data-testid="feed-location-go">
              {busy ? "…" : "Go"}
            </button>
          </form>
          {error ? <p style={s.error} role="alert">{error}</p> : null}
          {suggestions.length > 0 ? (
            <ul style={s.list} aria-label="Matching cities" data-testid="feed-location-suggestions">
              {suggestions.map((p) => (
                <li key={p.label}>
                  <button type="button" style={s.recentBtn} disabled={busy} onClick={() => finish(p)}>
                    {p.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {recent.length > 0 && suggestions.length === 0 ? (
            <ul style={s.list} aria-label="Recent places">
              {recent.map((label) => (
                <li key={label} style={s.recentItem}>
                  <button type="button" style={s.recentBtn} disabled={busy} onClick={() => submit(label)}>
                    {label}
                  </button>
                  <button
                    type="button"
                    style={s.remove}
                    aria-label={`Remove ${label}`}
                    onClick={() => {
                      removeRecentLocation(storage(), label);
                      setRecent(loadRecentLocations(storage()));
                    }}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <button type="button" style={s.current} disabled={busy} onClick={useCurrent} data-testid="feed-location-current">
            Use my current location
          </button>
        </div>
      ) : null}
    </div>
  );
}

const s = {
  wrap: { borderBottom: "1px solid rgba(255,255,255,0.08)" },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: "12px 10px",
    border: "none",
    background: "transparent",
    fontFamily: "inherit",
    textAlign: "left",
    cursor: "pointer",
  },
  text: { flex: 1, minWidth: 0, color: "#e8f0ec", fontSize: 15, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  change: { color: "#5eead4", fontSize: 14, fontWeight: 700 },
  panel: { padding: "0 10px 12px" },
  form: { display: "flex", gap: 8 },
  input: {
    flex: 1,
    minWidth: 0,
    height: 38,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.06)",
    color: "#e8f0ec",
    padding: "0 10px",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
  },
  go: {
    height: 38,
    padding: "0 14px",
    borderRadius: 8,
    border: "none",
    background: "#5eead4",
    color: "#04201b",
    fontWeight: 800,
    fontSize: 14,
    fontFamily: "inherit",
    cursor: "pointer",
  },
  error: { margin: "8px 0 0", color: "#fca5a5", fontSize: 13 },
  list: { listStyle: "none", margin: "8px 0 0", padding: 0 },
  recentItem: { display: "flex", alignItems: "center" },
  recentBtn: {
    flex: 1,
    textAlign: "left",
    padding: "8px 2px",
    border: "none",
    background: "transparent",
    color: "#e8f0ec",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
  },
  remove: { border: "none", background: "transparent", color: "rgba(232,240,236,0.5)", fontSize: 18, padding: "0 6px", cursor: "pointer" },
  current: {
    marginTop: 6,
    padding: "6px 2px",
    border: "none",
    background: "transparent",
    color: "#5eead4",
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: "pointer",
  },
};
