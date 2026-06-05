import React from "react";

function WaiterFaceIcon() {
  return (
    <svg
      viewBox="0 0 40 46"
      width="34"
      height="39"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <circle cx="14" cy="11" r="2.3" fill="#111" />
      <circle cx="26" cy="11" r="2.3" fill="#111" />
      <path d="M 11 18 Q 20 28 29 18" stroke="#111" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M 1 32 L 17 38 L 1 44 Z" fill="#111" />
      <path d="M 39 32 L 23 38 L 39 44 Z" fill="#111" />
      <ellipse cx="20" cy="38" rx="4" ry="5" fill="#111" />
    </svg>
  );
}

export default function WaiterRefinementPrompt({
  displayQuery,
  filteredResultCount = 0,
  refinementOptions = [],
  selectedRefinement = null,
  onSelectRefinement,
}) {
  const visibleOptions = refinementOptions.slice(0, 3);
  const selectedId = selectedRefinement?.id ?? null;

  if (visibleOptions.length < 2) return null;

  // Build the question sentence with inline clickable words.
  // The words themselves ARE the interactive elements — no separate chip row.
  function renderOptionWord(option, index) {
    const isActive = selectedId !== null && option.id === selectedId;
    const isAnySelected = selectedId !== null;

    return (
      <span
        key={option.id}
        role="button"
        tabIndex={0}
        aria-pressed={isActive}
        onClick={isActive ? undefined : () => onSelectRefinement?.(option)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !isActive) {
            e.preventDefault();
            onSelectRefinement?.(option);
          }
        }}
        style={{
          fontWeight: 900,
          fontSize: 15,
          cursor: isActive ? "default" : "pointer",
          color: isActive
            ? "#22C55E"
            : isAnySelected
            ? "rgba(229,231,235,0.45)"
            : "#F9FAFB",
          borderBottom: isActive
            ? "2px solid #22C55E"
            : "2px solid rgba(249,250,251,0.35)",
          paddingBottom: 1,
          transition: "color 0.15s, border-color 0.15s",
          whiteSpace: "nowrap",
          userSelect: "none",
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.color = "#22C55E";
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.color = isAnySelected
              ? "rgba(229,231,235,0.45)"
              : "#F9FAFB";
          }
        }}
      >
        {option.label}
      </span>
    );
  }

  // Renders: Word1 or Word2?   /   Word1, Word2, or Word3?
  function renderQuestion() {
    const [a, b, c] = visibleOptions;
    const plain = { fontWeight: 800, fontSize: 15, color: "#9CA3AF" };

    if (visibleOptions.length === 2) {
      return (
        <span>
          {renderOptionWord(a, 0)}
          <span style={plain}> or </span>
          {renderOptionWord(b, 1)}
          <span style={plain}>?</span>
        </span>
      );
    }

    return (
      <span>
        {renderOptionWord(a, 0)}
        <span style={plain}>, </span>
        {renderOptionWord(b, 1)}
        <span style={plain}>, or </span>
        {renderOptionWord(c, 2)}
        <span style={plain}>?</span>
      </span>
    );
  }

  return (
    <section
      aria-label="Search refinement"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        margin: "2px 0 14px",
      }}
    >
      {/* Bow tie icon */}
      <span
        title={displayQuery ? `Refine ${displayQuery}` : "Refine results"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 48,
          height: 48,
          borderRadius: 999,
          background: "#FFFFFF",
          color: "#0B0F0C",
          flexShrink: 0,
          boxShadow: "0 0 0 1px rgba(255,255,255,0.18), 0 10px 26px rgba(0,0,0,0.28)",
        }}
      >
        <WaiterFaceIcon />
      </span>

      {/* Inline question with clickable option words */}
      <span style={{ lineHeight: 1.4 }}>
        {renderQuestion()}
        {filteredResultCount > 0 && (
          <span
            style={{
              marginLeft: 10,
              fontSize: 11,
              fontWeight: 700,
              color: "#6B7280",
            }}
          >
            {filteredResultCount} {filteredResultCount === 1 ? "result" : "results"}
          </span>
        )}
      </span>
    </section>
  );
}
