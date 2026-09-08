/**
 * Minimal direct activity composer — text + emoji + Post.
 * No camera / media. Multiplier/Post remains the video path.
 */

import { useState } from "react";
import { FOOD_INTEREST_ICONS } from "../../../lib/foodInterestIcons.js";
import { socialBtn } from "../../../lib/socialDesignTokens.js";
import { GREEN_MID } from "./myMenuplyStyles.js";

const EMOJI_OPTIONS = Object.values(FOOD_INTEREST_ICONS).filter(
  (emoji, index, all) => all.indexOf(emoji) === index
);

export default function ActivityTextComposer({
  onSubmit,
  busy = false,
  placeholder = "What do you wanna eat?",
  testId = "activity-text-composer",
}) {
  const [text, setText] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const value = String(text || "").trim();
    if (!value || busy) return;
    await onSubmit({ text: value });
    setText("");
    setPickerOpen(false);
  }

  function appendEmoji(emoji) {
    setText((prev) => {
      const base = String(prev || "");
      if (!base) return emoji;
      if (base.endsWith(emoji) || base.includes(emoji)) return base;
      return `${base} ${emoji}`.trim();
    });
    setPickerOpen(false);
  }

  return (
    <div style={styles.bar} data-testid={testId}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          disabled={busy}
          maxLength={160}
          autoComplete="off"
          aria-label="Activity text"
          data-testid="activity-text-input"
          style={styles.input}
        />
        <button
          type="button"
          style={styles.emojiBtn}
          disabled={busy}
          aria-expanded={pickerOpen}
          aria-label="Add emoji"
          data-testid="activity-emoji-toggle"
          onClick={() => setPickerOpen((v) => !v)}
        >
          😀
        </button>
        <button
          type="submit"
          disabled={busy || !String(text).trim()}
          style={socialBtn.primary}
          data-testid="activity-text-post"
        >
          {busy ? "…" : "Post"}
        </button>
      </form>
      {pickerOpen ? (
        <div style={styles.picker} data-testid="activity-emoji-picker" role="listbox">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              style={styles.emojiOption}
              onClick={() => appendEmoji(emoji)}
              aria-label={`Insert ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  bar: {
    position: "sticky",
    bottom: "calc(var(--feed-primary-nav-h, 56px) + env(safe-area-inset-bottom, 0px))",
    zIndex: 30,
    margin: "16px -16px 0",
    padding: "10px 16px 12px",
    background: "rgba(250, 248, 245, 0.96)",
    borderTop: "1px solid #d1fae5",
    backdropFilter: "blur(8px)",
  },
  form: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1.5px solid #86efac",
    fontSize: 15,
    fontFamily: "inherit",
    color: "#0f172a",
    background: "#fff",
    boxSizing: "border-box",
  },
  emojiBtn: {
    appearance: "none",
    width: 44,
    height: 44,
    borderRadius: 10,
    border: "1.5px solid #d1fae5",
    background: "#fff",
    fontSize: 20,
    cursor: "pointer",
    flexShrink: 0,
  },
  picker: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
    padding: 8,
    borderRadius: 10,
    border: `1px solid ${GREEN_MID}33`,
    background: "#fff",
  },
  emojiOption: {
    appearance: "none",
    width: 36,
    height: 36,
    border: "none",
    borderRadius: 8,
    background: "#f0fdf4",
    fontSize: 18,
    cursor: "pointer",
  },
};
