import React, { createContext, useContext, useMemo, useCallback, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

const PlatformIntelligenceContext = createContext(null);

const KNOWN_PRESETS = new Set(["today", "yesterday", "7d", "30d"]);

/** Calendar date in the user's local timezone (YYYY-MM-DD). */
function localDateYmd(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addLocalDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function buildDefaultRange() {
  const today = new Date();
  return {
    start_date: localDateYmd(addLocalDays(today, -29)),
    end_date: localDateYmd(today),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  };
}

function applyPreset(preset) {
  const today = new Date();
  const end = localDateYmd(today);

  if (preset === "today") {
    return { start_date: end, end_date: end };
  }
  if (preset === "yesterday") {
    const y = localDateYmd(addLocalDays(today, -1));
    return { start_date: y, end_date: y };
  }
  if (preset === "7d") {
    const start = localDateYmd(addLocalDays(today, -6));
    return { start_date: start, end_date: end };
  }
  const start = localDateYmd(addLocalDays(today, -29));
  return { start_date: start, end_date: end };
}

function resolveRange(searchParams, defaults) {
  const preset = searchParams.get("preset") || "30d";
  const timezone = searchParams.get("timezone") || defaults.timezone;
  const hasStart = searchParams.has("start_date");
  const hasEnd = searchParams.has("end_date");

  if (KNOWN_PRESETS.has(preset) && (!hasStart || !hasEnd)) {
    return { ...applyPreset(preset), timezone, preset };
  }

  return {
    start_date: searchParams.get("start_date") || defaults.start_date,
    end_date: searchParams.get("end_date") || defaults.end_date,
    timezone,
    preset,
  };
}

export function PlatformIntelligenceProvider({ children }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const defaults = useMemo(() => buildDefaultRange(), []);

  const range = useMemo(
    () => resolveRange(searchParams, defaults),
    [searchParams, defaults]
  );

  useEffect(() => {
    const preset = searchParams.get("preset");
    if (!preset || !KNOWN_PRESETS.has(preset)) return;
    if (searchParams.has("start_date") && searchParams.has("end_date")) return;

    const next = applyPreset(preset);
    const params = new URLSearchParams(searchParams);
    params.set("start_date", next.start_date);
    params.set("end_date", next.end_date);
    if (!params.get("timezone")) params.set("timezone", defaults.timezone);
    navigate(
      { pathname: location.pathname, search: `?${params.toString()}` },
      { replace: true }
    );
  }, [searchParams, location.pathname, navigate, defaults.timezone]);

  const setRange = useCallback((next) => {
    const params = new URLSearchParams(searchParams);
    if (next.start_date) params.set("start_date", next.start_date);
    if (next.end_date) params.set("end_date", next.end_date);
    if (next.timezone) params.set("timezone", next.timezone);
    if (next.preset) params.set("preset", next.preset);
    const search = params.toString();
    navigate(
      { pathname: location.pathname, search: search ? `?${search}` : "" },
      { replace: true }
    );
  }, [searchParams, location.pathname, navigate]);

  const setPreset = useCallback((preset) => {
    const next = applyPreset(preset);
    setRange({ ...next, preset });
  }, [setRange]);

  const value = useMemo(() => ({ range, setRange, setPreset }), [range, setRange, setPreset]);

  return (
    <PlatformIntelligenceContext.Provider value={value}>
      {children}
    </PlatformIntelligenceContext.Provider>
  );
}

export function usePlatformIntelligenceRange() {
  const ctx = useContext(PlatformIntelligenceContext);
  if (!ctx) throw new Error("usePlatformIntelligenceRange must be used within PlatformIntelligenceProvider");
  return ctx;
}
