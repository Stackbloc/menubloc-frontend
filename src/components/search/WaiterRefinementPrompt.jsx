import React from "react";
import WaiterQuestionIcon from "../icons/WaiterQuestionIcon.jsx";

function formatPrompt(options) {
  const optionType = options[0]?.type || "";
  if (optionType === "commerce") {
    const commerceTypes = new Set(options.map((option) => option.commerceType).filter(Boolean));
    if (commerceTypes.size !== 1) return "";

    const commerceType = Array.from(commerceTypes)[0];
    if (commerceType === "price") return "Does price matter?";
    if (commerceType === "deal") return "Looking for a deal?";
    if (commerceType === "distance") return "Nearby only?";
    return "";
  }

  const labels = options
    .slice(0, 3)
    .map((option) => String(option.label || "").trim())
    .filter(Boolean);

  if (labels.length === 2) {
    return `${labels[0]} or ${labels[1].toLowerCase()}?`;
  }

  if (labels.length === 3) {
    return `${labels[0]}, ${labels[1].toLowerCase()}, or ${labels[2].toLowerCase()}?`;
  }

  return "Refine?";
}

export default function WaiterRefinementPrompt({
  displayQuery,
  filteredResultCount = 0,
  refinementOptions = [],
  selectedRefinement = null,
  onSelectRefinement,
}) {
  const visibleOptions = refinementOptions.slice(0, 3);

  if (selectedRefinement || visibleOptions.length < 2) return null;

  const prompt = formatPrompt(visibleOptions);

  if (!prompt) return null;

  return (
    <section
      aria-label="Search refinement"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        margin: "2px 0 12px",
        color: "#F9FAFB",
      }}
    >
      <span
        title={displayQuery ? `Refine ${displayQuery}` : "Refine results"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 20,
          height: 20,
          borderRadius: 999,
          background: "#FFFFFF",
          color: "#0B0F0C",
          flexShrink: 0,
        }}
      >
        <WaiterQuestionIcon size={16} />
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 800,
          lineHeight: 1.25,
          color: "#E5E7EB",
        }}
      >
        {prompt}
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          lineHeight: 1,
          color: "#9CA3AF",
        }}
      >
        {filteredResultCount} {filteredResultCount === 1 ? "result" : "results"}
      </span>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {visibleOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            title={option.predicateDescription}
            onClick={() => onSelectRefinement?.(option)}
            style={{
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.05)",
              color: "#F9FAFB",
              borderRadius: 999,
              padding: "5px 8px",
              minHeight: 28,
              fontSize: 12,
              fontWeight: 800,
              lineHeight: 1,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}
