/**
 * Permanent Menuply restaurant display ID (MPL-R-XXXXXXXX).
 * Canonical DB identity remains restaurants.id (BIGINT) — this is display-only.
 */

import React, { useState } from "react";

const FONT = '"Instrument Sans", "Avenir Next", system-ui, sans-serif';

export default function MenuplyRestaurantIdBadge({
  menuplyPublicId,
  compact = false,
  style = null,
}) {
  const [copied, setCopied] = useState(false);
  const code = String(menuplyPublicId || "").trim();
  if (!code) return null;

  async function handleCopy() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const el = document.createElement("textarea");
        el.value = code;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  if (compact) {
    return (
      <div
        data-testid="menuply-restaurant-id-badge"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontFamily: FONT,
          ...style,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Menuply ID</span>
        <code
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.04em",
            color: "#0f172a",
            background: "#f1f5f9",
            borderRadius: 6,
            padding: "2px 8px",
          }}
        >
          {code}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          data-testid="menuply-restaurant-id-copy"
          style={{
            border: "1px solid #cbd5e1",
            background: "#fff",
            borderRadius: 6,
            padding: "2px 8px",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            color: "#334155",
            fontFamily: FONT,
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid="menuply-restaurant-id-badge"
      style={{
        border: "1px solid #dbe4ee",
        background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
        borderRadius: 12,
        padding: "12px 14px",
        fontFamily: FONT,
        ...style,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "#64748b",
          marginBottom: 6,
        }}
      >
        Your Menuply ID
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <code
          style={{
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: "0.06em",
            color: "#0f172a",
          }}
        >
          {code}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          data-testid="menuply-restaurant-id-copy"
          style={{
            border: "1px solid #94a3b8",
            background: "#fff",
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            color: "#0f172a",
            fontFamily: FONT,
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p
        style={{
          margin: "8px 0 0",
          fontSize: 12,
          lineHeight: 1.45,
          color: "#64748b",
        }}
      >
        Your permanent identity on Menuply. Use it when connecting your restaurant with
        distributors, partners, or other business services.
      </p>
    </div>
  );
}
