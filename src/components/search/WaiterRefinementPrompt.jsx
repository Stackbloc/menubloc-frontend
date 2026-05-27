import React from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function WaiterRefinementPrompt({
  displayQuery,
  filteredResultCount = 0,
  refinementOptions = [],
  selectedRefinement = null,
  onSelectRefinement,
  onClearRefinements,
}) {
  const { t } = useLanguage();
  const optionLine = refinementOptions
    .slice(0, 3)
    .map((option) => option.label)
    .join(" or ");

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
        Search term: {displayQuery || "Search"}
      </div>
      <div style={{ marginTop: 4, fontSize: 14, fontWeight: 800, color: "#101828" }}>
        {filteredResultCount} {filteredResultCount === 1 ? "result" : "results"}
      </div>
      {refinementOptions.length > 0 ? (
        <>
          <div style={{ marginTop: 10, fontSize: 16, fontWeight: 800 }}>
            {optionLine}
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
                  background: selectedRefinement?.id === option.id ? "#101828" : "#fff",
                  color: selectedRefinement?.id === option.id ? "#fff" : "#101828",
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
            {selectedRefinement ? (
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
                Back
              </button>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
