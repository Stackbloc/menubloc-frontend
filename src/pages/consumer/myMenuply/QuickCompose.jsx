/**
 * One-line compose — type and post, optional photo or video via camera icon.
 */

import { useState } from "react";
import MenuplyMediaPicker from "../../../components/social/MenuplyMediaPicker.jsx";
import { isVideoFile } from "../../../lib/eatingMediaUtils.js";
import { socialBtn } from "../../../lib/socialDesignTokens.js";

export default function QuickCompose({
  placeholder,
  onSubmit,
  busy = false,
  acceptPhoto = false,
  acceptVideo = false,
  inputType = "text",
  defaultValue = "",
  submitLabel = "Post",
  testId = "quick-compose",
  autoFocus = false,
}) {
  const [text, setText] = useState(defaultValue);
  const [file, setFile] = useState(null);
  const acceptMedia = acceptPhoto || acceptVideo;

  async function handleSubmit(e) {
    e.preventDefault();
    const value = String(text || "").trim();
    if (!value && !file) return;
    await onSubmit({ text: value, file, mediaKind: isVideoFile(file) ? "video" : file ? "photo" : null });
    setText(inputType === "date" ? defaultValue || value : "");
    setFile(null);
  }

  return (
    <form onSubmit={handleSubmit} data-testid={testId} style={styles.form}>
      {acceptMedia ? (
        <MenuplyMediaPicker
          file={file}
          onFile={setFile}
          onClear={() => setFile(null)}
          disabled={busy}
          facingMode="environment"
          allowPhoto={acceptPhoto}
          allowVideo={acceptVideo}
          testId="quick-compose-media"
          ariaLabel="Add photo or video"
        />
      ) : null}
      <input
        type={inputType}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        disabled={busy}
        maxLength={inputType === "text" ? 160 : undefined}
        autoComplete="off"
        autoFocus={autoFocus}
        style={styles.input}
      />
      <button
        type="submit"
        disabled={busy || (!String(text).trim() && !file)}
        style={socialBtn.primary}
      >
        {busy ? "…" : submitLabel}
      </button>
    </form>
  );
}

const styles = {
  form: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    margin: "8px 0 0",
    flexWrap: "wrap",
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1.5px solid #d1d5db",
    fontSize: 15,
    fontFamily: "inherit",
    color: "#0f172a",
    background: "#fff",
    boxSizing: "border-box",
  },
};
