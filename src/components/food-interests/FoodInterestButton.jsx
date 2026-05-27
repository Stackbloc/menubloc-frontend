import React from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useFoodInterests } from "../../context/FoodInterestsContext.jsx";

export default function FoodInterestButton({
  interest,
  compact = false,
  stopPropagation = true,
  inactiveLabel = "Interested",
  activeLabel = "✓ Interested",
}) {
  const { t } = useLanguage();
  const { isFollowing, isSavingInterest, toggleInterest } = useFoodInterests();
  const followed = isFollowing(interest);
  const saving = isSavingInterest(interest);

  async function handleClick(event) {
    if (stopPropagation) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (saving) return;
    try {
      await toggleInterest(interest);
    } catch {
      // handled in shared state
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={saving}
      aria-pressed={followed}
      aria-label={followed ? `Remove interest in ${interest?.display_label || "this dish"}` : `Mark interest in ${interest?.display_label || "this dish"}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: compact ? 28 : 34,
        padding: compact ? "0 10px" : "0 12px",
        borderRadius: 999,
        border: `1px solid ${followed ? "rgba(34,197,94,0.42)" : "rgba(107,114,128,0.35)"}`,
        background: followed ? "rgba(34,197,94,0.16)" : "rgba(17,24,39,0.72)",
        color: followed ? "#D1FAE5" : "#E5E7EB",
        fontSize: compact ? 11 : 12,
        fontWeight: 800,
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
        cursor: saving ? "default" : "pointer",
        opacity: saving ? 0.7 : 1,
      }}
    >
      {followed ? activeLabel : inactiveLabel}
    </button>
  );
}
