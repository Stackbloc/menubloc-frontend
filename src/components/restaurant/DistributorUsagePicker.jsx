/**
 * Optional searchable multi-select for top foodservice distributors (max 3).
 * Usage only — does not grant contact/outreach permission.
 */

import React, { useEffect, useMemo, useState } from "react";
import { listFoodserviceDistributors } from "../../lib/operatorApi.js";

const FONT = '"Instrument Sans", "Avenir Next", system-ui, sans-serif';
const MAX = 3;

function matchesQuery(distributor, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  const hay = [
    distributor.display_name,
    distributor.slug,
    ...(Array.isArray(distributor.search_aliases) ? distributor.search_aliases : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export default function DistributorUsagePicker({
  selectedIds = [],
  onChange,
  disabled = false,
}) {
  const [catalog, setCatalog] = useState([]);
  const [query, setQuery] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    listFoodserviceDistributors()
      .then((data) => {
        if (cancelled) return;
        setCatalog(Array.isArray(data?.distributors) ? data.distributors : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err?.message || "Unable to load distributors.");
        setCatalog([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = useMemo(() => {
    const set = new Set((selectedIds || []).map(String));
    return catalog.filter((d) => set.has(String(d.id)));
  }, [catalog, selectedIds]);

  const options = useMemo(() => {
    const selectedSet = new Set((selectedIds || []).map(String));
    return catalog
      .filter((d) => matchesQuery(d, query))
      .filter((d) => !selectedSet.has(String(d.id)) || selectedSet.size < MAX);
  }, [catalog, query, selectedIds]);

  function toggle(id) {
    if (disabled) return;
    const sid = String(id);
    const current = (selectedIds || []).map(String);
    if (current.includes(sid)) {
      onChange(current.filter((x) => x !== sid));
      return;
    }
    if (current.length >= MAX) return;
    onChange([...current, sid]);
  }

  return (
    <div data-testid="distributor-usage-picker" style={{ fontFamily: FONT }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: "#374151",
          marginBottom: 6,
        }}
      >
        Who are the top 3 food distributors you currently use?{" "}
        <span style={{ fontWeight: 600, color: "#6b7280" }}>(optional)</span>
      </div>
      <p style={{ margin: "0 0 10px", fontSize: 13, color: "#6b7280", lineHeight: 1.45 }}>
        Select up to three. This records who you use today — it does not give permission for
        distributor outreach.
      </p>

      {selected.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          {selected.map((d) => (
            <button
              key={d.id}
              type="button"
              disabled={disabled}
              onClick={() => toggle(d.id)}
              data-testid={`distributor-selected-${d.slug}`}
              style={{
                border: "1px solid #bbf7d0",
                background: "#f0fdf4",
                color: "#166534",
                borderRadius: 999,
                padding: "6px 10px",
                fontSize: 12,
                fontWeight: 700,
                cursor: disabled ? "not-allowed" : "pointer",
                fontFamily: FONT,
              }}
            >
              {d.display_name} ×
            </button>
          ))}
        </div>
      ) : null}

      <input
        type="search"
        value={query}
        disabled={disabled || selected.length >= MAX}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={
          selected.length >= MAX
            ? "Maximum of 3 selected"
            : "Search distributors (Sysco, US Foods, Costco…)"
        }
        data-testid="distributor-search"
        style={{
          width: "100%",
          height: 42,
          padding: "0 12px",
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          outline: "none",
          fontSize: 14,
          fontFamily: FONT,
          boxSizing: "border-box",
          marginBottom: 8,
        }}
      />

      {loadError ? (
        <div style={{ fontSize: 12, color: "#b45309" }}>{loadError}</div>
      ) : (
        <div
          style={{
            maxHeight: 180,
            overflowY: "auto",
            border: "1px solid #e8e4de",
            borderRadius: 12,
            background: "#fff",
          }}
        >
          {options.length === 0 ? (
            <div style={{ padding: 12, fontSize: 13, color: "#6b7280" }}>No matches</div>
          ) : (
            options.map((d) => {
              const isSelected = (selectedIds || []).map(String).includes(String(d.id));
              const atCap = !isSelected && selected.length >= MAX;
              return (
                <button
                  key={d.id}
                  type="button"
                  disabled={disabled || atCap}
                  onClick={() => toggle(d.id)}
                  data-testid={`distributor-option-${d.slug}`}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    borderBottom: "1px solid #f3f0ea",
                    background: isSelected ? "#f0fdf4" : "#fff",
                    padding: "10px 12px",
                    cursor: disabled || atCap ? "not-allowed" : "pointer",
                    fontFamily: FONT,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                    {d.display_name}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
