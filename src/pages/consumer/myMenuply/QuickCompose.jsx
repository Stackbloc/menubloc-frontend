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
            aria-label="Photo"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            style={styles.iconBtn}
          >
            {file ? "✓" : "📷"}
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
    borderRadius: 999,
    border: "1.5px solid #d1d5db",
    fontSize: 15,
    fontFamily: "inherit",
    color: "#0f172a",
    background: "#fff",
  },
  iconBtn: {
    appearance: "none",
    width: 44,
    height: 44,
    borderRadius: 999,
    border: "1.5px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontSize: 18,
    flexShrink: 0,
  },
  post: {
    appearance: "none",
    minHeight: 44,
    padding: "0 16px",
    borderRadius: 999,
    border: "none",
    background: "#1F4E3D",
    color: "#fff",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
    flexShrink: 0,
  },
};
