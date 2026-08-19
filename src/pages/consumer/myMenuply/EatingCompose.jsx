/**
 * Unified Eating compose — category + caption + photo/video.
 */

import { useState } from "react";
import ConsumerCameraPickButton from "../../../components/consumer/ConsumerCameraPickButton.jsx";
import { isVideoFile } from "../../../lib/eatingMediaUtils.js";
import { EATING_COMPOSE_CATEGORIES } from "./eatingHubUtils.js";

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
      mediaKind: isVideoFile(file) ? "video" : file ? "photo" : null,
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
      <form onSubmit={handleSubmit} style={styles.form}>
        {acceptMedia ? (
          <>
            <ConsumerCameraPickButton
              mode="photo"
              facingMode="environment"
              onFile={setFile}
              disabled={busy}
              testId="eating-compose-photo"
              ariaLabel="Add photo"
              showLibraryLink={false}
              buttonStyle={styles.mediaBtn}
            >
              Photo
            </ConsumerCameraPickButton>
            {category === "ate" ? (
              <ConsumerCameraPickButton
                mode="video"
                facingMode="environment"
                onFile={setFile}
                disabled={busy}
                testId="eating-compose-video"
                ariaLabel="Add video"
                showLibraryLink={false}
                buttonStyle={styles.mediaBtn}
              >
                Video
              </ConsumerCameraPickButton>
            ) : null}
          </>
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
        />
        <button
          type="submit"
          disabled={busy || (category !== "plan" && !String(text).trim() && !file)}
          style={styles.post}
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
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
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
  mediaBtn: {
    appearance: "none",
    minHeight: 44,
    padding: "0 12px",
    borderRadius: 12,
    border: "1px solid rgba(60,60,67,0.18)",
    background: "#fff",
    color: "#3C3C43",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "inherit",
    flexShrink: 0,
  },
  post: {
    appearance: "none",
    minHeight: 44,
    padding: "0 18px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
    color: "#0B0F0C",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
    flexShrink: 0,
  },
};
