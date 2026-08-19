/**
 * One-line compose — type and post, optional photo or video.
 */

import { useState } from "react";
import ConsumerCameraPickButton from "../../../components/consumer/ConsumerCameraPickButton.jsx";
import { eatingMediaLabel, isVideoFile } from "../../../lib/eatingMediaUtils.js";

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
  const mediaLabel = file ? eatingMediaLabel(file) : null;

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
      {acceptPhoto ? (
        <ConsumerCameraPickButton
          mode="photo"
          facingMode="environment"
          onFile={setFile}
          disabled={busy}
          testId="quick-compose-photo"
          ariaLabel="Take photo with camera"
          showLibraryLink={false}
          buttonStyle={styles.iconBtn}
        >
          {mediaLabel === "Photo" ? "Added" : "Photo"}
        </ConsumerCameraPickButton>
      ) : null}
      {acceptVideo ? (
        <ConsumerCameraPickButton
          mode="video"
          facingMode="environment"
          onFile={setFile}
          disabled={busy}
          testId="quick-compose-video"
          ariaLabel="Record video with camera"
          showLibraryLink={false}
          buttonStyle={styles.iconBtn}
        >
          {mediaLabel === "Video" ? "Added" : "Video"}
        </ConsumerCameraPickButton>
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
        style={styles.post}
      >
        {busy ? "…" : submitLabel}
      </button>
    </form>
  );
}

const styles = {
  form: {
    display: "flex",
    alignItems: "center",
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
  iconBtn: {
    appearance: "none",
    minHeight: 44,
    padding: "0 12px",
    borderRadius: 10,
    border: "1.5px solid #d1d5db",
    background: "#ffffff",
    color: "#334155",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
    fontFamily: "inherit",
    flexShrink: 0,
  },
  post: {
    appearance: "none",
    minHeight: 44,
    padding: "0 16px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
    color: "#0B0F0C",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
    flexShrink: 0,
  },
};
