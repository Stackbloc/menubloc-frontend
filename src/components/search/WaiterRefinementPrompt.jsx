import React from "react";

function isValidOptionLabel(label) {
  const text = String(label || "").trim();
  return /[A-Za-z0-9]/.test(text);
}

export default function WaiterRefinementPrompt({
  displayQuery,
  filteredResultCount = 0,
  refinementOptions = [],
  selectedRefinement = null,
  onSelectRefinement,
}) {
  const visibleOptions = refinementOptions
    .filter((option) => isValidOptionLabel(option?.label))
    .slice(0, 3);
  const selectedId = selectedRefinement?.id ?? null;

  if (visibleOptions.length < 1) return null;

  // Build the question sentence with inline clickable words.
  // The words themselves ARE the interactive elements — no separate chip row.
  function renderOptionWord(option) {
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

  // Renders a concise question from existing live-data refinement options.
  function renderQuestion() {
    const [a, b, c] = visibleOptions;
    const plain = { fontWeight: 800, fontSize: 15, color: "var(--gb-color-ink-muted)" };

    if (visibleOptions.length === 1) {
      return (
        <span>
          {renderOptionWord(a)}
          <span style={plain}>?</span>
        </span>
      );
    }

    if (visibleOptions.length === 2) {
      return (
        <span>
          {renderOptionWord(a)}
          <span style={plain}> or </span>
          {renderOptionWord(b)}
          <span style={plain}>?</span>
        </span>
      );
    }

    return (
      <span>
        {renderOptionWord(a)}
        <span style={plain}>, </span>
        {renderOptionWord(b)}
        <span style={plain}>, or </span>
        {renderOptionWord(c)}
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
