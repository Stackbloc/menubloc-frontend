/**
 * Unified Eating compose — category + caption + camera icon media + meal time (Ate).
 */

import { useState } from "react";
import MenuplyMediaPicker from "../../../components/social/MenuplyMediaPicker.jsx";
import {
  WHAT_I_ATE_MEAL_PERIODS,
  defaultWhatIAteMealPeriod,
} from "../../../lib/whatIAteTodayMealPeriod.js";
import { EATING_COMPOSE_CATEGORIES } from "./eatingHubUtils.js";
import { socialBtn, socialType } from "../../../lib/socialDesignTokens.js";

export default function EatingCompose({
  busy = false,
  testId = "eating-compose",
  defaultCategory = "ate",
  onSubmit,
  onPlanSchedule,
}) {
  const [category, setCategory] = useState(defaultCategory);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [mealPeriod, setMealPeriod] = useState(defaultWhatIAteMealPeriod());

  const meta = EATING_COMPOSE_CATEGORIES.find((c) => c.id === category) || EATING_COMPOSE_CATEGORIES[0];
  const acceptMedia = category === "ate" || category === "want";

  async function handleSubmit(e) {
    e.preventDefault();
    if (category === "plan") {
      onPlanSchedule?.({ text: String(text || "").trim() });
      return;
    }
    const value = String(text || "").trim();
    if (!value && !file) return;
    await onSubmit({
      category,
      text: value,
      file,
      mealPeriod: category === "ate" ? mealPeriod : undefined,
    });
    setText("");
    setFile(null);
  }

  return (
    <div data-testid={testId} style={styles.wrap}>
      <div style={styles.chips} role="tablist" aria-label="Eating category">
        {EATING_COMPOSE_CATEGORIES.map((chip) => {
          const active = chip.id === category;
          return (
            <button
              key={chip.id}
              type="button"
              role="tab"
              aria-selected={active}
              data-testid={`eating-compose-${chip.id}`}
              disabled={busy}
              style={{ ...styles.chip, ...(active ? styles.chipActive : null) }}
              onClick={() => setCategory(chip.id)}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
      {meta.description ? <p style={socialType.meta}>{meta.description}</p> : null}
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.composeRow}>
          {acceptMedia ? (
            <MenuplyMediaPicker
              file={file}
              onFile={setFile}
              onClear={() => setFile(null)}
              disabled={busy}
              facingMode="environment"
              allowPhoto
              allowVideo={category === "ate"}
              testId="eating-compose-media"
              ariaLabel="Add photo or video"
            />
          ) : null}
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={meta.placeholder}
            disabled={busy}
            maxLength={160}
            autoComplete="off"
            style={styles.input}
            data-testid="eating-compose-input"
          />
        </div>
        {acceptMedia ? (
          <p style={socialType.meta}>Photo or video is optional — you can take it before you post.</p>
        ) : null}
        {category === "ate" ? (
          <div style={styles.mealRow} role="group" aria-label="Meal time">
            {WHAT_I_ATE_MEAL_PERIODS.map((slot) => {
              const active = mealPeriod === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  data-testid={`eating-meal-${slot.id}`}
                  disabled={busy}
                  style={{ ...styles.mealChip, ...(active ? styles.mealChipActive : null) }}
                  onClick={() => setMealPeriod(slot.id)}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={busy || (category !== "plan" && !String(text).trim() && !file)}
          style={socialBtn.primary}
        >
          {busy ? "…" : category === "plan" ? "Schedule" : "Post"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  wrap: { margin: "0 0 12px" },
  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  chip: {
    appearance: "none",
    border: "1px solid rgba(60,60,67,0.18)",
    background: "rgba(120,120,128,0.08)",
    color: "#3C3C43",
    borderRadius: 999,
    padding: "6px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  chipActive: {
    background: "#1C1C1E",
    color: "#fff",
    borderColor: "#1C1C1E",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: 10,
  },
  composeRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
  },
  input: {
    flex: "1 1 140px",
    minWidth: 0,
    minHeight: 44,
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(60,60,67,0.18)",
    fontSize: 15,
    fontFamily: "inherit",
    color: "#1C1C1E",
    background: "#fff",
    boxSizing: "border-box",
  },
  mealRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  },
  mealChip: {
    appearance: "none",
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#475569",
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  mealChipActive: {
    background: "#ecfdf5",
    borderColor: "#86efac",
    color: "#166534",
  },
};
