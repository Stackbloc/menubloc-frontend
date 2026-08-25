import { useId, useState } from "react";
import {
  captureAttrForFacing,
  formatVideoMaxDurationLabel,
  normalizeNativeVideoFile,
  SOCIAL_VIDEO_MAX_RECORD_SECONDS,
} from "../../lib/nativeVideoCapture.js";
import { socialBtn } from "../../lib/socialDesignTokens.js";

/**
 * OS-native video recording via <label> + <input capture> — not MediaRecorder,
 * and not button→input.click() (that opens a file picker on many phones).
 */
export default function NativeVideoCapture({
  onFile,
  disabled = false,
  facingMode = "environment",
  testId = "native-video-capture",
  buttonLabel = "Record video",
  compact = false,
}) {
  const inputId = useId();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const maxLabel = formatVideoMaxDurationLabel(SOCIAL_VIDEO_MAX_RECORD_SECONDS);
  const inactive = disabled || busy;

  async function handlePick(event) {
    const picked = event.target.files?.[0] || null;
    event.target.value = "";
    if (!picked) return;

    setBusy(true);
    setError("");
    try {
      const file = await normalizeNativeVideoFile(picked);
      onFile?.(file);
    } catch (err) {
      setError(String(err?.message || "Could not use that video."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-testid={testId} style={styles.wrap}>
      <label
        htmlFor={inactive ? undefined : inputId}
        style={{
          ...(compact ? styles.compactBtn : styles.btn),
          ...(inactive ? styles.inactive : null),
        }}
        data-testid={`${testId}-trigger`}
        aria-label={`${buttonLabel} (up to ${maxLabel})`}
        aria-disabled={inactive}
        onClick={(e) => {
          if (inactive) e.preventDefault();
          else setError("");
        }}
      >
        <VideoIcon />
        {!compact ? (
          <span style={styles.label}>{busy ? "Checking…" : buttonLabel}</span>
        ) : null}
      </label>
      {!compact ? (
        <p style={styles.hint} data-testid={`${testId}-hint`}>
          Uses your phone camera · up to {maxLabel}
        </p>
      ) : null}
      {error ? (
        <p style={styles.error} data-testid={`${testId}-error`} role="alert">
          {error}
        </p>
      ) : null}
      <input
        id={inputId}
        type="file"
        accept="video/*"
        capture={captureAttrForFacing(facingMode)}
        style={styles.visuallyHiddenInput}
        disabled={inactive}
        data-testid={`${testId}-input`}
        onChange={handlePick}
      />
    </div>
  );
}

function VideoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3"
        y="6"
        width="13"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M16 10l5-3v10l-5-3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const styles = {
  wrap: {
    display: "inline-flex",
    flexDirection: "column",
    gap: 4,
    alignItems: "flex-start",
  },
  btn: {
    ...socialBtn.icon,
    width: "auto",
    minHeight: 44,
    padding: "0 14px",
    gap: 8,
    display: "inline-flex",
    alignItems: "center",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    boxSizing: "border-box",
  },
  compactBtn: {
    ...socialBtn.icon,
    width: 44,
    height: 44,
    padding: 0,
    display: "inline-grid",
    placeItems: "center",
    cursor: "pointer",
    boxSizing: "border-box",
  },
  inactive: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
  label: { lineHeight: 1.2 },
  hint: {
    margin: 0,
    fontSize: 12,
    color: "#64748b",
    fontWeight: 600,
  },
  error: {
    margin: 0,
    fontSize: 12,
    color: "#b91c1c",
    fontWeight: 600,
    maxWidth: 280,
    lineHeight: 1.4,
  },
  visuallyHiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: 0,
  },
};
