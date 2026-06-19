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
  selectedRefinement = null,
  onSelectRefinement,
}) {
  const visibleOptions = refinementOptions
    .filter((option) => isValidOptionLabel(option?.label))
    .slice(0, 3);
  const selectedId = selectedRefinement?.id ?? null;

  if (visibleOptions.length < 1) return null;

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
            ? "#9CA3AF"
            : "#0B0F0C",
          transition: "color 0.15s",
          whiteSpace: "nowrap",
          userSelect: "none",
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.color = "var(--gb-color-accent)";
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.color = isAnySelected ? "#9CA3AF" : "#0B0F0C";
          }
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
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, lineHeight: 1.4 }}>
        <span
          aria-hidden="true"
          title={displayQuery ? `Refine ${displayQuery}` : "Refine results"}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          <WaiterFaceIcon size={28} />
        </span>
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
        {selectedId !== null && (
          <button
            type="button"
            aria-label="Clear refinement"
            title="Undo"
            onClick={() => onSelectRefinement?.(null)}
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
