import React from "react";
import WaiterFaceIcon from "../icons/WaiterFaceIcon.jsx";

function isValidOptionLabel(label) {
  const text = String(label || "").trim();
  return /[A-Za-z0-9]/.test(text);
}

function UndoIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7v6h6" />
      <path d="M3 13C4.5 8.5 8.5 5 13 5a9 9 0 0 1 9 9 9 9 0 0 1-9 9c-3.5 0-6.5-1.5-8.5-4" />
    </svg>
  );
}

export default function WaiterRefinementPrompt({
  displayQuery,
  filteredResultCount = 0,
  refinementOptions = [],
  refinementStackLength = 0,
  onSelectRefinement,
  onUndo,
}) {
  const visibleOptions = refinementOptions
    .filter((option) => isValidOptionLabel(option?.label))
    .slice(0, 3);
  const hasQuestion = visibleOptions.length >= 1;
  const hasActiveRefinement = refinementStackLength > 0;

  if (!hasQuestion && !hasActiveRefinement) return null;

  const resultLabel =
    filteredResultCount === 1 ? "1 result" : `${filteredResultCount} results`;

  function renderOptionWord(option) {
    return (
      <span
        key={option.id}
        role="button"
        tabIndex={0}
        onClick={() => onSelectRefinement?.(option)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectRefinement?.(option);
          }
        }}
        style={{
          fontWeight: 900,
          fontSize: 15,
          cursor: "pointer",
          color: "#0B0F0C",
          transition: "color 0.15s",
          whiteSpace: "nowrap",
          userSelect: "none",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--gb-color-accent)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#0B0F0C";
        }}
      >
        {option.label}
      </span>
    );
  }

  function renderQuestion() {
    const [a, b, c] = visibleOptions;
    const plain = { fontWeight: 800, fontSize: 15, color: "#6B7280" };

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
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, lineHeight: 1.4, flexWrap: "wrap" }}>
        <span
          aria-hidden="true"
          title={displayQuery ? `Refine ${displayQuery}` : "Refine results"}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          <WaiterFaceIcon size={28} />
        </span>
        {filteredResultCount > 0 && (
          <span
            aria-live="polite"
            style={{ fontWeight: 800, fontSize: 14, color: "#6B7280", whiteSpace: "nowrap" }}
          >
            {resultLabel}
            <span aria-hidden="true"> · </span>
          </span>
        )}
        {hasQuestion && renderQuestion()}
        {refinementStackLength > 0 && (
          <button
            type="button"
            aria-label="Undo last refinement"
            title="Undo"
            onClick={() => onUndo?.()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              padding: "2px 4px",
              cursor: "pointer",
              color: "#9CA3AF",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#0B0F0C"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#9CA3AF"; }}
          >
            <UndoIcon />
          </button>
        )}
      </span>
    </section>
  );
}
