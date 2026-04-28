/**
 * ============================================================
 * File: CompareItemsModal.jsx
 * Path: menubloc-frontend/src/components/menu/CompareItemsModal.jsx
 * Date: 2026-04-14
 * Purpose:
 *   Stable centered compare modal for side-by-side menu item comparison.
 *   Fixes collapsed/clipped body rendering by using a simple modal layout:
 *   header + scrollable body + footer.
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

function hasValue(v) {
  return v !== null && v !== undefined && v !== "";
}

function asSafeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function asSafeString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function abbreviateLabel(name, fallback, max = 18) {
  const raw = String(name || fallback || "").trim();
  if (!raw) return fallback || "";
  if (raw.length <= max) return raw;
  return `${raw.slice(0, max - 1).trim()}…`;
}

// ── Styles ───────────────────────────────────────────────────

const OVERLAY_STYLE = {
  position: "fixed",
  inset: 0,
  zIndex: 9000,
  background: "rgba(14, 22, 18, 0.55)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
};

const MODAL_STYLE = {
  width: "min(920px, 100%)",
  maxHeight: "86vh",
  minHeight: "520px",
  background: "#f8f7f2",
  borderRadius: 24,
  boxShadow: "0 20px 60px rgba(14,22,18,0.22)",
  border: "1px solid rgba(20,33,27,0.10)",
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
  background: "#f8f7f2",
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

const BODY_STYLE = {
  flex: "1 1 auto",
  minHeight: 0,
  overflowY: "auto",
  padding: "18px 20px 22px",
  WebkitOverflowScrolling: "touch",
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
  padding: "0 16px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const SECTION_LABEL_STYLE = {
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#8a9e94",
};

const ROW_GRID_STYLE = {
  display: "grid",
  gridTemplateColumns: "96px 1fr 1fr",
  gap: 8,
  alignItems: "center",
};

const ROW_LABEL_STYLE = {
  fontSize: 11,
  fontWeight: 800,
  color: "#617167",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
};

function valueBox(isWinner) {
  return {
    padding: "10px 12px",
    borderRadius: 12,
    background: isWinner ? "rgba(22,105,62,0.09)" : "rgba(20,33,27,0.04)",
    border: isWinner ? "1px solid rgba(22,105,62,0.20)" : "1px solid rgba(20,33,27,0.07)",
    textAlign: "center",
    fontSize: 14,
    fontWeight: 900,
    color: isWinner ? "#166a3e" : "#14211b",
    minHeight: 42,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    wordBreak: "break-word",
  };
}

// ── Small pieces ─────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div style={{ paddingTop: 10, paddingBottom: 4 }}>
      <div style={SECTION_LABEL_STYLE}>{children}</div>
    </div>
  );
}

function CompareRow({ label, baseValue, candidateValue, baseWins = false, candidateWins = false }) {
  return (
    <div style={ROW_GRID_STYLE}>
      <div style={ROW_LABEL_STYLE}>{label}</div>
      <div style={valueBox(baseWins)}>{hasValue(baseValue) ? baseValue : "—"}</div>
      <div style={valueBox(candidateWins)}>{hasValue(candidateValue) ? candidateValue : "—"}</div>
    </div>
  );
}

function ItemHeader({ item, label, emphasized }) {
  const price = fmtMoney(item?.price);
  const dist = fmtDist(item?.distance_miles);

  return (
    <div
      style={{
        borderRadius: 18,
        padding: "14px 16px",
        background: emphasized
          ? "linear-gradient(135deg, rgba(17,33,26,0.96), rgba(30,55,42,0.92))"
          : "rgba(255,255,255,0.92)",
        border: emphasized ? "none" : "1px solid rgba(20,33,27,0.10)",
        color: emphasized ? "#f0f7f3" : "#14211b",
        minHeight: 116,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 6,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          opacity: 0.68,
        }}
      >
        {label}
      </div>

      <div style={{ fontSize: 15, fontWeight: 900, lineHeight: 1.25 }}>
        {item?.name || "—"}
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.78, lineHeight: 1.4 }}>
        {item?.restaurant_name || "—"}
        {dist ? <span style={{ marginLeft: 6, fontWeight: 600 }}>· {dist}</span> : null}
      </div>

      {price ? (
        <div
          style={{
            fontSize: 20,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            marginTop: 4,
          }}
        >
          {price}
        </div>
      ) : null}
    </div>
  );
}

function HighlightChips({ highlights, baseLabel, candidateLabel }) {
  if (!highlights?.length) return null;

  return (
    <div style={{ marginTop: 18 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: "0.10em",
          textTransform: "uppercase",
          color: "#5a695f",
          marginBottom: 10,
        }}
      >
        Why this differs
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {highlights.map((h, idx) => (
          <span
            key={`${h.key || "highlight"}-${idx}`}
            style={{
              fontSize: 12,
              fontWeight: 800,
              borderRadius: 999,
              padding: "5px 12px",
              background: "rgba(20,33,27,0.06)",
              border: "1px solid rgba(20,33,27,0.10)",
              color: "#2d4037",
            }}
          >
            {h.winner === "candidate" ? candidateLabel : baseLabel}: {h.summary}
          </span>
        ))}
      </div>
    </div>
  );
}

function InsightBadge({ level, higherIsBetter }) {
  if (!level) {
    return <span style={{ color: "#8a9e94", fontSize: 13, fontWeight: 700 }}>—</span>;
  }

  const isPositive = higherIsBetter ? level === "High" || level === "Excellent" || level === "Good" : level === "Low";
  const isNegative = higherIsBetter ? level === "Low" : level === "High" || level === "Very High";

  const bg = isPositive
    ? "rgba(22,105,62,0.10)"
    : isNegative
      ? "rgba(160,40,0,0.09)"
      : "rgba(20,33,27,0.06)";

  const color = isPositive ? "#166a3e" : isNegative ? "#a02800" : "#3d5248";

  const border = isPositive
    ? "1px solid rgba(22,105,62,0.20)"
    : isNegative
      ? "1px solid rgba(160,40,0,0.18)"
      : "1px solid rgba(20,33,27,0.09)";

  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 900,
        borderRadius: 999,
        padding: "4px 10px",
        background: bg,
        color,
        border,
        whiteSpace: "nowrap",
      }}
    >
      {level}
    </span>
  );
}

function IndulgencePill({ label }) {
  if (!label || label === "Limited data") {
    return <span style={{ color: "#8a9e94", fontSize: 13, fontWeight: 700 }}>—</span>;
  }

  const isRich = label === "Rich" || label === "Very Rich";

  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 900,
        borderRadius: 999,
        padding: "4px 10px",
        background: isRich ? "rgba(160,40,0,0.09)" : "rgba(20,33,27,0.06)",
        color: isRich ? "#a02800" : "#5a695f",
        border: isRich ? "1px solid rgba(160,40,0,0.18)" : "1px solid rgba(20,33,27,0.09)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function LoadingPane() {
  return (
    <div
      style={{
        padding: "40px 0",
        textAlign: "center",
        color: "#617167",
        fontSize: 14,
        fontWeight: 700,
      }}
    >
      Loading comparison…
    </div>
  );
}

function ErrorPane({ message }) {
  return (
    <div
      style={{
        padding: "24px 0",
        textAlign: "center",
        color: "#a02800",
        fontSize: 14,
        fontWeight: 800,
        lineHeight: 1.5,
      }}
    >
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
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const base = comparison?.baseItem || null;
  const candidate = comparison?.candidateItem || null;
  const highlights = asSafeArray(comparison?.highlights);

  const hlMap = {};
  for (const h of highlights) {
    if (!h?.key) continue;
    hlMap[h.key] = h.winner;
  }

  function wins(key, side) {
    return hlMap[key] === side;
  }

  const candidateRestaurantName = asSafeString(candidate?.restaurant_name);
  const candidateLabel = candidateRestaurantName
    ? candidateRestaurantName.split(" ").slice(0, 2).join(" ")
    : "Compare";

  const baseActionLabel = `View ${abbreviateLabel(base?.name, "Current item")}`;
  const candidateActionLabel = `View ${abbreviateLabel(candidate?.name, "Compared item")}`;

  const baseVerdictLabel = base?.verdict?.label || base?.verdict_label || base?.verdict || null;
  const candVerdictLabel =
    candidate?.verdict?.label || candidate?.verdict_label || candidate?.verdict || null;

  const showVerdictRow = !!(baseVerdictLabel || candVerdictLabel);
  const showMethodRow = !!(base?.preparation || candidate?.preparation);
  const showIndulgenceRow = !!(base?.indulgence?.label || candidate?.indulgence?.label);

  const baseIns = base?.insights || null;
  const candIns = candidate?.insights || null;
  const showInsightsSection = !!(baseIns || candIns);

  const isNarrowViewport =
    typeof window !== "undefined" ? window.innerWidth <= 640 : false;

  return (
    <div
      style={OVERLAY_STYLE}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Compare items"
    >
      <div style={MODAL_STYLE}>
        <div style={HEADER_STYLE}>
          <span
            style={{
              fontSize: 17,
              fontWeight: 900,
              color: "#14211b",
              letterSpacing: "-0.02em",
            }}
          >
            Compare Items
          </span>

          <button style={CLOSE_BTN_STYLE} onClick={onClose} aria-label="Close compare">
            ×
          </button>
        </div>

        <div style={BODY_STYLE}>
          {loading && <LoadingPane />}
          {!loading && error && <ErrorPane message={error} />}

          {!loading && !error && !base && !candidate && (
            <ErrorPane message="Compare data did not load." />
          )}

          {!loading && !error && base && candidate && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isNarrowViewport ? "1fr" : "1fr 1fr",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <ItemHeader item={base} label={baseLabel} emphasized />
                <ItemHeader item={candidate} label={candidateLabel} emphasized={false} />
              </div>

              {showVerdictRow && (
                <div style={{ marginTop: 12 }}>
                  <CompareRow
                    label="Verdict"
                    baseValue={baseVerdictLabel || "—"}
                    candidateValue={candVerdictLabel || "—"}
                  />
                </div>
              )}

              {(base?.allergen_alert || candidate?.allergen_alert) && (
                <div style={{ marginTop: showVerdictRow ? 8 : 12 }}>
                  <CompareRow
                    label="Allergens"
                    baseValue={base?.allergen_alert || "—"}
                    candidateValue={candidate?.allergen_alert || "—"}
                  />
                </div>
              )}

              <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                <CompareRow
                  label="Price"
                  baseValue={fmtMoney(base?.price) || "—"}
                  candidateValue={fmtMoney(candidate?.price) || "—"}
                  baseWins={wins("price", "base")}
                  candidateWins={wins("price", "candidate")}
                />

                <CompareRow
                  label="Portion"
                  baseValue={base?.portion_oz != null ? `${base.portion_oz} oz` : "—"}
                  candidateValue={candidate?.portion_oz != null ? `${candidate.portion_oz} oz` : "—"}
                  baseWins={wins("portion_oz", "base")}
                  candidateWins={wins("portion_oz", "candidate")}
                />

                <CompareRow
                  label="$/oz"
                  baseValue={fmtPerOz(base?.price_per_oz)}
                  candidateValue={fmtPerOz(candidate?.price_per_oz)}
                  baseWins={wins("price_per_oz", "base")}
                  candidateWins={wins("price_per_oz", "candidate")}
                />

                {showMethodRow && (
                  <CompareRow
                    label="Method"
                    baseValue={base?.preparation || "—"}
                    candidateValue={candidate?.preparation || "—"}
                  />
                )}

                <CompareRow
                  label="Distance"
                  baseValue={fmtDist(base?.distance_miles) || "—"}
                  candidateValue={fmtDist(candidate?.distance_miles) || "—"}
                  baseWins={wins("distance_miles", "base")}
                  candidateWins={wins("distance_miles", "candidate")}
                />

                {(base?.nutrition || candidate?.nutrition) && (
                  <>
                    <SectionLabel>Nutrition</SectionLabel>

                    <CompareRow
                      label="Calories"
                      baseValue={fmt(base?.nutrition?.calories)}
                      candidateValue={fmt(candidate?.nutrition?.calories)}
                      baseWins={wins("calories", "base")}
                      candidateWins={wins("calories", "candidate")}
                    />

                    <CompareRow
                      label="Protein"
                      baseValue={fmt(base?.nutrition?.protein_g, "g")}
                      candidateValue={fmt(candidate?.nutrition?.protein_g, "g")}
                      baseWins={wins("protein_g", "base")}
                      candidateWins={wins("protein_g", "candidate")}
                    />

                    <CompareRow
                      label="Carbs"
                      baseValue={fmt(base?.nutrition?.carbs_g, "g")}
                      candidateValue={fmt(candidate?.nutrition?.carbs_g, "g")}
                    />

                    <CompareRow
                      label="Fat"
                      baseValue={fmt(base?.nutrition?.fat_g, "g")}
                      candidateValue={fmt(candidate?.nutrition?.fat_g, "g")}
                    />

                    <CompareRow
                      label="Sodium"
                      baseValue={fmt(base?.nutrition?.sodium_mg, "mg")}
                      candidateValue={fmt(candidate?.nutrition?.sodium_mg, "mg")}
                      baseWins={wins("sodium_mg", "base")}
                      candidateWins={wins("sodium_mg", "candidate")}
                    />

                    {showIndulgenceRow && (
                      <div style={ROW_GRID_STYLE}>
                        <div style={ROW_LABEL_STYLE}>Indulgence</div>
                        <div style={{ ...valueBox(false), background: "rgba(20,33,27,0.02)" }}>
                          <IndulgencePill label={base?.indulgence?.label} />
                        </div>
                        <div style={{ ...valueBox(false), background: "rgba(20,33,27,0.02)" }}>
                          <IndulgencePill label={candidate?.indulgence?.label} />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {showInsightsSection && (
                  <>
                    <SectionLabel>Insights</SectionLabel>

                    <div style={ROW_GRID_STYLE}>
                      <div style={ROW_LABEL_STYLE}>Protein</div>
                      <div style={{ ...valueBox(false), background: "rgba(20,33,27,0.02)" }}>
                        <InsightBadge level={baseIns?.protein_strength} higherIsBetter />
                      </div>
                      <div style={{ ...valueBox(false), background: "rgba(20,33,27,0.02)" }}>
                        <InsightBadge level={candIns?.protein_strength} higherIsBetter />
                      </div>
                    </div>

                    <div style={ROW_GRID_STYLE}>
                      <div style={ROW_LABEL_STYLE}>Glycemic</div>
                      <div style={{ ...valueBox(false), background: "rgba(20,33,27,0.02)" }}>
                        <InsightBadge level={baseIns?.glycemic_impact} higherIsBetter={false} />
                      </div>
                      <div style={{ ...valueBox(false), background: "rgba(20,33,27,0.02)" }}>
                        <InsightBadge level={candIns?.glycemic_impact} higherIsBetter={false} />
                      </div>
                    </div>

                    <div style={ROW_GRID_STYLE}>
                      <div style={ROW_LABEL_STYLE}>Sodium</div>
                      <div style={{ ...valueBox(false), background: "rgba(20,33,27,0.02)" }}>
                        <InsightBadge level={baseIns?.sodium_signal} higherIsBetter={false} />
                      </div>
                      <div style={{ ...valueBox(false), background: "rgba(20,33,27,0.02)" }}>
                        <InsightBadge level={candIns?.sodium_signal} higherIsBetter={false} />
                      </div>
                    </div>

                    <div style={ROW_GRID_STYLE}>
                      <div style={ROW_LABEL_STYLE}>Energy</div>
                      <div style={{ ...valueBox(false), background: "rgba(20,33,27,0.02)" }}>
                        <InsightBadge level={baseIns?.lasting_energy} higherIsBetter />
                      </div>
                      <div style={{ ...valueBox(false), background: "rgba(20,33,27,0.02)" }}>
                        <InsightBadge level={candIns?.lasting_energy} higherIsBetter />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <HighlightChips
                highlights={highlights}
                baseLabel={baseLabel}
                candidateLabel={candidateLabel}
              />

              {!base?.nutrition && !candidate?.nutrition && (
                <div
                  style={{
                    marginTop: 14,
                    fontSize: 12,
                    color: "#8a9e94",
                    fontWeight: 700,
                    textAlign: "center",
                  }}
                >
                  Limited nutrition data available
                </div>
              )}
            </>
          )}
        </div>

        <div style={FOOTER_STYLE}>
          <button
            style={{ ...BTN_BASE, background: "rgba(20,33,27,0.08)", color: "#23352d" }}
            onClick={onClose}
            disabled={loading}
            title={base?.name || "Current item"}
          >
            {baseActionLabel}
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
            title={candidate?.name || "Compared item"}
          >
            {candidateActionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
