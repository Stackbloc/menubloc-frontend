import React from "react";

export default function FoodNavigationLadder({
  step,
  breadcrumb = [],
  loading = false,
  onSelectChoice,
  onBypass,
  onBack,
}) {
  if (!step && !loading) return null;

  const choices = (step?.choices || []).slice(0, 8);

  return (
    <section
      aria-label="Food navigation"
      style={{
        margin: "12px 0 20px",
        padding: "16px 18px",
        borderRadius: 16,
        background: "linear-gradient(180deg, #F8FAF8 0%, #FFFFFF 100%)",
        border: "1px solid #E5E7EB",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: "#6B7280", marginBottom: 8 }}>
        Narrow your food
      </div>
      {breadcrumb.length > 0 && (
        <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 10 }}>
          {breadcrumb.map((crumb) => crumb.label).join(" → ")}
        </div>
      )}
      <div style={{ fontSize: 18, fontWeight: 900, color: "#0B0F0C", marginBottom: 14 }}>
        {loading ? "Loading choices…" : step?.title || "What are you in the mood for?"}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            onClick={() => onSelectChoice?.(choice)}
            style={{
              border: "1px solid #D1D5DB",
              background: "#FFFFFF",
              color: "#0B0F0C",
              borderRadius: 999,
              padding: "10px 16px",
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {choice.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 14, alignItems: "center" }}>
        {step?.show_all?.label && (
          <button
            type="button"
            onClick={onBypass}
            style={{
              border: "none",
              background: "transparent",
              color: "#6B7280",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {step.show_all.label}
          </button>
        )}
        {breadcrumb.length > 0 && (
          <button
            type="button"
            onClick={onBack}
            style={{
              border: "none",
              background: "transparent",
              color: "#6B7280",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Back
          </button>
        )}
      </div>
    </section>
  );
}
