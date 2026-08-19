/**
 * Photo attach for eating posts — capture/select, preview, replace, remove.
 */

import { useEffect, useRef, useState } from "react";

export default function EatingMediaAttach({
  disabled = false,
  file,
  onFileChange,
  previewUrl = "",
  testId = "eating-media-attach",
}) {
  const inputRef = useRef(null);
  const [localPreview, setLocalPreview] = useState("");

  useEffect(() => {
    if (!file) {
      setLocalPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setLocalPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const shown = localPreview || previewUrl || "";

  function pick() {
    if (disabled) return;
    inputRef.current?.click();
  }

  function clear() {
    onFileChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div data-testid={testId} style={styles.wrap}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        capture="environment"
        hidden
        disabled={disabled}
        onChange={(e) => {
          const next = e.target.files?.[0] || null;
          onFileChange(next);
        }}
      />
      {shown ? (
        <div style={styles.previewWrap}>
          <img src={shown} alt="" style={styles.preview} />
          <div style={styles.actions}>
            <button type="button" style={styles.secondary} disabled={disabled} onClick={pick}>
              Replace
            </button>
            <button type="button" style={styles.secondary} disabled={disabled} onClick={clear}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button type="button" style={styles.addBtn} disabled={disabled} onClick={pick}>
          <span style={styles.addIcon} aria-hidden>
            📷
          </span>
          <span>Add photo</span>
        </button>
      )}
    </div>
  );
}

const styles = {
  wrap: { display: "grid", gap: 8 },
  addBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 52,
    borderRadius: 12,
    border: "1.5px dashed #86efac",
    background: "#f0fdf4",
    color: "#166534",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    width: "100%",
  },
  addIcon: { fontSize: 20 },
  previewWrap: { display: "grid", gap: 8 },
  preview: {
    width: "100%",
    maxHeight: 280,
    objectFit: "cover",
    borderRadius: 12,
    display: "block",
    background: "#f1f5f9",
  },
  actions: { display: "flex", gap: 8, flexWrap: "wrap" },
  secondary: {
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "8px 12px",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },
};
