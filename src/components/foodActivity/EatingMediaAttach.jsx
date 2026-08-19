/**
 * Photo attach for eating posts — inline camera sheet + library fallback.
 */

import { useEffect, useState } from "react";
import ConsumerCameraPickButton from "../consumer/ConsumerCameraPickButton.jsx";

export default function EatingMediaAttach({
  disabled = false,
  file,
  onFileChange,
  previewUrl = "",
  testId = "eating-media-attach",
}) {
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

  function clear() {
    onFileChange(null);
  }

  return (
    <div data-testid={testId} style={styles.wrap}>
      {shown ? (
        <div style={styles.previewWrap}>
          <img src={shown} alt="" style={styles.preview} />
          <div style={styles.actions}>
            <ConsumerCameraPickButton
              mode="photo"
              facingMode="environment"
              onFile={onFileChange}
              disabled={disabled}
              testId="eating-media-replace"
              ariaLabel="Replace photo with camera"
              showLibraryLink
              buttonStyle={styles.secondary}
            >
              Replace
            </ConsumerCameraPickButton>
            <button type="button" style={styles.secondary} disabled={disabled} onClick={clear}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <ConsumerCameraPickButton
          mode="photo"
          facingMode="environment"
          onFile={onFileChange}
          disabled={disabled}
          testId="eating-media-add"
          ariaLabel="Add photo with camera"
          showLibraryLink
          buttonStyle={styles.addBtn}
        >
          Add photo
        </ConsumerCameraPickButton>
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
    fontFamily: "inherit",
  },
  previewWrap: { display: "grid", gap: 8 },
  preview: {
    width: "100%",
    maxHeight: 280,
    objectFit: "cover",
    borderRadius: 12,
    display: "block",
    background: "#f1f5f9",
  },
  actions: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
  secondary: {
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "8px 12px",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
