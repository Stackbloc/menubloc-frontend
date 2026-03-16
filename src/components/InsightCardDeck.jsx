/**
 * InsightCardDeck.jsx
 * Path: menubloc-frontend/src/components/InsightCardDeck.jsx
 *
 * Compact, navigable insight card deck.
 *
 * Real data sources only:
 *   chips.insights.phrases  — contextual labels computed by the backend
 *                             (High Protein, Best Value, Low Calorie)
 *   chips.insights.items    — raw insight records from v_menu_item_insights_summary
 *                             (only surfaced when they carry a title + descriptive text)
 *   chips.nutrition_chip    — numeric context backing phrase cards
 *
 * Returns null when no real cards can be built.
 * No fake data. No placeholder text. No invented metrics.
 *
 * Works on:
 *   - Restaurant Menu Page  (receives colors prop from parent)
 *   - Search Results Page   (omit colors; falls back to CSS variables)
 */

import { useState } from "react";

/* ---- Chip resolver (handles top-level or nested item shape) ---- */

function resolveChips(item) {
  return item?.chips || item?.item?.chips || {};
}

function asN(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/* ---- Phrase-card metadata ---- */
/*
 * Each known phrase maps to:
 *   accent     — colored stripe + headline tint
 *   bg         — semi-transparent card face (works in dark + light)
 *   statsFrom  — derives numeric stat from nutrition_chip (or null)
 *   fallback   — shown when no numeric backing exists
 */
const PHRASE_META = {
  "High Protein": {
    accent: "#1a9a4a",
    bg: "rgba(26,154,74,0.1)",
    statsFrom(nut) {
      const p = asN(nut.protein_g);
      if (p === null) return null;
      const pct = asN(nut.protein_pct_daily);
      return {
        value: `${Math.round(p)}g`,
        label: "protein per serving",
        sub: pct !== null ? `${Math.round(pct)}% daily value` : null,
      };
    },
    fallback: "Above-average protein content for this section.",
  },
  "Low Calorie": {
    accent: "#0e8a7a",
    bg: "rgba(14,138,122,0.1)",
    statsFrom(nut) {
      const c = asN(nut.calories_kcal);
      if (c === null) return null;
      const pctW = asN(nut.calories_pct_women);
      return {
        value: `${Math.round(c)}`,
        label: "calories per serving",
        sub: pctW !== null ? `${Math.round(pctW)}% of a 2,000 cal diet` : null,
      };
    },
    fallback: "Fewer calories than the section average.",
  },
  "Best Value": {
    accent: "#b87a00",
    bg: "rgba(184,122,0,0.1)",
    statsFrom: () => null,
    fallback: "Highest protein-per-dollar ratio in this section.",
  },
};

const FALLBACK_META = { accent: "#4e6a8f", bg: "rgba(78,106,143,0.1)" };

/* ---- Card builder ---- */

export function buildInsightCards(item) {
  const chips = resolveChips(item);
  const insights = chips?.insights || {};
  const nutChip = chips?.nutrition_chip || {};
  const cards = [];

  // 1. Phrase-based cards — contextual, section-relative intelligence
  const phrases = Array.isArray(insights.phrases)
    ? insights.phrases.map((p) => String(p || "").trim()).filter(Boolean)
    : [];

  for (const phrase of phrases) {
    const meta = PHRASE_META[phrase] || { ...FALLBACK_META, statsFrom: () => null, fallback: null };
    const stats = meta.statsFrom ? meta.statsFrom(nutChip) : null;
    cards.push({
      id: phrase,
      headline: phrase,
      accent: meta.accent,
      bg: meta.bg,
      stats,
      desc: stats ? null : meta.fallback,
    });
  }

  // 2. Insight item cards — only when they carry a real title AND descriptive text
  const items = Array.isArray(insights.items) ? insights.items.filter(Boolean) : [];
  for (const it of items) {
    const title = String(it?.title || it?.label || "").trim();
    const detail = String(it?.reason || it?.description || it?.summary || "").trim();
    if (!title || !detail) continue;
    if (cards.some((c) => c.headline.toLowerCase() === title.toLowerCase())) continue;
    cards.push({
      id: `item-${title}`,
      headline: title,
      accent: FALLBACK_META.accent,
      bg: FALLBACK_META.bg,
      detail,
    });
  }

  return cards;
}

/* ---- Default colors — CSS variables (light-mode safe, search results) ---- */

const CSS_COLORS = {
  text:    "var(--ink, #0f1720)",
  subtext: "var(--muted, #5b6675)",
  border:  "var(--border, #e4e9f0)",
  panel2:  "var(--surface-1, #f4f7fb)",
  chipBg:  "var(--surface-2, #f8fafc)",
};

/* ---- Component ---- */

export default function InsightCardDeck({ item, colors }) {
  const [idx, setIdx] = useState(0);

  const cards = buildInsightCards(item);
  if (!cards.length) return null;

  const C = colors || CSS_COLORS;
  const safeIdx = Math.min(idx, cards.length - 1);
  const card = cards[safeIdx];
  const hasNav = cards.length > 1;

  return (
    <div>
      {/* Card face */}
      <div
        style={{
          background: card.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 11,
          padding: "10px 14px 10px 18px",
          position: "relative",
          minHeight: 52,
        }}
      >
        {/* Left accent stripe */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 8,
            bottom: 8,
            width: 3,
            borderRadius: "0 2px 2px 0",
            background: card.accent,
          }}
        />

        {/* Headline */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            color: card.accent,
            marginBottom: card.stats || card.desc || card.detail ? 5 : 0,
          }}
        >
          {card.headline}
        </div>

        {/* Numeric stat (phrase cards with real backing) */}
        {card.stats && (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: C.text, lineHeight: 1 }}>
                {card.stats.value}
              </span>
              {card.stats.label && (
                <span style={{ fontSize: 12, color: C.subtext, fontWeight: 600 }}>
                  {card.stats.label}
                </span>
              )}
            </div>
            {card.stats.sub && (
              <div style={{ fontSize: 11.5, color: C.subtext, marginTop: 3 }}>
                {card.stats.sub}
              </div>
            )}
          </>
        )}

        {/* Fallback description (phrase without numeric backing) */}
        {!card.stats && card.desc && (
          <div style={{ fontSize: 12.5, color: C.subtext, lineHeight: 1.4 }}>
            {card.desc}
          </div>
        )}

        {/* Detail text (insight item cards with real description) */}
        {card.detail && (
          <div style={{ fontSize: 12.5, color: C.subtext, lineHeight: 1.4 }}>
            {card.detail}
          </div>
        )}
      </div>

      {/* Navigation — only when 2+ cards */}
      {hasNav && (
        <div
          style={{
            marginTop: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            onClick={() => setIdx((i) => (i - 1 + cards.length) % cards.length)}
            aria-label="Previous insight"
            style={{
              background: "none",
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              color: C.subtext,
              padding: "2px 10px",
              cursor: "pointer",
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            ‹
          </button>

          {/* Dot indicators */}
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {cards.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Insight ${i + 1} of ${cards.length}`}
                style={{
                  width: i === safeIdx ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === safeIdx ? card.accent : C.border,
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  transition: "width 0.15s ease, background 0.15s ease",
                }}
              />
            ))}
          </div>

          <button
            onClick={() => setIdx((i) => (i + 1) % cards.length)}
            aria-label="Next insight"
            style={{
              background: "none",
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              color: C.subtext,
              padding: "2px 10px",
              cursor: "pointer",
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
