import React, { createContext, useContext, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

const PlatformIntelligenceContext = createContext(null);

function buildDefaultRange() {
  const today = new Date();
  const prior = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
  return {
    start_date: prior.toISOString().slice(0, 10),
    end_date: today.toISOString().slice(0, 10),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  };
}

function applyPreset(preset) {
  const today = new Date();
  const end = today.toISOString().slice(0, 10);
  const dayMs = 24 * 60 * 60 * 1000;

  if (preset === "today") {
    return { start_date: end, end_date: end };
  }
  if (preset === "yesterday") {
    const y = new Date(today.getTime() - dayMs).toISOString().slice(0, 10);
    return { start_date: y, end_date: y };
  }
  if (preset === "7d") {
    const start = new Date(today.getTime() - 6 * dayMs).toISOString().slice(0, 10);
    return { start_date: start, end_date: end };
  }
  const start = new Date(today.getTime() - 29 * dayMs).toISOString().slice(0, 10);
  return { start_date: start, end_date: end };
}

export function PlatformIntelligenceProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaults = useMemo(() => buildDefaultRange(), []);

  const range = useMemo(() => ({
    start_date: searchParams.get("start_date") || defaults.start_date,
    end_date: searchParams.get("end_date") || defaults.end_date,
    timezone: searchParams.get("timezone") || defaults.timezone,
    preset: searchParams.get("preset") || "30d",
  }), [searchParams, defaults]);

  const setRange = (next) => {
    const params = new URLSearchParams(searchParams);
    if (next.start_date) params.set("start_date", next.start_date);
    if (next.end_date) params.set("end_date", next.end_date);
    if (next.timezone) params.set("timezone", next.timezone);
    if (next.preset) params.set("preset", next.preset);
    setSearchParams(params, { replace: true });
  };

  const setPreset = (preset) => {
    const next = applyPreset(preset);
    setRange({ ...next, preset });
  };

  const value = useMemo(() => ({ range, setRange, setPreset }), [range]);

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
