/**
 * ============================================================
 * File: CompareItemsModal.jsx
 * Path: menubloc-frontend/src/components/menu/CompareItemsModal.jsx
 * Date: 2026-04-14
 * Purpose:
 *   Side-by-side decision modal for comparing two menu items.
 *   Opened from the Show Similar list on the menu item detail page.
 *
 *   Props:
 *     open        {boolean}
 *     onClose     {() => void}
 *     comparison  {object|null}  — { ok, baseItem, candidateItem, highlights }
 *     loading     {boolean}
 *     error       {string|null}
 *     onSwap      {(candidateItem) => void}
 *     baseLabel   {string}
 *
 *   Intelligence layer displayed:
 *     - Verdict label (when at least one item has a verdict)
 *     - Indulgence row (dessert/bread items only)
 *     - Insight rows: Protein Strength, Glycemic Impact, Sodium, Lasting Energy
 *       (entrees only — null when item is beverage, dessert, or low confidence)
 *     - Preparation row suppressed for dessert/bread/beverage comparisons
 *
 *   Swap: navigates to candidate detail page (no cart mutation).
 *   TODO: Add Both — requires unified cart/order flow not yet available.
 * ============================================================
 */

import { useEffect } from "react";

// ── Helpers ──────────────────────────────────────────────────

function fmt(value, suffix = "") {
  if (value === null || value === undefined) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n}${suffix}`;
}

function fmtMoney(value) {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function fmtPerOz(value) {
  if (value === null || value === undefined) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `$${n.toFixed(2)}/oz`;
}

function fmtDist(value) {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return `${n} mi`;
}

// Level value ordering for insight row winner computation
const LEVEL_ORDER_ASC  = { Low: 0, Moderate: 1, High: 2, "Very High": 3 };
const LEVEL_ORDER_DESC = { Low: 3, Moderate: 2, High: 1, "Very High": 0 };

// ── Styles ───────────────────────────────────────────────────

const OVERLAY_STYLE = {
  position: "fixed",
  inset: 0,
  zIndex: 9000,
  background: "rgba(14, 22, 18, 0.55)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  padding: "0",
};

const SHEET_STYLE = {
  width: "100%",
  maxWidth: 780,
  maxHeight: "92dvh",
  background: "#f8f7f2",
  borderRadius: "24px 24px 0 0",
  boxShadow: "0 -12px 48px rgba(14,22,18,0.18)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const HEADER_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "18px 20px 14px",
  borderBottom: "1px solid rgba(20,33,27,0.08)",
  flexShrink: 0,
};

const CLOSE_BTN_STYLE = {
  background: "rgba(20,33,27,0.07)",
  border: "none",
  borderRadius: "50%",
  width: 36,
  height: 36,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
  color: "#23352d",
  flexShrink: 0,
};

const SCROLL_AREA_STYLE = {
  overflowY: "auto",
  flex: "1 1 0",
  padding: "16px 20px",
};

const FOOTER_STYLE = {
  display: "flex",
  gap: 10,
  padding: "14px 20px",
  borderTop: "1px solid rgba(20,33,27,0.08)",
  flexShrink: 0,
  background: "#f8f7f2",
};

const BTN_BASE = {
  flex: 1,
  minHeight: 46,
  borderRadius: 999,
  border: "none",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 800,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const INSIGHT_ROW_STYLE = {
  display: "grid",
  gridTemplateColumns: "80px 1fr 1fr",
  gap: 6,
  alignItems: "center",
};

const INSIGHT_LABEL_STYLE = {
  fontSize: 11,
  fontWeight: 800,
  color: "#617167",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
};

// ── Item column header ───────────────────────────────────────

function ItemHeader({ item, label, isCurrent }) {
  const price = fmtMoney(item?.price);
  const dist  = fmtDist(item?.distance_miles);
  return (
    <div
      style={{
        borderRadius: 18,
        padding: "14px 16px",
        background: isCurrent
          ? "linear-gradient(135deg, rgba(17,33,26,0.96), rgba(30,55,42,0.92))"
          : "rgba(255,255,255,0.90)",
        border: isCurrent ? "none" : "1px solid rgba(20,33,27,0.10)",
        color: isCurrent ? "#f0f7f3" : "#14211b",
        minHeight: 110,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 6,
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.65 }}>
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 900, lineHeight: 1.25 }}>
        {item?.name || "—"}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.75, lineHeight: 1.4 }}>
        {item?.restaurant_name || "—"}
        {dist ? <span style={{ marginLeft: 6, fontWeight: 600 }}>· {dist}</span> : null}
      </div>
      {price ? (
        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em", marginTop: 4 }}>
          {price}
        </div>
      ) : null}
    </div>
  );
}

// ── Comparison row ───────────────────────────────────────────

function CompareRow({ label, baseValue, candidateValue, baseWins, candidateWins }) {
  const baseStyle = {
    flex: 1,
    padding: "8px 10px",
    borderRadius: 12,
    background: baseWins ? "rgba(22,105,62,0.09)" : "rgba(20,33,27,0.04)",
    border: baseWins ? "1px solid rgba(22,105,62,0.20)" : "1px solid rgba(20,33,27,0.07)",
    textAlign: "center",
    fontSize: 15,
    fontWeight: 900,
    color: baseWins ? "#166a3e" : "#14211b",
  };
  const candStyle = {
    ...baseStyle,
    background: candidateWins ? "rgba(22,105,62,0.09)" : "rgba(20,33,27,0.04)",
    border: candidateWins ? "1px solid rgba(22,105,62,0.20)" : "1px solid rgba(20,33,27,0.07)",
    color: candidateWins ? "#166a3e" : "#14211b",
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: 6, alignItems: "center" }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: "#617167", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label}
      </div>
      <div style={baseStyle}>{baseValue}</div>
      <div style={candStyle}>{candidateValue}</div>
    </div>
  );
}

// ── Insight level badge ──────────────────────────────────────
// Renders a colored pill for a signal level string.
// higherIsBetter: true → High is green / Low is amber.
//                false → Low is green / High is amber.

function InsightBadge({ level, higherIsBetter }) {
  if (!level) return <span style={{ color: "#8a9e94", fontSize: 13, fontWeight: 700 }}>—</span>;

  const isPositive = higherIsBetter
    ? (level === "High" || level === "Excellent" || level === "Good")
    : (level === "Low");
  const isNegative = higherIsBetter
    ? (level === "Low")
    : (level === "High" || level === "Very High");

  const bg     = isPositive ? "rgba(22,105,62,0.10)"   : isNegative ? "rgba(160,40,0,0.09)" : "rgba(20,33,27,0.06)";
  const color  = isPositive ? "#166a3e"                : isNegative ? "#a02800"              : "#3d5248";
  const border = isPositive ? "1px solid rgba(22,105,62,0.20)" : isNegative ? "1px solid rgba(160,40,0,0.18)" : "1px solid rgba(20,33,27,0.09)";

  return (
    <span style={{ fontSize: 12, fontWeight: 900, borderRadius: 999, padding: "4px 10px", background: bg, color, border, whiteSpace: "nowrap" }}>
      {level}
    </span>
  );
}

// ── Indulgence level pill ────────────────────────────────────

function IndulgencePill({ label }) {
  if (!label || label === "Limited data") {
    return <span style={{ color: "#8a9e94", fontSize: 13, fontWeight: 700 }}>—</span>;
  }
  const isRich = label === "Rich" || label === "Very Rich";
  return (
    <span style={{
      fontSize: 12, fontWeight: 900, borderRadius: 999, padding: "4px 10px",
      background: isRich ? "rgba(160,40,0,0.09)" : "rgba(20,33,27,0.06)",
      color: isRich ? "#a02800" : "#5a695f",
      border: isRich ? "1px solid rgba(160,40,0,0.18)" : "1px solid rgba(20,33,27,0.09)",
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

// ── Highlights chips ─────────────────────────────────────────

function HighlightChips({ highlights, baseLabel, candidateLabel }) {
  if (!highlights?.length) return null;
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.10em", textTransform: "uppercase", color: "#5a695f", marginBottom: 10 }}>
        Why this differs
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {highlights.map((h) => (
          <span
            key={h.key}
            style={{
              fontSize: 12, fontWeight: 800, borderRadius: 999, padding: "5px 12px",
              background: "rgba(20,33,27,0.06)", border: "1px solid rgba(20,33,27,0.10)", color: "#2d4037",
            }}
          >
            {h.winner === "candidate" ? candidateLabel : baseLabel}: {h.summary}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Section divider label ────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div style={{ paddingTop: 6, paddingBottom: 2 }}>
      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a9e94" }}>
        {children}
      </div>
    </div>
  );
}

// ── Loading / error states ───────────────────────────────────

function LoadingPane() {
  return (
    <div style={{ padding: "40px 0", textAlign: "center", color: "#617167", fontSize: 14, fontWeight: 700 }}>
      Loading comparison…
    </div>
  );
}

function ErrorPane({ message }) {
  return (
    <div style={{ padding: "24px 0", textAlign: "center", color: "#a02800", fontSize: 14, fontWeight: 800, lineHeight: 1.5 }}>
      {message || "Could not load comparison. Try again."}
    </div>
  );
}

// ── Main modal ───────────────────────────────────────────────

export default function CompareItemsModal({
  open,
  onClose,
  comparison,
  loading,
  error,
  onSwap,
  baseLabel = "Current",
}) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const base       = comparison?.baseItem      || null;
  const candidate  = comparison?.candidateItem || null;
  const highlights = comparison?.highlights    || [];

  const hlMap = {};
  for (const h of highlights) hlMap[h.key] = h.winner;
  function wins(key, side) { return hlMap[key] === side; }

  const candidateLabel = candidate?.restaurant_name
    ? candidate.restaurant_name.split(" ").slice(0, 2).join(" ")
    : "Compare";

  // Insight winner helpers: compare two level strings using an ordering map
  function insightWinner(baseLevel, candLevel, orderMap) {
    const bv = orderMap[baseLevel] ?? -1;
    const cv = orderMap[candLevel] ?? -1;
    if (bv === cv) return null;
    return bv > cv ? "base" : "candidate";
  }
  function insightWinnerHigh(b, c) { return insightWinner(b, c, LEVEL_ORDER_ASC); }
  function insightWinnerLow(b, c)  { return insightWinner(b, c, LEVEL_ORDER_DESC); }

  // What to show
  const baseVerdictLabel = base?.verdict?.label     || null;
  const candVerdictLabel = candidate?.verdict?.label || null;
  const showVerdictRow   = !!(baseVerdictLabel || candVerdictLabel);

  // Show preparation row only when at least one item has a non-null preparation
  // (route already nulls it out for desserts/bread/beverages)
  const showMethodRow = !!(base?.preparation || candidate?.preparation);

  // Indulgence: show when at least one item has dessert indulgence data
  const showIndulgenceRow = !!(base?.indulgence?.label || candidate?.indulgence?.label);

  // Insights: entree-only section — shown when at least one item has insight data
  const baseIns = base?.insights  || null;
  const candIns = candidate?.insights || null;
  const showInsightsSection = !!(baseIns || candIns);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <div
      style={OVERLAY_STYLE}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Compare items"
    >
      <div style={SHEET_STYLE}>

        {/* ── Header ── */}
        <div style={HEADER_STYLE}>
          <span style={{ fontSize: 17, fontWeight: 900, color: "#14211b", letterSpacing: "-0.02em" }}>
            Compare Items
          </span>
          <button style={CLOSE_BTN_STYLE} onClick={onClose} aria-label="Close compare">×</button>
        </div>

        {/* ── Scroll area ── */}
        <div style={SCROLL_AREA_STYLE}>

          {loading && <LoadingPane />}
          {!loading && error && <ErrorPane message={error} />}

          {!loading && !error && base && candidate && (
            <>
              {/* Item header cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <ItemHeader item={base}      label={baseLabel}      isCurrent />
                <ItemHeader item={candidate} label={candidateLabel} isCurrent={false} />
              </div>

              {/* Verdict row — shown when at least one item has a verdict label */}
              {showVerdictRow && (
                <div style={{ marginTop: 12 }}>
                  <CompareRow
                    label="Verdict"
                    baseValue={baseVerdictLabel || "—"}
                    candidateValue={candVerdictLabel || "—"}
                    baseWins={false}
                    candidateWins={false}
                  />
                </div>
              )}

              {/* Allergen alerts */}
              {(base.allergen_alert || candidate.allergen_alert) && (
                <div style={{ marginTop: showVerdictRow ? 6 : 12 }}>
                  <CompareRow
                    label="Allergens"
                    baseValue={base.allergen_alert || "—"}
                    candidateValue={candidate.allergen_alert || "—"}
                    baseWins={false}
                    candidateWins={false}
                  />
                </div>
              )}

              {/* Comparison rows */}
              <div style={{ marginTop: 12, display: "grid", gap: 7 }}>
                <CompareRow
                  label="Price"
                  baseValue={fmtMoney(base.price) || "—"}
                  candidateValue={fmtMoney(candidate.price) || "—"}
                  baseWins={wins("price", "base")}
                  candidateWins={wins("price", "candidate")}
                />
                <CompareRow
                  label="Portion"
                  baseValue={base.portion_oz != null ? `${base.portion_oz} oz` : "—"}
                  candidateValue={candidate.portion_oz != null ? `${candidate.portion_oz} oz` : "—"}
                  baseWins={wins("portion_oz", "base")}
                  candidateWins={wins("portion_oz", "candidate")}
                />
                <CompareRow
                  label="$/oz"
                  baseValue={fmtPerOz(base.price_per_oz)}
                  candidateValue={fmtPerOz(candidate.price_per_oz)}
                  baseWins={wins("price_per_oz", "base")}
                  candidateWins={wins("price_per_oz", "candidate")}
                />

                {/* Preparation — suppressed for desserts, bread, and beverages */}
                {showMethodRow && (
                  <CompareRow
                    label="Method"
                    baseValue={base.preparation || "—"}
                    candidateValue={candidate.preparation || "—"}
                    baseWins={false}
                    candidateWins={false}
                  />
                )}

                <CompareRow
                  label="Distance"
                  baseValue={fmtDist(base.distance_miles) || "—"}
                  candidateValue={fmtDist(candidate.distance_miles) || "—"}
                  baseWins={wins("distance_miles", "base")}
                  candidateWins={wins("distance_miles", "candidate")}
                />

                {/* Nutrition section */}
                {(base.nutrition || candidate.nutrition) && (
                  <>
                    <SectionLabel>Nutrition</SectionLabel>
                    <CompareRow
                      label="Calories"
                      baseValue={fmt(base.nutrition?.calories)}
                      candidateValue={fmt(candidate.nutrition?.calories)}
                      baseWins={wins("calories", "base")}
                      candidateWins={wins("calories", "candidate")}
                    />
                    <CompareRow
                      label="Protein"
                      baseValue={fmt(base.nutrition?.protein_g, "g")}
                      candidateValue={fmt(candidate.nutrition?.protein_g, "g")}
                      baseWins={wins("protein_g", "base")}
                      candidateWins={wins("protein_g", "candidate")}
                    />
                    <CompareRow
                      label="Carbs"
                      baseValue={fmt(base.nutrition?.carbs_g, "g")}
                      candidateValue={fmt(candidate.nutrition?.carbs_g, "g")}
                      baseWins={false}
                      candidateWins={false}
                    />
                    <CompareRow
                      label="Fat"
                      baseValue={fmt(base.nutrition?.fat_g, "g")}
                      candidateValue={fmt(candidate.nutrition?.fat_g, "g")}
                      baseWins={false}
                      candidateWins={false}
                    />
                    <CompareRow
                      label="Sodium"
                      baseValue={fmt(base.nutrition?.sodium_mg, "mg")}
                      candidateValue={fmt(candidate.nutrition?.sodium_mg, "mg")}
                      baseWins={wins("sodium_mg", "base")}
                      candidateWins={wins("sodium_mg", "candidate")}
                    />

                    {/* Indulgence — desserts and pure bread only */}
                    {showIndulgenceRow && (
                      <div style={INSIGHT_ROW_STYLE}>
                        <div style={INSIGHT_LABEL_STYLE}>Indulgence</div>
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <IndulgencePill label={base.indulgence?.label} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <IndulgencePill label={candidate.indulgence?.label} />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Insights section — entrees only */}
                {showInsightsSection && (
                  <>
                    <SectionLabel>Insights</SectionLabel>

                    {/* Protein Strength: higher is better */}
                    <div style={INSIGHT_ROW_STYLE}>
                      <div style={INSIGHT_LABEL_STYLE}>Protein</div>
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <InsightBadge level={baseIns?.protein_strength} higherIsBetter />
                      </div>
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <InsightBadge level={candIns?.protein_strength} higherIsBetter />
                      </div>
                    </div>

                    {/* Glycemic Impact: lower is better */}
                    <div style={INSIGHT_ROW_STYLE}>
                      <div style={INSIGHT_LABEL_STYLE}>Glycemic</div>
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <InsightBadge level={baseIns?.glycemic_impact} higherIsBetter={false} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <InsightBadge level={candIns?.glycemic_impact} higherIsBetter={false} />
                      </div>
                    </div>

                    {/* Sodium Signal: lower is better */}
                    <div style={INSIGHT_ROW_STYLE}>
                      <div style={INSIGHT_LABEL_STYLE}>Sodium</div>
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <InsightBadge level={baseIns?.sodium_signal} higherIsBetter={false} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <InsightBadge level={candIns?.sodium_signal} higherIsBetter={false} />
                      </div>
                    </div>

                    {/* Lasting Energy: higher is better */}
                    <div style={INSIGHT_ROW_STYLE}>
                      <div style={INSIGHT_LABEL_STYLE}>Energy</div>
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <InsightBadge level={baseIns?.lasting_energy} higherIsBetter />
                      </div>
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <InsightBadge level={candIns?.lasting_energy} higherIsBetter />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Why this differs */}
              <HighlightChips
                highlights={highlights}
                baseLabel={baseLabel}
                candidateLabel={candidateLabel}
              />

              {!base.nutrition && !candidate.nutrition && (
                <div style={{ marginTop: 14, fontSize: 12, color: "#8a9e94", fontWeight: 700, textAlign: "center" }}>
                  Limited nutrition data available
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer actions ── */}
        <div style={FOOTER_STYLE}>
          <button
            style={{ ...BTN_BASE, background: "rgba(20,33,27,0.08)", color: "#23352d" }}
            onClick={onClose}
            disabled={loading}
          >
            Keep Current
          </button>
          <button
            style={{
              ...BTN_BASE,
              background: candidate ? "#11211a" : "rgba(20,33,27,0.15)",
              color: candidate ? "#f0f7f3" : "#8a9e94",
              cursor: candidate && !loading ? "pointer" : "not-allowed",
            }}
            onClick={() => candidate && !loading && onSwap && onSwap(candidate)}
            disabled={!candidate || loading}
          >
            Swap
          </button>
          {/* TODO: Add Both — requires unified cart mutation.
              Wire this button once the OrderCartContext supports multi-restaurant
              item queueing.
              TODO: Flex Pricing — wire flex_price_hint from compare payload when
              Flex Pricing order flow is available. */}
        </div>

      </div>
    </div>
  );
}
