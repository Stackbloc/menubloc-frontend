/* ============================================================
   Grubbid Canonical Design System Lock
   Shared public-facing card styling must inherit from the Grubbid
   design system. Do not introduce local typography or surface
   overrides here without explicit approval from Andre.
   ============================================================ */

import React from "react";

function formatPrice(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed === "$0" || trimmed === "$0.00" || trimmed === "0" || trimmed === "0.00") return null;
    return trimmed;
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return `$${numeric.toFixed(2)}`;
}

function Chip({ label, value }) {
  const hasValue = Boolean(String(value ?? "").trim());

  return (
    <span
      style={{
        padding: "4px 8px",
        borderRadius: "var(--gb-radius-pill)",
        border: "1px solid var(--gb-color-border)",
        fontSize: "12px",
        fontWeight: 700,
        color: hasValue ? "var(--gb-color-accent)" : "var(--gb-color-ink-muted)",
        background: hasValue ? "var(--gb-color-accent-soft)" : "var(--gb-color-surface-muted)",
        whiteSpace: "nowrap",
      }}
    >
      {hasValue ? `${label}: ${value}` : label}
    </span>
  );
}

export default function MenuCard({ item, compact = false }) {
  const name = item?.name || item?.title || "Untitled Item";
  const price = formatPrice(item?.price);
  const notes = String(item?.notes || item?.description || "").trim();

  return (
    <article
      className="gb-card"
      style={{
        padding: compact ? 12 : 16,
        borderRadius: "var(--gb-radius-card-tight)",
        boxShadow: "var(--gb-shadow-soft)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <h4
          style={{
            margin: 0,
            color: "var(--gb-color-ink-strong)",
            fontSize: compact ? 15 : 16,
            lineHeight: 1.2,
            fontWeight: 800,
          }}
        >
          {name}
        </h4>
        {price ? (
          <div
            style={{
              color: "var(--gb-color-ink-strong)",
              fontSize: compact ? 14 : 15,
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            {price}
          </div>
        ) : null}
      </div>

      {notes ? (
        <p
          style={{
            margin: "8px 0 0",
            color: "var(--gb-color-ink-soft)",
            fontSize: 13,
            lineHeight: 1.45,
          }}
        >
          {notes}
        </p>
      ) : null}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: notes ? 10 : 8 }}>
        <Chip label="Deals" value={item?.deals} />
        <Chip label="Nutrition" value={item?.nutrition} />
        <Chip label="Pairings" value={item?.pairings} />
      </div>
    </article>
  );
}
