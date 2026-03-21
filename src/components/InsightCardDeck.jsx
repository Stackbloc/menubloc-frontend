/**
 * InsightCardDeck.jsx
 * Path: menubloc-frontend/src/components/InsightCardDeck.jsx
 * Date: 2026-03-17
 *
 * Compact, navigable insight card deck.
 *
 * Real data sources only — two card categories:
 *
 *   1. Phrase cards (contextual/comparative, section-relative)
 *      Source: chips.insights.phrases  → ["High Protein", "Best Value", "Low Calorie"]
 *      Numeric backing: chips.nutrition_chip
 *
 *   2. Score cards (absolute, computed from nutrition macros)
 *      Source: chips.insights.scores   → { protein_strength, glycemic_impact,
 *                                          sodium_risk, lasting_energy }
 *      Each score is { score: number|null, level: "low"|"moderate"|"high"|null }
 *
 *   3. Insight item cards (from v_menu_item_insights_summary when populated)
 *      Source: chips.insights.items    → [{ title, reason/description }]
 *
 * Returns null when no real cards can be built.
 * No fake data. No placeholder text. No invented metrics.
 */

import { useState } from "react";

/* ---- Chip resolver ---- */

function resolveChips(item) {
  return item?.chips || item?.item?.chips || {};
}

function asN(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/* ---- Phrase-card metadata ---- */

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

/* ---- Score-card metadata ---- */
/*
 * Each score key maps to:
 *   label       — display name
 *   accent(lvl) — color function keyed on level ("low"|"moderate"|"high")
 *   bg(lvl)     — semi-transparent card bg
 *   format(s)   — formats the raw score value for display
 *   valueLabel  — unit / short description shown beside the number
 *   subLine(s)  — secondary line (can use level)
 */

// Keyed by lowercase level string. Positive metrics use green for top,
// caution metrics use red for top. "Very High" maps to "very_high".
const LEVEL_COLORS = {
  protein_strength: {
    low:       { accent: "#9ca3af", bg: "rgba(156,163,175,0.1)" },
    moderate:  { accent: "#6d28d9", bg: "rgba(109,40,217,0.1)"  },
    good:      { accent: "#1d6fc2", bg: "rgba(29,111,194,0.1)"  },
    excellent: { accent: "#1a9a4a", bg: "rgba(26,154,74,0.1)"   },
  },
  protein_quality: {
    poor:      { accent: "#9ca3af", bg: "rgba(156,163,175,0.1)" },
    low:       { accent: "#e07b39", bg: "rgba(224,123,57,0.1)"  },
    moderate:  { accent: "#6d28d9", bg: "rgba(109,40,217,0.1)"  },
    good:      { accent: "#1d6fc2", bg: "rgba(29,111,194,0.1)"  },
    excellent: { accent: "#1a9a4a", bg: "rgba(26,154,74,0.1)"   },
  },
  glycemic_impact: {
    low:       { accent: "#0e8a7a", bg: "rgba(14,138,122,0.1)"  },
    moderate:  { accent: "#b87a00", bg: "rgba(184,122,0,0.1)"   },
    high:      { accent: "#c0392b", bg: "rgba(192,57,43,0.1)"   },
    very_high: { accent: "#7f1d1d", bg: "rgba(127,29,29,0.1)"   },
  },
  sodium_risk: {
    low:       { accent: "#0e8a7a", bg: "rgba(14,138,122,0.1)"  },
    moderate:  { accent: "#b87a00", bg: "rgba(184,122,0,0.1)"   },
    high:      { accent: "#c0392b", bg: "rgba(192,57,43,0.1)"   },
    very_high: { accent: "#7f1d1d", bg: "rgba(127,29,29,0.1)"   },
  },
  lasting_energy: {
    low:       { accent: "#9ca3af", bg: "rgba(156,163,175,0.1)" },
    moderate:  { accent: "#6d28d9", bg: "rgba(109,40,217,0.1)"  },
    good:      { accent: "#1d6fc2", bg: "rgba(29,111,194,0.1)"  },
    excellent: { accent: "#1a9a4a", bg: "rgba(26,154,74,0.1)"   },
  },
};

const SCORE_META = {
  protein_strength: { label: "High Protein",       positive: true  },
  protein_quality:  { label: "Protein Quality",    positive: true  },
  glycemic_impact:  { label: "Blood Sugar Impact", positive: false, levelOverrides: { "high": "High Spike", "very high": "Very High Spike" } },
  sodium_risk:      { label: "Sodium Load",         positive: false },
  lasting_energy:   { label: "Lasting Energy",     positive: true  },
};

function formatLevel(positive, level, levelOverrides) {
  if (!level) return level;
  const key = level.toLowerCase();
  const raw = levelOverrides?.[key] ?? level;
  if (positive) {
    if (key === "excellent" || key === "good" || key === "high") return `${raw} ✅`;
    if (key === "low") return `${raw} ⚠️`;
  } else {
    if (key === "very high" || key === "high") return `${raw} ⚠️`;
    if (key === "low") return `${raw} ✅`;
  }
  return raw;
}

function buildTradeoffSummary(cards) {
  const clean = (l) => (l || "").replace(/[✅⚠️]/g, "").trim().toLowerCase();
  const scorecards = cards.filter((c) => c.id?.startsWith("score-"));
  const goods = scorecards
    .filter((c) => {
      const meta = SCORE_META[c.id.replace("score-", "")];
      const lv = clean(c.levelLine?.split("(")[0] || "");
      return meta?.positive && ["excellent", "good", "high"].includes(lv.trimEnd());
    })
    .map((c) => SCORE_META[c.id.replace("score-", "")]?.label?.toLowerCase() || "");
  const bads = scorecards
    .filter((c) => {
      const meta = SCORE_META[c.id.replace("score-", "")];
      const lv = clean(c.levelLine?.split("(")[0] || "");
      return !meta?.positive && ["high", "very high", "high spike", "very high spike"].some((k) => lv.trimEnd().startsWith(k));
    })
    .map((c) => SCORE_META[c.id.replace("score-", "")]?.label?.toLowerCase() || "");
  if (!goods.length && !bads.length) return null;
  if (goods.length && bads.length)
    return `⚖️ Strong on ${goods.join(" & ")} — watch ${bads.join(" & ")}`;
  if (goods.length) return `✅ Strong on ${goods.join(" & ")}`;
  return `⚠️ Watch: high ${bads.join(" & ")}`;
}

// Ordered as the user wants to see them
const SCORE_ORDER = ["protein_strength", "protein_quality", "glycemic_impact", "sodium_risk", "lasting_energy"];

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

  // 2. Score cards — 1–10 scores with level label and short explanation
  const scores = insights.scores || {};
  for (const key of SCORE_ORDER) {
    const s = scores[key];
    if (!s || s.score === null || !Number.isFinite(s.score)) continue;

    const meta = SCORE_META[key];
    // Normalize human-readable level to color map key (e.g. "Very High" → "very_high")
    const levelKey = s.level ? s.level.toLowerCase().replace(/\s+/g, "_") : null;
    const levelColors = (LEVEL_COLORS[key] || {})[levelKey] || FALLBACK_META;

    const dirLevel = formatLevel(meta.positive, s.level, meta.levelOverrides);
    cards.push({
      id: `score-${key}`,
      headline: meta.label,
      accent: levelColors.accent,
      bg: levelColors.bg,
      levelLine: `${dirLevel} (${s.score}/10)`,
      explanation: s.explanation || null,
    });
  }

  // 3. Insight item cards — only when they carry a real title AND descriptive text
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

  const summary = buildTradeoffSummary(cards);

  return (
    <div>
      {summary && (
        <div style={{ fontSize: 12, color: C.subtext, marginBottom: 8, fontStyle: "italic" }}>
          {summary}
        </div>
      )}
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
            marginBottom: card.stats || card.desc || card.detail || card.levelLine ? 5 : 0,
          }}
        >
          {card.headline}
        </div>

        {/* Score card: level + score + explanation */}
        {card.levelLine && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>
              {card.levelLine}
            </div>
            {card.explanation && (
              <div style={{ fontSize: 12, color: C.subtext, marginTop: 4, lineHeight: 1.4 }}>
                {"\u2192"} {card.explanation}
              </div>
            )}
          </>
        )}

        {/* Phrase card stats (numeric backing) */}
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
        {!card.stats && !card.levelLine && card.desc && (
          <div style={{ fontSize: 12.5, color: C.subtext, lineHeight: 1.4 }}>
            {card.desc}
          </div>
        )}

        {/* Detail text (insight item cards) */}
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
