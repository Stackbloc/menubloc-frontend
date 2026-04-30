import React from "react";

export default function WaiterRefinementPrompt({
  displayQuery,
  filteredResultCount = 0,
  refinementOptions = [],
  selectedRefinements = [],
  onSelectRefinement,
  onRemoveRefinement,
  onClearRefinements,
}) {
  return (
    <section
      style={{
        margin: "0 0 14px",
        padding: "14px 16px",
        borderRadius: 18,
        background: "#fff",
        color: "#101828",
        border: "1px solid rgba(16,24,40,0.08)",
        boxShadow: "0 8px 24px rgba(16,24,40,0.06)",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 800, color: "#475467" }}>
        Search term: {displayQuery || "Search"}; {filteredResultCount} {filteredResultCount === 1 ? "result" : "results"}
      </div>
      {selectedRefinements.length > 0 ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          {selectedRefinements.map((refinement, index) => (
            <button
              key={`${refinement.type}:${refinement.key}:${index}`}
              type="button"
              onClick={() => onRemoveRefinement?.(index)}
              style={{
                border: "1px solid rgba(16,24,40,0.12)",
                background: "rgba(16,24,40,0.04)",
                color: "#101828",
                borderRadius: 999,
                padding: "6px 10px",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {refinement.label} ×
            </button>
          ))}
          <button
            type="button"
            onClick={() => onClearRefinements?.()}
            style={{
              border: "none",
              background: "transparent",
              color: "#475467",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              padding: "6px 0",
            }}
          >
            Clear all
          </button>
        </div>
      ) : null}
      {refinementOptions.length > 0 ? (
        <>
          <div style={{ marginTop: 12, fontSize: 14, fontWeight: 800 }}>
            Are you looking for:
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            {refinementOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                title={option.predicateDescription}
                onClick={() => onSelectRefinement?.(option)}
                style={{
                  border: "1px solid rgba(16,24,40,0.1)",
                  background: "#101828",
                  color: "#fff",
                  borderRadius: 999,
                  padding: "9px 12px",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {option.label} ({option.count})
              </button>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
