/**
 * One-line compose — type and post, optional photo. No extra fields.
 */

import { useRef, useState } from "react";

export default function QuickCompose({
  placeholder,
  onSubmit,
  busy = false,
  acceptPhoto = false,
  inputType = "text",
  defaultValue = "",
  submitLabel = "Post",
  testId = "quick-compose",
  autoFocus = false,
}) {
  const [text, setText] = useState(defaultValue);
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const value = String(text || "").trim();
    if (!value && !file) return;
    await onSubmit({ text: value, file });
    setText(inputType === "date" ? defaultValue || value : "");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <form onSubmit={handleSubmit} data-testid={testId} style={styles.form}>
      {acceptPhoto ? (
        <>
          <button
            type="button"
            aria-label="Add photo"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            style={styles.iconBtn}
          >
            {file ? "Added" : "Photo"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            disabled={busy}
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
            }}
          />
        </>
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
