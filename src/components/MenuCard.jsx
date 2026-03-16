import React from "react";

function formatPrice(value) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string") return value;

  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return `$${n.toFixed(2)}`;
}

function Chip({ label, value }) {
  const hasValue = Boolean(String(value ?? "").trim());

  return (
    <span
      style={{
        padding: "4px 8px",
        borderRadius: 999,
        border: "1px solid #d7deea",
        fontSize: 12,
        fontWeight: 700,
        color: hasValue ? "#164a9e" : "#73809a",
        background: hasValue ? "#eef4ff" : "#f7f9fc",
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
      style={{
        border: "1px solid #e3e8f2",
        borderRadius: 14,
        background: "#ffffff",
        padding: compact ? 10 : 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <h4 style={{ margin: 0, fontSize: compact ? 15 : 16, lineHeight: 1.2 }}>{name}</h4>
        <div style={{ fontSize: compact ? 14 : 15, fontWeight: 800 }}>{price || "-"}</div>
      </div>

      {notes ? (
        <p style={{ margin: "8px 0 0 0", color: "#44516b", fontSize: 13, lineHeight: 1.35 }}>{notes}</p>
      ) : null}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: notes ? 10 : 8 }}>
        <Chip label="Deals" value={item?.deals} />
        <Chip label="Nutrition" value={item?.nutrition} />
        <Chip label="Pairings" value={item?.pairings} />
      </div>
    </article>
  );
}
