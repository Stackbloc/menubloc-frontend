import React from "react";
import WaiterFaceIcon from "../icons/WaiterFaceIcon.jsx";

export default function WaiterRefinementPrompt({
  displayQuery,
  filteredResultCount = 0,
  refinementOptions = [],
  selectedRefinement = null,
  onSelectRefinement,
}) {
  const visibleOptions = refinementOptions.slice(0, 3);
  const selectedId = selectedRefinement?.id ?? null;

  if (visibleOptions.length < 1) return null;

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
            ? "var(--gb-color-accent)"
            : isAnySelected
            ? "var(--gb-color-ink-muted)"
            : "var(--gb-color-ink-strong)",
          borderBottom: isActive
            ? "2px solid var(--gb-color-accent)"
            : "2px solid var(--gb-color-border)",
          paddingBottom: 1,
          transition: "color 0.15s, border-color 0.15s",
          whiteSpace: "nowrap",
          userSelect: "none",
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.color = "var(--gb-color-accent)";
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.color = isAnySelected
              ? "var(--gb-color-ink-muted)"
              : "var(--gb-color-ink-strong)";
          }
        }}
      >
        {option.label}
      </span>
    );
  }

  // Renders: Word1?  /  Word1 or Word2?  /  Word1, Word2, or Word3?
  function renderQuestion() {
    const [a, b, c] = visibleOptions;
    const plain = { fontWeight: 800, fontSize: 15, color: "var(--gb-color-ink-muted)" };

    if (visibleOptions.length === 1) {
      return (
        <span>
          {renderOptionWord(a, 0)}
          <span style={plain}>?</span>
        </span>
      );
    }

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
          background: "var(--gb-color-surface-strong)",
          color: "var(--gb-color-ink-strong)",
          flexShrink: 0,
          overflow: "hidden",
          boxShadow: "0 0 0 1px var(--gb-color-border), 0 10px 26px rgba(15,23,42,0.1)",
        }}
      >
        <WaiterFaceIcon size={48} style={{ filter: "invert(1)" }} />
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
