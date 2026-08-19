import { useRef, useState } from "react";
import ConsumerCameraSheet from "./ConsumerCameraSheet.jsx";
import {
  inlineCameraSupported,
  preferInlineCamera,
  videoRecorderSupported,
} from "../../lib/consumerCameraCapture.js";

/**
 * Opens inline camera sheet when supported; falls back to native file+capture picker.
 */
export default function ConsumerCameraPickButton({
  mode = "photo",
  facingMode = "environment",
  onFile,
  disabled = false,
  children,
  testId,
  ariaLabel,
  buttonStyle = {},
  showLibraryLink = true,
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const cameraInputRef = useRef(null);
  const libraryInputRef = useRef(null);

  const photoAccept = "image/*";
  const videoAccept = "video/*";
  const accept = mode === "video" ? videoAccept : photoAccept;

  function handleNativePick(event) {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
    if (file) onFile?.(file);
  }

  function handlePress() {
    if (disabled) return;
    if (mode === "video" && !videoRecorderSupported()) {
      cameraInputRef.current?.click();
      return;
    }
    if (inlineCameraSupported() && preferInlineCamera()) {
      setSheetOpen(true);
      return;
    }
    cameraInputRef.current?.click();
  }

  return (
    <>
      <button
        type="button"
        data-testid={testId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={handlePress}
        style={buttonStyle}
      >
        {children}
      </button>
      <input
        ref={cameraInputRef}
        type="file"
        accept={accept}
        capture=""
        hidden
        disabled={disabled}
        data-testid={testId ? `${testId}-native-input` : undefined}
        onChange={handleNativePick}
      />
      {showLibraryLink ? (
        <>
          <button
            type="button"
            data-testid={testId ? `${testId}-library` : "camera-pick-library"}
            disabled={disabled}
            onClick={() => libraryInputRef.current?.click()}
            style={libraryLinkStyle}
          >
            Photo library
          </button>
          <input
            ref={libraryInputRef}
            type="file"
            accept={accept}
            hidden
            disabled={disabled}
            onChange={handleNativePick}
          />
        </>
      ) : null}
      <ConsumerCameraSheet
        open={sheetOpen}
        mode={mode}
        facingMode={facingMode}
        onClose={() => setSheetOpen(false)}
        onNativeFallback={() => cameraInputRef.current?.click()}
        onCapture={(file) => {
          setSheetOpen(false);
          onFile?.(file);
        }}
      />
    </>
  );
}

const libraryLinkStyle = {
  appearance: "none",
  border: "none",
  background: "transparent",
  color: "#64748b",
  fontSize: 12,
  fontWeight: 600,
  textDecoration: "underline",
  cursor: "pointer",
  padding: "4px 0 0",
  fontFamily: "inherit",
};
